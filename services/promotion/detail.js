import { config } from '../../config/index';
import { request } from '../../utils/request';

/** 获取商品列表 */
function mockFetchPromotion(ID = 0) {
  const { delay } = require('../_utils/delay');
  const { getPromotion } = require('../../model/promotion');
  return delay().then(() => getPromotion(ID));
}

/** 获取商品列表 */
export function fetchPromotion(ID = 0) {
  if (config.useMock) {
    return mockFetchPromotion(ID);
  }
  return request(`/promotion/${ID}`).then((data) => ({
    list: data.goodsList || [],
    banner: data.description || '',
    time: data.endTime ? Number(data.endTime) - Date.now() : 0,
    showBannerDesc: Boolean(data.description),
    statusTag: data.tag || '',
  }));
}
