import { Node } from '../node';
import { Text } from '../text';
import { Element } from '../element';
import { unescape, escape } from '../../utils';

export const toHTML = (node: Node) => {
	if (Text.isText(node)) {
		const { text } = node;
		return unescape(text)
			.replace(/\u00a0/g, ' ')
			.replace(/\u200b/g, '');
	} else if (Element.isElement(node)) {
		const { type, children } = node;
		let element = `<${type}`;
		for (const [key, value] of Object.entries(node)) {
			if (key === 'type' || key === 'children') continue;
			element += ` ${key}="${escape(value)}"`;
		}
		const isVoid = Node.isVoid(node);
		element += isVoid ? '' : '>';
		for (const child of children) {
			element += toHTML(child);
		}
		element += isVoid ? ' />' : `</${type}>`;
		return element.replace(/\u200b/g, '');
	}
	throw new Error('Cannot convert node to value');
};
