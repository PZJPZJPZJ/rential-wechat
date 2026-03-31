import { z } from 'zod';

import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { fail, success } from '@/lib/response';

const updateCartSchema = z
  .object({
    quantity: z.coerce.number().int().min(1).max(999).optional(),
    isSelected: z.coerce.number().int().min(0).max(1).optional(),
  })
  .refine((value) => value.quantity !== undefined || value.isSelected !== undefined, {
    message: 'quantity or isSelected is required',
  });

const parseCartId = (raw: string) => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withAuth(request, async (userId) => {
    const { id } = await params;
    const cartId = parseCartId(id);
    if (!cartId) {
      return fail('INVALID_PARAMS', 'Invalid cart id', 400);
    }

    let payload: z.infer<typeof updateCartSchema>;
    try {
      const body = await request.json();
      const result = updateCartSchema.safeParse(body);
      if (!result.success) {
        return fail('INVALID_PARAMS', 'Invalid cart params', 400);
      }
      payload = result.data;
    } catch {
      return fail('INVALID_PARAMS', 'Invalid request body', 400);
    }

    const current = await prisma.cart.findFirst({
      where: { id: cartId, userId },
      select: { id: true },
    });
    if (!current) {
      return fail('NOT_FOUND', 'Cart item not found', 404);
    }

    await prisma.cart.update({
      where: { id: cartId },
      data: {
        ...(payload.quantity !== undefined ? { quantity: payload.quantity } : {}),
        ...(payload.isSelected !== undefined ? { isSelected: payload.isSelected } : {}),
      },
    });

    return success(true);
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withAuth(request, async (userId) => {
    const { id } = await params;
    const cartId = parseCartId(id);
    if (!cartId) {
      return fail('INVALID_PARAMS', 'Invalid cart id', 400);
    }

    const deleted = await prisma.cart.deleteMany({
      where: { id: cartId, userId },
    });
    if (deleted.count === 0) {
      return fail('NOT_FOUND', 'Cart item not found', 404);
    }

    return success(true);
  });
}
