import { z } from 'zod';

import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { success, fail } from '@/lib/response';
import { mapOrderBase } from '@/lib/order';

const querySchema = z.object({
  pageNum: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  orderStatus: z.coerce.number().int().optional(),
});

export async function GET(request: Request): Promise<Response> {
  return withAuth(request, async (userId) => {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      pageNum: searchParams.get('pageNum') ?? 1,
      pageSize: searchParams.get('pageSize') ?? 10,
      orderStatus: searchParams.get('orderStatus') ?? undefined,
    });
    if (!parsed.success) {
      return fail('INVALID_PARAMS', 'Invalid query params', 400);
    }

    const { pageNum, pageSize, orderStatus } = parsed.data;
    const where = {
      userId,
      ...(typeof orderStatus === 'number' ? { status: orderStatus } : {}),
    };

    const [totalCount, orders] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: { items: true, logistics: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return success({
      pageNum,
      pageSize,
      totalCount,
      orders: orders.map((order) => ({
        ...mapOrderBase(order, order.items),
        logisticsVO: order.logistics
          ? {
              logisticsType: 1,
              logisticsNo: order.logistics.trackNo,
              logisticsStatus: null,
              logisticsCompanyCode: '',
              logisticsCompanyName: order.logistics.company,
              receiverAddressId: '0',
              provinceCode: '',
              cityCode: '',
              countryCode: '',
              receiverProvince: '',
              receiverCity: '',
              receiverCountry: '',
              receiverArea: '',
              receiverAddress: order.logistics.receiverAddress,
              receiverPostCode: '',
              receiverLongitude: '',
              receiverLatitude: '',
              receiverIdentity: String(order.userId),
              receiverPhone: order.logistics.receiverPhone,
              receiverName: order.logistics.receiverName,
              expectArrivalTime: null,
              senderName: '',
              senderPhone: '',
              senderAddress: '',
              sendTime: null,
              arrivalTime: null,
            }
          : {
              logisticsType: 1,
              logisticsNo: '',
              logisticsStatus: null,
              logisticsCompanyCode: '',
              logisticsCompanyName: '',
              receiverAddressId: '0',
              provinceCode: '',
              cityCode: '',
              countryCode: '',
              receiverProvince: '',
              receiverCity: '',
              receiverCountry: '',
              receiverArea: '',
              receiverAddress: '',
              receiverPostCode: '',
              receiverLongitude: '',
              receiverLatitude: '',
              receiverIdentity: String(order.userId),
              receiverPhone: '',
              receiverName: '',
              expectArrivalTime: null,
              senderName: '',
              senderPhone: '',
              senderAddress: '',
              sendTime: null,
              arrivalTime: null,
            },
        paymentVO: {
          payStatus: order.status === 5 ? 1 : 2,
          amount: String(order.totalAmount),
          currency: 'CNY',
          payType: null,
          payWay: null,
          payWayName: null,
          interactId: null,
          traceNo: null,
          channelTrxNo: null,
          period: null,
          payTime: order.payTime ? String(order.payTime.getTime()) : null,
          paySuccessTime: order.payTime ? String(order.payTime.getTime()) : null,
        },
      })),
    });
  });
}
