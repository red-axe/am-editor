import { Node } from '../node';
import { Text } from '../text';
import { Element } from '../element';
import { toCardValue } from './to-card-value';
import { CARD_KEY } from '../../constants';
import { escape, unescape } from '../../utils';

export const toValue = (node: Node, filter?: (node: Node) => false | void) => {
	if (Text.isText(node)) {
		const { text } = node;
		return unescape(text)
			.replace(/\u00a0/g, ' ')
			.replace(/\u200b/g, '');
	} else if (Element.isElement(node)) {
		const { type, children } = node;
		if (filter && filter(node) === false) return '';
		const isCard = node[CARD_KEY];
		if (isCard) return toCardValue(node);
		let element = `<${type}`;
		for (const [key, value] of Object.entries(node)) {
			if (key === 'type' || key === 'children') continue;
			element += ` ${key}="${escape(value)}"`;
		}
		if (Node.isVoid(node)) {
			return element + ' />';
		}
		element += '>';
		for (const child of children) {
			element += toValue(child);
		}
		element += `</${type}>`;
		return element;
	}
	throw new Error('Cannot convert node to value');
};
