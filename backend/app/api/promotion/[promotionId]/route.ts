import { prisma } from '@/lib/db';
import { fail, success } from '@/lib/response';
import { parseJsonArray } from '@/lib/order';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ promotionId: string }> },
): Promise<Response> {
  const { promotionId } = await params;
  if (!promotionId) {
    return fail('INVALID_PARAMS', 'promotionId is required', 400);
  }

  const promotion = await prisma.promotion.findUnique({
    where: { promotionId },
  });
  if (!promotion) {
    return fail('NOT_FOUND', 'Promotion not found', 404);
  }

  return success({
    promotionId: promotion.promotionId,
    title: promotion.title,
    description: promotion.description,
    promotionCode: promotion.promotionCode,
    promotionSubCode: promotion.promotionSubCode,
    tag: promotion.tag,
    startTime: promotion.startTime,
    endTime: promotion.endTime,
    activityLadder: parseJsonArray<{ label: string }>(promotion.activityLadder),
    goodsList: [],
  });
}
