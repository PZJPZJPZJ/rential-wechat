import { config } from '../../config/index';
import { request } from '../../utils/request';

/** 获取售后单mock数据 */
function mockFetchRightsPreview(params) {
  const { delay } = require('../_utils/delay');
  const { genRightsPreview } = require('../../model/order/applyService');

  return delay().then(() => genRightsPreview(params));
}

/** 获取售后单数据 */
export function fetchRightsPreview(params) {
  if (config.useMock) {
    return mockFetchRightsPreview(params);
  }

  const orderNo = params?.orderNo;
  const targetSkuId = String(params?.skuId || '');
  const numOfSku = Number(params?.numOfSku || 1);

  return request(`/order/${orderNo}`).then((data) => {
    const goods = (data.orderItemVOs || []).find((item) => String(item.skuId) === targetSkuId) || data.orderItemVOs?.[0];
    const paidAmountEach = Number(goods?.actualPrice || 0);
    const boughtQuantity = Number(goods?.buyQuantity || 1);
    const applyQuantity = Math.min(Math.max(numOfSku, 1), boughtQuantity);

    return {
      data: {
        spuId: goods?.spuId || params?.spuId,
        skuId: goods?.skuId || targetSkuId,
        goodsInfo: {
          skuImage: goods?.goodsPictureUrl || '',
          goodsName: goods?.goodsName || '',
          specInfo: goods?.specifications || [],
        },
        paidAmountEach,
        boughtQuantity,
        numOfSku: applyQuantity,
        numOfSkuAvailable: boughtQuantity,
        refundableAmount: paidAmountEach * applyQuantity,
        shippingFeeIncluded: Number(data.freightFee || 0),
      },
    };
  });
}

/** 确认收货 */
export function dispatchConfirmReceived() {
  if (config.useMock) {
    const { delay } = require('../_utils/delay');
    return delay();
  }

  return Promise.resolve({ code: 'Success', data: true });
}

/** 获取可选的mock售后原因列表 */
function mockFetchApplyReasonList(params) {
  const { delay } = require('../_utils/delay');
  const { genApplyReasonList } = require('../../model/order/applyService');

  return delay().then(() => genApplyReasonList(params));
}

/** 获取可选的售后原因列表 */
export function fetchApplyReasonList(params) {
  if (config.useMock) {
    return mockFetchApplyReasonList(params);
  }

  return Promise.resolve({
    data: {
      rightsReasonList: [
        { id: 1, desc: '商品质量问题' },
        { id: 2, desc: '商品与描述不符' },
        { id: 3, desc: '不想要了' },
      ],
    },
  });
}

/** 发起mock售后申请 */
function mockDispatchApplyService(params) {
  const { delay } = require('../_utils/delay');
  const { applyService } = require('../../model/order/applyService');

  return delay().then(() => applyService(params));
}

/** 发起售后申请 */
export function dispatchApplyService(params) {
  if (config.useMock) {
    return mockDispatchApplyService(params);
  }

  const orderNo = params?.rights?.orderNo;
  const requestType = Number(params?.rights?.rightsType) === 10 ? 'return' : 'refund';

  return request(`/order/${orderNo}/after-service`, {
    method: 'POST',
    data: {
      type: requestType,
      reason: params?.rights?.rightsReasonDesc || '其他',
      description: params?.refundMemo || '',
      images: params?.rights?.rightsImageUrls || [],
    },
  }).then((data) => ({
    data: {
      rightsNo: String(data.afterServiceId),
    },
  }));
}
