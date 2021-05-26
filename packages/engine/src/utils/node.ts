import { NodeInterface, isNodeEntry } from '../types/node';

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
 * 获取一个 dom 元素内所有的 textnode 类型的元素
 * @param  {Node} node - dom节点
 * @param  {Function} filter - 过滤器
 * @return {Array} 获取的文本节点
 */
export const getTextNodes = (
	node: Node,
	filter?: (node: Node) => boolean,
): Array<Node> => {
	let textNodes: Array<Node> = [];
	if (filter && !filter(node)) {
		return textNodes;
	}

	const nodes = node.childNodes;

	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		const nodeType = node.nodeType;
		if (nodeType === 3) {
			textNodes.push(node);
		} else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
			textNodes = textNodes.concat(getTextNodes(node, filter));
		}
	}
	return textNodes;
};
