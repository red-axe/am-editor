import {
	CardToolbarItemOptions,
	CardType,
	EditorInterface,
	NodeInterface,
	PluginOptions,
	ToolbarItemOptions,
} from '@aomao/engine';
import { EventEmitter2 } from 'eventemitter2';
import PhotoSwipe from 'photoswipe';

export interface PswpInterface extends EventEmitter2 {
	root: NodeInterface;
	barUI: NodeInterface;
	closeUI: NodeInterface;
	bindControllerFadeInAndOut(): void;
	unbindControllerFadeInAndOut(): void;
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
	open(items: PhotoSwipe.Item[], index: number): void;
	reset: () => void;
	close(): void;
	destroy(): void;
}

export interface ImageOptions extends PluginOptions {
	/**
	 * 图片渲染前调用，可以在这里修改图片链接
	 */
	onBeforeRender?: (
		status: 'uploading' | 'done',
		src: string,
		editor: EditorInterface,
	) => string;
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
	/**
	 * 最高高度，设置后默认按最高高度缩放
	 */
	maxHeight?: number;
	cardToolbars?: (
		items: (ToolbarItemOptions | CardToolbarItemOptions)[],
		editor: EditorInterface,
	) => (ToolbarItemOptions | CardToolbarItemOptions)[];
}
