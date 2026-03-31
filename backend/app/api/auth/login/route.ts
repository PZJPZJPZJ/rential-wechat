import { z } from 'zod';

import { loginWithWechatCode } from '@/lib/auth';
import { fail, success } from '@/lib/response';

const loginSchema = z.object({
  code: z.string().trim().min(1, 'code is required'),
});

export async function POST(request: Request): Promise<Response> {
  let parsedBody: z.infer<typeof loginSchema>;

  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return fail('INVALID_PARAMS', 'Invalid login params', 400);
    }

    parsedBody = result.data;
  } catch {
    return fail('INVALID_PARAMS', 'Invalid request body', 400);
  }

  try {
    const { token } = await loginWithWechatCode(parsedBody.code);

    return success({ token }, 201);
  } catch {
    return fail('UNAUTHORIZED', 'Wechat login failed', 401);
  }
}
