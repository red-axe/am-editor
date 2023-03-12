import { isPlainObject } from './utils';

export interface Text {
	text: string;
}

export const Text = {
	isText(value: any): value is Text {
		return isPlainObject(value) && typeof value.text === 'string';
	},

	create(text: string): Text {
		return { text };
	},
};
