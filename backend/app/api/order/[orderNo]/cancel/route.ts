import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { fail, success } from '@/lib/response';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> },
): Promise<Response> {
  return withAuth(request, async (userId) => {
    const { orderNo } = await params;
    if (!orderNo) {
      return fail('INVALID_PARAMS', 'orderNo is required', 400);
    }

    try {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: { orderNo, userId },
          include: { items: true },
        });
        if (!order) {
          throw new Error('NOT_FOUND');
        }
        if (order.status !== 5) {
          throw new Error('INVALID_STATUS');
        }

        for (const item of order.items) {
          const sku = await tx.sku.findUnique({
            where: { skuId: item.skuId },
            select: { id: true, goodsId: true },
          });
          if (!sku) {
            continue;
          }
          await tx.sku.update({
            where: { id: sku.id },
            data: {
              stockQuantity: { increment: item.quantity },
              soldQuantity: { decrement: item.quantity },
            },
          });
          await tx.goods.update({
            where: { id: sku.goodsId },
            data: {
              spuStockQuantity: { increment: item.quantity },
              soldNum: { decrement: item.quantity },
            },
          });
        }

        await tx.order.update({
          where: { id: order.id },
          data: { status: 80 },
        });

        if (order.couponId) {
          await tx.userCoupon.updateMany({
            where: { id: order.couponId, userId },
            data: { status: 'unused', usedAt: null, orderId: null },
          });
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'NOT_FOUND') {
        return fail('NOT_FOUND', 'Order not found', 404);
      }
      if (error instanceof Error && error.message === 'INVALID_STATUS') {
        return fail('FORBIDDEN', 'Only pending payment orders can be cancelled', 403);
      }
      return fail('INTERNAL_ERROR', 'Failed to cancel order', 500);
    }

    return success(true);
  });
}
