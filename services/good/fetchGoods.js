import { config } from '../../config/index';
import { request } from '../../utils/request';

/** 获取商品列表 */
function mockFetchGoodsList(pageIndex = 1, pageSize = 20) {
  const { delay } = require('../_utils/delay');
  const { getGoodsList } = require('../../model/goods');
  return delay().then(() =>
    getGoodsList(pageIndex, pageSize).map((item) => {
      return {
        spuId: item.spuId,
        thumb: item.primaryImage,
        title: item.title,
        price: item.minSalePrice,
        originPrice: item.maxLinePrice,
        tags: item.spuTagList.map((tag) => tag.title),
      };
    }),
  );
}

/** 获取商品列表 */
export function fetchGoodsList(pageIndex = 1, pageSize = 20) {
  if (config.useMock) {
    return mockFetchGoodsList(pageIndex, pageSize);
  }
  const safePageSize = Number(pageSize) > 0 ? Number(pageSize) : 20;
  const offset = Number(pageIndex) > 0 ? Number(pageIndex) : 0;
  const pageNum = Math.floor(offset / safePageSize) + 1;

  return request(`/goods?pageNum=${pageNum}&pageSize=${safePageSize}`).then(
    (data) =>
      (data.spuList || []).map((item) => ({
        spuId: item.spuId,
        thumb: item.primaryImage || item.thumb,
        title: item.title,
        price: item.minSalePrice || item.price,
        originPrice: item.maxLinePrice || item.originPrice,
        tags: Array.isArray(item.spuTagList)
          ? item.spuTagList.map((tag) => tag.title)
          : item.tags || [],
      })),
  );
}
