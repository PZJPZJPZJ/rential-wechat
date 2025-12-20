import dayjs from 'dayjs';

const formatTime = (date, template) => dayjs(date).format(template);

/**
 * 格式化价格数额为字符串
 * 可对小数部分进行填充，默认不填充
 * @param price 价格数额，以分为单位!
 * @param fill 是否填充小数部分 0-不填充 1-填充第一位小数 2-填充两位小数
 */
function priceFormat(price, fill = 0) {
  if (isNaN(price) || price === null || price === Infinity) {
    return price;
  }

  let priceFormatValue = Math.round(parseFloat(`${price}`) * 10 ** 8) / 10 ** 8; // 恢复精度丢失
  priceFormatValue = `${Math.ceil(priceFormatValue) / 100}`; // 向上取整，单位转换为元，转换为字符串
  if (fill > 0) {
    // 补充小数位数
    if (priceFormatValue.indexOf('.') === -1) {
      priceFormatValue = `${priceFormatValue}.`;
    }
    const n = fill - priceFormatValue.split('.')[1]?.length;
    for (let i = 0; i < n; i++) {
      priceFormatValue = `${priceFormatValue}0`;
    }
  }
  return priceFormatValue;
}

/**
 * 获取cdn裁剪后链接
 *
 * @param {string} url 基础链接
 * @param {number} width 宽度，单位px
 * @param {number} [height] 可选，高度，不填时与width同值
 */
const cosThumb = (url, width, height = width) => {
  if (url.indexOf('?') > -1) {
    return url;
  }

  if (url.indexOf('http://') === 0) {
    url = url.replace('http://', 'https://');
  }

  return `${url}?imageMogr2/thumbnail/${~~width}x${~~height}`;
};

const get = (source, paths, defaultValue) => {
  if (typeof paths === 'string') {
    paths = paths
      .replace(/\[/g, '.')
      .replace(/\]/g, '')
      .split('.')
      .filter(Boolean);
  }
  const { length } = paths;
  let index = 0;
  while (source != null && index < length) {
    source = source[paths[index++]];
  }
  return source === undefined || index === 0 ? defaultValue : source;
};
let systemWidth = 0;
/** 获取系统宽度，为了减少启动消耗所以在函数里边做初始化 */
export const loadSystemWidth = () => {
  if (systemWidth) {
    return systemWidth;
  }

  try {
    ({ screenWidth: systemWidth, pixelRatio } = wx.getSystemInfoSync());
  } catch (e) {
    systemWidth = 0;
  }
  return systemWidth;
};

/**
 * 转换rpx为px
 *
 * @description
 * 什么时候用？
 * - 布局(width: 172rpx)已经写好, 某些组件只接受px作为style或者prop指定
 *
 */
const rpx2px = (rpx, round = false) => {
  loadSystemWidth();

  // px / systemWidth = rpx / 750
  const result = (rpx * systemWidth) / 750;

  if (round) {
    return Math.floor(result);
  }

  return result;
};

/**
 * 手机号码*加密函数
 * @param {string} phone 电话号
 * @returns
 */
const phoneEncryption = (phone) => {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

// 内置手机号正则字符串
const innerPhoneReg =
  '^1(?:3\\d|4[4-9]|5[0-35-9]|6[67]|7[0-8]|8\\d|9\\d)\\d{8}$';

/**
 * 手机号正则校验
 * @param phone 手机号
 * @param phoneReg 正则字符串
 * @returns true - 校验通过 false - 校验失败
 */
const phoneRegCheck = (phone) => {
  const phoneRegExp = new RegExp(innerPhoneReg);
  return phoneRegExp.test(phone);
};

/**
 * 获取导航栏高度和胶囊按钮信息
 * 用于自定义导航栏时计算安全区域
 * @returns {Object} 包含状态栏高度、胶囊按钮信息、导航栏总高度等
 */
const getNavBarInfo = () => {
  try {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    // 获取胶囊按钮信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    
    // 状态栏高度
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    
    // 胶囊按钮高度
    const menuButtonHeight = menuButtonInfo.height;
    
    // 胶囊按钮上边距（胶囊按钮top - 状态栏高度）
    const menuButtonTop = menuButtonInfo.top;
    
    // 胶囊按钮与状态栏的间距
    const menuButtonMarginTop = menuButtonTop - statusBarHeight;
    
    // 导航栏总高度 = 胶囊按钮bottom + 胶囊按钮与状态栏的间距（保持上下对称）
    const navBarHeight = menuButtonInfo.bottom + menuButtonMarginTop;
    
    return {
      statusBarHeight,        // 状态栏高度
      menuButtonHeight,       // 胶囊按钮高度
      menuButtonTop,          // 胶囊按钮上边距
      menuButtonMarginTop,    // 胶囊按钮与状态栏的间距
      navBarHeight,           // 总的导航栏高度（安全区域高度）
      menuButtonInfo,         // 完整的胶囊按钮信息（包含 left, right, width 等）
    };
  } catch (e) {
    // 降级处理，返回默认值
    console.error('getNavBarInfo error:', e);
    return {
      statusBarHeight: 20,
      menuButtonHeight: 32,
      menuButtonTop: 20,
      menuButtonMarginTop: 0,
      navBarHeight: 64,
      menuButtonInfo: {},
    };
  }
};

module.exports = {
  formatTime,
  priceFormat,
  cosThumb,
  get,
  rpx2px,
  phoneEncryption,
  phoneRegCheck,
  getNavBarInfo,
};
