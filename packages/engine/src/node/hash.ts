import { NodeInterface } from '../types';
import { DATA_ID } from '../constants';

const _counters: { [key: string]: number } = {};

export const uuid = (n = 0): string => {
	return Number(
		Math.random().toString().substring(2, 7) + n + Date.now(),
	).toString(36);
};

const valueCaches = new Map<string, string>();

export default (
	value: string | NodeInterface | Node,
	unique: boolean = true,
) => {
	let prefix = '';
	if (typeof value !== 'string') {
		let node = (value[0] ?? value) as Node;
		if (node.nodeType === Node.ELEMENT_NODE) {
			const element = node as HTMLElement;
			const name = element.localName;
			prefix = name.substring(0, 1);
			value = name;
			const attributes = element.attributes;
			for (let i = attributes.length; i--; ) {
				const item = attributes[i];
				if (~~[DATA_ID, 'id'].indexOf(item.name))
					value += `${item.name}="${item.value}"`;
			}
		} else {
			value = node.textContent ?? '';
		}
	}
	const cachePerfix = valueCaches.get(value);
	if (!cachePerfix) {
		const base64 = window.btoa(encodeURIComponent(value)).replace(/=/g, '');
		prefix = prefix + base64.substr(0, 4);
		const indexs: number[] = [];
		for (let i = 1; i <= 26; i++) {
			const char = String.fromCharCode(i + 64).toLowerCase();
			const index = base64.indexOf(char);
			indexs.push(~index ? index : i % 2 ? 0 : 1);
		}
		const str = Number(indexs.join('')).toString(36).replace(/0/g, '');
		prefix = prefix + str.substr(0, 4) + str.substr(-4);
		valueCaches.set(value, prefix);
	} else {
		prefix = cachePerfix;
	}
	const hash = prefix;
	if (unique) {
		const counter = _counters[hash] || 0;
		_counters[hash] = counter + 1;
		return `${hash}-${uuid(_counters[hash])}`;
	}

	return hash;
};
