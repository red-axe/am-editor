import { ANCHOR, FOCUS, CURSOR } from '../constants/selection';
import { NodeInterface, isNodeEntry } from '../types/node';
import { DATA_ELEMENT } from '../constants/root';

export const getDocument = (node?: Node): Document => {
	if (
		typeof document === 'undefined' &&
		typeof global['__amWindow'] === 'undefined'
	)
		throw 'document is not defined,If you are using ssr, you can assign a value to the `__amWindow` global variable.';

	return node
		? node.ownerDocument || node['document'] || node
		: typeof document === 'undefined'
		? global['__amWindow'].document
		: document;
};

export const getWindow = (node?: Node): Window & typeof globalThis => {
	if (
		typeof window === 'undefined' &&
		typeof global['__amWindow'] === 'undefined'
	)
		throw 'window is not defined,If you are using ssr, you can assign a value to the `__amWindow` global variable.';
	const win = typeof window === 'undefined' ? global['__amWindow'] : window;
	if (!node) return win;
	const document = getDocument(node);
	return document['parentWindow'] || document.defaultView || win;
};

/**
 * 移除空的文本节点，并连接相邻的文本节点
 * @param node 节点
 */
export const combinTextNode = (node: NodeInterface | Node) => {
	if (isNodeEntry(node)) node = node[0];
	node.normalize();
};

/**
 * 转换为Map格式
 * @param value 数组或者字符串
 * @param delimiter 字符串时候的分隔符
 * @param callback 回调函数
 */
export const toMap = <V = boolean>(
	value: Array<string> | string,
	delimiter: string = ',',
	callback: (key: string) => boolean = function() {
		return true;
	},
): { [k: string]: V | boolean } => {
	const map: { [k: string]: V | boolean } = {};

	const arr: Array<string> = Array.isArray(value)
		? value
		: value.split(delimiter);
	let match;
	arr.forEach(char => {
		if ((match = /^(\d+)\.\.(\d+)$/.exec(char))) {
			for (
				let i = parseInt(match[1], 10);
				i <= parseInt(match[2], 10);
				i++
			) {
				map[i.toString()] = callback(i.toString());
			}
		} else {
			map[char] = true;
		}
	});
	return map;
};
