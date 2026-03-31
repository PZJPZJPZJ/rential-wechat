import { type User } from '@prisma/client';
import { randomUUID } from 'crypto';

import { prisma } from '@/lib/db';
import { code2Session } from '@/lib/wechat';

const DEFAULT_SESSION_EXPIRE_DAYS = 7;

export const generateSessionToken = () => randomUUID();

export const getSessionExpiresAt = (days = DEFAULT_SESSION_EXPIRE_DAYS) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
};

export const createSession = async (userId: number, expiresAt = getSessionExpiresAt()) => {
  const token = generateSessionToken();

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
};

export const getSessionByToken = async (token: string) =>
  prisma.session.findUnique({
    where: { token },
  });

export const revokeSession = async (token: string) =>
  prisma.session.deleteMany({
    where: { token },
  });

export interface LoginWithWechatCodeResult {
  token: string;
  user: User;
}

export const loginWithWechatCode = async (code: string): Promise<LoginWithWechatCodeResult> => {
  const { openid } = await code2Session(code);

  const user = await prisma.user.upsert({
    where: { openid },
    update: {},
    create: {
      openid,
    },
  });

  const token = await createSession(user.id);

  return { token, user };
};
