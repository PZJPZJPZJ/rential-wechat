import { fail, success } from '@/lib/response';
import { prisma } from '@/lib/db';

const parseJsonArray = <T>(value: string | null | undefined, fallback: T[]): T[] => {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ spuId: string }> },
): Promise<Response> {
  const { spuId } = await params;
  if (!spuId) {
    return fail('INVALID_PARAMS', 'spuId is required', 400);
  }

  const goods = await prisma.goods.findUnique({
    where: { spuId },
    include: {
      skus: true,
      spuTags: true,
      specGroups: {
        include: {
          specValues: true,
        },
      },
    },
  });

  if (!goods) {
    return fail('NOT_FOUND', 'Goods not found', 404);
  }

  return success({
    saasId: '88888888',
    storeId: goods.storeId,
    spuId: goods.spuId,
    title: goods.title,
    primaryImage: goods.primaryImage,
    images: parseJsonArray<string>(goods.images, [goods.primaryImage]),
    video: goods.video,
    available: 1,
    minSalePrice: goods.minSalePrice,
    minLinePrice: goods.minLinePrice,
    maxSalePrice: goods.maxSalePrice,
    maxLinePrice: goods.maxLinePrice,
    spuStockQuantity: goods.spuStockQuantity,
    soldNum: goods.soldNum,
    isPutOnSale: goods.isPutOnSale,
    isSoldOut: goods.isSoldOut,
    spuTagList: goods.spuTags.map((tag) => ({
      id: tag.tagId ?? String(tag.id),
      title: tag.title,
      image: tag.image,
    })),
    limitInfo: parseJsonArray<{ text: string }>(goods.limitInfo, []),
    desc: parseJsonArray<string>(goods.desc, []),
    etitle: goods.etitle ?? '',
    specList: goods.specGroups.map((group) => ({
      specId: group.specId,
      title: group.title,
      specValueList: group.specValues.map((value) => ({
        specValueId: value.specValueId,
        specId: group.specId,
        saasId: null,
        specValue: value.specValue,
        image: value.image,
      })),
    })),
    skuList: goods.skus.map((sku) => ({
      skuId: sku.skuId,
      skuImage: sku.skuImage,
      specInfo: parseJsonArray<
        {
          specId: string;
          specTitle?: string | null;
          specValueId: string;
          specValue?: string | null;
        }
      >(sku.specInfo, []),
      priceInfo: [
        { priceType: 1, price: String(sku.salePrice), priceTypeName: null },
        { priceType: 2, price: String(sku.linePrice), priceTypeName: null },
      ],
      stockInfo: {
        stockQuantity: sku.stockQuantity,
        safeStockQuantity: 0,
        soldQuantity: sku.soldQuantity,
      },
      weight: { value: null, unit: 'KG' },
      volume: null,
      profitPrice: null,
    })),
  });
}
