import { config } from '../config/index';

const normalizePath = (path) => {
  if (!path.startsWith('/')) {
    return `/${path}`;
  }
  return path;
};

export function request(path, options = {}) {
  const token = wx.getStorageSync('token');
  const method = options.method || 'GET';

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.baseUrl}${normalizePath(path)}`,
      method,
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.header || {}),
      },
      success: (res) => {
        const payload = res.data || {};
        if (payload.success) {
          resolve(payload.data);
          return;
        }

        reject({
          statusCode: res.statusCode,
          code: payload.code || 'REQUEST_ERROR',
          message: payload.message || '请求失败',
          data: payload,
        });
      },
      fail: (error) => {
        reject({
          code: 'NETWORK_ERROR',
          message: '网络请求失败',
          error,
        });
      },
    });
  });
}
