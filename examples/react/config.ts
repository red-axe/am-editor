import { isServer } from '@aomao/engine';

export const IS_DEV = process.env.NODE_ENV !== 'production';
export const DOMAIN = IS_DEV
	? `http://${
			typeof window !== 'undefined'
				? window.location.host
				: 'localhost:7001'
	  }`
	: 'https://editor.aomao.com';

export const lang = (
	!isServer ? window.location.href.indexOf('zh-CN') > 0 : false
)
	? 'zh-CN'
	: 'en-US';
