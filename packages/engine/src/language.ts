import merge from 'lodash/merge';
import type { LanguageInterface } from './types';

/**
 * 语言包管理器
 */
class Language implements LanguageInterface {
	private data: {} = {};
	private locale: string = 'zh-CN';

	constructor(locale: string, data: {} = {}) {
		this.locale = locale;
		this.data = data;
	}

	add(data: {}) {
		this.data = merge(this.data, data);
	}

	get<T extends string | {}>(...keys: Array<string>): T {
		const get = (start: number = 0, language: {}): T => {
			for (let i = start; i < keys.length; i++) {
				const value = language[keys[i]];
				if (typeof value === 'object') {
					return get(i + 1, value);
				}
				return value || '';
			}
			return language as T;
		};
		return get(0, this.data[this.locale]);
	}
}

export default Language;
