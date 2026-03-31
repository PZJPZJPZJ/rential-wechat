import { withAuth } from '@/lib/middleware';
import { fail, success } from '@/lib/response';
import { prisma } from '@/lib/db';
import { parseJsonArray, parseAddressInfo } from '@/lib/order';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> },
): Promise<Response> {
  return withAuth(request, async (userId) => {
    const { orderNo } = await params;
    if (!orderNo) {
      return fail('INVALID_PARAMS', 'orderNo is required', 400);
    }

    const order = await prisma.order.findFirst({
      where: { orderNo, userId },
      include: { logistics: true },
    });
    if (!order) {
      return fail('NOT_FOUND', 'Order not found', 404);
    }
    if (!order.logistics) {
      return fail('NOT_FOUND', 'Delivery info not found', 404);
    }

    const address = parseAddressInfo(order.addressInfo);

    return success({
      company: order.logistics.company,
      trackNo: order.logistics.trackNo,
      receiverName: String(address.name ?? order.logistics.receiverName),
      receiverPhone: String(address.phone ?? order.logistics.receiverPhone),
      receiverAddress: order.logistics.receiverAddress,
      traces: parseJsonArray<{ time: string; content: string }>(order.logistics.traces),
    });
  });
}
