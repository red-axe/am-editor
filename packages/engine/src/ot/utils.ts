import { isEqual } from 'lodash-es';
import OTJSON from 'ot-json0';
import { NodeInterface } from '../types/node';
import { RangeInterface } from '../types/range';
import { FOCUS, ANCHOR, CURSOR } from '../constants/selection';
import { CARD_SELECTOR } from '../constants/card';
import Range from '../range';
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
import { DATA_ELEMENT } from '../constants/root';
import { getWindow } from '../utils';
import { EngineInterface } from '../types';

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

export const isTransientElement = (node: NodeInterface) => {
	if (node.isElement()) {
		//范围标记
		if ([CURSOR, ANCHOR, FOCUS].includes(node.attributes(DATA_ELEMENT)))
			return true;
		//data-transient属性
		if (node.attributes('data-transient')) return true;
		//在卡片里面
		if (!node.isCard() && node.closest(CARD_SELECTOR).length > 0)
			return true;
		//当前是卡片，父级也是卡片
		const parent = node.parent();
		if (node.isCard() && parent && parent.closest(CARD_SELECTOR).length > 0)
			return true;
	}
	return false;
};

export const isTransientAttribute = (node: NodeInterface, attr: string) => {
	if (node.isRoot() && !/^data-selection-/.test(attr)) return true;
	if (node.isCard() && ['id', 'class', 'style'].includes(attr)) return true;
	return false;
};

export const toPath = (range: RangeInterface): Path[] => {
	const node = range.commonAncestorNode;
	if (!node.isRoot() && !node.inEditor()) return [];
	range.shrinkToTextNode();

	const getPath = (node: NodeInterface, offset: number): Path => {
		let domNode: NodeInterface | undefined = node;
		const path = [];
		while (domNode && domNode.length > 0 && !domNode.isRoot()) {
			let prev = domNode.prev();
			let i = 0;
			while (prev && prev.length > 0) {
				if (!prev.attributes('data-transient')) i++;
				prev = prev.prev();
			}
			path.unshift(i);
			domNode = domNode.parent();
		}
		path.push(offset);
		return path;
	};
	return [
		getPath(range.startNode, range.startOffset),
		getPath(range.endNode, range.endOffset),
	];
};

export const fromPath = (
	engine: EngineInterface,
	node: NodeInterface,
	path: Path[],
) => {
	const startPath = path[0].slice();
	const endPath = path[1].slice();
	const startOffset = startPath.pop();
	const endOffset = endPath.pop();

	const getNode = (path: Path) => {
		let domNode = node;
		for (let i = 0; i < path.length; i++) {
			let p = path[i];
			if (p < 0) {
				p = 0;
			}
			let needNode = undefined;
			let domChild = domNode.first();
			let offset = 0;
			while (domChild && domChild.length > 0) {
				if (domChild.attributes('data-transient')) {
					domChild = domChild.next();
				} else {
					if (offset === p || !domChild.next()) {
						needNode = domChild;
						break;
					}
					offset++;
					domChild = domChild.next();
				}
			}
			if (!needNode) break;
			domNode = needNode;
		}
		return domNode;
	};

	const setRange = (
		method: string,
		range: RangeInterface,
		node: Node | null,
		offset: number,
	) => {
		if (node !== null) {
			if (offset < 0) {
				offset = 0;
			}
			if (
				node.nodeType === getWindow().Node.ELEMENT_NODE &&
				offset > node.childNodes.length
			) {
				offset = node.childNodes.length;
			}
			if (
				node.nodeType === getWindow().Node.TEXT_NODE &&
				offset > (node.nodeValue?.length || 0)
			) {
				offset = node.nodeValue?.length || 0;
			}
			range[method](node, offset);
		}
	};
	const startNode = getNode(startPath);
	const endNode = getNode(endPath);
	const range = Range.create(engine, document);
	setRange(
		'setStart',
		range,
		startNode.get(),
		startOffset ? parseInt(startOffset.toString()) : 0,
	);
	setRange(
		'setEnd',
		range,
		endNode.get(),
		endOffset ? parseInt(endOffset.toString()) : 0,
	);
	return range;
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

	otherOp.forEach(op => {
		if (op.ops) ops.push(op.ops);
	});
	ops.forEach(o => {
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
	let start: Path = startPath.map(p => parseInt(p.toString()) + 2);
	let end: Path = endPath.map(p => parseInt(p.toString()) + 2);
	let ops: Op[] = [];
	operation?.forEach(op => {
		if (op.ops) ops = ops.concat(op.ops);
	});
	ops.forEach(op => {
		start = handlePath(start, op);
		end = handlePath(end, op);
	});
	return [
		start.map(p => parseInt(p.toString()) - 2),
		end.map(p => parseInt(p.toString()) - 2),
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

export const getRangePath = (range: RangeInterface) => {
	return toPath(range.cloneRange());
};

export const getOldIndex = (index: number, ops: Op[]) => {
	let i = index;
	ops.forEach(op => {
		if (parseInt(op.p[op.p.length - 1].toString()) - 2 <= index) {
			if ('li' in op) i -= 1;
			else if ('ld' in op) i += 1;
		}
	});
	return i;
};
