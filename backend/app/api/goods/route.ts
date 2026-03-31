import { z } from 'zod';

import { prisma } from '@/lib/db';
import { fail, success } from '@/lib/response';

const querySchema = z.object({
  pageNum: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
  sort: z.coerce.number().int().optional(),
  sortType: z.coerce.number().int().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  keyword: z.string().trim().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const parseResult = querySchema.safeParse({
    pageNum: searchParams.get('pageNum') ?? searchParams.get('page') ?? 1,
    pageSize: searchParams.get('pageSize') ?? 30,
    sort: searchParams.get('sort') ?? undefined,
    sortType: searchParams.get('sortType') ?? undefined,
    minPrice: searchParams.get('minPrice') ?? undefined,
    maxPrice: searchParams.get('maxPrice') ?? undefined,
    keyword: searchParams.get('keyword') ?? undefined,
    categoryId: searchParams.get('categoryId') ?? undefined,
  });

  if (!parseResult.success) {
    return fail('INVALID_PARAMS', 'Invalid query params', 400);
  }

  const { pageNum, pageSize, sort, sortType, minPrice, maxPrice, keyword, categoryId } =
    parseResult.data;

  if (typeof minPrice === 'number' && typeof maxPrice === 'number' && minPrice > maxPrice) {
    return fail('INVALID_PARAMS', 'minPrice cannot be greater than maxPrice', 400);
  }

  const where = {
    isPutOnSale: 1,
    ...(categoryId ? { categoryId } : {}),
    ...(keyword ? { title: { contains: keyword } } : {}),
    ...(typeof minPrice === 'number' || typeof maxPrice === 'number'
      ? {
          minSalePrice: {
            ...(typeof minPrice === 'number' ? { gte: minPrice } : {}),
            ...(typeof maxPrice === 'number' ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const orderBy =
    sort === 1
      ? [{ minSalePrice: sortType === 1 ? 'desc' : 'asc' as const }, { id: 'desc' as const }]
      : [{ soldNum: 'desc' as const }, { id: 'desc' as const }];

  const [totalCount, goods] = await prisma.$transaction([
    prisma.goods.count({ where }),
    prisma.goods.findMany({
      where,
      include: {
        spuTags: true,
      },
      orderBy,
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return success({
    pageNum,
    pageSize,
    totalCount,
    spuList: goods.map((item) => ({
      spuId: item.spuId,
      title: item.title,
      primaryImage: item.primaryImage,
      minSalePrice: item.minSalePrice,
      maxSalePrice: item.maxSalePrice,
      minLinePrice: item.minLinePrice,
      maxLinePrice: item.maxLinePrice,
      soldNum: item.soldNum,
      spuStockQuantity: item.spuStockQuantity,
      isPutOnSale: item.isPutOnSale,
      isSoldOut: item.isSoldOut,
      spuTagList: item.spuTags.map((tag) => ({
        id: tag.tagId ?? String(tag.id),
        title: tag.title,
        image: tag.image,
      })),
      thumb: item.primaryImage,
      price: item.minSalePrice,
      originPrice: item.maxLinePrice,
      tags: item.spuTags.map((tag) => tag.title),
    })),
  });
}
