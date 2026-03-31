import { withAuth } from '@/lib/middleware';
import { success } from '@/lib/response';
import { prisma } from '@/lib/db';

export async function GET(request: Request): Promise<Response> {
  return withAuth(request, async (userId) => {
    const list = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 20,
    });

    return success({
      historyWords: Array.from(new Set(list.map((item) => item.keyword))),
    });
  });
}

export async function DELETE(request: Request): Promise<Response> {
  return withAuth(request, async (userId) => {
    await prisma.searchHistory.deleteMany({
      where: { userId },
    });
    return success(true);
  });
}
