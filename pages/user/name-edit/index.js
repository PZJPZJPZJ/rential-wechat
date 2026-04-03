import { updatePerson } from '../../../services/usercenter/fetchPerson';
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    nameValue: '',
  },
  onLoad(options) {
    const { name } = options;
    this.setData({
      nameValue: name,
    });
  },
  onSubmit() {
    const { nameValue } = this.data;
    if (!nameValue.trim()) return;
    updatePerson({ nickname: nameValue }).then(() => {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '昵称修改成功',
        theme: 'success',
      });
      setTimeout(() => wx.navigateBack(), 1500);
    }).catch(() => {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '修改失败，请重试',
        theme: 'error',
      });
    });
  },
  clearContent() {
    this.setData({
      nameValue: '',
    });
  },
});
