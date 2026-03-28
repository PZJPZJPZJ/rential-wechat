-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "openid" TEXT NOT NULL,
    "nickname" TEXT,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "gender" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "thumbnail" TEXT,
    "parentId" INTEGER,
    "sort" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Goods" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "spuId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "primaryImage" TEXT NOT NULL,
    "images" TEXT NOT NULL,
    "video" TEXT,
    "desc" TEXT,
    "minSalePrice" INTEGER NOT NULL,
    "maxSalePrice" INTEGER NOT NULL,
    "minLinePrice" INTEGER NOT NULL,
    "maxLinePrice" INTEGER NOT NULL,
    "spuStockQuantity" INTEGER NOT NULL DEFAULT 0,
    "soldNum" INTEGER NOT NULL DEFAULT 0,
    "isPutOnSale" INTEGER NOT NULL DEFAULT 1,
    "isSoldOut" BOOLEAN NOT NULL DEFAULT false,
    "storeId" TEXT NOT NULL DEFAULT '1000',
    "etitle" TEXT,
    "categoryId" INTEGER,
    "limitInfo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Goods_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpuTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tagId" TEXT,
    "title" TEXT NOT NULL,
    "image" TEXT,
    "goodsId" INTEGER NOT NULL,
    CONSTRAINT "SpuTag_goodsId_fkey" FOREIGN KEY ("goodsId") REFERENCES "Goods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpecGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "specId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goodsId" INTEGER NOT NULL,
    CONSTRAINT "SpecGroup_goodsId_fkey" FOREIGN KEY ("goodsId") REFERENCES "Goods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpecValue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "specValueId" TEXT NOT NULL,
    "specValue" TEXT NOT NULL,
    "image" TEXT,
    "specGroupId" INTEGER NOT NULL,
    CONSTRAINT "SpecValue_specGroupId_fkey" FOREIGN KEY ("specGroupId") REFERENCES "SpecGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sku" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "skuId" TEXT NOT NULL,
    "skuImage" TEXT,
    "specInfo" TEXT NOT NULL,
    "salePrice" INTEGER NOT NULL,
    "linePrice" INTEGER NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "goodsId" INTEGER NOT NULL,
    CONSTRAINT "Sku_goodsId_fkey" FOREIGN KEY ("goodsId") REFERENCES "Goods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "skuId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isSelected" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cart_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNo" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 5,
    "totalAmount" INTEGER NOT NULL,
    "goodsAmount" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "freightAmount" INTEGER NOT NULL DEFAULT 0,
    "addressInfo" TEXT NOT NULL,
    "couponId" INTEGER,
    "remark" TEXT,
    "payTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "spuId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "specInfo" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Logistics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "company" TEXT NOT NULL,
    "trackNo" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "receiverPhone" TEXT NOT NULL,
    "receiverAddress" TEXT NOT NULL,
    "traces" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Logistics_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AfterService" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "images" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AfterService_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Address" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "provinceName" TEXT NOT NULL,
    "provinceCode" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "cityCode" TEXT NOT NULL,
    "districtName" TEXT NOT NULL,
    "districtCode" TEXT NOT NULL,
    "detailAddress" TEXT NOT NULL,
    "addressTag" TEXT DEFAULT '',
    "isDefault" INTEGER NOT NULL DEFAULT 0,
    "latitude" TEXT,
    "longitude" TEXT,
    CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'price',
    "value" INTEGER NOT NULL,
    "base" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT '¥',
    "timeLimit" TEXT,
    "startAt" DATETIME NOT NULL,
    "expireAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserCoupon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "couponId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unused',
    "usedAt" DATETIME,
    "orderId" INTEGER,
    CONSTRAINT "UserCoupon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserCoupon_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "goodsId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "skuId" TEXT,
    "specInfo" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "images" TEXT,
    "replyContent" TEXT,
    "replyAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_goodsId_fkey" FOREIGN KEY ("goodsId") REFERENCES "Goods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "keyword" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image" TEXT NOT NULL,
    "link" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "promotionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "promotionCode" TEXT NOT NULL,
    "promotionSubCode" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "activityLadder" TEXT NOT NULL DEFAULT '[]'
);

-- CreateIndex
CREATE UNIQUE INDEX "User_openid_key" ON "User"("openid");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Category_groupId_key" ON "Category"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Goods_spuId_key" ON "Goods"("spuId");

-- CreateIndex
CREATE UNIQUE INDEX "Sku_skuId_key" ON "Sku"("skuId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "Logistics_orderId_key" ON "Logistics"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_promotionId_key" ON "Promotion"("promotionId");
