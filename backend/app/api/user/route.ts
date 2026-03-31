import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { success } from '@/lib/response';

export async function GET(request: Request): Promise<Response> {
  return withAuth(request, async (userId) => {
    const [user, orderGrouped, couponCount, afterServiceCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: { userId },
        _count: {
          status: true,
        },
      }),
      prisma.userCoupon.count({
        where: { userId, status: 'unused' },
      }),
      prisma.afterService.count({
        where: {
          order: {
            userId,
          },
          status: 'pending',
        },
      }),
    ]);

    const countMap = new Map(orderGrouped.map((item) => [item.status, item._count.status]));

    return success({
      userInfo: {
        avatarUrl: user?.avatarUrl ?? '',
        nickName: user?.nickname ?? '微信用户',
        phoneNumber: user?.phone ?? '',
        gender: user?.gender ?? 0,
      },
      countsData: [
        { num: user?.points ?? 0, name: '积分', type: 'point' },
        { num: couponCount, name: '优惠券', type: 'coupon' },
      ],
      orderTagInfos: [
        { tabType: 5, orderNum: countMap.get(5) ?? 0 },
        { tabType: 10, orderNum: countMap.get(10) ?? 0 },
        { tabType: 40, orderNum: countMap.get(40) ?? 0 },
        { tabType: 0, orderNum: afterServiceCount },
      ],
      customerServiceInfo: {
        servicePhone: '4006336868',
        serviceTimeDuration: '每周一至周五 9:00-12:00 13:00-18:00',
      },
    });
  });
}
