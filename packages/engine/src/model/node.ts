import { toHex } from '../utils';
import { isTransientAttribute, isTransientElementCache } from './utils';
import { DOMNode, isDOMElement, isDOMHTMLElement } from './dom';
import { Element } from './element';
import { Text } from './text';
import { BaseNode } from './types';
import { Path } from './path';
import { SchemaInterface } from '../types';

export type Node = BaseNode;

const DOMNODE_TO_NODE: WeakMap<DOMNode, Node> = new WeakMap();
const NODE_TO_SCHEMA_TYPE: WeakMap<Node, string> = new WeakMap();
const NODE_TO_IS_VOID: WeakMap<Node, boolean> = new WeakMap();

export const Node = {
	createFromDOM: (domNode: DOMNode, schema?: SchemaInterface) => {
		if (isTransientElementCache(domNode)) return;
		const { nodeName, nodeValue } = domNode;
		if (isDOMElement(domNode)) {
			const { attributes, childNodes } = domNode;
			const props: Record<string, any> = {};
			for (const { name, value } of attributes) {
				if (isTransientAttribute(domNode, name)) continue;
				if (name === 'style' && isDOMHTMLElement(domNode)) {
					props['style'] = toHex(domNode.style.cssText || value);
				} else {
					props[name] = String(value);
				}
			}
			const children: Node[] = [];
			for (const child of childNodes) {
				const node = Node.createFromDOM(child, schema);
				if (node) {
					children.push(node);
				}
			}
			const element = Element.create(
				nodeName.toLowerCase(),
				props,
				children,
			);
			for (let i = 0; i < children.length; i++) {
				const child = children[i];
				Path.setPath(child, element, i);
			}
			Node.setDOM(element, domNode, schema);
			return element;
		}
		const text = Text.create(String(nodeValue));
		Node.setDOM(text, domNode);
		return text;
	},

	findNode: (domNode: DOMNode) => DOMNODE_TO_NODE.get(domNode),

	setDOM: (node: Node, domNode: DOMNode, schema?: SchemaInterface) => {
		DOMNODE_TO_NODE.set(domNode, node);
		if (schema && Element.isElement(node))
			Node.setSchemaType(node, domNode, schema);
	},

	setSchemaType: (
		element: Element,
		node: DOMNode,
		schema: SchemaInterface,
	) => {
		const type = schema.getType(node);
		if (type) {
			NODE_TO_SCHEMA_TYPE.set(element, type);
		}
		const isVoid =
			schema.find(
				(rule) => rule.name === element.type && rule.isVoid === true,
			).length > 0;
		NODE_TO_IS_VOID.set(element, isVoid);
	},

	isBlock: (node: Node) => {
		if (Element.isElement(node)) {
			return NODE_TO_SCHEMA_TYPE.get(node) === 'block';
		}
		return false;
	},

	isInline: (node: Node) => {
		if (Element.isElement(node)) {
			return NODE_TO_SCHEMA_TYPE.get(node) === 'inline';
		}
		return false;
	},

	isMark: (node: Node) => {
		if (Element.isElement(node)) {
			return NODE_TO_SCHEMA_TYPE.get(node) === 'mark';
		}
		return false;
	},

	isVoid: (node: Node) => {
		if (Element.isElement(node)) {
			return (
				NODE_TO_IS_VOID.get(node) === true ||
				~[
					'img',
					'br',
					'area',
					'col',
					'embed',
					'hr',
					'input',
					'link',
					'meta',
					'param',
					'source',
					'track',
					'wbr',
				].indexOf(node.type)
			);
		}
		return false;
	},

	get: (root: Node, path: Path) => {
		let node = root;
		for (const index of path) {
			if (Element.isElement(node)) {
				node = node.children[index];
			} else {
				throw new Error('Cannot find element');
			}
		}
		return node;
	},
};
