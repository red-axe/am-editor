import { Node } from '../node';
import { Text } from '../text';
import { Element } from '../element';
import { unescape } from '../../utils';
import { CARD_EDITABLE_KEY, CARD_KEY } from '../../constants';

export const toText = (node: Node, intoCard = false) => {
	if (Text.isText(node)) {
		const { text } = node;
		return unescape(text)
			.replace(/\u00a0/g, ' ')
			.replace(/\u200b/g, '');
	} else if (Element.isElement(node)) {
		const { type, children } = node;
		if (type === 'br') return '\n';
		let text = '';
		let hasBlock = !Node.isBlock(node) || children.length === 0;
		if (intoCard || !node[CARD_KEY] || node[CARD_EDITABLE_KEY] === 'true') {
			for (const child of children) {
				text += toText(child);
				if (!hasBlock && Element.isElement(child)) {
					if (child.type === 'br' || Node.isBlock(child))
						hasBlock = true;
				}
			}
		}

		return text + (hasBlock ? '' : '\n');
	}
	throw new Error('Cannot convert node to text');
};
