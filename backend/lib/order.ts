import { type Order, type OrderItem } from '@prisma/client';

interface SpecPair {
  specTitle: string;
  specValue: string;
}

export const parseJsonArray = <T>(raw?: string | null): T[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

export const parseAddressInfo = (raw: string) => {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const orderStatusNameMap: Record<number, string> = {
  5: '待付款',
  10: '待发货',
  40: '待收货',
  50: '交易完成',
  80: '已取消',
};

const toButtons = (status: number) => {
  if (status === 5) {
    return [
      { primary: false, type: 2, name: '取消订单' },
      { primary: true, type: 1, name: '付款' },
    ];
  }
  if (status === 10) {
    return [{ primary: true, type: 9, name: '再次购买' }];
  }
  if (status === 40) {
    return [{ primary: true, type: 3, name: '确认收货' }];
  }
  if (status === 50) {
    return [
      { primary: false, type: 4, name: '申请售后' },
      { primary: true, type: 6, name: '评价' },
    ];
  }
  return [{ primary: true, type: 9, name: '再次购买' }];
};

export const mapOrderItem = (item: OrderItem) => ({
  id: String(item.id),
  orderNo: null,
  spuId: item.spuId,
  skuId: item.skuId,
  roomId: null,
  goodsMainType: 0,
  goodsViceType: 0,
  goodsName: item.title,
  goodsPictureUrl: item.image,
  originPrice: String(item.price),
  actualPrice: String(item.price),
  specifications: parseJsonArray<SpecPair>(item.specInfo),
  buyQuantity: item.quantity,
  itemTotalAmount: String(item.price * item.quantity),
  itemDiscountAmount: '0',
  itemPaymentAmount: String(item.price * item.quantity),
  goodsPaymentPrice: String(item.price),
  tagPrice: null,
  tagText: null,
  outCode: null,
  labelVOs: null,
  buttonVOs: null,
});

export const mapOrderBase = (order: Order, items: OrderItem[]) => ({
  saasId: '88888888',
  storeId: '1000',
  storeName: 'TMall旗舰店',
  uid: String(order.userId),
  parentOrderNo: order.orderNo,
  orderId: String(order.id),
  orderNo: order.orderNo,
  orderType: 0,
  orderSubType: 0,
  orderStatus: order.status,
  orderSubStatus: null,
  totalAmount: String(order.totalAmount),
  goodsAmount: String(order.goodsAmount),
  goodsAmountApp: String(order.goodsAmount),
  paymentAmount: String(order.totalAmount),
  freightFee: String(order.freightAmount),
  packageFee: '0',
  discountAmount: String(order.discountAmount),
  channelType: 0,
  channelSource: '',
  channelIdentity: '',
  remark: order.remark ?? '',
  cancelType: null,
  cancelReasonType: null,
  cancelReason: null,
  rightsType: null,
  createTime: String(order.createdAt.getTime()),
  orderItemVOs: items.map(mapOrderItem),
  buttonVOs: toButtons(order.status),
  labelVOs: null,
  invoiceVO: null,
  couponAmount: order.discountAmount > 0 ? String(order.discountAmount) : null,
  autoCancelTime: order.status === 5 ? String(order.createdAt.getTime() + 30 * 60 * 1000) : null,
  orderStatusName: orderStatusNameMap[order.status] ?? '未知状态',
  orderStatusRemark: null,
  logisticsLogVO: null,
  invoiceStatus: null,
  invoiceDesc: null,
  invoiceUrl: null,
});
