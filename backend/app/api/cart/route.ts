import { z } from 'zod';

import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { fail, success } from '@/lib/response';

const addCartSchema = z.object({
  skuId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
  isSelected: z.coerce.number().int().min(0).max(1).default(1),
});

const parseSpecInfo = (
  specInfoRaw: string,
  fallbackMap: Record<string, { title: string; values: Record<string, string> }>,
) => {
  try {
    const parsed = JSON.parse(specInfoRaw) as Array<{
      specId?: string;
      specTitle?: string | null;
      specValueId?: string;
      specValue?: string | null;
    }>;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => {
      const ref = item.specId ? fallbackMap[item.specId] : undefined;
      return {
        specTitle: item.specTitle || ref?.title || '',
        specValue:
          item.specValue ||
          (item.specValueId && ref ? ref.values[item.specValueId] : undefined) ||
          '',
      };
    });
  } catch {
    return [];
  }
};

const buildCartResponse = async (userId: number) => {
  const items = await prisma.cart.findMany({
    where: { userId },
    include: {
      sku: {
        include: {
          goods: {
            include: {
              specGroups: {
                include: {
                  specValues: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
  });

  const goodsItems = [];
  const invalidGoodItems = [];

  let selectedGoodsCount = 0;
  let totalAmount = 0;
  let totalDiscountAmount = 0;
  let isAllSelected = items.length > 0;

  for (const item of items) {
    const specFallbackMap = Object.fromEntries(
      item.sku.goods.specGroups.map((group) => [
        group.specId,
        {
          title: group.title,
          values: Object.fromEntries(
            group.specValues.map((value) => [value.specValueId, value.specValue]),
          ),
        },
      ]),
    );

    const goodsItem = {
      id: item.id,
      uid: String(item.userId),
      saasId: '88888888',
      storeId: item.sku.goods.storeId,
      spuId: item.sku.goods.spuId,
      skuId: item.sku.skuId,
      isSelected: item.isSelected,
      thumb: item.sku.skuImage || item.sku.goods.primaryImage,
      title: item.sku.goods.title,
      primaryImage: item.sku.goods.primaryImage,
      quantity: item.quantity,
      stockStatus: item.sku.stockQuantity > 0,
      stockQuantity: item.sku.stockQuantity,
      price: String(item.sku.salePrice),
      originPrice: String(item.sku.linePrice),
      tagPrice: null,
      titlePrefixTags: [],
      roomId: null,
      specInfo: parseSpecInfo(item.sku.specInfo, specFallbackMap),
      joinCartTime: item.createdAt.toISOString(),
      available: 1,
      putOnSale: item.sku.goods.isPutOnSale,
      etitle: item.sku.goods.etitle,
    };

    const isInvalid = item.sku.goods.isPutOnSale !== 1 || item.sku.goods.isSoldOut;
    if (isInvalid) {
      invalidGoodItems.push(goodsItem);
      continue;
    }

    goodsItems.push(goodsItem);
    if (item.isSelected) {
      selectedGoodsCount += item.quantity;
      totalAmount += item.quantity * item.sku.salePrice;
      totalDiscountAmount += item.quantity * Math.max(item.sku.linePrice - item.sku.salePrice, 0);
    } else {
      isAllSelected = false;
    }
  }

  const storeGoods =
    goodsItems.length === 0
      ? []
      : [
          {
            storeId: '1000',
            storeName: 'TMall旗舰店',
            storeStatus: 1,
            totalDiscountSalePrice: String(totalDiscountAmount),
            promotionGoodsList: [
              {
                title: null,
                promotionCode: 'EMPTY_PROMOTION',
                promotionSubCode: null,
                promotionId: null,
                tagText: null,
                promotionStatus: null,
                tag: null,
                description: null,
                doorSillRemain: null,
                isNeedAddOnShop: 0,
                goodsPromotionList: goodsItems,
                lastJoinTime: goodsItems[0]?.joinCartTime ?? null,
              },
            ],
            lastJoinTime: goodsItems[0]?.joinCartTime ?? null,
            postageFreePromotionVo: {
              title: null,
              promotionCode: null,
              promotionSubCode: null,
              promotionId: null,
              tagText: null,
              promotionStatus: null,
              tag: null,
              description: null,
              doorSillRemain: null,
              isNeedAddOnShop: 0,
            },
          },
        ];

  return {
    isNotEmpty: goodsItems.length > 0 || invalidGoodItems.length > 0,
    storeGoods,
    invalidGoodItems,
    isAllSelected,
    selectedGoodsCount,
    totalAmount: String(totalAmount),
    totalDiscountAmount: String(totalDiscountAmount),
  };
};

export async function GET(request: Request): Promise<Response> {
  return withAuth(request, async (userId) => {
    const data = await buildCartResponse(userId);
    return success(data);
  });
}

export async function POST(request: Request): Promise<Response> {
  return withAuth(request, async (userId) => {
    let payload: z.infer<typeof addCartSchema>;
    try {
      const body = await request.json();
      const parsed = addCartSchema.safeParse(body);
      if (!parsed.success) {
        return fail('INVALID_PARAMS', 'Invalid cart params', 400);
      }
      payload = parsed.data;
    } catch {
      return fail('INVALID_PARAMS', 'Invalid request body', 400);
    }

    const sku = await prisma.sku.findUnique({
      where: { skuId: payload.skuId },
      select: { id: true },
    });
    if (!sku) {
      return fail('NOT_FOUND', 'SKU not found', 404);
    }

    const existing = await prisma.cart.findFirst({
      where: {
        userId,
        skuId: sku.id,
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    let cartId: number;
    if (existing) {
      const updated = await prisma.cart.update({
        where: { id: existing.id },
        data: {
          quantity: Math.min(existing.quantity + payload.quantity, 999),
          isSelected: payload.isSelected,
        },
        select: { id: true },
      });
      cartId = updated.id;
    } else {
      const created = await prisma.cart.create({
        data: {
          userId,
          skuId: sku.id,
          quantity: payload.quantity,
          isSelected: payload.isSelected,
        },
        select: { id: true },
      });
      cartId = created.id;
    }

    return success({ id: cartId }, 201);
  });
}
