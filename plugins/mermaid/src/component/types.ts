import { CardValue } from '@aomao/engine';

export type Size = {
	width: number;
	height: number;
};

export interface MermaidValue extends CardValue {
	code: string;
	enableResizer: boolean;
	maxWidth: number;
	size: Size;
	rate: number;
}
