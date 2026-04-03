import updateManager from './common/updateManager';
import { request } from './utils/request';

App({
  onLaunch: function () {
    this.login();
  },
  onShow: function () {
    updateManager();
  },

  login: function() {
    // 微信静默登录获取 code
    wx.login({
      success: (res) => {
        if (res.code) {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          request('/auth/login', {
            method: 'POST',
            data: {
              code: res.code
            }
          })
          .then((data) => {
            if (data && data.token) {
              wx.setStorageSync('token', data.token);
              console.log('登录成功，已保存 token');
              // 如果有其他想要全局共享的信息可以放在这
              this.globalData.token = data.token;
            }
          })
          .catch((err) => {
            console.error('后台登录接口调用失败', err);
          });
        } else {
          console.error('登录失败！' + res.errMsg);
        }
      },
      fail: (err) => {
        console.error('wx.login 失败', err);
      }
    });
  },

  globalData: {
    token: null
  }
});
