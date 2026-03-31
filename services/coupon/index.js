import { config } from '../../config/index';
import { request } from '../../utils/request';

/** 获取优惠券列表 */
function mockFetchCoupon(status) {
  const { delay } = require('../_utils/delay');
  const { getCouponList } = require('../../model/coupon');
  return delay().then(() => getCouponList(status));
}

const statusMap = {
  default: 'unused',
  useless: 'used',
  disabled: 'expired',
};

/** 获取优惠券列表 */
export function fetchCouponList(status = 'default') {
  if (config.useMock) {
    return mockFetchCoupon(status);
  }

  const apiStatus = statusMap[status] || '';
  return request(`/coupon${apiStatus ? `?status=${apiStatus}` : ''}`);
}

/** 获取优惠券详情 */
function mockFetchCouponDetail(id, status) {
  const { delay } = require('../_utils/delay');
  const { getCoupon } = require('../../model/coupon');
  const { genAddressList } = require('../../model/address');

  return delay().then(() => {
    const result = {
      detail: getCoupon(id, status),
      storeInfoList: genAddressList(),
    };

    result.detail.useNotes = `1个订单限使用1张，除运费券外，不可与其他同类优惠券叠加使用\n2.仅适用于各区域正常销售商品，不支持团购、抢购、预售类商品`;
    result.detail.storeAdapt = `商城通用`;

    if (result.detail.type === 'price') {
      result.detail.desc = `减免 ${result.detail.value / 100} 元`;

      if (result.detail.base) {
        result.detail.desc += `，满${result.detail.base / 100}元可用`;
      }

      result.detail.desc += '。';
    } else if (result.detail.type === 'discount') {
      result.detail.desc = `${result.detail.value}折`;

      if (result.detail.base) {
        result.detail.desc += `，满${result.detail.base / 100}元可用`;
      }

      result.detail.desc += '。';
    }

    return result;
  });
}

/** 获取优惠券详情 */
export function fetchCouponDetail(id, status = 'default') {
  if (config.useMock) {
    return mockFetchCouponDetail(id, status);
  }
  return request(`/coupon/${id}`);
}
