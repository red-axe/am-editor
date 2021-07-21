import { EventEmitter2 } from 'eventemitter2';
import { DATA_ELEMENT, UI } from '../constants';
import { isNode, NodeInterface } from '../types';
import { $ } from '../node';
import { isFirefox, removeUnit } from '../utils';
import './index.css';

export type ScrollbarDragging = {
	point: number;
	position: number;
};

class Scrollbar extends EventEmitter2 {
	private container: NodeInterface;
	private x: boolean;
	private y: boolean;
	private shadow: boolean;
	private scrollBarX?: NodeInterface;
	private slideX?: NodeInterface;
	private slideXDragging?: ScrollbarDragging;
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
	#observer?: MutationObserver;
	shadowTimer?: NodeJS.Timeout;
	/**
	 * @param {nativeNode} container 需要添加滚动条的容器元素
	 * @param {boolean} x 横向滚动条
	 * @param {boolean} y 竖向滚动条
	 * @param {boolean} needShadow 是否显示阴影
	 */
	constructor(
		container: NodeInterface | Node,
		x: boolean = true,
		y: boolean = false,
		shadow: boolean = true,
	) {
		super();
		this.container = isNode(container) ? $(container) : container;
		this.x = x;
		this.y = y;
		this.shadow = shadow;
		this.init();
	}

	init() {
		const children = this.container.children();
		let hasScrollbar = false;
		children.each((child) => {
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
				this.slideX = this.scrollBarX.find('.data-scrollbar-trigger');
				this.container.append(this.scrollBarX);
				this.container.addClass('scroll-x');
			}
			if (this.y) {
				this.scrollBarY = $(
					`<div ${DATA_ELEMENT}="${UI}" class="data-scrollbar data-scrollbar-y "><div class="data-scrollbar-trigger"></div></div>`,
				);
				this.slideY = this.scrollBarY.find('.data-scrollbar-trigger');
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

	refresh() {
		const element = this.container.get<HTMLElement>();
		if (element) {
			const {
				offsetWidth,
				offsetHeight,
				scrollWidth,
				scrollHeight,
				scrollLeft,
				scrollTop,
			} = element;

			this.oWidth =
				offsetWidth -
				removeUnit(this.container.css('border-left-width')) -
				removeUnit(this.container.css('border-right-width'));
			this.oHeight =
				offsetHeight -
				removeUnit(this.container.css('border-top-width')) -
				removeUnit(this.container.css('border-bottom-width'));
			this.sWidth = scrollWidth;
			this.sHeight = scrollHeight;
			this.xWidth = Math.floor((this.oWidth * this.oWidth) / scrollWidth);
			this.yHeight = Math.floor(
				(this.oHeight * this.oHeight) / scrollHeight,
			);
			this.maxScrollLeft = scrollWidth - this.oWidth;
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

	scroll = (event: Event) => {
		const { target } = event;
		if (!target) return;

		const { scrollTop, scrollLeft } = target as HTMLElement;
		this.reRenderX(scrollLeft);
		this.reRenderY(scrollTop);
	};

	wheelXScroll = (event: any) => {
		event.preventDefault();
		const wheelValue = event.wheelDelta / 120 || -event.detail;
		const dir = wheelValue > 0 ? 'up' : 'down';
		const containerElement = this.container.get<HTMLElement>();
		if (!containerElement) return;
		let left = containerElement.scrollLeft + (dir === 'up' ? -20 : 20);
		left =
			dir === 'up'
				? Math.max(0, left)
				: Math.min(left, this.sWidth - this.oWidth);
		containerElement.scrollLeft = left;
	};

	wheelYScroll = (event: any) => {
		event.preventDefault();
		const wheelValue = event.wheelDelta / 120 || -event.detail;
		const dir = wheelValue > 0 ? 'up' : 'down';
		const containerElement = this.container.get<HTMLElement>();
		if (!containerElement) return;
		let top = containerElement.scrollTop + (dir === 'up' ? -20 : 20);
		top =
			dir === 'up'
				? Math.max(0, top)
				: Math.min(top, this.sHeight - this.oHeight);
		containerElement.scrollTop = top;
	};

	bindWheelScroll = (event: any) => {
		if (this.x && !this.y) {
			this.wheelXScroll(event);
		} else if (this.y) {
			this.wheelYScroll(event);
		}
	};

	bindEvents() {
		this.container.on('scroll', this.scroll);
		this.container.on(
			isFirefox ? 'DOMMouseScroll' : 'mousewheel',
			this.bindWheelScroll,
		);
		const containerElement = this.container.get<HTMLElement>();
		if (!containerElement) return;
		let size = {
			width: this.container.width(),
			height: this.container.height(),
		};
		this.#observer = new MutationObserver(() => {
			const width = this.container.width();
			const height = this.container.height();
			if (width === size.width && height === size.height) return;
			size = {
				width,
				height,
			};
			this.refresh();
		});
		this.#observer.observe(containerElement, {
			attributes: true,
			attributeFilter: ['style'],
			attributeOldValue: true,
			childList: true,
			subtree: true,
		});

		this.bindXScrollEvent();
		this.bindYScrollEvent();
	}

	scrollX = (event: MouseEvent) => {
		if (this.slideXDragging) {
			const { point, position } = this.slideXDragging;
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
		this.slideXDragging = undefined;
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

	scrollXStart = (event: MouseEvent) => {
		this.container.addClass('scrolling');
		this.slideXDragging = {
			point: event.clientX,
			position: parseInt(this.slideX?.css('left') || '0'),
		};
		document.body.addEventListener('mousemove', this.scrollX);
		document.body.addEventListener('mouseup', this.scrollXEnd);
	};

	scrollYStart = (event: MouseEvent) => {
		this.container.addClass('scrolling');
		this.slideYDragging = {
			point: event.clientY,
			position: parseInt(this.slideY?.css('top') || '0'),
		};
		document.body.addEventListener('mousemove', this.scrollY);
		document.body.addEventListener('mouseup', this.scrollYEnd);
	};

	bindXScrollEvent = () => {
		if (this.x) {
			this.slideX?.on('mousedown', this.scrollXStart);
		}
	};

	bindYScrollEvent = () => {
		if (this.y) {
			this.slideY?.on('mousedown', this.scrollYStart);
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

	destroy() {
		this.container.off('scroll', this.scroll);
		this.slideX?.off('mousedown', this.scrollXStart);
		this.slideY?.off('mousedown', this.scrollYStart);
		this.container.off(
			isFirefox ? 'DOMMouseScroll' : 'mousewheel',
			this.bindWheelScroll,
		);
		this.container.removeClass('data-scrollable');
		if (this.x) {
			this.scrollBarX?.remove();
			this.container.removeClass('scroll-x');
		}
		if (this.y) {
			this.scrollBarY?.remove();
			this.container.removeClass('scroll-y');
		}
		if (this.shadow) {
			this.shadowLeft?.remove();
			this.shadowRight?.remove();
		}
		this.#observer?.disconnect();
	}
}

export default Scrollbar;
