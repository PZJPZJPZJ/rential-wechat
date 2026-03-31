import { config } from '../../../config/index';
import { queryCommentDetail } from '../../../model/comments/queryDetail';
import { request } from '../../../utils/request';
/** 获取商品评价数据 */
function mockQueryCommentDetail(params) {
  const { delay } = require('../../_utils/delay');
  const data = queryCommentDetail(params);
  return delay().then(() => {
    return data;
  });
}

/** 获取评价详情 */
export function getCommentDetail(params) {
  if (config.useMock) {
    return mockQueryCommentDetail(params);
  }
  const spuId = params?.spuId;
  if (!spuId) {
    return Promise.resolve({});
  }
  return request(`/goods/${spuId}/comments?pageNum=1&pageSize=20`).then((data) => {
    const id = params?.commentId || params?.id;
    const list = data.pageList || [];
    if (!id) {
      return list[0] || {};
    }
    return (
      list.find((item) => String(item.commentId || item.id) === String(id)) ||
      list[0] ||
      {}
    );
  });
}
