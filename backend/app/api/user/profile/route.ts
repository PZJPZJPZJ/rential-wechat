import { z } from 'zod';

import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { fail, success } from '@/lib/response';

const updateSchema = z
  .object({
    nickname: z.string().trim().min(1).max(50).optional(),
    avatarUrl: z.string().trim().url().optional(),
    gender: z.coerce.number().int().min(0).max(2).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'No fields to update' });

export async function GET(request: Request): Promise<Response> {
  return withAuth(request, async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: {
          where: { isDefault: 1 },
          orderBy: [{ id: 'desc' }],
          take: 1,
        },
      },
    });

    return success({
      avatarUrl: user?.avatarUrl ?? '',
      nickName: user?.nickname ?? '微信用户',
      phoneNumber: user?.phone ?? '',
      gender: user?.gender ?? 0,
      address: user?.addresses[0]
        ? {
            provinceName: user.addresses[0].provinceName,
            provinceCode: user.addresses[0].provinceCode,
            cityName: user.addresses[0].cityName,
            cityCode: user.addresses[0].cityCode,
          }
        : null,
    });
  });
}

export async function PUT(request: Request): Promise<Response> {
  return withAuth(request, async (userId) => {
    let payload: z.infer<typeof updateSchema>;
    try {
      const body = await request.json();
      const parsed = updateSchema.safeParse(body);
      if (!parsed.success) {
        return fail('INVALID_PARAMS', 'Invalid profile params', 400);
      }
      payload = parsed.data;
    } catch {
      return fail('INVALID_PARAMS', 'Invalid request body', 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(payload.nickname !== undefined ? { nickname: payload.nickname } : {}),
        ...(payload.avatarUrl !== undefined ? { avatarUrl: payload.avatarUrl } : {}),
        ...(payload.gender !== undefined ? { gender: payload.gender } : {}),
      },
    });

    return success(true);
  });
}
