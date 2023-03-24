import { BaseNode } from './types';
import { isPlainObject } from './utils';

export interface Element {
	type: string;
	children: BaseNode[];
}

export const Element = {
	isElement(value: any): value is Element {
		return isPlainObject(value) && Array.isArray(value.children);
	},

	create(
		type: string,
		props: Record<string, any> = {},
		children: BaseNode[] = [],
	): Element {
		return {
			type,
			...props,
			children,
		};
	},
};
