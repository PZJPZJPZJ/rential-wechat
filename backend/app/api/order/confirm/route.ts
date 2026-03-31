import { z } from 'zod';

import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { fail, success } from '@/lib/response';

const goodsRequestSchema = z.object({
  skuId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1).max(999),
});

const addressSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  provinceName: z.string().trim().min(1),
  provinceCode: z.string().trim().min(1),
  cityName: z.string().trim().min(1),
  cityCode: z.string().trim().min(1),
  districtName: z.string().trim().min(1),
  districtCode: z.string().trim().min(1),
  detailAddress: z.string().trim().min(1),
  addressTag: z.string().trim().optional(),
  isDefault: z.coerce.number().int().min(0).max(1).optional(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
});

const confirmSchema = z.object({
  goodsRequestList: z.array(goodsRequestSchema).min(1),
  userAddressReq: addressSchema.optional(),
  couponList: z.array(z.object({ couponId: z.coerce.number().int().positive() })).optional(),
  remark: z.string().trim().max(200).optional(),
});

class OrderConfirmError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const buildOrderNo = () => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(
    now.getMinutes(),
  ).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const randomPart = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return `ORD${datePart}${randomPart}`;
};

const parseSpecInfo = (raw: string) => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed
          .map((item) => {
            const val = item as { specTitle?: string | null; specValue?: string | null };
            if (!val.specTitle || !val.specValue) return null;
            return { specTitle: val.specTitle, specValue: val.specValue };
          })
          .filter(Boolean)
      : [];
  } catch {
    return [];
  }
};

export async function POST(request: Request): Promise<Response> {
  return withAuth(request, async (userId) => {
    let payload: z.infer<typeof confirmSchema>;
    try {
      const body = await request.json();
      const parsed = confirmSchema.safeParse(body);
      if (!parsed.success) {
        return fail('INVALID_PARAMS', 'Invalid order confirm params', 400);
      }
      payload = parsed.data;
    } catch {
      return fail('INVALID_PARAMS', 'Invalid request body', 400);
    }

    try {
      const orderNo = await prisma.$transaction(async (tx) => {
        const mergedGoodsMap = new Map<string, number>();
        for (const item of payload.goodsRequestList) {
          mergedGoodsMap.set(item.skuId, (mergedGoodsMap.get(item.skuId) ?? 0) + item.quantity);
        }

        const mergedGoodsList = Array.from(mergedGoodsMap.entries()).map(([skuId, quantity]) => ({
          skuId,
          quantity,
        }));

        const skuIds = mergedGoodsList.map((item) => item.skuId);
        const skus = await tx.sku.findMany({
          where: { skuId: { in: skuIds } },
          include: { goods: true },
        });
        if (skus.length !== skuIds.length) {
          throw new OrderConfirmError('NOT_FOUND', 'SKU not found', 404);
        }

        const skuMap = new Map(skus.map((sku) => [sku.skuId, sku]));
        let goodsAmount = 0;
        const goodsQuantityBySpu = new Map<number, number>();

        for (const item of mergedGoodsList) {
          const sku = skuMap.get(item.skuId)!;
          if (sku.goods.isPutOnSale !== 1 || sku.goods.isSoldOut) {
            throw new OrderConfirmError('FORBIDDEN', 'SKU is not available', 403);
          }

          const stockResult = await tx.sku.updateMany({
            where: {
              id: sku.id,
              stockQuantity: { gte: item.quantity },
            },
            data: {
              stockQuantity: { decrement: item.quantity },
              soldQuantity: { increment: item.quantity },
            },
          });
          if (stockResult.count === 0) {
            throw new OrderConfirmError('STOCK_INSUFFICIENT', 'Stock insufficient', 409);
          }

          goodsAmount += sku.salePrice * item.quantity;
          goodsQuantityBySpu.set(
            sku.goodsId,
            (goodsQuantityBySpu.get(sku.goodsId) ?? 0) + item.quantity,
          );
        }

        for (const [goodsId, quantity] of goodsQuantityBySpu) {
          await tx.goods.update({
            where: { id: goodsId },
            data: {
              soldNum: { increment: quantity },
              spuStockQuantity: { decrement: quantity },
            },
          });
        }

        const address =
          payload.userAddressReq ??
          (await tx.address.findFirst({
            where: { userId, isDefault: 1 },
          })) ??
          (await tx.address.findFirst({
            where: { userId },
          }));

        if (!address) {
          throw new OrderConfirmError('INVALID_PARAMS', 'Address is required', 400);
        }

        const addressInfo = JSON.stringify({
          name: address.name,
          phone: address.phone,
          provinceName: address.provinceName,
          provinceCode: address.provinceCode,
          cityName: address.cityName,
          cityCode: address.cityCode,
          districtName: address.districtName,
          districtCode: address.districtCode,
          detailAddress: address.detailAddress,
          addressTag: address.addressTag ?? '',
          latitude: address.latitude ?? null,
          longitude: address.longitude ?? null,
        });

        let discountAmount = 0;
        let usedCouponId: number | null = null;
        const requestCouponId = payload.couponList?.[0]?.couponId;
        if (requestCouponId) {
          const userCoupon = await tx.userCoupon.findFirst({
            where: {
              id: requestCouponId,
              userId,
              status: 'unused',
            },
            include: { coupon: true },
          });

          if (!userCoupon) {
            throw new OrderConfirmError('FORBIDDEN', 'Coupon is invalid', 403);
          }

          const now = Date.now();
          if (userCoupon.coupon.startAt.getTime() > now || userCoupon.coupon.expireAt.getTime() < now) {
            throw new OrderConfirmError('FORBIDDEN', 'Coupon has expired', 403);
          }

          if (goodsAmount >= userCoupon.coupon.base) {
            if (userCoupon.coupon.type === 'price') {
              discountAmount = userCoupon.coupon.value;
            } else if (userCoupon.coupon.type === 'discount') {
              discountAmount = Math.floor((goodsAmount * (100 - userCoupon.coupon.value)) / 100);
            }
            discountAmount = Math.min(discountAmount, goodsAmount);
            usedCouponId = userCoupon.id;
          }
        }

        const freightAmount = 0;
        const totalAmount = Math.max(goodsAmount - discountAmount + freightAmount, 0);
        const orderNo = buildOrderNo();

        const createdOrder = await tx.order.create({
          data: {
            orderNo,
            userId,
            status: 5,
            totalAmount,
            goodsAmount,
            discountAmount,
            freightAmount,
            addressInfo,
            couponId: usedCouponId,
            remark: payload.remark,
            items: {
              create: mergedGoodsList.map((item) => {
                const sku = skuMap.get(item.skuId)!;
                return {
                  spuId: sku.goods.spuId,
                  skuId: sku.skuId,
                  title: sku.goods.title,
                  image: sku.skuImage || sku.goods.primaryImage,
                  specInfo: JSON.stringify(parseSpecInfo(sku.specInfo)),
                  price: sku.salePrice,
                  quantity: item.quantity,
                };
              }),
            },
          },
          select: { id: true, orderNo: true },
        });

        if (usedCouponId) {
          await tx.userCoupon.update({
            where: { id: usedCouponId },
            data: {
              status: 'used',
              usedAt: new Date(),
              orderId: createdOrder.id,
            },
          });
        }

        const selectedSkuIds = mergedGoodsList.map((item) => skuMap.get(item.skuId)!.id);
        await tx.cart.deleteMany({
          where: {
            userId,
            skuId: { in: selectedSkuIds },
            isSelected: 1,
          },
        });

        return createdOrder.orderNo;
      });

      return success({ orderNo }, 201);
    } catch (error) {
      if (error instanceof OrderConfirmError) {
        return fail(error.code, error.message, error.status);
      }
      return fail('INTERNAL_ERROR', 'Failed to confirm order', 500);
    }
  });
}
