import axios from 'axios';

const WECHAT_CODE2SESSION_URL =
  'https://api.weixin.qq.com/sns/jscode2session';

interface WechatCode2SessionResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

interface WechatCode2SessionSuccess {
  openid: string;
  session_key?: string;
  unionid?: string;
}

const getWechatConfig = () => {
  const appId = process.env.WECHAT_APP_ID ?? process.env.WX_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET ?? process.env.WX_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Missing WeChat config: WECHAT_APP_ID / WECHAT_APP_SECRET');
  }

  return { appId, appSecret };
};

export const code2Session = async (
  code: string,
): Promise<WechatCode2SessionSuccess> => {
  const trimmedCode = code.trim();
  if (!trimmedCode) {
    throw new Error('Invalid wechat login code');
  }

  const { appId, appSecret } = getWechatConfig();

  const { data } = await axios.get<WechatCode2SessionResponse>(
    WECHAT_CODE2SESSION_URL,
    {
      params: {
        appid: appId,
        secret: appSecret,
        js_code: trimmedCode,
        grant_type: 'authorization_code',
      },
      timeout: 8000,
    },
  );

  if (data.errcode || !data.openid) {
    throw new Error(data.errmsg || `Wechat code2session failed: ${data.errcode}`);
  }

  return {
    openid: data.openid,
    session_key: data.session_key,
    unionid: data.unionid,
  };
};
