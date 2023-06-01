import isEqual from 'lodash/isEqual';
import { EngineInterface } from '../types';
import { isRoot } from '../node/utils';
import { isTransientAttribute, isTransientElementCache } from './utils';
import { DOMElement, DOMNode, isDOMElement } from './dom';
import { Node } from './node';
import { Element } from './element';
import { Path } from './path';
import { BaseNode } from './types';
import {
	DIFF_DELETE,
	DIFF_EQUAL,
	DIFF_INSERT,
	diff_match_patch,
	patch_obj,
} from 'diff-match-patch';
import {
	CARD_KEY,
	CARD_LOADING_KEY,
	CARD_TYPE_KEY,
	CARD_VALUE_KEY,
	DATA_ID,
} from '../constants';
import { decodeCardValue } from '../utils';

type BaseOperation = {
	type: string;
	path: Path;
	undoable?: boolean;
};

export interface InsertNodeOperation extends BaseOperation {
	type: 'insert_node';
	node: Node;
}

export interface InsertTextOperation extends BaseOperation {
	type: 'insert_text';
	offset: number;
	text: string;
}

export interface RemoveNodeOperation extends BaseOperation {
	type: 'remove_node';
	node: Node;
}

export interface RemoveTextOperation extends BaseOperation {
	type: 'remove_text';
	offset: number;
	text: string;
}

export interface SetNodeOperation extends BaseOperation {
	type: 'set_node';
	path: Path;
	properties: Record<string, any>;
	newProperties: Record<string, any>;
}

export type NodeOperation =
	| InsertNodeOperation
	| RemoveNodeOperation
	| SetNodeOperation;

export type TextOperation = InsertTextOperation | RemoveTextOperation;

export type Operation = NodeOperation | TextOperation;

interface MutationNode {
	node: DOMNode;
	previousSibling: DOMNode | null;
	nextSibling: DOMNode | null;
}

const validSibling = (
	node: DOMNode,
	sibling: DOMNode | null,
	defaultNode: DOMNode | null = null,
) => {
	if (!sibling || !sibling.isConnected) {
		sibling = defaultNode;
	}
	if (!sibling) return defaultNode;

	while (sibling.parentNode !== node) {
		const parent: DOMNode | null = sibling.parentNode;
		if (!parent || !node.contains(parent)) return defaultNode;
		sibling = parent;
	}
	return sibling;
};

const transform = (engine: EngineInterface, records: MutationRecord[]) => {
	const mutationNodes: MutationNode[] = [];

	const expandSibling = (
		mutationNode: MutationNode,
		oldNode: DOMNode,
		previousSibling: DOMNode | null,
		nextSibling: DOMNode | null,
	) => {
		const {
			previousSibling: currentPreviousSibling,
			nextSibling: currentNextSibling,
		} = mutationNode;
		if (
			(previousSibling &&
				(!currentPreviousSibling ||
					currentPreviousSibling.compareDocumentPosition(
						previousSibling,
					) & globalThis.Node.DOCUMENT_POSITION_PRECEDING)) ||
			currentPreviousSibling?.parentNode !== mutationNode.node
		) {
			mutationNode.previousSibling = validSibling(
				mutationNode.node,
				previousSibling,
				currentPreviousSibling,
			);
		}
		if (
			(nextSibling &&
				(!currentNextSibling ||
					currentNextSibling.compareDocumentPosition(nextSibling) &
						globalThis.Node.DOCUMENT_POSITION_FOLLOWING)) ||
			currentNextSibling?.parentNode !== mutationNode.node
		) {
			mutationNode.nextSibling = validSibling(
				mutationNode.node,
				nextSibling,
				currentNextSibling,
			);
		}

		if (mutationNode.previousSibling === oldNode) {
			mutationNode.previousSibling = oldNode.previousSibling;
		}
		if (mutationNode.nextSibling === oldNode) {
			mutationNode.nextSibling = oldNode.nextSibling;
		}
		if (
			mutationNode.previousSibling !== previousSibling &&
			mutationNode.previousSibling?.contains(previousSibling)
		) {
			mutationNode.previousSibling =
				mutationNode.previousSibling.previousSibling;
		}
		if (
			mutationNode.nextSibling !== nextSibling &&
			mutationNode.nextSibling?.contains(nextSibling)
		) {
			mutationNode.nextSibling = mutationNode.nextSibling.nextSibling;
		}
	};

	const validMutationNode = (
		node: DOMNode,
		previousSibling: DOMNode | null,
		nextSibling: DOMNode | null,
	) => {
		let hasMutation = false;
		for (const mutationNode of mutationNodes) {
			const { node: currentNode } = mutationNode;
			if (node === currentNode || currentNode.contains(node)) {
				hasMutation = true;
				expandSibling(
					mutationNode,
					currentNode,
					previousSibling,
					nextSibling,
				);
			} else if (node.contains(currentNode)) {
				hasMutation = true;
				mutationNode.node = node;
				const {
					previousSibling: oldPreviousSibling,
					nextSibling: oldNextSibling,
				} = mutationNode;

				mutationNode.previousSibling = validSibling(
					node,
					previousSibling,
					oldPreviousSibling,
				);
				mutationNode.nextSibling = validSibling(
					node,
					nextSibling,
					oldNextSibling,
				);
				expandSibling(
					mutationNode,
					currentNode,
					oldPreviousSibling,
					oldNextSibling,
				);
			}
		}
		return hasMutation;
	};

	for (const record of records) {
		const { type, attributeName } = record;
		let target = record.target;
		let isEditorRoot = false;
		if (isDOMElement(target) && isRoot(target)) {
			isEditorRoot = true;
		}
		if (
			!target.isConnected ||
			isTransientElementCache(target) ||
			(type === 'attributes' &&
				(isEditorRoot ||
					(attributeName &&
						isTransientAttribute(target, attributeName))))
		) {
			continue;
		}

		let { previousSibling, nextSibling } = record;
		if (type === 'childList') {
			const { addedNodes } = record;
			if (addedNodes.length > 0) {
				if (!previousSibling) {
					previousSibling = addedNodes[0].previousSibling;
				}
				if (!nextSibling) {
					nextSibling = addedNodes[addedNodes.length - 1].nextSibling;
				}
			}
			if (!previousSibling && nextSibling) {
				previousSibling = nextSibling.previousSibling;
			}
			if (!nextSibling && previousSibling) {
				nextSibling = previousSibling.nextSibling;
			}
		} else if (type === 'characterData' || type === 'attributes') {
			if (!previousSibling) {
				previousSibling = target.previousSibling;
			}
			if (!nextSibling) {
				nextSibling = target.nextSibling;
			}

			if (type === 'attributes' || !isDOMElement(target)) {
				const parent = target.parentElement;
				if (!parent || isTransientElementCache(parent)) continue;
				target = parent;
			}
		}

		if (validMutationNode(target, previousSibling, nextSibling)) continue;

		mutationNodes.push({
			node: target,
			previousSibling: validSibling(target, previousSibling),
			nextSibling: validSibling(target, nextSibling),
		});
	}
	const operations: Operation[] = [];
	for (const mutationNode of mutationNodes) {
		const { node } = mutationNode;
		let { previousSibling, nextSibling } = mutationNode;
		const parentNode = Node.findNode(node);
		if (!parentNode) {
			continue;
		}
		if (!Element.isElement(parentNode))
			throw new Error('parentNode is not an element');
		const parentPath = Path.getPath(parentNode);

		if (previousSibling) {
			while (
				isTransientElementCache(previousSibling) ||
				previousSibling === node.firstChild
			) {
				previousSibling = previousSibling.previousSibling;
				if (!previousSibling) break;
			}
		}
		if (nextSibling) {
			while (
				isTransientElementCache(nextSibling) ||
				nextSibling === node.lastChild
			) {
				nextSibling = nextSibling.nextSibling;
				if (!nextSibling) break;
			}
		}
		const previousNode = previousSibling
			? Node.findNode(previousSibling)
			: null;
		const nextNode = nextSibling ? Node.findNode(nextSibling) : null;

		let previousIndex = previousNode ? Path.getIndex(previousNode) : -1;
		const nextIndex = nextNode
			? Path.getIndex(nextNode)
			: parentNode.children.length;

		const children: Node[] = [];
		// 在model中找不到对应的node，说明是新增的，这里就无法确定到底是从哪个位置新增的，所以只能设置为null从头开始遍历
		let next = previousNode ? previousSibling?.nextSibling : null;

		if (!next) {
			next = node.firstChild;
			previousIndex = -1;
		}
		while (next && next !== nextSibling) {
			const node = Node.createFromDOM(next, engine.schema);
			if (node) {
				children.push(node);
			}
			next = next.nextSibling;
		}
		const start = previousIndex + 1;
		// const end = nextIndex - 1;
		const oldChildren = parentNode.children.slice(start, nextIndex);
		operations.push(
			...diff(engine, oldChildren, children, parentPath, start),
		);
		parentNode.children.splice(start, oldChildren.length, ...children);
		for (let i = start; i < parentNode.children.length; i++) {
			Path.setPath(parentNode.children[i], parentNode, i);
		}
	}
	return operations;
};

const diff = (
	engine: EngineInterface,
	a: BaseNode[],
	b: BaseNode[],
	path: Path,
	index = 0,
	isLoading = false,
) => {
	const len = Math.max(a.length, b.length);
	const operations: Operation[] = [];
	let removeIndex = -1;
	for (let i = 0; i < len; i++) {
		const node = a[i];
		const newNode = b[i];
		const currentPath = path.concat(i + index);
		// insert node
		if (!node) {
			operations.push({
				type: 'insert_node',
				path: currentPath,
				node: newNode,
			});
		}
		// remove node
		else if (!newNode) {
			if (removeIndex === -1) removeIndex = i;
			operations.unshift({
				type: 'remove_node',
				path: path.concat(i + index),
				node,
			});
		} else {
			const isElement = Element.isElement(node);
			const element = isElement ? node : null;
			const text = isElement ? null : node;

			const newIsElement = Element.isElement(newNode);
			const newElement = newIsElement ? newNode : null;
			const newText = newIsElement ? null : newNode;
			isLoading =
				isLoading ||
				(!!newElement && isLoadingCard(engine, newElement));
			if (
				isElement !== newIsElement ||
				(element && newElement && element.type !== newElement.type)
			) {
				operations.unshift({
					type: 'remove_node',
					path: currentPath,
					node,
					undoable: isLoading,
				});
				operations.push({
					type: 'insert_node',
					path: currentPath,
					node: newNode,
					undoable: isLoading,
				});
				continue;
			}

			let hasAttributeChange = false;
			const getAttributes = (node: BaseNode) => {
				const attributes = {};
				for (const key in node) {
					if (~['children', 'text', 'type'].indexOf(key)) continue;
					attributes[key] = node[key];
				}
				return attributes;
			};

			const attributes = getAttributes(node);
			const attributesLength = Object.keys(attributes).length;
			const newAttributes = getAttributes(newNode);
			const newAttributesLength = Object.keys(newAttributes).length;
			if (attributesLength !== newAttributesLength) {
				hasAttributeChange = true;
			} else {
				for (const key in attributes) {
					if (attributes[key] !== newAttributes[key]) {
						hasAttributeChange = true;
						break;
					}
				}
			}

			if (hasAttributeChange) {
				const cardValue = newAttributes[CARD_VALUE_KEY];
				const operation: SetNodeOperation = {
					type: 'set_node',
					path: currentPath,
					properties: attributes,
					newProperties: newAttributes,
					undoable: isLoading,
				};
				if (cardValue) {
					const value = decodeCardValue(cardValue);
					const component = engine.card.find(value.id);
					if (
						component?.writeHistoryOnValueChange &&
						component.writeHistoryOnValueChange(value) === false
					) {
						operation.undoable = true;
					}
				}
				operations.push(operation);
			}
			if (element && newElement)
				operations.push(
					...diff(
						engine,
						element.children,
						newElement.children,
						currentPath,
						0,
						isLoading,
					),
				);
			else if (text && newText && text.text !== newText.text) {
				operations.push(
					...transformText(
						text.text,
						newText.text,
						currentPath,
						isLoading,
					),
				);
			}
		}
	}
	return operations;
};

const transformText = (a: string, b: string, path: Path, isLoading = false) => {
	const operations: Operation[] = [];
	const patches = new diff_match_patch().patch_make(a, b);
	Object.keys(patches).forEach((key) => {
		const patch: patch_obj = patches[key];
		if (patch.start1 === null) return;
		let offset: number = patch.start1;
		patch.diffs.forEach((diff) => {
			const [type, data] = diff;
			if (type !== DIFF_DELETE) {
				if (type !== DIFF_INSERT) {
					if (type === DIFF_EQUAL) {
						offset += data.length;
					}
				} else {
					operations.push({
						type: 'insert_text',
						text: data,
						path: path,
						offset,
						undoable: isLoading,
					});
				}
			} else {
				operations.unshift({
					type: 'remove_text',
					text: data,
					path: path,
					offset,
					undoable: isLoading,
				});
			}
		});
	});
	return operations;
};

const isLoadingCard = (engine: EngineInterface, element: Element) => {
	const cardKey = element[CARD_KEY];
	const cardType = element[CARD_TYPE_KEY];
	const dataId = element[DATA_ID];
	if (cardKey && cardType && dataId) {
		const cardNode = engine.container
			.get<DOMElement>()
			?.querySelector(`[${DATA_ID}="${dataId}"]`);
		if (cardNode?.getAttribute(CARD_LOADING_KEY)) {
			return true;
		}
	}
	return false;
};

export const Operation = {
	transform,
	diff,
	inverse: (operation: Operation): Operation => {
		switch (operation.type) {
			case 'insert_node': {
				return {
					...operation,
					type: 'remove_node',
				};
			}
			case 'remove_node': {
				return {
					...operation,
					type: 'insert_node',
				};
			}
			case 'insert_text': {
				return {
					...operation,
					type: 'remove_text',
				};
			}
			case 'remove_text': {
				return {
					...operation,
					type: 'insert_text',
				};
			}
			case 'set_node': {
				const { properties, newProperties } = operation;
				return {
					...operation,
					type: 'set_node',
					properties: newProperties,
					newProperties: properties,
				};
			}
		}
	},
	isReverse: (a: Operation, b: Operation): boolean => {
		if (
			(a.type === 'insert_node' && b.type === 'remove_node') ||
			(a.type === 'remove_node' && b.type === 'insert_node')
		) {
			return isEqual(a.node, b.node) && Path.isEqual(a.path, b.path);
		}
		if (a.type === 'insert_text' && b.type === 'remove_text') {
			const aPath = a.path.concat(a.offset);
			const bPath = b.path.concat(b.offset);
			return (
				isEqual(a.text, b.text) &&
				(isEqual(aPath, bPath) ||
					Path.isReverse(aPath, bPath, a.text.length) ||
					Path.isReverse(bPath, aPath, a.text.length))
			);
		}
		if (a.type === 'remove_text' && b.type === 'insert_text') {
			const aPath = a.path.concat(a.offset);
			const bPath = b.path.concat(b.offset);
			return isEqual(a.text, b.text) && isEqual(aPath, bPath);
		}
		return false;
	},

	canOpAffectPath(operation: Operation, path: Path): boolean {
		return Path.commonLength(path, operation.path) !== null;
	},
};
