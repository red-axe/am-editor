import { CARD_KEY, READY_CARD_KEY } from '../../constants';
import { Node } from '../node';
import { Text } from '../text';
import { Element } from '../element';

export const toDOM = (node: Node) => {
	if (Text.isText(node)) {
		return document.createTextNode(node.text);
	} else if (Element.isElement(node)) {
		const { type, children } = node;
		let element: HTMLElement | null = null;
		try {
			element = document.createElement(type.replace(/[-_\[\]\s]/g, ''));
		} catch (error) {
			element = document.createElement('span');
		}

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
