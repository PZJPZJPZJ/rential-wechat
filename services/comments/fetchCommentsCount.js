import { config } from '../../config/index';
import { request } from '../../utils/request';

/** 获取商品评论数 */
function mockFetchCommentsCount(ID = 0) {
  const { delay } = require('../_utils/delay');
  const { getGoodsCommentsCount } = require('../../model/comments');
  return delay().then(() => getGoodsCommentsCount(ID));
}

/** 获取商品评论数 */
export function fetchCommentsCount(ID = 0) {
  if (config.useMock) {
    return mockFetchCommentsCount(ID);
  }
  const spuId = typeof ID === 'object' ? ID.spuId : ID;
  if (!spuId) {
    return Promise.resolve({
      badCount: '0',
      commentCount: '0',
      goodCount: '0',
      middleCount: '0',
      hasImageCount: '0',
      uidCount: '0',
    });
  }

  return request(`/goods/${spuId}/comments?pageNum=1&pageSize=50`).then((data) => {
    const pageList = data.pageList || [];
    const commentCount = Number(data.totalCount || 0);
    const goodCount = pageList.filter((item) => item.commentScore >= 4).length;
    const middleCount = pageList.filter((item) => item.commentScore === 3).length;
    const badCount = pageList.filter((item) => item.commentScore <= 2).length;
    const hasImageCount = pageList.filter(
      (item) => Array.isArray(item.commentImageUrls) && item.commentImageUrls.length > 0,
    ).length;

    return {
      badCount: String(badCount),
      commentCount: String(commentCount),
      goodCount: String(goodCount),
      middleCount: String(middleCount),
      hasImageCount: String(hasImageCount),
      uidCount: '0',
    };
  });
}
