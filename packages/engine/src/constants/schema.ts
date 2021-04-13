import { SchemaGlobal, SchemaRule } from '../types';
import { CARD_KEY, CARD_TYPE_KEY, CARD_VALUE_KEY } from './card';
import { ANCHOR, CURSOR, FOCUS } from './selection';

const defualtSchema: Array<SchemaRule | SchemaGlobal> = [
	{
		name: 'p',
		type: 'block',
	},
	{
		name: 'br',
		type: 'inline',
		isVoid: true,
	},
	{
		name: ANCHOR,
		type: 'inline',
		isVoid: true,
	},
	{
		name: FOCUS,
		type: 'inline',
		isVoid: true,
	},
	{
		name: CURSOR,
		type: 'inline',
		isVoid: true,
	},
	{
		type: 'block',
		attributes: {
			'data-id': '*',
		},
	},
	{
		name: 'card',
		type: 'inline',
		attributes: {
			name: /\w+/,
			type: 'inline',
			value: '*',
		},
	},
	{
		name: 'span',
		type: 'inline',
		attributes: {
			[CARD_KEY]: /\w+/,
			[CARD_TYPE_KEY]: 'inline',
			[CARD_VALUE_KEY]: '*',
			class: '*',
			contenteditable: '*',
		},
	},
	{
		name: 'card',
		type: 'block',
		attributes: {
			name: /\w+/,
			type: 'block',
			value: '*',
		},
	},
	{
		name: 'div',
		type: 'block',
		attributes: {
			[CARD_KEY]: /\w+/,
			[CARD_TYPE_KEY]: 'block',
			[CARD_VALUE_KEY]: '*',
			class: '*',
			contenteditable: '*',
		},
	},
];

export default defualtSchema;
