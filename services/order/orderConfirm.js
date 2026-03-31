import { config } from '../../config/index';
import { mockIp, mockReqId } from '../../utils/mock';
import { request } from '../../utils/request';

/** 获取结算mock数据 */
function mockFetchSettleDetail(params) {
  const { delay } = require('../_utils/delay');
  const { genSettleDetail } = require('../../model/order/orderConfirm');

  return delay().then(() => genSettleDetail(params));
}

/** 提交mock订单 */
function mockDispatchCommitPay() {
  const { delay } = require('../_utils/delay');

  return delay().then(() => ({
    data: {
      isSuccess: true,
      tradeNo: '350930961469409099',
      payInfo: '{}',
      code: null,
      transactionId: 'E-200915180100299000',
      msg: null,
      interactId: '15145',
      channel: 'wechat',
      limitGoodsList: null,
    },
    code: 'Success',
    msg: null,
    requestId: mockReqId(),
    clientIp: mockIp(),
    rt: 891,
    success: true,
  }));
}

const toPrice = (val) => {
  const num = Number(val || 0);
  return Number.isFinite(num) ? Math.max(0, Math.round(num)) : 0;
};

const normalizeGoodsList = (goodsRequestList = []) =>
  (goodsRequestList || []).map((item, index) => {
    const specs = Array.isArray(item.specInfo)
      ? item.specInfo
      : Array.isArray(item.specs)
      ? item.specs.map((spec) => ({ specValue: spec }))
      : [];

    return {
      index,
      storeId: String(item.storeId || '1000'),
      storeName: item.storeName || 'TMall旗舰店',
      spuId: String(item.spuId || ''),
      skuId: String(item.skuId || ''),
      goodsName: item.goodsName || item.title || '',
      image: item.image || item.thumb || item.primaryImage || '',
      quantity: Number(item.quantity || 1),
      settlePrice: toPrice(item.settlePrice || item.price),
      tagPrice: item.tagPrice != null ? toPrice(item.tagPrice) : null,
      skuSpecLst: specs,
    };
  });

const buildSettleData = (goodsRequestList = [], userAddress = null, couponList = []) => {
  const goods = normalizeGoodsList(goodsRequestList).filter((item) => item.skuId);
  const storeMap = new Map();

  goods.forEach((item) => {
    if (!storeMap.has(item.storeId)) {
      storeMap.set(item.storeId, {
        storeId: item.storeId,
        storeName: item.storeName,
        storeTotalPayAmount: 0,
        skuDetailVos: [],
        couponList: [],
      });
    }

    const store = storeMap.get(item.storeId);
    store.skuDetailVos.push(item);
    store.storeTotalPayAmount += item.settlePrice * item.quantity;
  });

  const storeGoodsList = Array.from(storeMap.values());
  const totalAmount = storeGoodsList.reduce((sum, store) => sum + store.storeTotalPayAmount, 0);

  return {
    settleType: goods.length > 0 ? 1 : 0,
    totalAmount,
    totalPayAmount: totalAmount,
    discountAmount: 0,
    freightAmount: 0,
    userAddress,
    storeGoodsList,
    outOfStockGoodsList: [],
    abnormalDeliveryGoodsList: [],
    inValidGoodsList: [],
    limitGoodsList: [],
    couponList: couponList || [],
  };
};

/** 获取结算数据 */
export function fetchSettleDetail(params) {
  if (config.useMock) {
    return mockFetchSettleDetail(params);
  }

  const requestGoods = params?.goodsRequestList || [];

  return request('/address')
    .then((addressList) => {
      const defaultAddress = (addressList || []).find((item) => item.isDefault === 1) || addressList?.[0] || null;
      const settleData = buildSettleData(requestGoods, defaultAddress, params?.couponList || []);
      return { data: settleData };
    })
    .catch(() => ({
      data: buildSettleData(requestGoods, params?.userAddressReq || null, params?.couponList || []),
    }));
}

/* 提交订单 */
export function dispatchCommitPay(params) {
  if (config.useMock) {
    return mockDispatchCommitPay(params);
  }

  const payload = {
    goodsRequestList: (params?.goodsRequestList || []).map((item) => ({
      skuId: String(item.skuId || ''),
      quantity: Number(item.quantity || 1),
    })),
    userAddressReq: params?.userAddressReq,
    couponList: (params?.couponList || [])
      .map((item) => ({ couponId: Number(item.couponId || item.id || 0) }))
      .filter((item) => item.couponId > 0),
    remark: Array.isArray(params?.storeInfoList)
      ? params.storeInfoList.map((item) => item.remark).filter(Boolean).join('；')
      : undefined,
  };

  return request('/order/confirm', {
    method: 'POST',
    data: payload,
  })
    .then((data) => ({
      data: {
        isSuccess: true,
        tradeNo: data.orderNo,
        payInfo: '{}',
        code: null,
        transactionId: data.orderNo,
        msg: null,
        interactId: data.orderNo,
        channel: 'wechat',
        limitGoodsList: null,
      },
      code: 'Success',
      msg: null,
      requestId: mockReqId(),
      clientIp: mockIp(),
      rt: 0,
      success: true,
    }))
    .catch((err) => {
      throw {
        ...err,
        msg: err?.message || err?.msg || '提交订单失败',
      };
    });
}

/** 开发票 */
export function dispatchSupplementInvoice() {
  if (config.useMock) {
    const { delay } = require('../_utils/delay');
    return delay();
  }

  return Promise.resolve(true);
}
