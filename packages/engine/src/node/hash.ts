import md5 from 'blueimp-md5';
import { NodeInterface } from '../types';
import { DATA_ID } from '../constants';

const _counters: { [key: string]: number } = {};

export const uuid = (len: number, radix: number = 16): string => {
	const chars =
		'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(
			'',
		);
	let uuid = [],
		i;
	radix = radix || chars.length;
	if (radix > chars.length) {
		radix = chars.length;
	}
	if (len) {
		// Compact form
		for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)];
	} else {
		// rfc4122, version 4 form
		let r;

		// rfc4122 requires these characters
		uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
		uuid[14] = '4';

		// Fill in random data.  At i==19 set the high bits of clock sequence as
		// per rfc4122, sec. 4.1.5
		for (i = 0; i < 36; i++) {
			if (!uuid[i]) {
				r = 0 | (Math.random() * 16);
				uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r];
			}
		}
	}

	return uuid.join('');
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
				if (![DATA_ID, 'id'].includes(item.name))
					value += `${item.name}="${item.value}"`;
			}
		} else {
			value = node.textContent ?? '';
		}
	}
	const cachePerfix = valueCaches.get(value);
	if (!cachePerfix) {
		const md5Value = md5(value);
		prefix =
			prefix +
			md5Value.substr(0, 4) +
			md5Value.substr(md5Value.length - 3);
		valueCaches.set(value, prefix);
	} else {
		prefix = cachePerfix;
	}
	const hash = prefix;
	if (unique) {
		const counter = _counters[hash] || 0;
		_counters[hash] = counter + 1;
		return `${hash}-${uuid(8, 48 + _counters[hash])}`;
	}

	return hash;
};
