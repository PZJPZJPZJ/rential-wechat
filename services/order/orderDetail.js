import { config } from '../../config/index';
import { request } from '../../utils/request';

/** 获取订单详情mock数据 */
function mockFetchOrderDetail(params) {
  const { delay } = require('../_utils/delay');
  const { genOrderDetail } = require('../../model/order/orderDetail');

  return delay().then(() => genOrderDetail(params));
}

/** 获取订单详情数据 */
export function fetchOrderDetail(params) {
  if (config.useMock) {
    return mockFetchOrderDetail(params);
  }
  const orderNo = params?.parameter;
  return request(`/order/${orderNo}`).then((data) => ({ data }));
}

/** 获取客服mock数据 */
function mockFetchBusinessTime(params) {
  const { delay } = require('../_utils/delay');
  const { genBusinessTime } = require('../../model/order/orderDetail');

  return delay().then(() => genBusinessTime(params));
}

/** 获取客服数据 */
export function fetchBusinessTime(params) {
  if (config.useMock) {
    return mockFetchBusinessTime(params);
  }
  return Promise.resolve({
    data: {
      telphone: '4006336868',
      businessTime: ['周一至周日 09:00-12:00', '周一至周日 13:00-18:00'],
    },
  });
}
