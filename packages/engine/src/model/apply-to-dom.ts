import { isTransientElement } from './utils';
import {
	CARD_KEY,
	CARD_LOADING_KEY,
	DATA_ID,
	READY_CARD_KEY,
} from '../constants';
import { EditorInterface, EngineInterface } from '../types';
import { $ } from '../node';
import { Operation } from './operation';
import { Path } from './path';
import { DOMElement, DOMNode, isDOMElement, isDOMText } from './dom';
import { Node } from './node';
import { Text } from './text';
import { Element } from './element';
import { isCard, isRoot } from '../node/utils';

export const findDOMByPath = (
	engine: EngineInterface,
	root: DOMNode,
	path: Path,
): { parent: DOMElement; node: DOMNode; offset: number } => {
	// 正在加载中的节点，直接渲染
	if (isDOMElement(root) && root.hasAttribute(CARD_LOADING_KEY)) {
		const { card } = engine;
		const cardComponent = card.find(root);
		if (cardComponent) {
			cardComponent.getCenter().empty();
			card.renderComponent(cardComponent);
		}
	}

	let offset = path[0];
	let index = 0;
	for (const child of root.childNodes) {
		if (isTransientElement(child)) continue;
		if (offset === index) {
			if (path.length === 1) {
				return {
					parent: root as DOMElement,
					node: child,
					offset: -1,
				};
			}
			return findDOMByPath(engine, child, path.slice(1));
		}
		index++;
	}
	if (path.length > 1) throw new Error('Cannot find element');
	return {
		parent: root as DOMElement,
		node: root,
		offset,
	};
};

export const toDOM = (node: Node) => {
	if (Text.isText(node)) {
		return document.createTextNode(node.text);
	} else if (Element.isElement(node)) {
		const { type, children } = node;
		const element = document.createElement(type);
		for (const [key, value] of Object.entries(node)) {
			if (key === 'type' || key === 'children') continue;
			element.setAttribute(key, value);
		}
		if (node[CARD_KEY] && !node[READY_CARD_KEY]) {
			element.setAttribute(READY_CARD_KEY, node[CARD_KEY]);
			element.removeAttribute(CARD_KEY);
		}
		for (const child of children) {
			element.appendChild(toDOM(child));
		}
		return element;
	}
	throw new Error('Cannot convert node to DOM');
};

export const applyToDOM = (
	engine: EngineInterface,
	operation: Operation,
	isRemote: boolean,
) => {
	const { card } = engine;
	const { path } = operation;
	const {
		parent,
		node: domNode,
		offset: domOffset,
	} = findDOMByPath(engine, engine.container[0], path);
	if (operation.type === 'insert_node') {
		const { node } = operation;
		const element = toDOM(node);

		const $element = $(element);
		// if (
		// 	!isDOMElement(element) ||
		// 	!isCard(element) ||
		// 	(isEditableCard(element) &&
		// 		$element.closest(EDITABLE_SELECTOR).isEditable())
		// ) {
		if (parent !== domNode) {
			parent.insertBefore(element, domNode);
		} else {
			parent.appendChild(element);
		}
		if (isDOMElement(element) && isCard(element)) {
			element.setAttribute(
				CARD_LOADING_KEY,
				isRemote ? 'remote' : 'true',
			);
		}
		const id = node[DATA_ID];
		engine.card.render($element);
		if ($element[0].isConnected || !id) return $element;
		const el = parent.querySelector(`[${DATA_ID}="${id}"]`);
		return el ? $(el) : $element;
		// }
		// return;
	} else if (operation.type === 'remove_node') {
		if (domOffset === -1) {
			if (isDOMElement(domNode) && isCard(domNode)) {
				if (isRemote) {
					card.removeRemote(domNode);
				} else {
					card.remove(domNode, false);
				}
			} else parent.removeChild(domNode);
			return isRoot(parent) ? undefined : $(parent);
		}
		return;
	} else if (operation.type === 'set_node') {
		if (domOffset === -1 && isDOMElement(domNode)) {
			const { properties, newProperties } = operation;
			for (const [key] of Object.entries(properties)) {
				domNode.removeAttribute(key);
			}
			for (const [key, value] of Object.entries(newProperties)) {
				if (value === null) {
					domNode.removeAttribute(key);
				} else {
					domNode.setAttribute(key, value);
				}
			}
			const $node = $(domNode);
			if (isCard(domNode)) {
				const component = card.find(domNode);
				if (!component) return;
				if (!component.isEditable) card.reRender(component);
				if (component.isEditable && component.onChange)
					component.onChange(isRemote ? 'remote' : 'local', $node);
			}
			return $node;
		}
	} else if (operation.type === 'insert_text') {
		const { offset, text } = operation;
		if (domOffset === -1 && isDOMText(domNode)) {
			const content = domNode.nodeValue ?? '';
			domNode.nodeValue =
				content.slice(0, offset) + text + content.slice(offset);
			return $(domNode);
		}
	} else if (operation.type === 'remove_text') {
		const { offset, text } = operation;
		if (domOffset === -1 && isDOMText(domNode)) {
			const content = domNode.nodeValue ?? '';
			domNode.nodeValue =
				content.slice(0, offset) + content.slice(offset + text.length);
			return $(domNode);
		}
	}
	return;
};
