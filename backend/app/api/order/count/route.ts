import { withAuth } from '@/lib/middleware';
import { success } from '@/lib/response';
import { prisma } from '@/lib/db';

export async function GET(request: Request): Promise<Response> {
  return withAuth(request, async (userId) => {
    const grouped = await prisma.order.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        status: true,
      },
    });

    const countMap = new Map(grouped.map((item) => [item.status, item._count.status]));
    return success([
      { tabType: 5, orderNum: countMap.get(5) ?? 0 },
      { tabType: 10, orderNum: countMap.get(10) ?? 0 },
      { tabType: 40, orderNum: countMap.get(40) ?? 0 },
      { tabType: 50, orderNum: countMap.get(50) ?? 0 },
    ]);
  });
}
