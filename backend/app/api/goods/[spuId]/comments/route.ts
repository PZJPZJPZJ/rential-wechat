import { z } from 'zod';

import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { fail, success } from '@/lib/response';

const listQuerySchema = z.object({
  pageNum: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  commentLevel: z.coerce.number().int().min(1).max(3).optional(),
  hasImage: z.coerce.boolean().optional(),
});

const createCommentSchema = z.object({
  skuId: z.string().trim().optional(),
  orderId: z.coerce.number().int().positive().optional(),
  specInfo: z.string().trim().optional(),
  content: z.string().trim().min(1).max(1000),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  images: z.array(z.string().trim().url()).max(9).optional(),
});

const getRatingFilter = (commentLevel?: number) => {
  if (commentLevel === 1) {
    return { lte: 2 };
  }

  if (commentLevel === 2) {
    return { equals: 3 };
  }

  if (commentLevel === 3) {
    return { gte: 4 };
  }

  return undefined;
};

const parseJsonArray = <T>(value?: string | null): T[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ spuId: string }> },
): Promise<Response> {
  const { spuId } = await params;
  if (!spuId) {
    return fail('INVALID_PARAMS', 'spuId is required', 400);
  }

  const queryResult = listQuerySchema.safeParse({
    pageNum: new URL(request.url).searchParams.get('pageNum') ?? 1,
    pageSize: new URL(request.url).searchParams.get('pageSize') ?? 10,
    commentLevel: new URL(request.url).searchParams.get('commentLevel') ?? undefined,
    hasImage: new URL(request.url).searchParams.get('hasImage') ?? undefined,
  });
  if (!queryResult.success) {
    return fail('INVALID_PARAMS', 'Invalid query params', 400);
  }

  const goods = await prisma.goods.findUnique({
    where: { spuId },
    select: { id: true },
  });
  if (!goods) {
    return fail('NOT_FOUND', 'Goods not found', 404);
  }

  const { pageNum, pageSize, commentLevel, hasImage } = queryResult.data;
  const where = {
    goodsId: goods.id,
    ...(getRatingFilter(commentLevel) ? { rating: getRatingFilter(commentLevel) } : {}),
    ...(hasImage ? { images: { not: null } } : {}),
  };

  const [totalCount, list] = await prisma.$transaction([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return success({
    pageNum,
    pageSize,
    totalCount: String(totalCount),
    pageList: list.map((item) => {
      const resources = parseJsonArray<string>(item.images).map((src) => ({
        src,
        type: 'image' as const,
      }));

      return {
        spuId,
        skuId: item.skuId ?? '0',
        specInfo: item.specInfo ?? '',
        commentContent: item.content,
        commentResources: resources,
        commentImageUrls: resources.map((resource) => resource.src),
        commentScore: item.rating,
        uid: String(item.userId),
        userName: item.user.nickname ?? `用户${item.userId}`,
        userHeadUrl: item.user.avatarUrl ?? '',
        isAnonymity: false,
        commentTime: String(item.createdAt.getTime()),
        isAutoComment: false,
        sellerReply: item.replyContent ?? '',
        goodsDetailInfo: item.specInfo ?? '',
      };
    }),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ spuId: string }> },
): Promise<Response> {
  return withAuth(request, async (userId) => {
    const { spuId } = await params;
    if (!spuId) {
      return fail('INVALID_PARAMS', 'spuId is required', 400);
    }

    const goods = await prisma.goods.findUnique({
      where: { spuId },
      select: { id: true },
    });
    if (!goods) {
      return fail('NOT_FOUND', 'Goods not found', 404);
    }

    let payload: z.infer<typeof createCommentSchema>;
    try {
      const body = await request.json();
      const result = createCommentSchema.safeParse(body);
      if (!result.success) {
        return fail('INVALID_PARAMS', 'Invalid comment params', 400);
      }
      payload = result.data;
    } catch {
      return fail('INVALID_PARAMS', 'Invalid request body', 400);
    }

    const comment = await prisma.comment.create({
      data: {
        goodsId: goods.id,
        userId,
        orderId: payload.orderId,
        skuId: payload.skuId,
        specInfo: payload.specInfo,
        content: payload.content,
        rating: payload.rating,
        images: payload.images ? JSON.stringify(payload.images) : null,
      },
      select: { id: true },
    });

    return success({ commentId: comment.id }, 201);
  });
}
