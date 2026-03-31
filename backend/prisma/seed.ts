import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const bannerImages = [
  'https://tdesign.gtimg.com/miniprogram/template/retail/home/v2/banner1.png',
  'https://tdesign.gtimg.com/miniprogram/template/retail/home/v2/banner2.png',
  'https://tdesign.gtimg.com/miniprogram/template/retail/home/v2/banner3.png',
  'https://tdesign.gtimg.com/miniprogram/template/retail/home/v2/banner4.png',
  'https://tdesign.gtimg.com/miniprogram/template/retail/home/v2/banner5.png',
  'https://tdesign.gtimg.com/miniprogram/template/retail/home/v2/banner6.png',
];

const couponTemplates = [
  { name: '生鲜满减券', title: '生鲜满减券-1', type: 'price', value: 1000, base: 10000 },
  { name: '生鲜满减券', title: '生鲜满减券-2', type: 'price', value: 1800, base: 20000 },
  { name: '通用折扣券', title: '通用折扣券-1', type: 'discount', value: 85, base: 10000 },
  { name: '通用折扣券', title: '通用折扣券-2', type: 'discount', value: 90, base: 5000 },
  { name: '无门槛券', title: '无门槛券-1', type: 'price', value: 500, base: 0 },
];

const promotions = [
  { promotionId: '1', title: '满减满折回归', subCode: 'MYJ', tag: '满减' },
  { promotionId: '2', title: '暑期折扣季', subCode: 'MYG', tag: '满折' },
  { promotionId: '3', title: '品牌联合促销', subCode: 'MYJ', tag: '满减' },
];

const buildGoodSeed = (idx: number, categoryId: number) => {
  const spuId = `SPU${1000 + idx}`;
  const skuBase = 200000 + idx * 10;
  const salePrice = 9900 + idx * 500;
  const linePrice = salePrice + 3000;
  const stock = 100 + idx * 20;

  return {
    spuId,
    title: `示例商品-${idx + 1}`,
    primaryImage: `https://tdesign.gtimg.com/miniprogram/template/retail/goods/dz-${(idx % 3) + 1}a.png`,
    images: JSON.stringify([
      `https://tdesign.gtimg.com/miniprogram/template/retail/goods/dz-${(idx % 3) + 1}a.png`,
      `https://tdesign.gtimg.com/miniprogram/template/retail/goods/dz-${(idx % 3) + 1}b.png`,
    ]),
    desc: JSON.stringify([
      `https://tdesign.gtimg.com/miniprogram/template/retail/goods/dz-${(idx % 3) + 1}c.png`,
    ]),
    minSalePrice: salePrice,
    maxSalePrice: salePrice + 1000,
    minLinePrice: linePrice,
    maxLinePrice: linePrice + 1000,
    spuStockQuantity: stock * 3,
    soldNum: idx * 10,
    isPutOnSale: 1,
    isSoldOut: false,
    storeId: '1000',
    etitle: '',
    categoryId,
    limitInfo: JSON.stringify([{ text: '限购5件' }]),
    spuTags: [{ title: idx % 2 === 0 ? '限时抢购' : '热卖' }],
    specGroups: [
      {
        specId: `color_${idx}`,
        title: '颜色',
        values: [{ specValueId: `color_${idx}_white`, specValue: '白色' }],
      },
      {
        specId: `size_${idx}`,
        title: '尺码',
        values: [
          { specValueId: `size_${idx}_s`, specValue: 'S' },
          { specValueId: `size_${idx}_m`, specValue: 'M' },
        ],
      },
    ],
    skus: [
      {
        skuId: `${skuBase + 1}`,
        salePrice,
        linePrice,
        stockQuantity: stock,
        soldQuantity: idx * 2,
        specInfo: JSON.stringify([
          {
            specId: `color_${idx}`,
            specTitle: '颜色',
            specValueId: `color_${idx}_white`,
            specValue: '白色',
          },
          {
            specId: `size_${idx}`,
            specTitle: '尺码',
            specValueId: `size_${idx}_s`,
            specValue: 'S',
          },
        ]),
      },
      {
        skuId: `${skuBase + 2}`,
        salePrice: salePrice + 1000,
        linePrice: linePrice + 1000,
        stockQuantity: stock,
        soldQuantity: idx * 2,
        specInfo: JSON.stringify([
          {
            specId: `color_${idx}`,
            specTitle: '颜色',
            specValueId: `color_${idx}_white`,
            specValue: '白色',
          },
          {
            specId: `size_${idx}`,
            specTitle: '尺码',
            specValueId: `size_${idx}_m`,
            specValue: 'M',
          },
        ]),
      },
    ],
  };
};

async function main() {
  await prisma.afterService.deleteMany();
  await prisma.logistics.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.searchHistory.deleteMany();
  await prisma.userCoupon.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.spuTag.deleteMany();
  await prisma.sku.deleteMany();
  await prisma.specValue.deleteMany();
  await prisma.specGroup.deleteMany();
  await prisma.goods.deleteMany();
  await prisma.category.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.address.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  for (let i = 0; i < bannerImages.length; i += 1) {
    await prisma.banner.create({
      data: {
        image: bannerImages[i],
        sort: i,
      },
    });
  }

  const women = await prisma.category.create({
    data: {
      groupId: '24948',
      name: '女装',
      thumbnail: 'https://tdesign.gtimg.com/miniprogram/template/retail/category/category-default.png',
      sort: 1,
    },
  });
  const men = await prisma.category.create({
    data: {
      groupId: '24949',
      name: '男装',
      thumbnail: 'https://tdesign.gtimg.com/miniprogram/template/retail/category/category-default.png',
      sort: 2,
    },
  });
  const beauty = await prisma.category.create({
    data: {
      groupId: '24950',
      name: '美妆',
      thumbnail: 'https://tdesign.gtimg.com/miniprogram/template/retail/category/category-default.png',
      sort: 3,
    },
  });

  const womenChild = await prisma.category.create({
    data: {
      groupId: '249480',
      name: '连衣裙',
      thumbnail: 'https://tdesign.gtimg.com/miniprogram/template/retail/classify/img-9.png',
      parentId: women.id,
      sort: 1,
    },
  });
  const menChild = await prisma.category.create({
    data: {
      groupId: '249481',
      name: '卫衣',
      thumbnail: 'https://tdesign.gtimg.com/miniprogram/template/retail/classify/img-1.png',
      parentId: men.id,
      sort: 1,
    },
  });
  const beautyChild = await prisma.category.create({
    data: {
      groupId: '249482',
      name: '眼影',
      thumbnail: 'https://tdesign.gtimg.com/miniprogram/template/retail/goods/mz-12b.png',
      parentId: beauty.id,
      sort: 1,
    },
  });

  const leafCategories = [womenChild.id, menChild.id, beautyChild.id];
  for (let i = 0; i < 8; i += 1) {
    const item = buildGoodSeed(i, leafCategories[i % leafCategories.length]);
    await prisma.goods.create({
      data: {
        spuId: item.spuId,
        title: item.title,
        primaryImage: item.primaryImage,
        images: item.images,
        desc: item.desc,
        minSalePrice: item.minSalePrice,
        maxSalePrice: item.maxSalePrice,
        minLinePrice: item.minLinePrice,
        maxLinePrice: item.maxLinePrice,
        spuStockQuantity: item.spuStockQuantity,
        soldNum: item.soldNum,
        isPutOnSale: item.isPutOnSale,
        isSoldOut: item.isSoldOut,
        storeId: item.storeId,
        etitle: item.etitle,
        categoryId: item.categoryId,
        limitInfo: item.limitInfo,
        spuTags: {
          create: item.spuTags,
        },
        specGroups: {
          create: item.specGroups.map((group) => ({
            specId: group.specId,
            title: group.title,
            specValues: {
              create: group.values,
            },
          })),
        },
        skus: {
          create: item.skus.map((sku) => ({
            skuId: sku.skuId,
            skuImage: item.primaryImage,
            specInfo: sku.specInfo,
            salePrice: sku.salePrice,
            linePrice: sku.linePrice,
            stockQuantity: sku.stockQuantity,
            soldQuantity: sku.soldQuantity,
          })),
        },
      },
    });
  }

  const user = await prisma.user.create({
    data: {
      openid: 'mock_openid_1',
      nickname: '测试用户',
      avatarUrl:
        'https://we-retail-static-1300977798.cos.ap-guangzhou.myqcloud.com/retail-ui/components-exp/avatar/avatar-1.jpg',
      phone: '17600000000',
      gender: 1,
      points: 100,
    },
  });

  await prisma.address.create({
    data: {
      userId: user.id,
      name: '张三',
      phone: '17600000000',
      provinceName: '广东省',
      provinceCode: '440000',
      cityName: '深圳市',
      cityCode: '440300',
      districtName: '南山区',
      districtCode: '440305',
      detailAddress: '科技园一路 1 号',
      addressTag: '家',
      isDefault: 1,
    },
  });

  const couponRecords = [];
  for (const tpl of couponTemplates) {
    const coupon = await prisma.coupon.create({
      data: {
        name: tpl.name,
        title: tpl.title,
        type: tpl.type,
        value: tpl.value,
        base: tpl.base,
        currency: '¥',
        timeLimit: '2026.01.01-2026.12.31',
        startAt: new Date('2026-01-01T00:00:00.000Z'),
        expireAt: new Date('2026-12-31T23:59:59.000Z'),
      },
    });
    couponRecords.push(coupon);
  }

  for (const coupon of couponRecords) {
    await prisma.userCoupon.create({
      data: {
        userId: user.id,
        couponId: coupon.id,
        status: 'unused',
      },
    });
  }

  for (const promotion of promotions) {
    await prisma.promotion.create({
      data: {
        promotionId: promotion.promotionId,
        title: promotion.title,
        description: null,
        promotionCode: 'MERCHANT',
        promotionSubCode: promotion.subCode,
        tag: promotion.tag,
        startTime: String(Date.now() - 7 * 24 * 3600 * 1000),
        endTime: String(Date.now() + 30 * 24 * 3600 * 1000),
        activityLadder: JSON.stringify([{ label: '满100元减9.9元' }]),
      },
    });
  }

  console.log('Seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
