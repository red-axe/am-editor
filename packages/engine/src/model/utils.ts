import {
	DATA_ELEMENT,
	CURSOR,
	ANCHOR,
	FOCUS,
	DATA_TRANSIENT_ELEMENT,
	UI,
	ROOT,
	CARD_LOADING_KEY,
	CARD_SELECTOR,
	UI_SELECTOR,
	CARD_EDITABLE_KEY,
	DATA_TRANSIENT_ATTRIBUTES,
} from '../constants';
import { isNode, isCard, isEditableCard, closest, isRoot } from '../node/utils';
import { NodeInterface } from '../types/node';
import { getParentInRoot } from '../utils';
import $ from '../node/query';

type InspectableObject = Record<string | number | symbol, unknown>;

function isObject(o: unknown): o is InspectableObject {
	return Object.prototype.toString.call(o) === '[object Object]';
}

export function isPlainObject(o: unknown): o is InspectableObject {
	if (!isObject(o)) {
		return false;
	}

	// If has modified constructor
	const ctor = o.constructor;
	if (ctor === undefined) {
		return true;
	}

	// If has modified prototype
	const prot = ctor.prototype;
	if (isObject(prot) === false) {
		return false;
	}

	// If constructor does not have an Object-specific method
	if (prot.hasOwnProperty('isPrototypeOf') === false) {
		return false;
	}

	// Most likely a plain Object
	return true;
}

const transientWeakMap = new WeakMap<Node, boolean>();

export const isTransientElementCache = (
	node: NodeInterface | Node,
	transientElements?: Array<Node>,
	loadingCards?: NodeInterface[],
): boolean => {
	const element = (isNode(node) ? node : node[0]) as Element;
	let isTransient = transientWeakMap.get(element);
	if (isTransient !== undefined) {
		return isTransient;
	}
	isTransient = isTransientElement(element, transientElements, loadingCards);
	transientWeakMap.set(element, isTransient);
	return isTransient;
};

export const isTransientElement = (
	node: NodeInterface | Node,
	transientElements?: Array<Node>,
	loadingCards?: NodeInterface[],
): boolean => {
	const element = (isNode(node) ? node : node[0]) as Element;
	if (element.nodeType === Node.ELEMENT_NODE) {
		const dataElement = element.getAttribute(DATA_ELEMENT) || '';
		//范围标记
		if ([CURSOR, ANCHOR, FOCUS].indexOf(dataElement) > -1) {
			return true;
		}

		//data-element=ui 属性
		if (
			!!element.getAttribute(DATA_TRANSIENT_ELEMENT) ||
			dataElement === UI
		) {
			return true;
		}
		const parent = element.parentElement;
		const parentDataElement = parent?.getAttribute(DATA_ELEMENT) || '';
		if (dataElement === ROOT || parentDataElement === ROOT) return false;

		const curIsCard = isCard(element);
		//父级是卡片，并且没有可编辑区域
		const parentIsLoading = parent?.getAttribute(CARD_LOADING_KEY);
		if (parentIsLoading && parent) loadingCards?.push($(parent));
		if (!curIsCard && parent && isCard(parent) && !isEditableCard(parent)) {
			return true;
		}

		if (transientElements) {
			if (curIsCard) return false;
			const element = transientElements.find(
				(element) => element === node[0],
			);
			if (element) {
				if (element['__card_root'])
					loadingCards?.push(element['__card_root']);
				return true;
			}
		}
		let closestNode = closest(
			element,
			`${CARD_SELECTOR},${UI_SELECTOR}`,
			getParentInRoot,
		);
		if (!closestNode || !(closestNode instanceof Element)) return false;
		if (closestNode.getAttribute(DATA_ELEMENT) === UI) {
			return true;
		}
		//在卡片里面，并且卡片不是可编辑卡片 或者是标记为正在异步渲染时的卡片的子节点
		if (closestNode.getAttribute(CARD_LOADING_KEY)) {
			loadingCards?.push($(closestNode));
		}
		if (!curIsCard && isCard(closestNode) && !isEditableCard(closestNode)) {
			return true;
		}

		if (!curIsCard || isEditableCard(element) || !parent) return false;
		//当前是卡片，父级也是卡片
		const parentCard = closest(
			parent,
			CARD_SELECTOR,
			getParentInRoot,
		) as Element;
		if (!parentCard || !(parentCard instanceof Element)) return false;
		// 如果父级是可编辑卡片，并且在加载中，过滤掉其子节点
		const loadingCard = parentCard.getAttribute(CARD_LOADING_KEY);
		if (loadingCard && parentCard) {
			loadingCards?.push($(parentCard));
		}
		if (parentCard && isCard(parentCard) && !isEditableCard(parentCard)) {
			return true;
		}
	} else if (element.nodeType === Node.TEXT_NODE) {
		const parent = element.parentElement;
		return !!parent && isTransientElementCache(parent);
	}
	return false;
};

export const isTransientAttribute = (
	node: NodeInterface | Node,
	attr: string,
) => {
	const element = (isNode(node) ? node : node[0]) as Element;
	if (isRoot(element)) return true;
	if (
		isCard(element) &&
		['id', 'class', 'style', CARD_LOADING_KEY].includes(attr)
	)
		return true;
	const transient = element.getAttribute(DATA_TRANSIENT_ATTRIBUTES);
	if (
		transient === '*' ||
		(transient &&
			transient
				.split(',')
				.some(
					(value) =>
						value.trim().toLowerCase() === attr.toLowerCase(),
				))
	)
		return true;
	return false;
};
