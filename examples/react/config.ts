import { isServer } from '@aomao/engine';

export const IS_DEV = process.env.NODE_ENV !== 'production';

export const lang = (
	!isServer ? window.location.href.indexOf('zh-CN') > 0 : false
)
	? 'zh-CN'
	: 'en-US';
