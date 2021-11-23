export const CARD_TAG = 'card';
export const CARD_KEY = 'data-card-key';
export const READY_CARD_KEY = 'data-ready-card';
export const CARD_TYPE_KEY = 'data-card-type';
export const CARD_VALUE_KEY = 'data-card-value';
export const CARD_ELEMENT_KEY = 'data-card-element';
export const CARD_LOADING_KEY = 'data-card-loading';
export const CARD_EDITABLE_KEY = 'data-card-editable';
export const CARD_SELECTOR = 'div['
	.concat(CARD_KEY, '],span[')
	.concat(CARD_KEY, ']');
export const READY_CARD_SELECTOR = 'div['
	.concat(READY_CARD_KEY, '],span[')
	.concat(READY_CARD_KEY, ']');
export const CARD_LEFT_SELECTOR = 'span['.concat(CARD_ELEMENT_KEY, '=left]');
export const CARD_CENTER_SELECTOR = 'div['
	.concat(CARD_ELEMENT_KEY, '=center],span[')
	.concat(CARD_ELEMENT_KEY, '=center]');
export const CARD_RIGHT_SELECTOR = 'span['.concat(CARD_ELEMENT_KEY, '=right]');
export const TRIGGER_CARD_ID = 'trigger-card-id';
