export interface ResizerInterface {
	on(eventType: string, listener: EventListener): void;
	off(eventType: string, listener: EventListener): void;
	setSize(width: number, height: number): void;
	maxWidth: number;
	render(): void;
	destroy(): void;
}

export type ResizerOptions = {
	imgUrl?: string;
	width: number;
	height: number;
	maxWidth: number;
	rate: number;
	onChange?: (size: Size) => void;
};

export type ResizerPosition =
	| 'right-top'
	| 'left-top'
	| 'right-bottom'
	| 'left-bottom';

export type Point = {
	x: number;
	y: number;
};

export type Size = {
	width: number;
	height: number;
};
