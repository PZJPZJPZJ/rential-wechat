# 后端开发步骤 TODO

> **提示：**
> 本 TODO 列表依据 `DESIGN.md` 设计文档生成，用于指导后端编码的逐步进行。
> 请按顺序完成每个步骤，并在完成一项任务后在选框内打勾（即将 `- [ ]` 修改为 `- [x]`），以便于团队或个人清晰地识别项目开发进度。

---

## 1. 项目与环境初始化
- [ ] 1.1 项目初始化与基础依赖安装（如 `next`, `prisma`, `zod` 等）
- [ ] 1.2 创建与配置环境变量 (`.env` 包含 `DATABASE_URL`，微信 AppID 等)
- [ ] 1.3 初始化 Prisma (创建 `prisma/schema.prisma` 并配置 SQLite 数据源)

## 2. 数据库建模与同步 (Prisma Schema)
- [ ] 2.1 编写用户系统及认证相关模型 (`User`, `Session`)
- [ ] 2.2 编写商品相关模型 (`Category`, `Goods`, `SpuTag`, `SpecGroup`, `SpecValue`, `Sku`)
- [ ] 2.3 编写订单与购物车流程相关模型 (`Cart`, `Order`, `OrderItem`, `Logistics`, `AfterService`)
- [ ] 2.4 编写营销与活动体系模型 (`Coupon`, `UserCoupon`, `Promotion`, `Banner`)
- [ ] 2.5 编写其余业务相关模型 (`Address`, `Comment`, `SearchHistory`)
- [ ] 2.6 执行数据库迁移并生成 Prisma Client (`npx prisma migrate dev --name init`、`npx prisma generate`)

## 3. 核心基础设施与工具类
- [ ] 3.1 实例化并导出数据库单例工具 (`lib/db.ts`)
- [ ] 3.2 封装标准化的 API 统一响应数据格式工具 (`lib/response.ts`)
- [ ] 3.3 封装微信 code2session 等鉴权工具类 (`lib/auth.ts`, `lib/wechat.ts`)
- [ ] 3.4 编写自定义 Session 拦截及 Token 验证中间件 (`lib/middleware.ts`)

## 4. 业务 API 路由开发
### 4.1 认证模块 (`/api/auth`)
- [ ] 实现 `POST /api/auth/login` —— 微信扫码/授权登录换取 Session 认证接口

### 4.2 首页与分类模块 (`/api/home`、`/api/category`)
- [ ] 实现 `GET /api/home` —— 首页轮播图及资源位推荐接口
- [ ] 实现 `GET /api/category` —— 商品多级分类树接口

### 4.3 商品模块 (`/api/goods`)
- [ ] 实现 `GET /api/goods` —— 商品列表查询（支持分页排序及筛选）
- [ ] 实现 `GET /api/goods/[spuId]` —— SPU 商品详情及 SKU 规格聚合配置
- [ ] 实现 `GET /api/goods/[spuId]/comments` —— 商品评论列表
- [ ] 实现 `POST /api/goods/[spuId]/comments` —— 提交商品评论

### 4.4 购物车模块 (`/api/cart`)
- [ ] 实现 `GET /api/cart` —— 获取用户购物车数据（含合计等前端需要的数据结构）
- [ ] 实现 `POST /api/cart` —— SKU 规格商品加入购物车
- [ ] 实现 `PUT /api/cart/[id]` —— 更新购物车商品数量或选中状态
- [ ] 实现 `DELETE /api/cart/[id]` —— 移除购物车指定商品项目

### 4.5 订单与售后模块 (`/api/order` 等)
- [ ] **实现 `POST /api/order/confirm` —— 极度核心：订单结算、事务处理、扣库存与核销优惠券**
- [ ] 实现 `GET /api/order` —— 个人订单列表
- [ ] 实现 `GET /api/order/count` —— 各状态订单角标及数据统计
- [ ] 实现 `GET /api/order/[orderNo]` —— 订单详细情况追踪
- [ ] 实现 `POST /api/order/[orderNo]/cancel` —— 用户主动取消订单
- [ ] 实现 `GET /api/order/[orderNo]/delivery` —— 订单关联物流轨迹详情
- [ ] 实现 `POST /api/order/[orderNo]/after-service` —— 提交售后服务申请

### 4.6 收货地址模块 (`/api/address`)
- [ ] 实现 `GET /api/address` —— 获取用户完整收货地址簿
- [ ] 实现 `POST /api/address` —— 新增个人收货地址
- [ ] 实现 `PUT /api/address/[id]` —— 编辑修改存量地址信息
- [ ] 实现 `DELETE /api/address/[id]` —— 删除指定收货地址

### 4.7 营销与优惠券模块 (`/api/coupon`、`/api/promotion`)
- [ ] 实现 `GET /api/coupon` —— 我的卡包与优惠券记录列表查询
- [ ] 实现 `GET /api/coupon/[id]` —— 优惠券单可用详情信息
- [ ] 实现 `GET /api/promotion/[promotionId]` —— 专项促销活动的规则详细页面数据

### 4.8 用户中心与聚合 (`/api/user`)
- [ ] 实现 `GET /api/user` —— 聚合页签状态及积分看板等个人主页所需概览数据
- [ ] 实现 `GET /api/user/profile` —— 用户详细资料获取
- [ ] 实现 `PUT /api/user/profile` —— 用户昵称、头像修改操作

### 4.9 搜索关联模块 (`/api/search`)
- [ ] 实现 `GET /api/search` —— SPU 全局关键词搜索支持
- [ ] 实现 `GET /api/search/history` —— 获取当用户的检索历史记录
- [ ] 实现 `DELETE /api/search/history` —— 清理个人搜索历史足迹

## 5. 初始测试数据导入
- [ ] 5.1 编写 `prisma/seed.ts`，基于前端原 mock 数据（轮播图、类别、商品集、测验票券等内容）录入
- [ ] 5.2 运行全库种子入库脚本 (`npx prisma db seed`)

## 6. 微信小程序前端对接整备
- [ ] 6.1 修改 `/config/index.js` 全局关闭 `useMock` 及重定向指向至后端 `baseUrl`
- [ ] 6.2 引入 `utils/request.js` 全局封装替换原生 `wx.request`，统一附加 `Authorization`
- [ ] 6.3 调整前端 services 层对新 API 接口的全量验证匹配与联调测试
