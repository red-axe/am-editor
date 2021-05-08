export type DrawStyle = {
	fill?: string;
	stroke?: string;
};

export type DrawOptions = DOMRect & DrawStyle;

export interface TinyCanvasInterface {
	resize(width: number, height: number): void;
	getImageData(options: DOMRect): ImageData | undefined;
	draw(type: 'Rect', options: DrawOptions): void;
	clearRect(options: DOMRect): void;
	clear(): void;
	destroy(): void;
}
