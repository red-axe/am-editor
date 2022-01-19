import { DATA_ELEMENT } from './root';

export const ANCHOR = 'anchor';
export const FOCUS = 'focus';
export const CURSOR = 'cursor';
export const ANCHOR_SELECTOR = 'span['
	.concat(DATA_ELEMENT, '=')
	.concat(ANCHOR, '],anchor');
export const FOCUS_SELECTOR = 'span['
	.concat(DATA_ELEMENT, '=')
	.concat(FOCUS, '],focus');
export const CURSOR_SELECTOR = 'span['
	.concat(DATA_ELEMENT, '=')
	.concat(CURSOR, '],cursor');
