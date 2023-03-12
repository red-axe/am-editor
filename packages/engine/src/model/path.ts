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
};
