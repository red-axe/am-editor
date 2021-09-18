import { isEqual } from 'lodash-es';
import OTJSON from 'ot-json0';
import { NodeInterface } from '../types/node';
import { FOCUS, ANCHOR, CURSOR } from '../constants/selection';
import {
	CARD_ASYNC_RENDER,
	CARD_ELEMENT_KEY,
	CARD_SELECTOR,
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
import { Operation } from '../types/ot';
import {
	DATA_ELEMENT,
	DATA_TRANSIENT_ATTRIBUTES,
	DATA_TRANSIENT_ELEMENT,
	UI,
	UI_SELECTOR,
} from '../constants/root';
import { getParentInRoot } from '../utils';

/**
 * 随机一个数字
 * @param start 开始
 * @param max 最大
 */
export const random = (start: number, max: number) => {
	return Math.floor(start + Math.random() * (max - start));
};

/**
 * 随机一个字符串不包含，0、o、O、l字符
 * @param length 长度，默认8
 */
export const randomString = (length: number = 8) => {
	const str = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
	let word = '';
	while (length--) word += str[random(0, str.length)];
	return word;
};

export const isTransientElement = (
	node: NodeInterface,
	transientElements?: Array<Node>,
) => {
	if (node.isElement()) {
		//范围标记
		if (
			[CURSOR, ANCHOR, FOCUS].indexOf(node.attributes(DATA_ELEMENT)) > -1
		) {
			return true;
		}

		//data-element=ui 属性
		if (
			!!node.attributes(DATA_TRANSIENT_ELEMENT) ||
			node.attributes(DATA_ELEMENT) === UI
		) {
			return true;
		}
		const parent = node.parent();
		if (node.isRoot() || parent?.isRoot()) return false;

		const isCard = node.isCard();
		//父级是卡片，并且没有可编辑区域
		if (!isCard && parent?.isCard() && !parent.isEditableCard()) {
			return true;
		}

		if (transientElements) {
			if (
				!isCard &&
				transientElements.find((element) => element === node[0])
			)
				return true;
		} else {
			let closestNode = node.closest(
				`${CARD_SELECTOR},${UI_SELECTOR}`,
				getParentInRoot,
			);
			if (
				closestNode.length > 0 &&
				closestNode.attributes(DATA_ELEMENT) === UI
			) {
				return true;
			}
			//在卡片里面，并且卡片不是可编辑卡片 或者是标记为正在异步渲染时的卡片
			if (
				!isCard &&
				closestNode.length > 0 &&
				closestNode.isCard() &&
				(!closestNode.isEditableCard() ||
					!!closestNode.attributes(CARD_ASYNC_RENDER))
			) {
				return true;
			}
			if (closestNode.length === 0) return false;
		}
		if (!isCard || node.isEditableCard()) return false;
		//当前是卡片，父级也是卡片
		const parentCard = parent?.closest(CARD_SELECTOR, getParentInRoot);
		if (parentCard && parentCard.isCard() && !parentCard.isEditableCard()) {
			return true;
		}
	}
	return false;
};

export const isTransientAttribute = (node: NodeInterface, attr: string) => {
	if ([CARD_ASYNC_RENDER].indexOf(attr) > -1) return true;
	if (node.isRoot() && !/^data-selection-/.test(attr)) return true;
	if (
		node.isCard() &&
		(['id', 'class', 'style'].includes(attr) ||
			!!node.attributes(CARD_ASYNC_RENDER))
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

export const reduceOperations = (ops: Op[]) => {
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

	return !!(
		op &&
		next &&
		((insertOp.li &&
			deleteNext.ld &&
			isEqual(insertOp.li, deleteNext.ld) &&
			(isEqual(op.p, next.p) ||
				isPathEqual(op.p, next.p) ||
				isPathEqual(next.p, op.p))) ||
			(deleteOp.ld &&
				insertNext.li &&
				isEqual(deleteOp.ld, insertNext.li) &&
				isEqual(op.p, next.p)) ||
			(insertStringOp.si &&
				deleteStringNext.sd &&
				isEqual(insertStringOp.si, deleteStringNext.sd) &&
				(isEqual(op.p, next.p) ||
					isPathEqual(op.p, next.p, insertStringOp.si.length) ||
					isPathEqual(next.p, op.p, insertStringOp.si.length))) ||
			(deleteStringOp.sd &&
				insertStringNext.si &&
				isEqual(deleteStringOp.sd, insertStringNext.si) &&
				isEqual(op.p, next.p)))
	);
};

const isPathEqual = (op: Path, next: Path, length: number = 1): boolean => {
	if (op.length !== next.length) return false;
	const nextClone = next.slice();
	nextClone[nextClone.length - 1] =
		(nextClone[nextClone.length - 1] as number) - length;

	return isEqual(op.slice(), nextClone);
};

export const transformOp = (op: Op[], otherOp: Operation[]) => {
	const ops: Op[][] = [];

	otherOp.forEach((op) => {
		if (op.ops) ops.push(op.ops);
	});
	ops.forEach((o) => {
		op = OTJSON.type.transform(op, o, 'left');
	});
	return op;
};

export const transformPath = (
	path: Path[] = [],
	operation?: Operation[],
): Path[] => {
	const [startPath, endPath] = path;
	if (!startPath || !endPath) return path;
	let start: Path = startPath.map((p) => parseInt(p.toString()) + 2);
	let end: Path = endPath.map((p) => parseInt(p.toString()) + 2);
	let ops: Op[] = [];
	operation?.forEach((op) => {
		if (op.ops) ops = ops.concat(op.ops);
	});
	ops.forEach((op) => {
		start = handlePath(start, op);
		end = handlePath(end, op);
	});
	return [
		start.map((p) => parseInt(p.toString()) - 2),
		end.map((p) => parseInt(p.toString()) - 2),
	];
};

const handlePath = (path: Path, op: Op): Path => {
	const writePath = path.slice();
	if (affectPath(op.p, path)) {
		if ('li' in op) {
			writePath[op.p.length - 1] =
				parseInt(writePath[op.p.length - 1].toString()) + 1;
		} else if ('ld' in op)
			writePath[op.p.length - 1] =
				parseInt(writePath[op.p.length - 1].toString()) - 1;
		else if ('si' in op)
			writePath[op.p.length - 1] =
				parseInt(writePath[op.p.length - 1].toString()) +
				(op as StringInsertOp).si.length;
		else if ('sd' in op) {
			const length = op.p.length;
			writePath[length - 1] =
				parseInt(writePath[length - 1].toString()) -
				(op as StringDeleteOp).sd.length;
			writePath[length - 1] = Math.max(
				parseInt(op.p[length - 1].toString()),
				parseInt(writePath[length - 1].toString()),
			);
		}
	}
	return writePath;
};

export const affectPath = (path: Path, otherPath: Path) => {
	let index = 0;
	while (path[index]) {
		if (!otherPath[index]) return false;
		if (path[index] === otherPath[index]) index++;
		else {
			if (path[index] > otherPath[index]) return false;
			if (path[index] < otherPath[index])
				return path[index + 1] === undefined;
		}
	}
	return true;
};

export const getOldIndex = (index: number, ops: Op[]) => {
	let i = index;
	ops.forEach((op) => {
		if (parseInt(op.p[op.p.length - 1].toString()) - 2 <= index) {
			if ('li' in op) i -= 1;
			else if ('ld' in op) i += 1;
		}
	});
	return i;
};
