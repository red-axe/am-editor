import { NodeInterface } from '@aomao/engine';
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
