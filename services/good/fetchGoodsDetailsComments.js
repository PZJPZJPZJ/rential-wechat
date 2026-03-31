import { config } from '../../config/index';
import { request } from '../../utils/request';

/** 获取商品详情页评论数 */
function mockFetchGoodDetailsCommentsCount(spuId = 0) {
  const { delay } = require('../_utils/delay');
  const {
    getGoodsDetailsCommentsCount,
  } = require('../../model/detailsComments');
  return delay().then(() => getGoodsDetailsCommentsCount(spuId));
}

/** 获取商品详情页评论数 */
export function getGoodsDetailsCommentsCount(spuId = 0) {
  if (config.useMock) {
    return mockFetchGoodDetailsCommentsCount(spuId);
  }
  if (!spuId) {
    return Promise.resolve({
      badCount: 0,
      commentCount: 0,
      goodCount: 0,
      goodRate: 0,
      hasImageCount: 0,
      middleCount: 0,
    });
  }
  return request(`/goods/${spuId}/comments?pageNum=1&pageSize=50`).then((data) => {
    const list = data.pageList || [];
    const commentCount = Number(data.totalCount || 0);
    const goodCount = list.filter((item) => item.commentScore >= 4).length;
    const middleCount = list.filter((item) => item.commentScore === 3).length;
    const badCount = list.filter((item) => item.commentScore <= 2).length;
    const hasImageCount = list.filter(
      (item) => Array.isArray(item.commentImageUrls) && item.commentImageUrls.length > 0,
    ).length;
    const goodRate = commentCount > 0 ? (goodCount * 100) / commentCount : 0;
    return {
      badCount,
      commentCount,
      goodCount,
      goodRate,
      hasImageCount,
      middleCount,
    };
  });
}

/** 获取商品详情页评论 */
function mockFetchGoodDetailsCommentList(spuId = 0) {
  const { delay } = require('../_utils/delay');
  const { getGoodsDetailsComments } = require('../../model/detailsComments');
  return delay().then(() => getGoodsDetailsComments(spuId));
}

/** 获取商品详情页评论 */
export function getGoodsDetailsCommentList(spuId = 0) {
  if (config.useMock) {
    return mockFetchGoodDetailsCommentList(spuId);
  }
  if (!spuId) {
    return Promise.resolve({ homePageComments: [] });
  }
  return request(`/goods/${spuId}/comments?pageNum=1&pageSize=5`).then((data) => ({
    homePageComments: data.pageList || [],
  }));
}
