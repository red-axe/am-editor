import { DATA_ELEMENT, DATA_ID, ROOT } from './root';
import $ from '../node/query';
import { ConversionData } from '../types';
import {
	CARD_KEY,
	CARD_TYPE_KEY,
	CARD_VALUE_KEY,
	READY_CARD_KEY,
	CARD_EDITABLE_KEY,
} from './card';
import { ANCHOR, CURSOR, FOCUS } from './selection';

const defaultConversion: ConversionData = [
	{
		from: (_name, _styles, attributes) => {
			return !!attributes[CARD_KEY] || !!attributes[READY_CARD_KEY];
		},
		to: (_, style, attributes) => {
			const value = attributes[CARD_VALUE_KEY];
			const oldAttrs = { ...attributes };
			attributes = {
				type: attributes[CARD_TYPE_KEY],
				name: (
					attributes[CARD_KEY] || attributes[READY_CARD_KEY]
				).toLowerCase(),
				editable: attributes[CARD_EDITABLE_KEY],
				[DATA_ID]: attributes[DATA_ID],
			};
			//其它 data 属性
			for (const attrName in oldAttrs) {
				if (
					attrName !== READY_CARD_KEY &&
					attrName.indexOf('data-') === 0 &&
					attrName.indexOf('data-card') !== 0
				) {
					attributes[attrName] = oldAttrs[attrName];
				}
			}

			if (value !== undefined) {
				attributes.value = value;
			}
			style = {};
			const card = $('<card />');
			for (const attrName in attributes) {
				card.attributes(attrName, attributes[attrName]);
			}
			return card;
		},
	},
	{
		from: (_name, _styles, attributes) => {
			return (
				(_name === 'div' || _name === 'section') &&
				(!attributes[CARD_KEY] || !attributes[READY_CARD_KEY]) &&
				attributes[DATA_ELEMENT] !== ROOT
			);
		},
		to: (_, style, attributes) => {
			const p = $('<p />');
			p.css(style);
			for (const attrName in attributes) {
				p.attributes(attrName, attributes[attrName]);
			}
			return p;
		},
	},
	{
		from: (name) => {
			return [CURSOR, ANCHOR, FOCUS].includes(name);
		},
		to: (name) => {
			return { node: $(`<${name} />`), replace: true };
		},
	},
];

export default defaultConversion;
