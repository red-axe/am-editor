import EventEmitter2 from 'eventemitter2';
import { EngineInterface } from '../types';
import { applyToDOM } from './apply-to-dom';
import { Element } from './element';
import { Mutation } from './mutation';
import { Node } from './node';
import { Operation } from './operation';
import { Path } from './path';

const ENGINE_TO_MODEL: WeakMap<EngineInterface, Model> = new WeakMap();

export interface Model {
	root: Element;
	mutation: Mutation;
	resetRoot(): void;
	onChange(fn: (operations: Operation[]) => void): void;
	offChange(fn: (operations: Operation[]) => void): void;
	findNode(path: Path): Node | undefined;
	apply(operations: Operation[]): void;
	destroy(): void;
}

const createModel = (engine: EngineInterface, root: Element) => {
	const ee = new EventEmitter2();

	const mutation = Mutation.from(engine);
	mutation.onChange((records) => {
		const operations = Operation.transform(engine, records);
		if (operations.length === 0) return;
		console.log('operations', operations);
		ee.emit('change', operations);
	});

	if (!engine.readonly) mutation.start();

	const model: Model = {
		root,
		mutation,
		resetRoot: () => {
			const root = Node.createFromDOM(engine.container[0]);
			if (Element.isElement(root)) model.root = root;
		},
		onChange: (fn) => {
			ee.on('change', fn);
		},
		offChange: (fn) => {
			ee.off('change', fn);
		},
		findNode: (path) => {
			let node: Node = model.root;
			for (const p of path) {
				if (!Element.isElement(node)) return undefined;
				node = node.children[p];
			}
			return node;
		},
		apply: (operations) => {
			for (const operation of operations) {
				let container = engine.container[0];
				const { path } = operation;

				applyToDOM(engine, operation, false);
			}
		},
		destroy: () => {
			mutation.destroy();
			ENGINE_TO_MODEL.delete(engine);
		},
	};

	return model;
};

export const Model = {
	from: (
		engine: EngineInterface,
		root: Element = { type: 'div', children: [] },
	) => {
		let model = ENGINE_TO_MODEL.get(engine);
		if (!model) {
			model = createModel(engine, root);
			ENGINE_TO_MODEL.set(engine, model);
		}
		return model;
	},

	destroy: (engine: EngineInterface) => {
		const model = ENGINE_TO_MODEL.get(engine);
		model?.destroy();
	},
};

export { Node, Element, Operation };
