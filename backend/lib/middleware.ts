import { prisma } from '@/lib/db';
import { fail } from '@/lib/response';

export async function withAuth(
  request: Request,
  handler: (userId: number, req: Request) => Promise<Response>,
): Promise<Response> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return fail('UNAUTHORIZED', '未提供访问令牌', 401);
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return fail('UNAUTHORIZED', '访问令牌格式无效', 401);
  }

  try {
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt.getTime() < Date.now()) {
      return fail('UNAUTHORIZED', '登录已过期，请重新登录', 401);
    }

    return handler(session.userId, request);
  } catch {
    return fail('INTERNAL_ERROR', '服务器内部错误', 500);
  }
}
