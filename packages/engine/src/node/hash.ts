import { NodeInterface } from '../types';
import { DATA_ID } from '../constants';

let _counters = 0;

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
		const indexs: number[] = [];
		[
			'a',
			'b',
			'c',
			'd',
			'e',
			'f',
			'g',
			'h',
			'i',
			'j',
			'k',
			'l',
			'm',
			'n',
			'o',
			'p',
			'q',
			'r',
			's',
			't',
			'u',
			'v',
			'w',
			'x',
			'y',
			'z',
		].forEach((char, i) => {
			const index = base64.indexOf(char);
			indexs.push(~index ? index : base64.length % i ? 0 : 1);
		});
		const str = Number(indexs.join('')).toString(36).replace(/0/g, '');
		prefix = prefix + str.substr(0, 4) + str.substr(-4);
		valueCaches.set(value, prefix);
	} else {
		prefix = cachePerfix;
	}
	const hash = prefix;
	if (unique) {
		const key = `${hash}-${uuid(_counters)}`;
		_counters++;
		return key;
	}

	return hash;
};
