import { $ } from '../node';
import { ConversionData } from '../types';
import {
	CARD_KEY,
	CARD_TYPE_KEY,
	CARD_VALUE_KEY,
	READY_CARD_KEY,
} from './card';

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
			};
			//其它 data 属性
			Object.keys(oldAttrs).forEach(attrName => {
				if (
					attrName !== READY_CARD_KEY &&
					attrName.indexOf('data-') === 0 &&
					attrName.indexOf('data-card') !== 0
				) {
					attributes[attrName] = oldAttrs[attrName];
				}
			});

			if (value !== undefined) {
				attributes.value = value;
			}
			style = {};
			const card = $('<card />');
			Object.keys(attributes).forEach(name => {
				card.attributes(name, attributes[name]);
			});
			return card;
		},
	},
];

export default defaultConversion;
