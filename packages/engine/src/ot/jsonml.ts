import { Op, Path } from 'sharedb';
import { CARD_KEY, READY_CARD_KEY } from '../constants';
import { NodeInterface } from '../types/node';
import { RepairOp } from '../types/ot';
import { unescapeDots, unescape, toHex, getWindow } from '../utils';
import { isTransientElement, isTransientAttribute } from './utils';

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
			fragment.appendChild(toDOM(ops[i] as Op[]));
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
				//不是待渲染Card，转换为待渲染Card
				if (
					Object.keys(ops[i]).indexOf(CARD_KEY) > -1 &&
					Object.keys(ops[i]).indexOf(READY_CARD_KEY) < 0
				) {
					element?.setAttribute(READY_CARD_KEY, ops[i][CARD_KEY]);
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

function fromChildDom(node: NodeInterface, values: Array<{} | string>) {
	const childNodes = node.children();
	if (0 !== childNodes.length) {
		for (let i = 0; i < childNodes.length; i++) {
			const child = childNodes.eq(i);
			if (!child) continue;
			const data = fromDOM(child);
			if (data) {
				values.push(data);
			}
		}
	}
}

export const fromDOM = (
	node: NodeInterface,
): string | undefined | (string | {})[] => {
	let values: Array<{} | string>;
	if (!isTransientElement(node)) {
		const { nodeName, nodeType, attributes, nodeValue } =
			node.get<Element>()!;
		if (nodeType === getWindow().Node.ELEMENT_NODE) {
			values = [nodeName.toLowerCase()];
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
			fromChildDom(node, values);
			return values;
		}
		return nodeType === getWindow().Node.TEXT_NODE
			? String(nodeValue)
			: undefined;
	}
	return;
};

export const getPathValue = (data: any, path: Path) => {
	if (path.length === 0) return data;
	let value = data;
	for (let i = 0; i < path.length && value !== undefined; i++) {
		value = value[path[i]];
	}
	return value;
};

export const opsSort = (ops: Op[]) => {
	ops.sort((op1, op2) => {
		let diff = 0;
		for (let p = 0; p < op1.p.length; p++) {
			const v1 = op1.p[p];
			// od oi 最后一个参数是属性名称
			if (typeof v1 === 'string') break;
			// op2 中没有这个索引路径，op1 < op2
			if (p >= op2.p.length) {
				diff = -1;
				break;
			}
			const v2 = op2.p[p];
			if (v1 < v2) {
				diff = -1;
			} else if (v1 > v2) {
				diff = 1;
			}
		}
		// 文字删除，排再最前面
		if ('sd' in op1) {
			// 相同的文字删除，位置大的排再前面
			if ('sd' in op2) {
				if (diff === -1) return 1;
				if (diff === 0) return 0;
			}
			return -1;
		}
		// 属性删除，排在节点删除最前面
		if ('od' in op1 && diff < 1 && 'ld' in op2) {
			return -1;
		}
		// 如果删除节点比增加的节点索引小，排在加入节点前面
		if (diff < 1 && 'ld' in op1 && 'li' in op2) return -1;

		const isLi = 'li' in op1 && 'li' in op2;
		const isLd = 'ld' in op1 && 'ld' in op2;
		// 都是新增节点，越小排越前面
		if (isLi) {
			return diff;
		}
		// 都是删除节点，越大排越前面
		else if (isLd) {
			if (diff === -1) return 1;
			if (diff === 1) return -1;
		}
		return 0;
	});
};
