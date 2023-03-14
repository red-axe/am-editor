import { Element } from './element';
import { BaseNode } from './types';

export type Path = number[];

const NODE_TO_INDEX: WeakMap<BaseNode, number> = new WeakMap();
const NODE_TO_PARENT: WeakMap<BaseNode, Element> = new WeakMap();

export const Path = {
	isPath(value: any): value is Path {
		return (
			Array.isArray(value) && value.every((v) => typeof v === 'number')
		);
	},

	setPath(node: BaseNode, parent: Element, index: number) {
		NODE_TO_INDEX.set(node, index);
		NODE_TO_PARENT.set(node, parent);
	},

	getPath(node: BaseNode): Path {
		const path: Path = [];
		let current: BaseNode | null = node;
		while (current) {
			const parent = NODE_TO_PARENT.get(current);
			if (!parent) break;
			const index = NODE_TO_INDEX.get(current);
			if (index === undefined)
				throw new Error(`Invalid index in ${JSON.stringify(current)}`);
			path.unshift(index);
			current = parent;
		}
		return path;
	},

	getIndex(node: BaseNode): number {
		const index = NODE_TO_INDEX.get(node);
		if (index === undefined) throw new Error(`Invalid index in ${node}`);
		return index;
	},

	isEqual(path: Path, other: Path): boolean {
		if (path.length !== other.length) return false;

		return path.every((p, i) => p === other[i]);
	},

	isReverse(path: Path, other: Path, offset = 1): boolean {
		if (path.length !== other.length) return false;
		const index = path.length - 1;
		const clone = other.slice();
		clone[index] = clone[index] - offset;

		return Path.isEqual(path, clone);
	},

	commonLength(path: Path, other: Path): number | null {
		let alen = path.length;
		let blen = other.length;

		if (alen === 0) return -1;
		if (blen === 0) return null;

		alen--;
		blen--;

		for (var i = 0; i < alen; i++) {
			var p = path[i];
			if (i >= blen || p !== other[i]) return null;
		}

		return alen;
	},
	next(path: Path): Path {
		if (path.length === 0) {
			throw new Error(
				`Cannot get the next path of a root path [${path}], because it has no next index.`,
			);
		}

		const last = path[path.length - 1];
		return path.slice(0, -1).concat(last + 1);
	},
};
