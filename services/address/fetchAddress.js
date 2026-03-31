import { config } from '../../config/index';
import { request } from '../../utils/request';

/** 获取收货地址 */
function mockFetchDeliveryAddress(id) {
  const { delay } = require('../_utils/delay');
  const { genAddress } = require('../../model/address');

  return delay().then(() => genAddress(id));
}

/** 获取收货地址 */
export function fetchDeliveryAddress(id = 0) {
  if (config.useMock) {
    return mockFetchDeliveryAddress(id);
  }
  return request(`/address/${id}`).then((address) => ({
    ...address,
    countryCode: address.countryCode || 'chn',
    countryName: address.countryName || '中国',
    isDefault: address.isDefault || 0,
    labelIndex: ['家', '公司'].indexOf(address.addressTag),
  }));
}

/** 获取收货地址列表 */
function mockFetchDeliveryAddressList(len = 0) {
  const { delay } = require('../_utils/delay');
  const { genAddressList } = require('../../model/address');

  return delay().then(() =>
    genAddressList(len).map((address) => {
      return {
        ...address,
        phoneNumber: address.phone,
        address: `${address.provinceName}${address.cityName}${address.districtName}${address.detailAddress}`,
        tag: address.addressTag,
      };
    }),
  );
}

/** 获取收货地址列表 */
export function fetchDeliveryAddressList(len = 10) {
  if (config.useMock) {
    return mockFetchDeliveryAddressList(len);
  }
  return request('/address').then((list) =>
    (list || []).slice(0, len).map((address) => ({
      ...address,
      phoneNumber: address.phone,
      address: `${address.provinceName || ''}${address.cityName || ''}${address.districtName || ''}${address.detailAddress || ''}`,
      tag: address.addressTag,
    })),
  );
}
