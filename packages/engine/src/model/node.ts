import { toHex } from '../utils';
import { isTransientAttribute, isTransientElement } from './utils';
import { DOMNode, isDOMElement, isDOMHTMLElement } from './dom';
import { Element } from './element';
import { Text } from './text';
import { BaseNode } from './types';
import { Path } from './path';

export type Node = BaseNode;

const DOMNODE_TO_NODE: WeakMap<DOMNode, Node> = new WeakMap();

export const Node = {
	createFromDOM: (domNode: DOMNode) => {
		if (isTransientElement(domNode)) return;
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
				const node = Node.createFromDOM(child);
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
			Node.setDOM(element, domNode);
			return element;
		}
		const text = Text.create(String(nodeValue));
		Node.setDOM(text, domNode);
		return text;
	},

	findNode: (domNode: DOMNode) => DOMNODE_TO_NODE.get(domNode),

	setDOM: (node: Node, domNode: DOMNode) => {
		DOMNODE_TO_NODE.set(domNode, node);
	},

	findByPath: (root: Node, path: Path) => {
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
