import { withAuth } from '@/lib/middleware';
import { fail, success } from '@/lib/response';
import { prisma } from '@/lib/db';
import { mapOrderBase, parseAddressInfo } from '@/lib/order';

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
      include: {
        items: true,
        logistics: true,
      },
    });
    if (!order) {
      return fail('NOT_FOUND', 'Order not found', 404);
    }

    const address = parseAddressInfo(order.addressInfo);

    return success({
      ...mapOrderBase(order, order.items),
      logisticsVO: order.logistics
        ? {
            logisticsType: 1,
            logisticsNo: order.logistics.trackNo,
            logisticsStatus: null,
            logisticsCompanyCode: '',
            logisticsCompanyName: order.logistics.company,
            receiverAddressId: '0',
            provinceCode: String(address.provinceCode ?? ''),
            cityCode: String(address.cityCode ?? ''),
            countryCode: String(address.districtCode ?? ''),
            receiverProvince: String(address.provinceName ?? ''),
            receiverCity: String(address.cityName ?? ''),
            receiverCountry: String(address.districtName ?? ''),
            receiverArea: '',
            receiverAddress: String(address.detailAddress ?? ''),
            receiverPostCode: '',
            receiverLongitude: String(address.longitude ?? ''),
            receiverLatitude: String(address.latitude ?? ''),
            receiverIdentity: String(order.userId),
            receiverPhone: String(address.phone ?? ''),
            receiverName: String(address.name ?? ''),
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
            provinceCode: String(address.provinceCode ?? ''),
            cityCode: String(address.cityCode ?? ''),
            countryCode: String(address.districtCode ?? ''),
            receiverProvince: String(address.provinceName ?? ''),
            receiverCity: String(address.cityName ?? ''),
            receiverCountry: String(address.districtName ?? ''),
            receiverArea: '',
            receiverAddress: String(address.detailAddress ?? ''),
            receiverPostCode: '',
            receiverLongitude: String(address.longitude ?? ''),
            receiverLatitude: String(address.latitude ?? ''),
            receiverIdentity: String(order.userId),
            receiverPhone: String(address.phone ?? ''),
            receiverName: String(address.name ?? ''),
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
      trajectoryVos: order.logistics
        ? [
            {
              title: '已发货',
              icon: 'deliver',
              code: '200003',
              nodes: [{ status: '订单已发货', timestamp: String(Date.now()), remark: null }],
              isShow: true,
            },
            {
              title: '已下单',
              icon: '',
              code: '200001',
              nodes: [
                {
                  status: '订单已提交',
                  timestamp: String(order.createdAt.getTime()),
                  remark: null,
                },
              ],
              isShow: true,
            },
          ]
        : [
            {
              title: '已下单',
              icon: '',
              code: '200001',
              nodes: [
                {
                  status: '订单已提交',
                  timestamp: String(order.createdAt.getTime()),
                  remark: null,
                },
              ],
              isShow: true,
            },
          ],
    });
  });
}
