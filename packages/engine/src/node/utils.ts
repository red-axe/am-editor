import { getDocument } from '../utils/node';
import { ElementInterface, NodeInterface, Selector } from '../types';
import {
	DATA_ELEMENT,
	EDITABLE,
	EDITABLE_SELECTOR,
	ROOT,
	ROOT_SELECTOR,
} from '../constants/root';
import { CARD_EDITABLE_KEY, CARD_TAG, CARD_TYPE_KEY } from '../constants/card';
import { ANCHOR, CURSOR, FOCUS } from '../constants/selection';

export const isNodeEntry = (selector: Selector): selector is NodeInterface => {
	return !!selector && (selector as NodeInterface).get !== undefined;
};

export const isNodeList = (selector: Selector): selector is NodeList => {
	return !!selector && (selector as NodeList).entries !== undefined;
};

export const isNode = (selector: Selector): selector is Node => {
	return !!selector && (selector as Node).nodeType !== undefined;
};

/**
 * 如果元素被指定的选择器字符串选择，Element.matches()  方法返回true; 否则返回false。
 * @param element 节点
 * @param selector 选择器
 */
export const isMatchesSelector = (
	element: ElementInterface,
	selector: string,
) => {
	if (element.nodeType !== Node.ELEMENT_NODE || !selector) {
		return false;
	}
	const defaultMatches = (element: Element, selector: string) => {
		let matches = getDocument(element)?.querySelectorAll(selector),
			i = matches ? matches.length : 0;
		while (--i >= 0 && matches?.item(i) !== element) {}
		return i > -1;
	};
	const matchesSelector =
		element.matches ||
		element.webkitMatchesSelector ||
		element.mozMatchesSelector ||
		element.msMatchesSelector ||
		element.oMatchesSelector ||
		element.matchesSelector ||
		defaultMatches;

	return matchesSelector.call(element, selector);
};

export const isCard = (element: Element) => {
	return (
		element.nodeName === CARD_TAG || !!element.getAttribute(CARD_TYPE_KEY)
	);
};
/**
 * 判断当前节点是否为block类型的Card组件
 */
export const isBlockCard = (element: Element) => {
	return 'block' === element.getAttribute(CARD_TYPE_KEY);
};
/**
 * 判断当前节点是否为inline类型的Card组件
 * @returns
 */
export const isInlineCard = (element: Element) => {
	return 'inline' === element.getAttribute(CARD_TYPE_KEY);
};
/**
 * 是否是可编辑器卡片
 * @returns
 */
export const isEditableCard = (element: Element) => {
	return (
		element.getAttribute(DATA_ELEMENT) === EDITABLE ||
		element.getAttribute(CARD_EDITABLE_KEY) === 'true' ||
		!!element?.querySelector(EDITABLE_SELECTOR)
	);
};

/**
 * 判断当前节点是否为根节点
 */
export const isRoot = (element: Element, root?: Node) => {
	return (
		element.getAttribute(DATA_ELEMENT) === ROOT &&
		(!root || element === root)
	);
};

export const isEditable = (element: Element) => {
	return isRoot(element) || element.getAttribute(DATA_ELEMENT) === EDITABLE;
};

/**
 * 判断当前是否在根节点内
 */
export const inEditor = (element: Node, root?: Node) => {
	if (
		element.nodeType === Node.ELEMENT_NODE &&
		isRoot(element as Element, root)
	) {
		return false;
	}
	const closetRoot = closest(element, ROOT_SELECTOR);
	return !!closetRoot && (!root || closetRoot === root);
};

/**
 * 是否是光标标记节点
 * @returns
 */
export const isCursor = (element: Element) => {
	const dataElement = element.getAttribute(DATA_ELEMENT);
	return !!dataElement && [ANCHOR, FOCUS, CURSOR].indexOf(dataElement) > -1;
};

/**
 * 根据查询器查询符合条件的离当前元素节点最近的父节点
 * @param element 当前节点
 * @param selector 查询器
 * @return 返回一个 NodeEntry 实例
 */
export const closest = (
	element: Node,
	selector: string,
	callback: (node: Node) => Node | undefined = (node) => {
		return node.parentElement || undefined;
	},
): Node | undefined => {
	let node: Node | undefined = element || undefined;
	while (node) {
		if (isMatchesSelector(node as ElementInterface, selector)) {
			return node;
		}
		node = callback(node);
	}
	return node;
};
