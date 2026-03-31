import { withAuth } from '@/lib/middleware';
import { success } from '@/lib/response';
import { prisma } from '@/lib/db';

const formatDate = (date: Date) =>
  `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;

const buildDesc = (type: string, value: number, base: number) => {
  if (type === 'discount') {
    const discount = value / 10;
    return `打${discount}折${base > 0 ? `，满${base / 100}元可用` : ''}。`;
  }
  return `减免 ${value / 100} 元${base > 0 ? `，满${base / 100}元可用` : ''}。`;
};

export async function GET(request: Request): Promise<Response> {
  return withAuth(request, async (userId) => {
    const status = new URL(request.url).searchParams.get('status') ?? '';
    const list = await prisma.userCoupon.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      include: {
        coupon: true,
      },
      orderBy: [{ id: 'desc' }],
    });

    return success(
      list.map((item) => ({
        id: item.id,
        name: item.coupon.name,
        title: item.coupon.title,
        type: item.coupon.type,
        value: item.coupon.value,
        base: item.coupon.base,
        currency: item.coupon.currency,
        timeLimit:
          item.coupon.timeLimit ||
          `${formatDate(item.coupon.startAt)}-${formatDate(item.coupon.expireAt)}`,
        status: item.status,
        desc: buildDesc(item.coupon.type, item.coupon.value, item.coupon.base),
        storeAdapt: '商城通用',
        useNotes: '1个订单限使用1张，不可叠加其他同类优惠券。',
      })),
    );
  });
}
