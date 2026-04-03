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

const templateProducts = [
  { title: '纯棉宽松打底衫多色可选', descText: '100%纯棉，柔软亲肤，吸汗透气，夏日必备单品' },
  { title: '秋季新款韩版宽松百搭连帽针织毛衣', descText: '慵懒风，柔软针织面料，宽松版型，显瘦百搭' },
  { title: '高腰直筒牛仔裤女宽松显瘦垂感长裤', descText: '修饰腿型，提高腰线，复古水洗蓝，百搭不过时' },
  { title: '极简风翻领长袖薄款衬衣职业通勤', descText: '不易起球，免烫工艺，垂坠感极佳，干练气质' },
  { title: '加绒加厚保暖运动卫衣男女同款', descText: '内里摇粒绒，防风保暖，休闲运动皆宜' },
  { title: '哑光丝绒唇釉显白不易掉色', descText: '高级丝绒质地，浓郁显色，长效持妆，不拔干' },
  { title: '氨基酸温和保湿洁面乳洗面奶', descText: '温和洁净，深层补水，洗后不紧绷，敏感肌适用' },
  { title: '持妆轻透粉底液遮瑕控油持久', descText: '轻薄透气，无暇底妆，24小时持妆力，防水防汗' },
  { title: '防水持久极细眼线液笔不晕染', descText: '0.01mm极细笔尖，出水流畅，一笔成型，新手友好' },
  { title: '清爽防晒霜SPF50+隔离紫外线', descText: '抗老防晒，质地轻盈，成膜快，不假白，全天防护' },
  { title: '复古法式方领碎花长裙收腰显瘦', descText: '浪漫法式风情，优雅碎花，方领设计展露锁骨' },
  { title: '多功能家用大容量空气炸锅', descText: '无油烟烹饪，全自动控温，360度热风循环，健康轻食' },
  { title: '智能降噪真无线蓝牙耳机', descText: '主动降噪，HIFI重低音，超长续航，人体工学设计' },
  { title: '家用全自动迷你破壁机豆浆机', descText: '免过滤，一键清洗，细腻无渣，冷热双打' },
  { title: '高颜值便携保温杯大容量', descText: '316不锈钢内胆，24小时长效保温保冷，密封防漏' },
];

const buildGoodSeed = (idx: number, categoryId: number) => {
  const spuId = `SPU${1000 + idx}`;
  const skuBase = 200000 + idx * 10;
  
  const tpl = templateProducts[idx % templateProducts.length];
  
  // 生成看起来合理的金额
  const salePrice = (89 + (idx * 37) % 200) * 100;
  const linePrice = salePrice + ((50 + (idx * 13) % 100) * 100);
  const stock = 100 + (idx * 27) % 200;

  return {
    spuId,
    title: tpl.title,
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
    soldNum: (idx * 47) % 500,
    isPutOnSale: 1,
    isSoldOut: false,
    storeId: '1000',
    etitle: tpl.descText,
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

  const digital = await prisma.category.create({
    data: {
      groupId: '24951',
      name: '数码',
      thumbnail: 'https://tdesign.gtimg.com/miniprogram/template/retail/category/category-default.png',
      sort: 4,
    },
  });
  const home = await prisma.category.create({
    data: {
      groupId: '24952',
      name: '家居',
      thumbnail: 'https://tdesign.gtimg.com/miniprogram/template/retail/category/category-default.png',
      sort: 5,
    },
  });

  const womenChild = await prisma.category.create({
    data: {
      groupId: '249480',
      name: '裙装',
      thumbnail: 'https://tdesign.gtimg.com/miniprogram/template/retail/classify/img-9.png',
      parentId: women.id,
      sort: 1,
    },
  });
  const menChild = await prisma.category.create({
    data: {
      groupId: '249481',
      name: '上装',
      thumbnail: 'https://tdesign.gtimg.com/miniprogram/template/retail/classify/img-1.png',
      parentId: men.id,
      sort: 1,
    },
  });
  const beautyChild = await prisma.category.create({
    data: {
      groupId: '249482',
      name: '彩妆',
      thumbnail: 'https://tdesign.gtimg.com/miniprogram/template/retail/goods/mz-12b.png',
      parentId: beauty.id,
      sort: 1,
    },
  });
  const beautySkinChild = await prisma.category.create({
    data: {
      groupId: '249483',
      name: '护肤',
      thumbnail: 'https://tdesign.gtimg.com/miniprogram/template/retail/category/category-default.png',
      parentId: beauty.id,
      sort: 2,
    },
  });
  const digitalChild = await prisma.category.create({
    data: {
      groupId: '249484',
      name: '影音娱乐',
      thumbnail: 'https://tdesign.gtimg.com/miniprogram/template/retail/category/category-default.png',
      parentId: digital.id,
      sort: 1,
    },
  });
  const homeChild = await prisma.category.create({
    data: {
      groupId: '249485',
      name: '厨房小电',
      thumbnail: 'https://tdesign.gtimg.com/miniprogram/template/retail/category/category-default.png',
      parentId: home.id,
      sort: 1,
    },
  });

  const leafCategories = [
    womenChild.id, 
    menChild.id, 
    beautyChild.id, 
    beautySkinChild.id, 
    digitalChild.id, 
    homeChild.id
  ];
  
  // 生成更多的商品 (以前是 8 个，现在我们生成 15 个，覆盖完上面的全部商品模板)
  for (let i = 0; i < 15; i += 1) {
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
