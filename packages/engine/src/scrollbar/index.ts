import { EventEmitter2 } from 'eventemitter2';
import { DATA_ELEMENT, UI } from '../constants';
import { EditorInterface, isNode, NodeInterface } from '../types';
import { isFirefox, isMobile } from '../utils';
import './index.css';

export type ScrollbarDragging = {
	point: number;
	position: number;
};

class Scrollbar extends EventEmitter2 {
	private editor: EditorInterface;
	private container: NodeInterface;
	private x: boolean;
	private y: boolean;
	private shadow: boolean;
	private scrollBarX?: NodeInterface;
	private slideX?: NodeInterface;
	private sildeXDragging?: ScrollbarDragging;
	private scrollBarY?: NodeInterface;
	private slideY?: NodeInterface;
	private slideYDragging?: ScrollbarDragging;
	private shadowLeft?: NodeInterface;
	private shadowRight?: NodeInterface;
	private oWidth: number = 0;
	private oHeight: number = 0;
	private sWidth: number = 0;
	private sHeight: number = 0;
	private xWidth: number = 0;
	private yHeight: number = 0;
	private maxScrollLeft: number = 0;
	shadowTimer?: NodeJS.Timeout;
	/**
	 * @param {nativeNode} container 需要添加滚动条的容器元素
	 * @param {boolean} x 横向滚动条
	 * @param {boolean} y 竖向滚动条
	 * @param {boolean} needShadow 是否显示阴影
	 */
	constructor(
		editor: EditorInterface,
		container: NodeInterface | Node,
		x: boolean = true,
		y: boolean = false,
		shadow: boolean = true,
	) {
		super();
		this.editor = editor;
		this.container = isNode(container) ? editor.$(container) : container;
		this.x = x;
		this.y = y;
		this.shadow = shadow;
		this.init();
	}

	init() {
		const { $ } = this.editor;
		if (!isFirefox && !isMobile) {
			const children = this.container.children();
			let hasScrollbar = false;
			children.each(child => {
				if ($(child).hasClass('data-scrollbar')) {
					hasScrollbar = true;
				}
			});
			if (!hasScrollbar) {
				this.container.css('position', 'relative');
				this.container.addClass('data-scrollable');
				if (this.x) {
					this.scrollBarX = $(
						`<div ${DATA_ELEMENT}="${UI}" class="data-scrollbar data-scrollbar-x "><div class="data-scrollbar-trigger"></div></div>`,
					);
					this.slideX = this.scrollBarX.find(
						'.data-scrollbar-trigger',
					);
					this.container.append(this.scrollBarX);
					this.container.addClass('scroll-x');
				}
				if (this.y) {
					this.scrollBarY = $(
						`<div ${DATA_ELEMENT}="${UI}" class="data-scrollbar data-scrollbar-y "><div class="data-scrollbar-trigger"></div></div>`,
					);
					this.slideY = this.scrollBarY.find(
						'.data-scrollbar-trigger',
					);
					this.container.append(this.scrollBarY);
					this.container.addClass('scroll-y');
				}
				if (this.shadow) {
					this.shadowLeft = $(
						`<div ${DATA_ELEMENT}="${UI}" class="scrollbar-shadow-left"></div>`,
					);
					this.shadowRight = $(
						`<div ${DATA_ELEMENT}="${UI}" class="scrollbar-shadow-right"></div>`,
					);
					this.container.append(this.shadowLeft);
					this.container.append(this.shadowRight);
				}
				this.refresh();
				this.bindEvents();
			}
		}
	}

	refresh() {
		if (!isFirefox && !isMobile) {
			const {
				offsetWidth,
				offsetHeight,
				scrollWidth,
				scrollHeight,
				scrollLeft,
				scrollTop,
			} = this.container.get<HTMLElement>()!;

			this.oWidth = offsetWidth;
			this.oHeight = offsetHeight;
			this.sWidth = scrollWidth;
			this.sHeight = scrollHeight;
			this.xWidth = Math.floor((offsetWidth * offsetWidth) / scrollWidth);
			this.yHeight = Math.floor(
				(offsetHeight * offsetHeight) / scrollHeight,
			);
			this.maxScrollLeft = scrollWidth - offsetWidth;
			if (this.x) {
				this.slideX?.css('width', this.xWidth + 'px');
				const display = this.oWidth === this.sWidth ? 'none' : 'block';
				this.slideX?.css('display', display);
				this.emit('display', display);
			}
			if (this.y) {
				this.slideY?.css('height', this.yHeight + 'px');
				const display =
					this.oHeight === this.sHeight ? 'none' : 'block';
				this.slideY?.css('display', display);
				this.emit('display', display);
			}
			this.reRenderX(scrollLeft);
			this.reRenderY(scrollTop);
		}
	}

	bindEvents() {
		this.container.on('scroll', event => {
			const { target } = event;
			const { scrollTop, scrollLeft } = target;
			this.reRenderX(scrollLeft);
			this.reRenderY(scrollTop);
		});
		this.bindXScrollEvent();
		this.bindYScrollEvent();
	}

	scrollX = (event: MouseEvent) => {
		if (this.sildeXDragging) {
			const { point, position } = this.sildeXDragging;
			let left = position + (event.clientX - point);
			left = Math.max(0, Math.min(left, this.oWidth - this.xWidth));
			this.slideX?.css('left', left + 'px');
			let min = left / (this.oWidth - this.xWidth);
			min = Math.min(1, min);
			this.container.get<HTMLElement>()!.scrollLeft =
				(this.sWidth - this.oWidth) * min;
		}
	};

	scrollY = (event: MouseEvent) => {
		if (this.slideYDragging) {
			const { point, position } = this.slideYDragging;
			let top = position + (event.clientY - point);
			top = Math.max(0, Math.min(top, this.oHeight - this.yHeight));
			this.slideY?.css('top', top + 'px');
			let min = top / (this.oHeight - this.yHeight);
			min = Math.min(1, min);
			this.container.get<HTMLElement>()!.scrollTop =
				(this.sHeight - this.oHeight) * min;
		}
	};

	scrollXEnd = () => {
		this.sildeXDragging = undefined;
		document.body.removeEventListener('mousemove', this.scrollX);
		document.body.removeEventListener('mouseup', this.scrollXEnd);
		this.container.removeClass('scrolling');
	};

	scrollYEnd = () => {
		this.slideYDragging = undefined;
		document.body.removeEventListener('mousemove', this.scrollY);
		document.body.removeEventListener('mouseup', this.scrollYEnd);
		this.container.removeClass('scrolling');
	};

	bindXScrollEvent = () => {
		if (this.x) {
			this.slideX?.on('mousedown', event => {
				this.container.addClass('scrolling');
				this.sildeXDragging = {
					point: event.clientX,
					position: parseInt(this.slideX?.css('left') || '0'),
				};
				document.body.addEventListener('mousemove', this.scrollX);
				document.body.addEventListener('mouseup', this.scrollXEnd);
			});
		}
	};

	bindYScrollEvent = () => {
		if (this.y) {
			this.slideY?.on('mousedown', event => {
				this.container.addClass('scrolling');
				this.sildeXDragging = {
					point: event.clientY,
					position: parseInt(this.slideY?.css('top') || '0'),
				};
				document.body.addEventListener('mousemove', this.scrollY);
				document.body.addEventListener('mouseup', this.scrollYEnd);
			});
		}
	};

	reRenderShadow = (width: number) => {
		if (this.shadow) {
			this.shadowLeft?.css('left', width + 'px');
			this.shadowRight?.css('left', width + this.oWidth - 4 + 'px');
			this.shadowLeft?.css('display', 'none');
			this.shadowRight?.css('display', 'none');
			if (this.shadowTimer) clearTimeout(this.shadowTimer);
			this.shadowTimer = setTimeout(() => {
				if (0 !== width) {
					this.shadowLeft?.css('display', 'block');
				}
				if (width !== this.maxScrollLeft) {
					this.shadowRight?.css('display', 'block');
				}
			}, 100);
		}
	};

	reRenderX = (left: number) => {
		if (this.x) {
			this.scrollBarX?.css('left', left + 'px');
			let min = left / (this.sWidth - this.oWidth);
			min = Math.min(1, min);
			this.slideX?.css('left', (this.oWidth - this.xWidth) * min + 'px');
			this.reRenderShadow(left);
		}
	};

	reRenderY = (top: number) => {
		if (this.y) {
			this.scrollBarY?.css('top', top + 'px');
			let min = top / (this.sHeight - this.oHeight);
			min = Math.min(1, min);
			this.slideY?.css('top', (this.oHeight - this.yHeight) * min + 'px');
		}
	};
}

export default Scrollbar;
