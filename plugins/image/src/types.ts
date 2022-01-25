import { CardType, NodeInterface, PluginOptions } from '@aomao/engine';
import { EventEmitter2 } from 'eventemitter2';

export interface PswpInterface extends EventEmitter2 {
	root: NodeInterface;
	barUI: NodeInterface;
	closeUI: NodeInterface;
	hoverControllerFadeInAndOut(): void;
	removeFadeOut(node: NodeInterface, id: string): void;
	fadeOut(node: NodeInterface, id: string): void;
	prev(): void;
	next(): void;
	renderCounter(): void;
	getCurrentZoomLevel(): number;
	zoomTo(zoom: number): void;
	zoomIn(): void;
	zoomOut(): void;
	zoomToOriginSize(): void;
	zoomToBestSize(): void;
	updateCursor(): void;
	getInitialZoomLevel(): number;
	afterZoom(): void;
	getCount(): number;
	afterChange(): void;
	setWhiteBackground(): void;
	open(items: Array<PhotoSwipe.Item>, index: number): void;
	close(): void;
	destroy(): void;
}

export interface ImageOptions extends PluginOptions {
	/**
	 * 图片渲染前调用，可以在这里修改图片链接
	 */
	onBeforeRender?: (status: 'uploading' | 'done', src: string) => string;
	/**
	 * 是否启用大小拖动，默认为 true
	 */
	enableResizer?: boolean;
	/**
	 * 是否启用block、inline切换
	 */
	enableTypeSwitch?: boolean;
	/**
	 * 默认使用的卡片类型
	 */
	defaultType?: CardType;
}
