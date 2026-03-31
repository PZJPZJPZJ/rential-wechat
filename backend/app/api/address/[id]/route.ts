import { z } from 'zod';

import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { fail, success } from '@/lib/response';

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    phone: z.string().trim().min(1).max(20).optional(),
    provinceName: z.string().trim().min(1).optional(),
    provinceCode: z.string().trim().min(1).optional(),
    cityName: z.string().trim().min(1).optional(),
    cityCode: z.string().trim().min(1).optional(),
    districtName: z.string().trim().min(1).optional(),
    districtCode: z.string().trim().min(1).optional(),
    detailAddress: z.string().trim().min(1).max(200).optional(),
    addressTag: z.string().trim().optional(),
    isDefault: z.coerce.number().int().min(0).max(1).optional(),
    latitude: z.string().optional().nullable(),
    longitude: z.string().optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'No fields to update' });

const parseId = (raw: string) => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withAuth(request, async (userId) => {
    const { id } = await params;
    const addressId = parseId(id);
    if (!addressId) {
      return fail('INVALID_PARAMS', 'Invalid address id', 400);
    }

    const item = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!item) {
      return fail('NOT_FOUND', 'Address not found', 404);
    }

    return success({
      saasId: '88888888',
      id: String(item.id),
      addressId: String(item.id),
      name: item.name,
      phone: item.phone,
      countryName: '中国',
      countryCode: 'chn',
      provinceName: item.provinceName,
      provinceCode: item.provinceCode,
      cityName: item.cityName,
      cityCode: item.cityCode,
      districtName: item.districtName,
      districtCode: item.districtCode,
      detailAddress: item.detailAddress,
      addressTag: item.addressTag ?? '',
      isDefault: item.isDefault,
      latitude: item.latitude,
      longitude: item.longitude,
    });
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withAuth(request, async (userId) => {
    const { id } = await params;
    const addressId = parseId(id);
    if (!addressId) {
      return fail('INVALID_PARAMS', 'Invalid address id', 400);
    }

    let payload: z.infer<typeof updateSchema>;
    try {
      const body = await request.json();
      const parsed = updateSchema.safeParse(body);
      if (!parsed.success) {
        return fail('INVALID_PARAMS', 'Invalid address params', 400);
      }
      payload = parsed.data;
    } catch {
      return fail('INVALID_PARAMS', 'Invalid request body', 400);
    }

    const current = await prisma.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true },
    });
    if (!current) {
      return fail('NOT_FOUND', 'Address not found', 404);
    }

    await prisma.$transaction(async (tx) => {
      if (payload.isDefault === 1) {
        await tx.address.updateMany({
          where: { userId, isDefault: 1 },
          data: { isDefault: 0 },
        });
      }

      await tx.address.update({
        where: { id: addressId },
        data: {
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
          ...(payload.provinceName !== undefined ? { provinceName: payload.provinceName } : {}),
          ...(payload.provinceCode !== undefined ? { provinceCode: payload.provinceCode } : {}),
          ...(payload.cityName !== undefined ? { cityName: payload.cityName } : {}),
          ...(payload.cityCode !== undefined ? { cityCode: payload.cityCode } : {}),
          ...(payload.districtName !== undefined ? { districtName: payload.districtName } : {}),
          ...(payload.districtCode !== undefined ? { districtCode: payload.districtCode } : {}),
          ...(payload.detailAddress !== undefined ? { detailAddress: payload.detailAddress } : {}),
          ...(payload.addressTag !== undefined ? { addressTag: payload.addressTag } : {}),
          ...(payload.isDefault !== undefined ? { isDefault: payload.isDefault } : {}),
          ...(payload.latitude !== undefined ? { latitude: payload.latitude } : {}),
          ...(payload.longitude !== undefined ? { longitude: payload.longitude } : {}),
        },
      });
    });

    return success(true);
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withAuth(request, async (userId) => {
    const { id } = await params;
    const addressId = parseId(id);
    if (!addressId) {
      return fail('INVALID_PARAMS', 'Invalid address id', 400);
    }

    const deleted = await prisma.address.deleteMany({
      where: { id: addressId, userId },
    });
    if (deleted.count === 0) {
      return fail('NOT_FOUND', 'Address not found', 404);
    }

    return success(true);
  });
}
