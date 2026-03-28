# 零售微信小程序后端设计文档

> 基于 `rential-wechat` 微信小程序前端工程逆向分析生成
> 技术栈：Next.js 15 (App Router) + Prisma ORM + SQLite
> 创建时间：2026-03-25

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [目录结构](#3-目录结构)
4. [数据库设计（Prisma Schema）](#4-数据库设计)
5. [API 接口规范](#5-api-接口规范)
6. [各模块接口详情](#6-各模块接口详情)
   - 6.1 [认证模块](#61-认证模块-apiauthlogin)
   - 6.2 [首页模块](#62-首页模块-apihome)
   - 6.3 [商品模块](#63-商品模块-apigoods)
   - 6.4 [分类模块](#64-分类模块-apicategory)
   - 6.5 [购物车模块](#65-购物车模块-apicart)
   - 6.6 [订单模块](#66-订单模块-apiorder)
   - 6.7 [地址模块](#67-地址模块-apiaddress)
   - 6.8 [优惠券模块](#68-优惠券模块-apicoupon)
   - 6.9 [用户中心模块](#69-用户中心模块-apiuser)
   - 6.10 [搜索模块](#610-搜索模块-apisearch)
   - 6.11 [促销活动模块](#611-促销活动模块-apipromotion)
7. [统一响应格式](#7-统一响应格式)
8. [认证与安全](#8-认证与安全)
9. [前端对接指南](#9-前端对接指南)
10. [环境变量配置](#10-环境变量配置)
11. [初始化与种子数据](#11-初始化与种子数据)

---

## 1. 项目概述

本后端服务为 `rential-wechat` 微信小程序提供数据支撑，替换前端工程中 `config/index.js` 的 `useMock: true` 模式。

**小程序功能模块：**

| 模块 | 说明 |
|------|------|
| 首页 | 轮播图、Tab 分类、商品列表 |
| 商品分类 | 多级分类树 |
| 商品详情 | SPU/SKU 规格选择、评论 |
| 购物车 | 多商品选择、促销分组 |
| 订单 | 下单、结算、物流、售后 |
| 用户中心 | 个人信息、积分、优惠券统计 |
| 地址管理 | 收货地址 CRUD |
| 优惠券 | 列表、详情、使用状态 |
| 搜索 | 关键词搜索、历史记录 |
| 促销活动 | 满减活动详情 |

---

## 2. 技术架构

```
┌─────────────────────────────────────────────────┐
│               微信小程序 (前端)                    │
│  pages/ services/ model/ config/index.js         │
└─────────────────┬───────────────────────────────┘
                  │ HTTP / wx.request
                  │ Authorization: Bearer <Token>
┌─────────────────▼───────────────────────────────┐
│           Next.js 15 后端 (App Router)            │
│                                                   │
│  app/api/**                                       │
│  ├── 路由层   Route Handler (route.ts)            │
│  ├── 中间件   Token 验证 / 请求解析                │
│  ├── 业务层   lib/services/*.ts                   │
│  └── 数据层   Prisma ORM → SQLite                │
└─────────────────────────────────────────────────┘
```

**依赖包：**

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "zod": "^3.0.0",
    "axios": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

---

## 3. 目录结构

```
backend/
├── prisma/
│   ├── schema.prisma          # 数据库模型定义
│   ├── seed.ts                # 种子数据脚本
│   └── dev.db                 # SQLite 数据库文件（gitignore）
│
├── app/
│   └── api/
│       ├── auth/
│       │   └── login/
│       │       └── route.ts           # POST /api/auth/login
│       ├── home/
│       │   └── route.ts               # GET  /api/home
│       ├── goods/
│       │   ├── route.ts               # GET  /api/goods
│       │   └── [spuId]/
│       │       ├── route.ts           # GET  /api/goods/:spuId
│       │       └── comments/
│       │           └── route.ts       # GET/POST /api/goods/:spuId/comments
│       ├── category/
│       │   └── route.ts               # GET  /api/category
│       ├── cart/
│       │   ├── route.ts               # GET/POST /api/cart
│       │   └── [id]/
│       │       └── route.ts           # PUT/DELETE /api/cart/:id
│       ├── order/
│       │   ├── route.ts               # GET  /api/order
│       │   ├── confirm/
│       │   │   └── route.ts           # POST /api/order/confirm
│       │   └── [orderNo]/
│       │       ├── route.ts           # GET  /api/order/:orderNo
│       │       ├── cancel/
│       │       │   └── route.ts       # POST /api/order/:orderNo/cancel
│       │       ├── delivery/
│       │       │   └── route.ts       # GET  /api/order/:orderNo/delivery
│       │       └── after-service/
│       │           └── route.ts       # POST /api/order/:orderNo/after-service
│       ├── address/
│       │   ├── route.ts               # GET/POST /api/address
│       │   └── [id]/
│       │       └── route.ts           # PUT/DELETE /api/address/:id
│       ├── coupon/
│       │   ├── route.ts               # GET  /api/coupon
│       │   └── [id]/
│       │       └── route.ts           # GET  /api/coupon/:id
│       ├── user/
│       │   ├── route.ts               # GET  /api/user（用户中心聚合）
│       │   └── profile/
│       │       └── route.ts           # GET/PUT /api/user/profile
│       ├── search/
│       │   ├── route.ts               # GET  /api/search（搜索结果）
│       │   └── history/
│       │       └── route.ts           # GET/DELETE /api/search/history
│       └── promotion/
│           └── [promotionId]/
│               └── route.ts           # GET  /api/promotion/:promotionId
│
├── lib/
│   ├── db.ts                  # Prisma Client 单例
│   ├── auth.ts                # JWT 生成 / 验证工具
│   ├── response.ts            # Session应格式工具
│   ├── middleware.ts          # 认证中间件（高阶函数）
│   └── wechat.ts              # 微信 code2session 封装
│
├── middleware.ts              # Next.js 全局中间件（CORS、日志）
├── .env                       # 环境变量
├── .env.example               # 环境变量示例
├── package.json
└── tsconfig.json
```

---

## 4. 数据库设计

> 价格字段统一使用**整数（分）**存储，如 `29800` = ¥298.00，与前端 `priceFormat()` 工具函数保持一致。

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────────
// 用户
// ─────────────────────────────────────────────────
model User {
  id          Int          @id @default(autoincrement())
  openid      String       @unique          // 微信 openid
  nickname    String?
  avatarUrl   String?
  phone       String?
  gender      Int?                          // 1=男 2=女 0=未知
  points      Int          @default(0)      // 积分
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  sessions    Session[]
  cart        Cart[]
  orders      Order[]
  addresses   Address[]
  userCoupons UserCoupon[]
  comments    Comment[]
  searchHistory SearchHistory[]
}

// ─────────────────────────────────────────────────
// 用户会话记录 (Session Token)
// ─────────────────────────────────────────────────
model Session {
  id        Int      @id @default(autoincrement())
  token     String   @unique              // 随机生成的 Session Token (如 UUID)
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime                      // 过期时间
  createdAt DateTime @default(now())
}

// ─────────────────────────────────────────────────
// 商品分类（支持多级，parentId 为 null 表示顶级分类）
// ─────────────────────────────────────────────────
model Category {
  id        Int        @id @default(autoincrement())
  groupId   String     @unique              // 对应前端 groupId，如 "24948"
  name      String
  thumbnail String?
  parentId  Int?
  parent    Category?  @relation("CategoryChildren", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryChildren")
  sort      Int        @default(0)
  goods     Goods[]
}

// ─────────────────────────────────────────────────
// 商品 SPU（标准产品单元）
// ─────────────────────────────────────────────────
model Goods {
  id               Int       @id @default(autoincrement())
  spuId            String    @unique           // 前端 spuId，字符串类型
  title            String
  primaryImage     String
  images           String                      // JSON 字符串，图片 URL 数组
  video            String?
  desc             String?                     // JSON 字符串，商品详情图片数组
  minSalePrice     Int                         // 最低售价（分）
  maxSalePrice     Int                         // 最高售价（分）
  minLinePrice     Int                         // 最低划线价（分）
  maxLinePrice     Int                         // 最高划线价（分）
  spuStockQuantity Int       @default(0)       // 总库存
  soldNum          Int       @default(0)       // 已售数量
  isPutOnSale      Int       @default(1)       // 是否上架：1=上架 0=下架
  isSoldOut        Boolean   @default(false)   // 是否售罄
  storeId          String    @default("1000")
  etitle           String?                     // 副标题
  categoryId       Int?
  category         Category? @relation(fields: [categoryId], references: [id])
  skus             Sku[]
  spuTags          SpuTag[]
  comments         Comment[]
  specGroups       SpecGroup[]                 // 规格组
  limitInfo        String?                     // JSON，如 [{text:"限购5件"}]
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}

// ─────────────────────────────────────────────────
// 商品标签（如"限时抢购"、"联名系列"）
// ─────────────────────────────────────────────────
model SpuTag {
  id      Int    @id @default(autoincrement())
  tagId   String?
  title   String
  image   String?
  goodsId Int
  goods   Goods  @relation(fields: [goodsId], references: [id])
}

// ─────────────────────────────────────────────────
// 规格组（如"颜色"、"尺码"）
// ─────────────────────────────────────────────────
model SpecGroup {
  id         Int         @id @default(autoincrement())
  specId     String                               // 前端 specId
  title      String                               // 规格名称，如"颜色"
  goodsId    Int
  goods      Goods       @relation(fields: [goodsId], references: [id])
  specValues SpecValue[]
}

// ─────────────────────────────────────────────────
// 规格值（如"米色荷叶边"、"S"、"M"、"L"）
// ─────────────────────────────────────────────────
model SpecValue {
  id           Int       @id @default(autoincrement())
  specValueId  String                               // 前端 specValueId
  specValue    String                               // 规格值，如"红色"
  image        String?
  specGroupId  Int
  specGroup    SpecGroup @relation(fields: [specGroupId], references: [id])
}

// ─────────────────────────────────────────────────
// 商品 SKU（最小库存单元）
// ─────────────────────────────────────────────────
model Sku {
  id            Int     @id @default(autoincrement())
  skuId         String  @unique                    // 前端 skuId
  skuImage      String?
  // specInfo: JSON 数组，每项 {specId, specTitle, specValueId, specValue}
  specInfo      String
  salePrice     Int                                // 销售价（分），priceType=1
  linePrice     Int                                // 划线价（分），priceType=2
  stockQuantity Int     @default(0)
  soldQuantity  Int     @default(0)
  goodsId       Int
  goods         Goods   @relation(fields: [goodsId], references: [id])
  cartItems     Cart[]
}

// ─────────────────────────────────────────────────
// 购物车
// ─────────────────────────────────────────────────
model Cart {
  id         Int      @id @default(autoincrement())
  userId     Int
  user       User     @relation(fields: [userId], references: [id])
  skuId      Int
  sku        Sku      @relation(fields: [skuId], references: [id])
  quantity   Int      @default(1)
  isSelected Int      @default(1)                 // 1=已选中 0=未选中
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// ─────────────────────────────────────────────────
// 订单
// ─────────────────────────────────────────────────
model Order {
  id            Int         @id @default(autoincrement())
  orderNo       String      @unique               // 订单号，如 "ORD202600001"
  userId        Int
  user          User        @relation(fields: [userId], references: [id])
  // 订单状态：5=待付款 10=待发货 40=待收货 50=已完成 80=已取消
  status        Int         @default(5)
  totalAmount   Int                               // 实付金额（分）
  goodsAmount   Int                               // 商品总金额（分）
  discountAmount Int        @default(0)           // 优惠金额（分）
  freightAmount Int         @default(0)           // 运费（分）
  // addressInfo: JSON 快照（下单时地址副本，不随用户修改地址变动）
  addressInfo   String
  couponId      Int?
  remark        String?                           // 买家备注
  payTime       DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  items         OrderItem[]
  logistics     Logistics?
  afterServices AfterService[]
}

// ─────────────────────────────────────────────────
// 订单商品项（快照）
// ─────────────────────────────────────────────────
model OrderItem {
  id       Int    @id @default(autoincrement())
  orderId  Int
  order    Order  @relation(fields: [orderId], references: [id])
  spuId    String
  skuId    String
  title    String
  image    String
  // specInfo: JSON 快照，如 [{specTitle:"颜色",specValue:"经典白"}]
  specInfo String
  price    Int                                    // 成交单价（分）
  quantity Int
}

// ─────────────────────────────────────────────────
// 物流信息
// ─────────────────────────────────────────────────
model Logistics {
  id              Int    @id @default(autoincrement())
  orderId         Int    @unique
  order           Order  @relation(fields: [orderId], references: [id])
  company         String                          // 快递公司
  trackNo         String                          // 运单号
  receiverName    String
  receiverPhone   String
  receiverAddress String
  // traces: JSON 数组，物流轨迹 [{time, content}]
  traces          String @default("[]")
}

// ─────────────────────────────────────────────────
// 售后申请
// ─────────────────────────────────────────────────
model AfterService {
  id          Int      @id @default(autoincrement())
  orderId     Int
  order       Order    @relation(fields: [orderId], references: [id])
  // 类型：refund=仅退款 return=退货退款
  type        String
  reason      String
  description String?
  images      String?                             // JSON 图片数组
  // 状态：pending=待处理 approved=已同意 rejected=已拒绝 completed=已完成
  status      String   @default("pending")
  createdAt   DateTime @default(now())
}

// ─────────────────────────────────────────────────
// 收货地址
// ─────────────────────────────────────────────────
model Address {
  id            Int     @id @default(autoincrement())
  userId        Int
  user          User    @relation(fields: [userId], references: [id])
  name          String                            // 收货人
  phone         String
  provinceName  String
  provinceCode  String
  cityName      String
  cityCode      String
  districtName  String
  districtCode  String
  detailAddress String                            // 详细地址
  addressTag    String? @default("")             // 标签：家/公司/等
  isDefault     Int     @default(0)              // 1=默认地址
  latitude      String?
  longitude     String?
}

// ─────────────────────────────────────────────────
// 优惠券模板
// ─────────────────────────────────────────────────
model Coupon {
  id         Int          @id @default(autoincrement())
  name       String
  title      String
  // type: price=满减 discount=折扣
  type       String       @default("price")
  // value: 满减时为减免金额（分），折扣时为折扣值（如 85 = 8.5折）
  value      Int
  // base: 使用门槛（分），0 表示无门槛
  base       Int          @default(0)
  currency   String       @default("¥")
  timeLimit  String?                             // 展示用，如 "2024.01.01-2024.12.31"
  startAt    DateTime
  expireAt   DateTime
  userCoupons UserCoupon[]
}

// ─────────────────────────────────────────────────
// 用户优惠券关联
// ─────────────────────────────────────────────────
model UserCoupon {
  id       Int       @id @default(autoincrement())
  userId   Int
  user     User      @relation(fields: [userId], references: [id])
  couponId Int
  coupon   Coupon    @relation(fields: [couponId], references: [id])
  // status: unused=未使用 used=已使用 expired=已过期
  status   String    @default("unused")
  usedAt   DateTime?
  orderId  Int?
}

// ─────────────────────────────────────────────────
// 商品评论
// ─────────────────────────────────────────────────
model Comment {
  id        Int      @id @default(autoincrement())
  goodsId   Int
  goods     Goods    @relation(fields: [goodsId], references: [id])
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  orderId   Int?
  skuId     String?
  // specInfo: JSON，购买时的规格快照
  specInfo  String?
  content   String
  rating    Int                                   // 1-5 星
  images    String?                               // JSON 图片数组
  // replyContent: 商家回复
  replyContent String?
  replyAt   DateTime?
  createdAt DateTime  @default(now())
}

// ─────────────────────────────────────────────────
// 搜索历史
// ─────────────────────────────────────────────────
model SearchHistory {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  keyword   String
  createdAt DateTime @default(now())
}

// ─────────────────────────────────────────────────
// 首页轮播图
// ─────────────────────────────────────────────────
model Banner {
  id    Int    @id @default(autoincrement())
  image String
  link  String?                                   // 跳转链接或 promotionId
  sort  Int    @default(0)
}

// ─────────────────────────────────────────────────
// 促销活动
// ─────────────────────────────────────────────────
model Promotion {
  id               Int    @id @default(autoincrement())
  promotionId      String @unique
  title            String
  description      String?
  promotionCode    String                          // 如 "MERCHANT"
  promotionSubCode String                          // 如 "MYJ"=满减 "MYG"=满折
  tag              String                          // 如 "满减"
  startTime        String
  endTime          String
  // activityLadder: JSON 数组，如 [{label:"满100元减99.9元"}]
  activityLadder   String @default("[]")
}
```

---

## 5. API 接口规范

### 5.1 Base URL

```
开发环境：http://localhost:3000/api
生产环境：https://your-domain.com/api
```

### 5.2 请求规范

- 所有接口使用 **JSON** 格式传输
- `Content-Type: application/json`
- 需要认证的接口在 Header 中携带：`Authorization: Bearer <token>`

### 5.3 认证说明

| 接口类型 | 是否需要 Token |
|---------|----------------|
| `POST /api/auth/login` | 否 |
| `GET /api/home` | 否 |
| `GET /api/goods` | 否 |
| `GET /api/category` | 否 |
| `GET /api/search` | 否 |
| 购物车、订单、地址、优惠券、用户相关 | **是** |

### 5.4 分页规范

```json
// 请求参数
{ "page": 1, "pageSize": 20 }

// 响应数据
{
  "list": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 6. 各模块接口详情

---

### 6.1 认证模块 `/api/auth/login`

#### POST `/api/auth/login`

微信小程序通过 `wx.login()` 获取 `code`，传给后端换取 JWT Token。

**请求体：**

```json
{
  "code": "wx_login_code_from_wechat"
}
```

**处理流程：**

```
1. 用 code 调用微信接口 https://api.weixin.qq.com/sns/jscode2session
   参数：appid, secret, js_code, grant_type=authorization_code
2. 获取 openid（和 session_key，可不存储）
3. 查找或创建 User 记录（upsert by openid）
4. 生成随机字符串作为 Session Token（如 Node.js crypto.randomUUID()）
5. 在数据库 Session 表中记录该 Token、对应 userId 并设置过期时间（如 7 天后）
6. 返回 token 和用户信息
```

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "token": "550e8400-e29b-41d4-a716-446655440000",
    "userInfo": {
      "id": 1,
      "nickname": null,
      "avatarUrl": null,
      "phone": null
    }
  }
}
```

**失败响应 400：**

```json
{
  "code": "INVALID_CODE",
  "success": false,
  "message": "微信 code 无效或已过期"
}
```

---

### 6.2 首页模块 `/api/home`

#### GET `/api/home`

返回轮播图和 Tab 分类列表，对应前端 `services/home/home.js` 的 `fetchHome()`。

**无需认证**

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "swiper": [
      "https://example.com/banner1.png",
      "https://example.com/banner2.png"
    ],
    "tabList": [
      { "text": "精选推荐", "key": 0 },
      { "text": "夏日防晒",  "key": 1 },
      { "text": "人气榜",    "key": 2 }
    ],
    "activityImg": "https://example.com/activity/banner.png"
  }
}
```

---

### 6.3 商品模块 `/api/goods`

#### GET `/api/goods` — 商品列表

对应前端 `services/good/fetchGoodsList.js`，支持分页、分类筛选、排序。

**无需认证**

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页数量，默认 20 |
| `categoryId` | string | 否 | 分类 ID |
| `keyword` | string | 否 | 搜索关键词 |
| `sort` | string | 否 | 排序：`price_asc` / `price_desc` / `sold_desc` |
| `minPrice` | number | 否 | 最低价格（分） |
| `maxPrice` | number | 否 | 最高价格（分） |

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "saasId": null,
    "storeId": null,
    "pageNum": 1,
    "pageSize": 20,
    "totalCount": 100,
    "spuList": [
      {
        "spuId": "135686633",
        "title": "纯色纯棉休闲圆领短袖T恤",
        "primaryImage": "https://example.com/goods/nz-08b.png",
        "thumb": "https://example.com/goods/nz-08b.png",
        "price": 25900,
        "originPrice": 31900,
        "minSalePrice": 25900,
        "maxLinePrice": 31900,
        "soldNum": 1032,
        "isSoldOut": false,
        "tags": ["2020夏季新款"],
        "desc": ""
      }
    ]
  }
}
```

---

#### GET `/api/goods/[spuId]` — 商品详情

对应前端 `services/good/fetchGood.js` 的 `fetchGood(ID)`。

**无需认证**

**Path 参数：** `spuId` - 商品 SPU ID

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "saasId": "88888888",
    "storeId": "1000",
    "spuId": "135686633",
    "title": "纯色纯棉休闲圆领短袖T恤",
    "primaryImage": "https://example.com/goods/nz-08b.png",
    "images": [
      "https://example.com/goods/nz-08a.png",
      "https://example.com/goods/nz-08b.png"
    ],
    "video": null,
    "available": 1,
    "minSalePrice": 25900,
    "maxSalePrice": 26900,
    "minLinePrice": 31900,
    "maxLinePrice": 31900,
    "spuStockQuantity": 371,
    "soldNum": 1032,
    "isPutOnSale": 1,
    "isSoldOut": false,
    "etitle": "",
    "limitInfo": [{ "text": "限购5件" }],
    "desc": [
      "https://example.com/goods/nz-08c.png",
      "https://example.com/goods/nz-08d.png"
    ],
    "spuTagList": [
      { "id": null, "title": "2020夏季新款", "image": null }
    ],
    "specList": [
      {
        "specId": "10000",
        "title": "颜色",
        "specValueList": [
          {
            "specValueId": "10001",
            "specId": "10000",
            "saasId": "88888888",
            "specValue": "白色",
            "image": ""
          }
        ]
      },
      {
        "specId": "10002",
        "title": "尺码",
        "specValueList": [
          { "specValueId": "11003", "specId": "10002", "saasId": "88888888", "specValue": "S", "image": "" },
          { "specValueId": "10003", "specId": "10002", "saasId": "88888888", "specValue": "M", "image": "" },
          { "specValueId": "11002", "specId": "10002", "saasId": "88888888", "specValue": "L", "image": "" }
        ]
      }
    ],
    "skuList": [
      {
        "skuId": "135686634",
        "skuImage": null,
        "specInfo": [
          { "specId": "10000", "specTitle": null, "specValueId": "10001", "specValue": "白色" },
          { "specId": "10002", "specTitle": null, "specValueId": "10003", "specValue": "M" }
        ],
        "priceInfo": [
          { "priceType": 1, "price": "25900", "priceTypeName": "销售价格" },
          { "priceType": 2, "price": "31900", "priceTypeName": "划线价格" }
        ],
        "stockInfo": {
          "stockQuantity": 177,
          "safeStockQuantity": 0,
          "soldQuantity": 0
        },
        "weight": null,
        "volume": null,
        "profitPrice": null
      }
    ],
    "promotionList": null
  }
}
```

---

#### GET `/api/goods/[spuId]/comments` — 商品评论列表

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | number | 页码 |
| `pageSize` | number | 每页数量，默认 10 |
| `rating` | number | 筛选星级 1-5 |

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "total": 50,
    "averageRating": 4.8,
    "ratingDistribution": { "5": 40, "4": 8, "3": 1, "2": 1, "1": 0 },
    "list": [
      {
        "id": 1,
        "rating": 5,
        "content": "质量很好，穿着舒适",
        "images": ["https://example.com/comment/img1.png"],
        "specInfo": [
          { "specTitle": "颜色", "specValue": "白色" },
          { "specTitle": "尺码", "specValue": "M" }
        ],
        "createdAt": "2024-03-01T10:00:00Z",
        "userInfo": {
          "nickname": "用户***88",
          "avatarUrl": "https://example.com/avatar.png"
        },
        "replyContent": null
      }
    ],
    "pagination": { "page": 1, "pageSize": 10, "total": 50, "totalPages": 5 }
  }
}
```

---

#### POST `/api/goods/[spuId]/comments` — 发布评论

**需要认证**

**请求体：**

```json
{
  "orderId": 123,
  "skuId": "135686634",
  "rating": 5,
  "content": "质量很好，穿着舒适",
  "images": ["https://example.com/comment/img1.png"],
  "specInfo": [
    { "specTitle": "颜色", "specValue": "白色" },
    { "specTitle": "尺码", "specValue": "M" }
  ]
}
```

**成功响应 201：**

```json
{
  "code": "Success",
  "success": true,
  "data": { "id": 101 }
}
```

---

### 6.4 分类模块 `/api/category`

#### GET `/api/category` — 分类树

对应前端 `services/good/fetchCategoryList.js`。返回三级分类树。

**无需认证**

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": [
    {
      "groupId": "24948",
      "name": "女装",
      "thumbnail": "https://example.com/category/nz.png",
      "children": [
        {
          "groupId": "249481",
          "name": "上衣",
          "children": [
            { "groupId": "249480", "name": "卫衣", "thumbnail": "https://example.com/category/wy.png" },
            { "groupId": "249482", "name": "T恤",  "thumbnail": "https://example.com/category/tx.png" }
          ]
        }
      ]
    },
    {
      "groupId": "24949",
      "name": "男装",
      "thumbnail": "https://example.com/category/mz.png",
      "children": []
    }
  ]
}
```

---

### 6.5 购物车模块 `/api/cart`

#### GET `/api/cart` — 获取购物车

对应前端 `services/cart/cart.js` 的 `fetchCartGroupData()`。

**需要认证**

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "isNotEmpty": true,
    "isAllSelected": false,
    "selectedGoodsCount": 2,
    "storeGoods": [
      {
        "storeId": "1000",
        "storeName": "云Mall旗舰店",
        "storeStatus": 1,
        "totalAmount": "179900",
        "totalDiscountSalePrice": "0",
        "totalDiscountAmount": "0",
        "promotionGoodsList": [
          {
            "title": "普通商品",
            "promotionCode": "NORMAL",
            "promotionSubCode": "",
            "promotionId": "",
            "tagText": [],
            "tag": "",
            "goodsPromotionList": [
              {
                "uid": "1",
                "saasId": "88888888",
                "storeId": "1000",
                "cartId": 1,
                "spuId": "135686633",
                "skuId": "135686634",
                "isSelected": 1,
                "thumb": "https://example.com/goods/nz-08b.png",
                "title": "纯色纯棉休闲圆领短袖T恤",
                "primaryImage": "https://example.com/goods/nz-08b.png",
                "quantity": 2,
                "stockStatus": true,
                "stockQuantity": 177,
                "price": "25900",
                "originPrice": "31900",
                "specInfo": [
                  { "specTitle": "颜色", "specValue": "白色" },
                  { "specTitle": "尺码", "specValue": "M" }
                ],
                "available": 1,
                "putOnSale": 1
              }
            ]
          }
        ]
      }
    ],
    "invalidGoodItems": []
  }
}
```

---

#### POST `/api/cart` — 加入购物车

**需要认证**

**请求体：**

```json
{
  "skuId": "135686634",
  "quantity": 1
}
```

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": { "cartId": 1 }
}
```

---

#### PUT `/api/cart/[id]` — 修改数量或选中状态

**需要认证**

**请求体：**

```json
{
  "quantity": 3,
  "isSelected": 1
}
```

**成功响应 200：**

```json
{ "code": "Success", "success": true }
```

---

#### DELETE `/api/cart/[id]` — 删除购物车项

**需要认证**

**成功响应 200：**

```json
{ "code": "Success", "success": true }
```

---

### 6.6 订单模块 `/api/order`

#### GET `/api/order` — 订单列表

对应前端 `services/order/orderList.js` 的 `fetchOrders()`。

**需要认证**

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `status` | number | 订单状态：5/10/40/50/80，不传=全部 |
| `page` | number | 页码，默认 1 |
| `pageSize` | number | 每页数量，默认 10 |

**订单状态说明：**

| 值 | 含义 |
|----|------|
| 5 | 待付款 |
| 10 | 待发货 |
| 40 | 待收货 |
| 50 | 已完成 |
| 80 | 已取消 |

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "list": [
      {
        "orderNo": "ORD202600001",
        "orderStatus": 10,
        "paymentAmount": "51800",
        "createdAt": "2026-03-20T08:00:00Z",
        "orderItemVOs": [
          {
            "spuId": "135686633",
            "skuId": "135686634",
            "title": "纯色纯棉休闲圆领短袖T恤",
            "primaryImage": "https://example.com/goods/nz-08b.png",
            "quantity": 2,
            "price": "25900",
            "specInfo": [
              { "specTitle": "颜色", "specValue": "白色" },
              { "specTitle": "尺码",  "specValue": "M" }
            ]
          }
        ]
      }
    ],
    "pagination": { "page": 1, "pageSize": 10, "total": 5, "totalPages": 1 }
  }
}
```

---

#### GET `/api/order/count` — 各状态订单数量

对应前端 `services/order/orderList.js` 的 `fetchOrdersCount()`，用于用户中心订单角标。

**需要认证**

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "orderTagInfos": [
      { "tabType": 5,  "orderNum": 1 },
      { "tabType": 10, "orderNum": 2 },
      { "tabType": 40, "orderNum": 0 },
      { "tabType": 50, "orderNum": 0 }
    ]
  }
}
```

---

#### GET `/api/order/[orderNo]` — 订单详情

对应前端 `services/order/orderDetail.js` 的 `fetchOrderDetail()`。

**需要认证**

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "orderNo": "ORD202600001",
    "orderStatus": 10,
    "paymentAmount": "51800",
    "goodsAmount": "51800",
    "discountAmount": "0",
    "freightAmount": "0",
    "createdAt": "2026-03-20T08:00:00Z",
    "payTime": "2026-03-20T08:05:00Z",
    "remark": "",
    "logisticsVO": {
      "receiverName": "张三",
      "receiverPhone": "17600000000",
      "receiverAddress": "北京市朝阳区某某街道1号"
    },
    "orderItemVOs": [
      {
        "spuId": "135686633",
        "skuId": "135686634",
        "title": "纯色纯棉休闲圆领短袖T恤",
        "primaryImage": "https://example.com/goods/nz-08b.png",
        "quantity": 2,
        "price": "25900",
        "specInfo": [
          { "specTitle": "颜色", "specValue": "白色" },
          { "specTitle": "尺码", "specValue": "M" }
        ]
      }
    ]
  }
}
```

---

#### POST `/api/order/confirm` — 下单结算

对应前端 `services/order/orderConfirm.js`，前端在结算页调用。

**需要认证**

**请求体：**

```json
{
  "cartIds": [1, 2],
  "addressId": 3,
  "couponId": null,
  "remark": "请尽快发货"
}
```

**处理流程（强安全核心）：**

```
1. 【防越权】验证 cartIds 属于当前用户，且地址、优惠券必须属于当前用户。
2. 【防篡改】绝对不信任前端计算的金额，必须在后端根据当前 SKU 单价和有效优惠券重新计算实付金额。
3. 【防超卖与重入】必须开启数据库事务 (prisma.$transaction)：
   a. **原子减库存**：利用条件更新防止并发超卖 (`UPDATE Sku SET stockQuantity = stockQuantity - N WHERE id = X AND stockQuantity >= N`)。
   b. **原子核销优惠券**：利用条件更新防止并发重复用券 (`UPDATE UserCoupon SET status='used' WHERE id=Y AND status='unused'`)。
4. 【快照入库】创建 Order 记录（保存 addressInfo 快照），创建 OrderItem（保存价格/名称属性快照）。
5. 【清理状态】清除已下单的购物车项。
6. 【未支付兜底】（需配合定时/延时任务）订单状态设为 5（待付款），超过 15 分钟未支付则自动取消，并回滚库存与优惠券。
7. 返回 orderNo
```

**成功响应 201：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "orderNo": "ORD202600002"
  }
}
```

---

#### POST `/api/order/[orderNo]/cancel` — 取消订单

**需要认证**

仅允许 `status=5`（待付款）的订单取消。

**成功响应 200：**

```json
{ "code": "Success", "success": true }
```

---

#### GET `/api/order/[orderNo]/delivery` — 物流详情

**需要认证**

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "company": "顺丰速运",
    "trackNo": "SF1234567890",
    "receiverName": "张三",
    "receiverPhone": "176****0000",
    "receiverAddress": "北京市朝阳区某某街道1号",
    "traces": [
      { "time": "2026-03-22 10:00:00", "content": "快件已签收，签收人：本人" },
      { "time": "2026-03-22 09:00:00", "content": "快件正在派送，派送员：李四" },
      { "time": "2026-03-21 18:00:00", "content": "快件已到达北京朝阳分拨中心" },
      { "time": "2026-03-21 10:00:00", "content": "快件已从仓库发出" }
    ]
  }
}
```

---

#### POST `/api/order/[orderNo]/after-service` — 申请售后

**需要认证**

**请求体：**

```json
{
  "type": "refund",
  "reason": "商品质量问题",
  "description": "收到商品有破损",
  "images": ["https://example.com/complaint/img1.png"]
}
```

**成功响应 201：**

```json
{
  "code": "Success",
  "success": true,
  "data": { "afterServiceId": 1 }
}
```

---

### 6.7 地址模块 `/api/address`

#### GET `/api/address` — 地址列表

**需要认证**

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": [
    {
      "saasId": "88888888",
      "id": "1",
      "addressId": "1",
      "name": "张三",
      "phone": "17600000000",
      "countryName": "中国",
      "countryCode": "chn",
      "provinceName": "北京市",
      "provinceCode": "110000",
      "cityName": "北京市",
      "cityCode": "110100",
      "districtName": "朝阳区",
      "districtCode": "110105",
      "detailAddress": "某某街道1号",
      "addressTag": "家",
      "isDefault": 1,
      "latitude": null,
      "longitude": null
    }
  ]
}
```

---

#### POST `/api/address` — 新增地址

**需要认证**

**请求体：**

```json
{
  "name": "张三",
  "phone": "17600000000",
  "provinceName": "北京市",
  "provinceCode": "110000",
  "cityName": "北京市",
  "cityCode": "110100",
  "districtName": "朝阳区",
  "districtCode": "110105",
  "detailAddress": "某某街道1号",
  "addressTag": "家",
  "isDefault": 1
}
```

**成功响应 201：**

```json
{
  "code": "Success",
  "success": true,
  "data": { "addressId": "1" }
}
```

---

#### PUT `/api/address/[id]` — 修改地址

**需要认证**

请求体同新增，字段可部分传入。

**成功响应 200：**

```json
{ "code": "Success", "success": true }
```

---

#### DELETE `/api/address/[id]` — 删除地址

**需要认证**

**成功响应 200：**

```json
{ "code": "Success", "success": true }
```

---

### 6.8 优惠券模块 `/api/coupon`

#### GET `/api/coupon` — 我的优惠券列表

对应前端 `services/coupon/index.js` 的 `fetchCouponList(status)`。

**需要认证**

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `status` | string | `unused` / `used` / `expired`，不传=全部 |

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "生鲜满减券",
      "title": "生鲜满减券 - 1",
      "type": "price",
      "value": 1000,
      "base": 10000,
      "currency": "¥",
      "timeLimit": "2024.01.01-2024.12.31",
      "status": "unused",
      "desc": "减免 10 元，满100元可用。",
      "storeAdapt": "商城通用",
      "useNotes": "1个订单限用1张，不能与其它类型的优惠券叠加使用"
    }
  ]
}
```

---

#### GET `/api/coupon/[id]` — 优惠券详情

对应前端 `services/coupon/index.js` 的 `fetchCouponDetail(id)`。

**需要认证**

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "detail": {
      "id": 1,
      "type": "price",
      "value": 1000,
      "base": 10000,
      "desc": "减免 10 元，满100元可用。",
      "storeAdapt": "商城通用",
      "useNotes": "1个订单限用1张，除运费券外，不能与其它类型的优惠券叠加使用"
    },
    "storeInfoList": []
  }
}
```

---

### 6.9 用户中心模块 `/api/user`

#### GET `/api/user` — 用户中心聚合数据

对应前端 `services/usercenter/fetchUsercenter.js` 的 `fetchUsercenter()`。
一次返回个人信息、积分优惠券统计、订单状态统计、客服信息。

**需要认证**

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "userInfo": {
      "avatarUrl": "https://example.com/avatar.png",
      "nickName": "用户昵称",
      "phoneNumber": "176****0000",
      "gender": 2
    },
    "countsData": [
      { "num": 100,  "name": "积分",  "type": "point"  },
      { "num": 3,    "name": "优惠券", "type": "coupon" }
    ],
    "orderTagInfos": [
      { "tabType": 5,  "orderNum": 1 },
      { "tabType": 10, "orderNum": 2 },
      { "tabType": 40, "orderNum": 0 },
      { "tabType": 0,  "orderNum": 0 }
    ],
    "customerServiceInfo": {
      "servicePhone": "4006336868",
      "serviceTimeDuration": "每周三至周五 9:00-12:00  13:00-15:00"
    }
  }
}
```

---

#### GET `/api/user/profile` — 获取个人信息

对应前端 `services/usercenter/fetchPerson.js` 的 `fetchPerson()`。

**需要认证**

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "avatarUrl": "https://example.com/avatar.png",
    "nickName": "用户昵称",
    "phoneNumber": "176****0000",
    "gender": 2
  }
}
```

---

#### PUT `/api/user/profile` — 更新个人信息

**需要认证**

**请求体：**

```json
{
  "nickname": "新昵称",
  "avatarUrl": "https://example.com/new-avatar.png",
  "gender": 1
}
```

**成功响应 200：**

```json
{ "code": "Success", "success": true }
```

---

### 6.10 搜索模块 `/api/search`

#### GET `/api/search` — 搜索商品

对应前端 `services/good/fetchSearchResult.js`，复用商品列表逻辑，加入关键词过滤。

**无需认证**

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `keyword` | string | 搜索词（必填） |
| `page` | number | 页码 |
| `pageSize` | number | 每页数量 |
| `sort` | string | 排序方式 |

**成功响应 200：**（格式同 `GET /api/goods`）

---

#### GET `/api/search/history` — 搜索历史

**需要认证**

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "historyWords": ["连衣裙", "耳机", "T恤"]
  }
}
```

---

#### DELETE `/api/search/history` — 清除搜索历史

**需要认证**

**成功响应 200：**

```json
{ "code": "Success", "success": true }
```

---

### 6.11 促销活动模块 `/api/promotion`

#### GET `/api/promotion/[promotionId]` — 促销活动详情

对应前端 `services/promotion/detail.js`。

**无需认证**

**成功响应 200：**

```json
{
  "code": "Success",
  "success": true,
  "data": {
    "promotionId": "1",
    "title": "满减满折回归",
    "description": null,
    "promotionCode": "MERCHANT",
    "promotionSubCode": "MYJ",
    "tag": "满减",
    "startTime": "1588737710000",
    "endTime": "1601467070000",
    "activityLadder": [
      { "label": "满100元减99.9元" }
    ],
    "goodsList": []
  }
}
```

---

## 7. 统一响应格式

所有接口严格遵循以下格式：

```typescript
// lib/response.ts

interface ApiResponse<T = unknown> {
  code: string;     // "Success" 或错误码字符串
  success: boolean;
  data?: T;
  message?: string; // 仅失败时返回
}
```

**常见错误码：**

| HTTP 状态码 | code | 说明 |
|-------------|------|------|
| 400 | `INVALID_PARAMS` | 请求参数错误 |
| 401 | `UNAUTHORIZED` | 未登录或 Token 无效 |
| 403 | `FORBIDDEN` | 无权操作 |
| 404 | `NOT_FOUND` | 资源不存在 |
| 409 | `STOCK_INSUFFICIENT` | 库存不足 |
| 500 | `INTERNAL_ERROR` | 服务器内部错误 |

**示例工具函数：**

```typescript
// lib/response.ts
export const success = <T>(data: T, status = 200) =>
  Response.json({ code: 'Success', success: true, data }, { status });

export const fail = (code: string, message: string, status = 400) =>
  Response.json({ code, success: false, message }, { status });
```

---

## 8. 认证与核心防线

### 8.1 边界防线：自定义 Session Token 机制

本系统采用更符合微信小程序场景且安全性可控的**自定义登录态（Session Token）**方案，代替传统的无状态 JWT。
- **生成与存储：** 登录时生成唯一 UUID Token 并写入数据库 `Session` 表。
- **请求携带：** 客户端请求任何受保护接口时，都在 Header 携带 `Authorization: Bearer <Token>`。
- **优势：** 相比 JWT，基于数据库的 Session 可以随时主动回收登录态（例如单独限制某个账号踢出，或被盗号强制下线等）。

### 认证中间件

```typescript
// lib/middleware.ts
import { prisma } from './db';

export async function withAuth(
  request: Request,
  handler: (userId: number, req: Request) => Promise<Response>
): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ code: 'UNAUTHORIZED', success: false, message: '未提供访问令牌' }, { status: 401 });
  }
  
  const token = authHeader.slice(7);
  try {
    // 查询数据库中关联的 Session 是否有效（未过期）
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt.getTime() < Date.now()) {
      return Response.json({ code: 'UNAUTHORIZED', success: false, message: '登录已过期，请重新登录' }, { status: 401 });
    }

    return handler(session.userId, request);
  } catch (err) {
    return Response.json({ code: 'INTERNAL_ERROR', success: false }, { status: 500 });
  }
}
```

### 8.2 数据与权限防线 (IDOR 安全)

在涉及购物车、订单、地址等操作时，绝不能仅凭借请求携带的 ID 操作数据库。所有的 CRUD 必须联合查询当前 `userId`，以防水平越权（拿到其他人的订单号即可越权查看信息）。
```typescript
// 错误示范：只要拿到了别人的 orderNo 就能看别人的敏感地址信息
const order = await prisma.order.findUnique({ where: { orderNo } });

// ✅ 商业防泄漏规范：必须带上当前用户的 userId 联合查询
const order = await prisma.order.findFirst({ where: { orderNo, userId } });
```

### 8.3 并发风控防线 (超卖与重入防护)

对于处理下单、支付、抵扣优惠券的核心交易接口，必须杜绝因为请求并发带来的重复扣除或超买（Race Condition）。
1. **防止超卖**：通过 SQL 条件控制实现原子扣减：`UPDATE SKU SET stockQuantity = stockQuantity - N WHERE id = X AND stockQuantity >= N`。
2. **防篡改与重算**：不信任前端报送的 `totalAmount`，后端必须据 `itemId` 和当前单价重新累计，再扣减已验证为未使用的优惠券，得出实付金额持久化。

### 8.4 业务级防御 (UGC 与 防刷)

1. **XSS 清洗**：用户的评价、售后原因和买家留言等在后台输出前，若为富文本，必须通过 `DOMPurify` 严格过滤恶意 JS 执行代码，防止后台管理 Token 被盗取。
2. **API 限流**：公共查询接口如 `/api/goods` 或大流量的首页推荐接口（尤其是对无 Token 的游客），应前置部署 Nginx 拦截规则，或引入 Node.js 层防爬虫限速（Rate Limit），每 IP 超过 10 QPS 返回 HTTP 429 以保护 SQLite。

**在 Route Handler 中使用：**

```typescript
// app/api/cart/route.ts
export async function GET(request: Request) {
  return withAuth(request, async (userId) => {
    const cart = await getCartByUserId(userId);
    return success(cart);
  });
}
```

---

## 9. 前端对接指南

### Step 1：修改 `config/index.js`

```javascript
// rential-wechat/config/index.js
export const config = {
  useMock: false,          // 关闭 mock
  baseUrl: 'http://localhost:3000/api',  // 开发环境
};
```

### Step 2：封装 wx.request

在 `utils/request.js` 中统一封装请求，自动携带 token：

```javascript
// utils/request.js
import { config } from '../config/index';

export function request(url, options = {}) {
  const token = wx.getStorageSync('token');
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.baseUrl}${url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        if (res.data.success) {
          resolve(res.data.data);
        } else {
          reject(res.data);
        }
      },
      fail: reject,
    });
  });
}
```

### Step 3：替换各 service 文件中的真实 API

以 `services/home/home.js` 为例：

```javascript
import { config } from '../../config/index';
import { request } from '../../utils/request';

export function fetchHome() {
  if (config.useMock) {
    // ... mock 逻辑保留，方便切换
  }
  return request('/home');
}
```

---

## 10. 环境变量配置

```bash
# backend/.env

# 数据库（SQLite 文件路径）
DATABASE_URL="file:./prisma/dev.db"

# 微信小程序配置
WECHAT_APP_ID="wx5c02e3c16abd3182"
WECHAT_APP_SECRET="your-wechat-app-secret"

# 运行端口（可选，默认 3000）
PORT=3000

# Node 环境
NODE_ENV="development"
```

---

## 11. 初始化与种子数据

### 项目初始化命令

```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖
npm install

# 3. 初始化数据库（创建 SQLite 文件 + 建表）
npx prisma migrate dev --name init

# 4. 生成 Prisma Client
npx prisma generate

# 5. 写入种子数据
npx prisma db seed

# 6. 启动开发服务器
npm run dev
```

### 种子数据说明（`prisma/seed.ts`）

种子数据基于前端 `model/` 目录中的 mock 数据，包含：

| 数据 | 数量 | 来源 |
|------|------|------|
| 首页轮播图 | 6 张 | `model/swiper.js` |
| 商品分类 | 4 个顶级 + 多级子分类 | `model/category.js` |
| 商品（SPU+SKU） | 8 个 SPU，覆盖女装/电子/家居 | `model/good.js` |
| 测试用户 | 1 个 | — |
| 优惠券模板 | 5 张 | `model/coupon.js` |
| 促销活动 | 3 个 | `model/activities.js` |

---

*文档结束 — 如需扩展功能（如微信支付、发票管理、积分系统），参考对应页面的 `pages/order/invoice/` 等目录进行补充设计。*

---

## 12. 架构演进与优化建议 (Roadmap)

> 以下建议旨在提升系统的商业成熟度和多场景适配能力，当前开发阶段暂无需实现。

### 12.1 场景适配优化 (点餐/O2O)
- **核销码机制：** 在 `Order` 模型增加 `pickupCode` 和 `deliveryType` (自提/快递)，适配线下取餐或零售店提货场景。
- **多门店 LBS：** 引入地理位置坐标字段，支持根据用户当前位置展示最近的门店或仓库。

### 12.2 核心业务逻辑增强
- **库存锁定策略：** 引入“待支付锁定库存”逻辑。用户下单后锁定库存 X 分钟，支付成功后正式核减，超时则释放。防止恶意刷单导致库存积压。
- **阶梯营销引擎：** 扩展 `Promotion` 模型，支持“满 X 元减 Y 元”、“满 X 件打 Y 折”等更复杂的组合营销玩法。

### 12.3 性能与体验优化
- **响应式图片服务：** 在各模块接口返回图片时，根据前端需求提供不同尺寸的缩略图后缀（如 `_thumb`），提升小程序首屏渲染速度。
- **Session 缓存化：** 若未来日活突破 10w+，可考虑将 `Session` 模型从 SQLite 迁移至 Redis 存储，以获得更快的验证速度和更灵活的过期策略。

### 12.4 数据迁移方案
- **低成本无缝迁移：** 由于使用了 Prisma ORM，当业务量达到百万级单表瓶颈时，可随时通过修改 `datasource` 配置，在 1 天内完成向 PostgreSQL 或 MySQL 的生产环境迁移。

