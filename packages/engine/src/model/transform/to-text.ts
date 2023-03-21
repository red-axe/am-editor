import { Node } from '../node';
import { Text } from '../text';
import { Element } from '../element';
import { decodeCardValue, getListStyle, unescape } from '../../utils';
import { CARD_EDITABLE_KEY, CARD_KEY, CARD_VALUE_KEY } from '../../constants';

const getListType = (type: string, indent: number) => {
	if (type === 'ol') {
		if (indent % 3 === 1) return 'lower-alpha';
		if (indent % 3 === 2) return 'lower-roman';

		return 'decimal';
	} else {
		if (indent % 3 === 1) return 'circle';
		if (indent % 3 === 2) return 'square';
		return 'disc';
	}
};

const getIndent = (node: Element) => {
	let dataIndent = node['data-indent'];
	if (!dataIndent) {
		const style = node['style'];
		if (!style) return 0;
		const match = style.match(/text-indent: (\d+)(px|em|rem);/);
		if (!match) return 0;
		dataIndent = match[1];
	}
	const indent = dataIndent ? parseInt(dataIndent) : 0;
	return indent;
};

const toIndent = (node: Element) => {
	const indent = getIndent(node);
	return ' '.repeat(indent * 2);
};

const listToText = (node: Element) => {
	const start = node['start'];
	const classz = node['class'];
	if (classz && classz.includes('data-list-task')) return elementToText(node);

	const indent = getIndent(node);
	const style = getListType(node.type, indent);
	const space = toIndent(node);
	let typeText = toIndent(node);
	const isOrder = node.type === 'ol';
	const index = start ? parseInt(start) : 1;
	if (!isOrder) {
		typeText = `${getListStyle(style)} `;
	}
	let text = '';
	node.children.forEach((child, _index) => {
		if (Element.isElement(child)) {
			if (child.type === 'li') {
				if (isOrder) {
					typeText = `${getListStyle(style, index + _index)}. `;
				}
				text += space + typeText + elementToText(child);
			} else {
				text += space + elementToText(child);
			}
		} else {
			text += toText(child);
		}
	});

	return text;
};

const elementToText = (node: Element, intoCard = false) => {
	const { children } = node;

	let text = toIndent(node);
	let hasBlock = !Node.isBlock(node) || children.length === 0;
	if (node[CARD_KEY] === 'checkbox') {
		const value = decodeCardValue(node[CARD_VALUE_KEY]);
		const checked = value.checked;
		return checked ? '✅' : '🔲';
	}
	if (intoCard || !node[CARD_KEY] || node[CARD_EDITABLE_KEY] === 'true') {
		for (const child of children) {
			text += toText(child);
			if (!hasBlock && Element.isElement(child)) {
				if (child.type === 'br' || Node.isBlock(child)) hasBlock = true;
			}
		}
	}

	return text + (hasBlock ? '' : '\n');
};

export const toText = (node: Node, intoCard = false) => {
	if (Text.isText(node)) {
		const { text } = node;
		return unescape(text)
			.replace(/\u00a0/g, ' ')
			.replace(/\u200b/g, '');
	} else if (Element.isElement(node)) {
		const { type } = node;
		if (type === 'br') return '\n';
		if (type === 'ol' || type === 'ul') {
			return listToText(node);
		}
		return elementToText(node, intoCard);
	}
	throw new Error('Cannot convert node to text');
};
