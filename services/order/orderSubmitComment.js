import { config } from '../../config/index';
import { request } from '../../utils/request';

/** 获取评价商品 */
function mockGetGoods(parameter) {
  const { delay } = require('../_utils/delay');
  const { getGoods } = require('../../model/submitComment');
  const data = getGoods(parameter);

  return delay().then(() => {
    return data;
  });
}

/** 获取评价商品 */
export function getGoods(parameter) {
  if (config.useMock) {
    return mockGetGoods(parameter);
  }
  const orderNo = parameter?.orderNo || parameter?.parameter;
  if (!orderNo) {
    return Promise.resolve([]);
  }
  return request(`/order/${orderNo}`).then((data) =>
    (data.orderItemVOs || []).map((item) => ({
      id: item.id,
      spuId: item.spuId,
      skuId: item.skuId,
      title: item.goodsName,
      thumb: item.goodsPictureUrl,
      specs: (item.specifications || []).map((spec) => spec.specValue),
      price: item.actualPrice,
      num: item.buyQuantity,
    })),
  );
}
