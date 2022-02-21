import { isEqual } from 'lodash';
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
	ObjectInsertOp,
	ObjectDeleteOp,
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
	UI,
	UI_SELECTOR,
} from '../constants/root';
import { getParentInRoot, toHex, unescapeDots, unescape } from '../utils';

export const isTransientElement = (
	node: NodeInterface,
	transientElements?: Array<Node>,
	loadingCards?: NodeInterface[],
) => {
	if (node.isElement()) {
		const nodeAttributes = node.attributes();
		//范围标记
		if (
			[CURSOR, ANCHOR, FOCUS].indexOf(nodeAttributes[DATA_ELEMENT]) > -1
		) {
			return true;
		}

		//data-element=ui 属性
		if (
			!!nodeAttributes[DATA_TRANSIENT_ELEMENT] ||
			nodeAttributes[DATA_ELEMENT] === UI
		) {
			return true;
		}
		const parent = node.parent();
		if (node.isRoot() || parent?.isRoot()) return false;

		const isCard = node.isCard();
		//父级是卡片，并且没有可编辑区域
		const parentIsLoading = parent?.attributes(CARD_LOADING_KEY);
		if (parentIsLoading && parent) loadingCards?.push(parent);
		if (!isCard && parent?.isCard() && !parent.isEditableCard()) {
			return true;
		}

		if (transientElements) {
			if (isCard) return false;
			const element = transientElements.find(
				(element) => element === node[0],
			);
			if (element) {
				if (element['__card_root'])
					loadingCards?.push(element['__card_root']);
				return true;
			}
		}
		let closestNode = node.closest(
			`${CARD_SELECTOR},${UI_SELECTOR}`,
			getParentInRoot,
		);
		const attributes = closestNode?.attributes() || {};
		if (closestNode.length > 0 && attributes[DATA_ELEMENT] === UI) {
			return true;
		}
		//在卡片里面，并且卡片不是可编辑卡片 或者是标记为正在异步渲染时的卡片的子节点
		if (attributes[CARD_LOADING_KEY]) {
			loadingCards?.push(closestNode);
		}
		if (
			!isCard &&
			closestNode.length > 0 &&
			closestNode.isCard() &&
			!closestNode.isEditableCard()
		) {
			return true;
		}
		if (closestNode.length === 0) return false;

		if (!isCard || node.isEditableCard()) return false;
		//当前是卡片，父级也是卡片
		const parentCard = parent?.closest(CARD_SELECTOR, getParentInRoot);
		// 如果父级是可编辑卡片，并且在加载中，过滤掉其子节点
		const loadingCard = parentCard?.attributes(CARD_LOADING_KEY);
		if (loadingCard && parentCard) {
			loadingCards?.push(parentCard);
		}
		if (parentCard && parentCard.isCard() && !parentCard.isEditableCard()) {
			return true;
		}
	}
	return false;
};

export const isTransientAttribute = (node: NodeInterface, attr: string) => {
	if (node.isRoot() && !/^data-selection-/.test(attr)) return true;
	if (
		node.isCard() &&
		['id', 'class', 'style', CARD_LOADING_KEY, CARD_EDITABLE_KEY].includes(
			attr,
		)
	)
		return true;
	const transient = node.attributes(DATA_TRANSIENT_ATTRIBUTES);
	if (
		transient === '*' ||
		transient
			.split(',')
			.some((value) => value.trim().toLowerCase() === attr.toLowerCase())
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

export const isCursorOp = (op: Op) => {
	const insertOp = op as ObjectInsertOp;
	const deleteOp = op as ObjectDeleteOp;
	return (
		(insertOp.oi || deleteOp.od) &&
		op.p &&
		op.p.length === 2 &&
		op.p[0] === 1 &&
		op.p[1].toString().startsWith('data-selection-')
	);
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

export const updateIndex = (
	root: NodeInterface,
	filter?: (child: NodeInterface) => boolean,
) => {
	if (root.isText()) return;
	let childrens = root.children().toArray();
	if (!root.isEditable()) {
		childrens = filter ? childrens.filter(filter) : childrens;
	}
	childrens.forEach((child, index) => {
		child[0]['__index'] = index;
		if (!child.isText()) updateIndex(child);
	});
};

export const opsSort = (ops: Op[]) => {
	ops.sort((op1, op2) => {
		/**
		 *  diff > 0：op1在op2之后 [1,2,3] -> [1,2] | [2,3] -> [1,2]
		 *  diff < 0：op1在op2之前 [1,2] -> [1,2,3] | [1,2] -> [2,3]
		 *  diff = 0: op1和op2相同 [1,2] -> [1,2]
		 */
		let diff = op1.p.length < op2.p.length ? -1 : 0;
		/**
		 * op1.p.length > op2.p.length：op1在op2之后，并且op2的每一项都与op1的固定op2的长度数据每一项相同
		 */
		let les = false;
		if (isCursorOp(op1)) return 1;
		if (isCursorOp(op2)) return -1;
		for (let p = 0; p < op1.p.length; p++) {
			const v1 = op1.p[p];
			// od oi 最后一个参数是属性名称
			if (typeof v1 === 'string') break;
			// op2 中没有这个索引路径，op1 < op2
			if (p >= op2.p.length) {
				diff = 1;
				les = true;
				break;
			}
			const v2 = op2.p[p];
			if (v1 < v2) {
				diff = -1;
				break;
			} else if (v1 > v2) {
				diff = 1;
				break;
			}
		}
		// 文字删除，排再最前面
		if ('sd' in op1) {
			// 相同文字删除不处理，按原来顺序操作，textToOps 中已经计算好删除后的位置.2021-12-08
			if ('sd' in op2) {
				return 0;
			}
			return -1;
		}
		if ('sd' in op2) {
			// 相同文字删除不处理，按原来顺序操作，textToOps 中已经计算好删除后的位置.2021-12-08
			if ('sd' in op1) {
				return 0;
			}
			return 1;
		}

		// 删除div，但是修改span属性，span的op放在前面 <div><span>修改属性</span></div>
		if (les && 'ld' in op2 && 'od' in op1) {
			return -1;
		}

		if (les && 'ld' in op1 && 'od' in op2) {
			return -1;
		}

		if (diff === 0 && 'od' in op1 && 'ld' in op2) {
			return -1;
		}

		if (diff === 0 && 'od' in op2 && 'ld' in op1) {
			return 1;
		}

		if ('od' in op1 && 'ld' in op2) {
			return 1;
		}
		if ('od' in op2 && 'ld' in op1) {
			return -1;
		}
		if ('oi' in op1 && diff < 1 && 'li' in op2) {
			return -1;
		}
		if ('oi' in op1 && diff > -1 && 'li' in op2) {
			return 1;
		}
		if ('oi' in op2 && diff > -1 && 'li' in op1) {
			return 1;
		}
		if ('oi' in op2 && diff < 1 && 'li' in op1) {
			return -1;
		}
		if ('od' in op1 && ('li' in op2 || 'ld' in op2)) {
			return -1;
		}
		if ('od' in op2 && ('li' in op1 || 'ld' in op1)) {
			return 1;
		}
		if ('oi' in op1 && ('li' in op2 || 'ld' in op2)) {
			return 1;
		}
		if ('oi' in op2 && ('li' in op1 || 'ld' in op1)) {
			return -1;
		}
		// 如果删除节点比增加的节点索引小，排在加入节点前面
		if ('ld' in op1 && 'li' in op2) return -1;
		if ('li' in op1 && 'ld' in op2) return 1;
		if (diff < 1 && 'ld' in op1 && 'si' in op2) return 1;
		if (diff > 0 && 'ld' in op1 && 'si' in op2) return -1;
		if (diff < 1 && 'si' in op1 && 'ld' in op2) return 1;
		if (diff > 0 && 'si' in op1 && 'ld' in op2) return -1;
		const isLi =
			('li' in op1 && 'li' in op2) || ('oi' in op1 && 'oi' in op2);
		const isLd =
			('ld' in op1 && 'ld' in op2) || ('od' in op1 && 'od' in op2);
		// 都是新增节点，越小排越前面
		if (isLi) {
			return diff;
		}
		// 都是删除节点，越大排越前面
		else if (isLd) {
			return -diff;
		}
		return 0;
	});
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

const childToJSON0 = (node: NodeInterface, values: Array<{} | string>) => {
	const childNodes = node.children();
	if (0 !== childNodes.length) {
		for (let i = 0; i < childNodes.length; i++) {
			const child = childNodes.eq(i);
			if (!child) continue;
			const data = toJSON0(child);
			if (data) {
				values.push(data);
			}
		}
	}
};

export const toJSON0 = (
	node: NodeInterface,
): string | undefined | (string | {})[] => {
	let values: Array<{} | string>;
	if (!isTransientElement(node)) {
		const { attributes, nodeValue } = node.get<Element>()!;
		if (node.type === Node.ELEMENT_NODE) {
			values = [node.name];
			const data = {};
			for (let i = 0; attributes && i < attributes.length; i++) {
				const { name, specified, value } = attributes[i];
				if (specified && !isTransientAttribute(node, name)) {
					if (name === 'style') {
						data['style'] = toHex(
							node.get<HTMLElement>()?.style.cssText || value,
						);
					} else if ('string' === typeof value) {
						data[name] = value;
					}
				}
			}
			values.push(data);
			childToJSON0(node, values);
			return values;
		}
		return node.type === Node.TEXT_NODE ? String(nodeValue) : undefined;
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
