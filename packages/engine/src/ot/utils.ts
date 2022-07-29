import isEqual from 'lodash/isEqual';
import { NodeInterface } from '../types/node';
import { FOCUS, ANCHOR, CURSOR } from '../constants/selection';
import {
	CARD_EDITABLE_KEY,
	CARD_KEY,
	CARD_LOADING_KEY,
	CARD_SELECTOR,
	READY_CARD_KEY,
} from '../constants/card';
import {
	Op,
	Path,
	ListInsertOp,
	ListDeleteOp,
	StringInsertOp,
	StringDeleteOp,
} from 'sharedb';
import {
	DATA_ELEMENT,
	DATA_ID,
	DATA_TRANSIENT_ATTRIBUTES,
	DATA_TRANSIENT_ELEMENT,
	ROOT,
	UI,
	UI_SELECTOR,
} from '../constants/root';
import { getParentInRoot, toHex, unescapeDots, unescape } from '../utils';
import { closest, isCard, isEditableCard, isNode } from '../node/utils';
import $ from '../node/query';
import { isRoot } from './../node/utils';

export const isTransientElement = (
	node: NodeInterface | Node,
	transientElements?: Array<Node>,
	loadingCards?: NodeInterface[],
) => {
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
		['id', 'class', 'style', CARD_LOADING_KEY, CARD_EDITABLE_KEY].includes(
			attr,
		)
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

export const filterOperations = (ops: Op[]) => {
	const data: Op[] = [];
	for (let i = 0; i < ops.length; i++) {
		const op = ops[i];
		const next = ops[i + 1];
		isReverseOp(op, next) ? i++ : data.push(op);
	}
	return data;
};

export const isReverseOp = (op: Op, next: Op) => {
	const insertOp = op as ListInsertOp;
	const deleteOp = op as ListDeleteOp;
	const insertNext = next as ListInsertOp;
	const deleteNext = next as ListDeleteOp;
	const insertStringOp = op as StringInsertOp;
	const deleteStringOp = op as StringDeleteOp;
	const insertStringNext = next as StringInsertOp;
	const deleteStringNext = next as StringDeleteOp;

	if (!op || !next) return false;

	// 节点增加和删除
	if (insertOp.li && deleteNext.ld) {
		return isEqual(insertOp.li, deleteNext.ld) && isEqual(op.p, next.p);
	}

	if (deleteOp.ld && insertNext.li) {
		return isEqual(deleteOp.ld, insertNext.li) && isEqual(op.p, next.p);
	}

	// 文本增加和删除
	if (insertStringOp.si && deleteStringNext.sd) {
		return (
			isEqual(insertStringOp.si, deleteStringNext.sd) &&
			(isEqual(op.p, next.p) ||
				isReversePath(op.p, next.p, insertStringOp.si.length) ||
				isReversePath(next.p, op.p, insertStringOp.si.length))
		);
	}

	if (deleteStringOp.sd && insertStringNext.si) {
		return (
			isEqual(deleteStringOp.sd, insertStringNext.si) &&
			isEqual(op.p, next.p)
		);
	}

	return false;
};

const isReversePath = (op: Path, next: Path, length: number = 1): boolean => {
	if (op.length !== next.length) return false;
	const nextClone = next.slice();
	nextClone[nextClone.length - 1] =
		(nextClone[nextClone.length - 1] as number) - length;

	return isEqual(op.slice(), nextClone);
};

export const toDOM = (ops: Op[] | Op[][]): Node => {
	const fragment = document.createDocumentFragment();
	let elementName: string | null = null;
	let i = 0;
	let element: HTMLElement | null = null;
	if (typeof ops[0] === 'string') {
		elementName = ops[0];
		i = 1;
	}
	for (; i < ops.length; i++) {
		if (Array.isArray(ops[i])) {
			const prevOp = ops[i - 1];
			if (
				prevOp &&
				prevOp.toString() === '[object Object]' &&
				Object.keys(prevOp).includes(READY_CARD_KEY)
			) {
				continue;
			}
			const child = toDOM(ops[i] as Op[]);
			if (child) fragment.appendChild(child);
		} else if ('[object Object]' === ops[i].toString()) {
			if (elementName) {
				element = document.createElement(
					elementName,
				) as HTMLElement | null;
				for (let attr in ops[i]) {
					element?.setAttribute(
						unescapeDots(attr),
						unescape(ops[i][attr]),
					);
				}
				// 不是待渲染Card，转换为待渲染Card
				const attributeKeys = Object.keys(ops[i]);
				if (
					attributeKeys.indexOf(CARD_KEY) > -1 &&
					attributeKeys.indexOf(READY_CARD_KEY) < 0
				) {
					element?.setAttribute(READY_CARD_KEY, ops[i][CARD_KEY]);
					element?.removeAttribute(CARD_KEY);
				}
			}
		} else if ('number' === typeof ops[i] || 'string' === typeof ops[i]) {
			const textNode = document.createTextNode(ops[i].toString());
			fragment.appendChild(textNode);
		}
	}
	if (!element && elementName) {
		element = document.createElement(elementName);
	}
	if (element) {
		element.appendChild(fragment);
		return element;
	} else {
		return fragment.childNodes[0];
	}
};

const childToJSON0 = (
	node: NodeInterface | Node,
	values: Array<{} | string>,
) => {
	if (!(node instanceof Node)) {
		node = node[0];
	}
	const childNodes = node.childNodes;
	if (0 !== childNodes.length) {
		for (let i = 0; i < childNodes.length; i++) {
			const child = childNodes.item(i);
			if (!child) continue;
			const data = toJSON0(child);
			if (data) {
				values.push(data);
			}
		}
	}
};

export const toJSON0 = (
	node: NodeInterface | Node,
): string | undefined | (string | {})[] => {
	let values: Array<{} | string>;
	if (!(node instanceof Node)) {
		node = node[0];
	}
	if (!isTransientElement(node)) {
		const { nodeValue } = node;
		if (node instanceof Element) {
			const attributes = node.attributes;
			values = [node.nodeName.toLowerCase()];
			const data = {};
			for (let i = 0; attributes && i < attributes.length; i++) {
				const { name, specified, value } = attributes[i];
				if (specified && !isTransientAttribute(node, name)) {
					if (name === 'style' && node instanceof HTMLElement) {
						data['style'] = toHex(node.style.cssText || value);
					} else if ('string' === typeof value) {
						data[name] = value;
					}
				}
			}
			values.push(data);
			childToJSON0(node, values);
			return values;
		} else if (node instanceof Text) return String(nodeValue);
	}
	return;
};

/**
 * 根据路径获取json中的值
 * @param data json 数据
 * @param path 路径
 * @param id 相对节点的id
 * @returns
 */
export const getValue = (data: any, path: Path, id?: string) => {
	if (path.length === 0) return data;
	let value = data;
	let hasValue = !id;
	for (let i = 0; i < path.length && value !== undefined; i++) {
		value = value[path[i]];
		if (
			!hasValue &&
			id &&
			Array.isArray(value) &&
			value.length > 0 &&
			value[1][DATA_ID] === id
		) {
			hasValue = true;
		}
	}
	return hasValue ? value : undefined;
};

export interface DocData {
	path: number[];
	children: any[];
	name: string;
	attributes: Record<string, string>;
}

export const findFromDoc = (
	data: any,
	callback: (attributes: Record<string, string>) => boolean,
): DocData | null => {
	if (!Array.isArray(data) || data.length < 1) {
		return null;
	}
	for (let i = 1; i < data.length; i++) {
		if (i === 1) {
			const attributes = data[i];
			if (
				typeof attributes === 'object' &&
				callback &&
				callback(attributes)
			) {
				return {
					path: [],
					name: data[0],
					attributes,
					children: data.slice(i + 1),
				};
			}
		} else if (Array.isArray(data[i])) {
			const result = findFromDoc(data[i], callback);
			if (result) {
				result.path.unshift(i);
				return result;
			}
		}
	}
	return null;
};

/**
 * 从 doc 中查找目标卡片
 * @param data
 * @param name
 * @param callback
 * @returns 返回卡片属性，以及是否已渲染
 */
export const findCardForDoc = (
	data: any,
	callback?: (attributes: { [key: string]: string }) => boolean,
): { attributes: any; rendered: boolean } | void => {
	const result = findFromDoc(data, (attributes) => {
		if (attributes['data-card-key']) {
			if (callback) {
				return callback(attributes);
			}
			return true;
		}
		return false;
	});
	if (result) {
		const { attributes, children } = result;
		return {
			attributes,
			rendered:
				Array.isArray(children) &&
				Array.isArray(children[2]) &&
				Array.isArray(children[2][2]),
		};
	}
};
