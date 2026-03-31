import { config } from '../../config/index';
import { request } from '../../utils/request';

const toQuery = (params = {}) =>
  Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

/** 获取商品评论 */
function mockFetchComments(parmas) {
  const { delay } = require('../_utils/delay');
  const { getGoodsAllComments } = require('../../model/comments');
  return delay().then(() => getGoodsAllComments(parmas));
}

/** 获取商品评论 */
export function fetchComments(parmas) {
  if (config.useMock) {
    return mockFetchComments(parmas);
  }
  const queryParameter = parmas?.queryParameter || {};
  const { spuId } = queryParameter;
  if (!spuId) {
    return Promise.resolve({
      pageNum: 1,
      pageSize: 30,
      totalCount: '0',
      pageList: [],
    });
  }

  const query = toQuery({
    pageNum: parmas?.pageNum || 1,
    pageSize: parmas?.pageSize || 30,
    commentLevel: queryParameter.commentLevel,
    hasImage: queryParameter.hasImage,
  });
  return request(`/goods/${spuId}/comments${query ? `?${query}` : ''}`);
}
