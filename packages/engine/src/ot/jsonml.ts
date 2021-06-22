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

export const fromDOM = (node: NodeInterface) => {
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

export const pushAndRepair = (ops: RepairOp[], op: RepairOp) => {
	const oldPath = op.oldPath?.slice() || [];
	ops.forEach((opItem) => {
		const opOffset = op.newPath[op.newPath.length - 1];
		const itemOffset = opItem.newPath[opItem.newPath.length - 1];

		const itemOldPath = opItem.oldPath?.slice() || [];
		const itemP = opItem.p.slice();
		if ('ld' in op) {
			if ('ld' in opItem) {
				if (itemOffset <= opOffset) {
					oldPath[oldPath.length - 1] =
						parseInt(oldPath[oldPath.length - 1].toString()) + 1;
				} else {
					itemOldPath[itemOldPath.length - 1] =
						parseInt(
							itemOldPath[itemOldPath.length - 1].toString(),
						) + 1;
					itemP[itemP.length - 1] =
						parseInt(itemP[itemP.length - 1].toString()) + 1;
				}
			}
			if ('li' in opItem) {
				if (itemOffset >= opOffset) {
					itemP[itemP.length - 1] =
						parseInt(itemP[itemP.length - 1].toString()) + 1;
				} else {
					oldPath[oldPath.length - 1] =
						parseInt(oldPath[oldPath.length - 1].toString()) - 1;
				}
			}
		}
		if ('li' in op) {
			if ('ld' in opItem) {
				if (itemOffset > opOffset) {
					itemOldPath[itemOldPath.length - 1] =
						parseInt(
							itemOldPath[itemOldPath.length - 1].toString(),
						) - 1;
					itemP[itemP.length - 1] =
						parseInt(itemP[itemP.length - 1].toString()) - 1;
				}
			}
			if ('li' in opItem) {
				if (itemOffset > opOffset) {
					itemP[itemP.length - 1] =
						parseInt(itemP[itemP.length - 1].toString()) - 1;
				}
			}
		}
		opItem.oldPath = itemOldPath;
		opItem.p = itemP;
	});
	op.oldPath = oldPath;
	ops.push(op);
};
