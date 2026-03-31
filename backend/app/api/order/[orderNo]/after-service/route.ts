import { z } from 'zod';

import { withAuth } from '@/lib/middleware';
import { fail, success } from '@/lib/response';
import { prisma } from '@/lib/db';

const bodySchema = z.object({
  type: z.enum(['refund', 'return']),
  reason: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  images: z.array(z.string().trim().url()).max(9).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> },
): Promise<Response> {
  return withAuth(request, async (userId) => {
    const { orderNo } = await params;
    if (!orderNo) {
      return fail('INVALID_PARAMS', 'orderNo is required', 400);
    }

    let payload: z.infer<typeof bodySchema>;
    try {
      const body = await request.json();
      const parsed = bodySchema.safeParse(body);
      if (!parsed.success) {
        return fail('INVALID_PARAMS', 'Invalid after service params', 400);
      }
      payload = parsed.data;
    } catch {
      return fail('INVALID_PARAMS', 'Invalid request body', 400);
    }

    const order = await prisma.order.findFirst({
      where: { orderNo, userId },
      select: { id: true },
    });
    if (!order) {
      return fail('NOT_FOUND', 'Order not found', 404);
    }

    const created = await prisma.afterService.create({
      data: {
        orderId: order.id,
        type: payload.type,
        reason: payload.reason,
        description: payload.description,
        images: payload.images ? JSON.stringify(payload.images) : null,
      },
      select: { id: true },
    });

    return success({ afterServiceId: created.id }, 201);
  });
}
