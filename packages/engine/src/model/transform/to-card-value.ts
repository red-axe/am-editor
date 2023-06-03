import { escape } from '../../utils';
import {
	CARD_EDITABLE_KEY,
	CARD_KEY,
	CARD_TYPE_KEY,
	CARD_VALUE_KEY,
	DATA_ID,
	READY_CARD_KEY,
} from '../../constants';
import { Node } from '../node';

export const toCardValue = (node: Node) => {
	const type = node[CARD_TYPE_KEY];
	if (!type) return '';
	const attributes = {
		type,
		value: node[CARD_VALUE_KEY],
		name: (node[CARD_KEY] || node[READY_CARD_KEY]).toLowerCase(),
		editable: node[CARD_EDITABLE_KEY],
		[DATA_ID]: node[DATA_ID],
	};
	//其它 data 属性
	for (const attrName in node) {
		if (
			attrName !== READY_CARD_KEY &&
			attrName.indexOf('data-') === 0 &&
			attrName.indexOf('data-card') !== 0
		) {
			attributes[attrName] = node[attrName];
		}
	}

	let card = '<card ';
	for (const name in attributes) {
		const value = attributes[name];
		if (value === undefined) continue;
		card += `${name}="${escape(attributes[name])}" `;
	}
	card += '></card>';
	return card;
};
