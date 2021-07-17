import { merge } from 'lodash-es';
import { LanguageInterface } from './types/language';

class Language implements LanguageInterface {
	private data: {} = {};
	private lange: string = 'zh-CN';

	constructor(lange: string, data: {} = {}) {
		this.lange = lange;
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
		return get(0, this.data[this.lange]);
	}
}

export default Language;
