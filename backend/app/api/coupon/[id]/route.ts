import { withAuth } from '@/lib/middleware';
import { fail, success } from '@/lib/response';
import { prisma } from '@/lib/db';

const buildDesc = (type: string, value: number, base: number) => {
  if (type === 'discount') {
    const discount = value / 10;
    return `打${discount}折${base > 0 ? `，满${base / 100}元可用` : ''}。`;
  }
  return `减免 ${value / 100} 元${base > 0 ? `，满${base / 100}元可用` : ''}。`;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withAuth(request, async (userId) => {
    const { id } = await params;
    const couponId = Number(id);
    if (!Number.isInteger(couponId) || couponId <= 0) {
      return fail('INVALID_PARAMS', 'Invalid coupon id', 400);
    }

    const userCoupon =
      (await prisma.userCoupon.findFirst({
        where: { id: couponId, userId },
        include: { coupon: true },
      })) ||
      (await prisma.userCoupon.findFirst({
        where: { couponId, userId },
        include: { coupon: true },
      }));

    if (!userCoupon) {
      return fail('NOT_FOUND', 'Coupon not found', 404);
    }

    return success({
      detail: {
        id: userCoupon.id,
        type: userCoupon.coupon.type,
        value: userCoupon.coupon.value,
        base: userCoupon.coupon.base,
        desc: buildDesc(userCoupon.coupon.type, userCoupon.coupon.value, userCoupon.coupon.base),
        storeAdapt: '商城通用',
        useNotes: '1个订单限使用1张，不可叠加其他同类优惠券。',
      },
      storeInfoList: [],
    });
  });
}
