import { z } from 'zod';

import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { fail, success } from '@/lib/response';

const addressSchema = z.object({
  name: z.string().trim().min(1).max(50),
  phone: z.string().trim().min(1).max(20),
  provinceName: z.string().trim().min(1),
  provinceCode: z.string().trim().min(1),
  cityName: z.string().trim().min(1),
  cityCode: z.string().trim().min(1),
  districtName: z.string().trim().min(1),
  districtCode: z.string().trim().min(1),
  detailAddress: z.string().trim().min(1).max(200),
  addressTag: z.string().trim().optional(),
  isDefault: z.coerce.number().int().min(0).max(1).default(0),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
});

export async function GET(request: Request): Promise<Response> {
  return withAuth(request, async (userId) => {
    const list = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
    });

    return success(
      list.map((item) => ({
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
      })),
    );
  });
}

export async function POST(request: Request): Promise<Response> {
  return withAuth(request, async (userId) => {
    let payload: z.infer<typeof addressSchema>;
    try {
      const body = await request.json();
      const parsed = addressSchema.safeParse(body);
      if (!parsed.success) {
        return fail('INVALID_PARAMS', 'Invalid address params', 400);
      }
      payload = parsed.data;
    } catch {
      return fail('INVALID_PARAMS', 'Invalid request body', 400);
    }

    const addressId = await prisma.$transaction(async (tx) => {
      if (payload.isDefault === 1) {
        await tx.address.updateMany({
          where: { userId, isDefault: 1 },
          data: { isDefault: 0 },
        });
      }

      const created = await tx.address.create({
        data: {
          userId,
          name: payload.name,
          phone: payload.phone,
          provinceName: payload.provinceName,
          provinceCode: payload.provinceCode,
          cityName: payload.cityName,
          cityCode: payload.cityCode,
          districtName: payload.districtName,
          districtCode: payload.districtCode,
          detailAddress: payload.detailAddress,
          addressTag: payload.addressTag ?? '',
          isDefault: payload.isDefault,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
        },
        select: { id: true },
      });
      return created.id;
    });

    return success({ addressId: String(addressId) }, 201);
  });
}
