import EventEmitter2 from 'eventemitter2';
import cloneDeep from 'lodash/cloneDeep';
import { CARD_VALUE_KEY, READY_CARD_KEY } from '../constants';
import { CardInterface, EngineInterface, NodeInterface } from '../types';
import { applyToDOM, findDOMByPath } from './apply-to-dom';
import { DOMNode } from './dom';
import { Element } from './element';
import { Text } from './text';
import { CursorAttribute, CollaborationMember } from './member';
import { Mutation } from './mutation';
import { Node } from './node';
import { Operation } from './operation';
import { Path } from './path';
import ModelSelection from './selection';
import './index.css';
import { applyRangeByRemotePath, getRangeRemotePath } from './apply-range';
import { toHTML } from './transform/to-html';
import { toValue } from './transform/to-value';
import { toDOM } from './transform/to-dom';
import { toText } from './transform/to-text';
import { $ } from '../node';

const ENGINE_TO_MODEL: WeakMap<EngineInterface, Model> = new WeakMap();
const FLUSHING: WeakMap<EngineInterface, boolean> = new WeakMap();
export interface Model {
	root: Element;
	mutation: Mutation;
	selection: ModelSelection;
	member: ReturnType<typeof CollaborationMember.fromEngine>;
	resetRoot(): void;
	onChange(fn: (operations: Operation[], root: Element) => void): void;
	offChange(fn: (operations: Operation[], root: Element) => void): void;
	emitChange(operations: Operation[]): void;
	onSelectionChange(fn: (attribute: CursorAttribute) => void): void;
	offSelectionChange(fn: (attribute: CursorAttribute) => void): void;
	findNode(path: Path): Node | undefined;
	apply(operations: Operation[]): void;
	applyRemote(operations: Operation[]): void;
	drawCursor(attributes: CursorAttribute[] | CursorAttribute): void;
	toDOM(node?: Node): DOMNode;
	toHTML(node?: Node): string;
	toValue(node?: Node): string;
	toValueAsync(
		node?: Node,
		callback?: (
			name: string,
			card?: CardInterface,
			...args: any
		) => boolean | number | void,
	): Promise<string>;
	toText(node?: Node, intoCard?: boolean): string;
	destroy(): void;
}

const createModel = (engine: EngineInterface, root: Element) => {
	const ee = new EventEmitter2();
	const { history, change } = engine;
	const mutation = Mutation.from(engine);
	mutation.onChange((records) => {
		const cloneRoot = cloneDeep(engine.model.root);
		const operations = Operation.transform(engine, records);
		if (operations.length === 0) return;
		ee.emit('change', operations, cloneRoot);
		history.handleSelfOps(
			operations.filter((op) => {
				if (
					op.undoable === true &&
					op.type === 'set_node' &&
					!!op.newProperties[CARD_VALUE_KEY]
				) {
					history.handleNLCardValue(op);
				}
				return (
					!op.undoable &&
					(op.type !== 'set_node' ||
						!op.newProperties[READY_CARD_KEY])
				);
			}),
		);

		engine.trigger('operations', operations);
		if (
			operations.find(
				(op) =>
					op.type === 'set_node' && op.newProperties[CARD_VALUE_KEY],
			)
		) {
			change.change(false);
		}
	});

	if (!engine.readonly) mutation.start();

	const selection = new ModelSelection(engine);

	selection.on('change', (attr) => {
		ee.emit('selection-change', attr);
	});

	const member = CollaborationMember.fromEngine(engine);

	const applyOperations = (operations: Operation[]) => {
		const applyNodes: NodeInterface[] = [];
		for (const operation of operations) {
			const applyNode = applyToDOM(engine, operation, false);
			if (applyNode && applyNode.length > 0) {
				applyNodes.push(applyNode);
			}
			if (
				operation.type === 'insert_node' ||
				operation.type === 'remove_node'
			) {
				const { path, node } = operation;
				const parent = Node.get(
					model.root,
					path.slice(0, path.length - 1),
				);
				if (Element.isElement(parent)) {
					const isInsert = operation.type === 'insert_node';
					const index = path[path.length - 1];
					if (isInsert) parent.children.splice(index, 0, node);
					else parent.children.splice(index, 1);
					if (isInsert && applyNode && applyNode.length > 0) {
						const setDOM = (
							node: Node,
							parent: Element,
							index: number,
							domNode: DOMNode,
						) => {
							Node.setDOM(node, domNode, engine.schema);
							Path.setPath(node, parent, index);
							if (Element.isElement(node)) {
								for (let i = 0; i < node.children.length; i++) {
									const child = node.children[i];
									const { node: dom } = findDOMByPath(
										engine,
										domNode,
										[i],
										false,
									);
									setDOM(child, node, i, dom);
								}
							}
						};
						setDOM(node, parent, index, applyNode[0]);
					}
					for (
						let i = path[path.length - 1];
						i < parent.children.length;
						i++
					) {
						const child = parent.children[i];
						Path.setPath(child, parent, i);
					}
				}
			} else if (operation.type === 'set_node') {
				const { path, properties, newProperties } = operation;
				const node = Node.get(model.root, path);
				if (node) {
					for (const key in properties) {
						delete node[key];
					}
					for (const key in newProperties) {
						node[key] = newProperties[key];
					}
				}
			} else if (
				operation.type === 'insert_text' ||
				operation.type === 'remove_text'
			) {
				const { path, offset, text } = operation;
				const node = Node.get(model.root, path);
				if (Text.isText(node)) {
					if (operation.type === 'insert_text') {
						node.text =
							node.text.slice(0, offset) +
							text +
							node.text.slice(offset);
					} else {
						node.text =
							node.text.slice(0, offset) +
							node.text.slice(offset + text.length);
					}
				}
			}
		}

		return applyNodes;
	};

	const model: Model = {
		root,
		mutation,
		selection,
		member,
		resetRoot: () => {
			const root = Node.createFromDOM(engine.container[0], engine.schema);
			if (Element.isElement(root)) model.root = root;
		},
		onChange: (fn) => {
			ee.on('change', fn);
		},
		offChange: (fn) => {
			ee.off('change', fn);
		},
		emitChange: (operations) => {
			ee.emit('change', operations, cloneDeep(engine.model.root));
		},
		onSelectionChange: (fn) => {
			ee.on('selection-change', fn);
		},
		offSelectionChange: (fn) => {
			ee.off('selection-change', fn);
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
			const applyNodes = applyOperations(operations);
			engine.change.change(false, applyNodes);
			return applyNodes;
		},
		applyRemote: (operations) => {
			mutation.stop();
			const path = getRangeRemotePath(engine);
			const applyNodes = applyOperations(operations);
			Promise.resolve().then(() => {
				mutation.start();
			});
			if (path && engine.isFocus())
				applyRangeByRemotePath(
					engine,
					path,
					selection.emitSelectChange,
				);
			engine.change.change(true, applyNodes);
			return applyNodes;
		},
		drawCursor(attributes) {
			if (!FLUSHING.get(engine)) {
				FLUSHING.set(engine, true);
				Promise.resolve().then(() => {
					FLUSHING.set(engine, false);
					if (!Array.isArray(attributes)) attributes = [attributes];
					const current = member.getCurrent();
					const members = member.getMembers();
					attributes.forEach((attribute) => {
						if (current && attribute.uuid === current.uuid) return;
						const member = members.find(
							(m) => m.uuid === attribute.uuid,
						);
						if ('remove' in attribute || !member)
							selection.removeAttirbute(attribute.uuid);
						else {
							selection.setAttribute(attribute, member);
						}
					});
				});
			}
		},
		toDOM: (node) => {
			return toDOM(node ?? model.root);
		},
		toHTML: (node) => {
			const html = !node ? toHTML(model.root) : toHTML(node);
			const element = $(html);
			if (!node) {
				const style = engine.container.css();
				element.css(style);
			}
			engine.trigger('parse:html-before', element);
			engine.trigger('parse:html', element);
			engine.trigger('parse:html-after', element);
			return element.html().replace(/\u200b/g, '');
		},
		toValue: (node) => {
			const filter = (node: Node) => {
				return engine.trigger('parse:node', node);
			};
			if (!node)
				return model.root.children
					.map((child) => toValue(child, filter))
					.join('');
			return toValue(node, filter);
		},

		toValueAsync: (node, callback) => {
			return new Promise(async (resolve, reject) => {
				for (const pluginName in engine.plugin.components) {
					const plugin = engine.plugin.components[pluginName];
					const result = await new Promise((resolve) => {
						if (plugin.waiting) {
							plugin
								.waiting(callback)
								.then(() => resolve(true))
								.catch(resolve);
						} else resolve(true);
					});
					if (typeof result === 'object') {
						reject(result);
						return;
					}
				}
				resolve(model.toValue(node));
			});
		},
		toText: (node, intoCard) => {
			if (!node)
				return model.root.children
					.map((child) => toText(child, intoCard))
					.join('');
			return toText(node, intoCard);
		},
		destroy: () => {
			mutation.destroy();
			selection.destroy();
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

export { Node, Element, Path, Text, CollaborationMember };
export type { CursorAttribute };
export * from './utils';
export * from './operation';
