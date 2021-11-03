export type DrawStyle = {
	fill?: string;
	stroke?: string;
};

export type DrawOptions = DOMRect & DrawStyle;

export interface TinyCanvasInterface {
	/**
	 * 重置大小
	 * @param width
	 * @param height
	 */
	resize(width: number, height: number): void;
	/**
	 * 获取图片数据
	 * @param options
	 */
	getImageData(options: DOMRect): ImageData | undefined;
	/**
	 * 绘制区域
	 * @param options
	 */
	drawRect(options: DrawOptions): void;
	/**
	 * 清除绘制额区域
	 * @param options
	 */
	clearRect(options: DOMRect): void;
	/**
	 * 清除
	 */
	clear(): void;
	/**
	 * 销毁
	 */
	destroy(): void;
}
