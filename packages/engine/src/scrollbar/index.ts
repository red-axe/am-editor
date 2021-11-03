import { EventEmitter2 } from 'eventemitter2';
import { DATA_ELEMENT, UI } from '../constants';
import { NodeInterface } from '../types';
import { $ } from '../node';
import { isFirefox, isMobile, removeUnit } from '../utils';
import { isNode } from '../node/utils';
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
	#reverse?: boolean;
	#content?: NodeInterface;
	shadowTimer?: NodeJS.Timeout;
	#enableScroll: boolean = true;
	/**
	 * @param {nativeNode} container 需要添加滚动条的元素
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

	/**
	 * 设置滚动条内容节点
	 * @param content
	 */
	setContentNode(content?: NodeInterface | Node) {
		this.#content = content
			? isNode(content)
				? $(content)
				: content
			: content;
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
			const { offsetWidth, offsetHeight, scrollLeft, scrollTop } =
				element;

			const contentElement = this.#content?.get<HTMLElement>();
			const sPLeft = removeUnit(this.container.css('padding-left'));
			const sPRight = removeUnit(this.container.css('padding-right'));
			const sPTop = removeUnit(this.container.css('padding-top'));
			const sPBottom = removeUnit(this.container.css('padding-bottom'));
			const scrollWidth = contentElement
				? contentElement.offsetWidth + sPLeft + sPRight
				: element.scrollWidth;
			const scrollHeight = contentElement
				? contentElement.offsetHeight + sPTop + sPBottom
				: element.scrollHeight;
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
				const display =
					this.oWidth === this.sWidth ||
					(contentElement &&
						contentElement.offsetWidth <= this.oWidth)
						? 'none'
						: 'block';
				this.slideX?.css('display', display);
				this.emit('display', display);
				this.shadowLeft?.css('display', display);
				this.shadowRight?.css('display', display);
			}
			if (this.y) {
				this.slideY?.css('height', this.yHeight + 'px');
				const display =
					this.oHeight === this.sHeight ||
					(contentElement &&
						contentElement.offsetHeight <= this.oHeight)
						? 'none'
						: 'block';
				this.slideY?.css('display', display);
				this.emit('display', display);
			}
			// 实际内容宽度小于容器滚动宽度（有内容删除了）
			if (
				this.x &&
				contentElement &&
				element.scrollWidth - sPLeft - sPRight !==
					contentElement.offsetWidth
			) {
				element.scrollLeft -=
					element.scrollWidth -
					sPLeft -
					sPRight -
					contentElement.offsetWidth;
				return;
			}
			// 实际内容高度小于容器滚动高度（有内容删除了）
			if (
				this.y &&
				contentElement &&
				element.scrollHeight - sPTop - sPBottom !==
					contentElement.offsetHeight
			) {
				element.scrollTop -=
					element.scrollHeight -
					sPTop -
					sPBottom -
					contentElement.offsetHeight;
				return;
			}
			this.reRenderX(scrollLeft);
			this.reRenderY(scrollTop);
		}
	}

	/**
	 * 启用鼠标在内容节点上滚动或在移动设备使用手指滑动
	 */
	enableScroll() {
		this.#enableScroll = true;
	}
	/**
	 * 禁用鼠标在内容节点上滚动或在移动设备使用手指滑动
	 */
	disableScroll() {
		this.#enableScroll = false;
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
		if (!this.#enableScroll) return;
		if (this.x && !this.y) {
			if (this.slideX && this.slideX.css('display') !== 'none')
				this.wheelXScroll(event);
		} else if (this.y) {
			if (this.slideY && this.slideY.css('display') !== 'none')
				this.wheelYScroll(event);
		}
	};

	/**
	 * 在节点上左右滑动手指
	 * @param event
	 * @returns
	 */
	bindContainerTouchX = (event: TouchEvent) => {
		if (!event.target || !this.#enableScroll) return;
		if ($(event.target).hasClass('data-scrollbar-trigger')) return;
		// 设置滚动方向相反
		this.#reverse = true;
		this.scrollXStart(event);
	};
	/**
	 * 在节点上上下滑动手指
	 * @param event
	 * @returns
	 */
	bindContainerTouchY = (event: TouchEvent) => {
		if (!event.target || !this.#enableScroll) return;
		if ($(event.target).hasClass('data-scrollbar-trigger')) return;
		// 设置滚动方向相反
		this.#reverse = true;
		this.scrollYStart(event);
	};

	bindEvents() {
		if (isMobile) {
			// 在节点上滑动手指
			if (this.x) {
				this.container.on('touchstart', this.bindContainerTouchX);
			}
			if (this.y) {
				this.container.on('touchstart', this.bindContainerTouchY);
			}
		} else {
			// 在节点上滚动鼠标滚轮
			this.container.on(
				isFirefox ? 'DOMMouseScroll' : 'mousewheel',
				this.bindWheelScroll,
			);
		}
		this.container.on('scroll', this.scroll);
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
		// 绑定滚动条事件
		this.bindXScrollEvent();
		this.bindYScrollEvent();
	}
	/**
	 * 获取鼠标事件或者触摸事件的 clientX clientY
	 * @param event
	 * @returns
	 */
	getEventClientOffset = (event: MouseEvent | TouchEvent) => {
		if (event instanceof MouseEvent) {
			return {
				x: event.clientX,
				y: event.clientY,
			};
		}
		return {
			x: event.touches[0].clientX,
			y: event.touches[0].clientY,
		};
	};
	/**
	 * 横向滚动
	 * @param event
	 */
	scrollX = (event: MouseEvent | TouchEvent) => {
		if (this.slideXDragging) {
			const { point, position } = this.slideXDragging;
			const offset = this.getEventClientOffset(event);
			let left = this.#reverse
				? position - (offset.x - point)
				: position + (offset.x - point);
			left = Math.max(0, Math.min(left, this.oWidth - this.xWidth));
			this.slideX?.css('left', left + 'px');
			let min = left / (this.oWidth - this.xWidth);
			min = Math.min(1, min);
			this.container.get<HTMLElement>()!.scrollLeft =
				(this.sWidth - this.oWidth) * min;
		}
	};

	scrollY = (event: MouseEvent | TouchEvent) => {
		if (this.slideYDragging) {
			const { point, position } = this.slideYDragging;
			const offset = this.getEventClientOffset(event);
			let top = this.#reverse
				? position - (offset.y - point)
				: position + (offset.y - point);
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
		this.#reverse = false;
		document.body.removeEventListener(
			isMobile ? 'touchmove' : 'mousemove',
			this.scrollX,
		);
		document.body.removeEventListener(
			isMobile ? 'touchend' : 'mouseup',
			this.scrollXEnd,
		);
		this.container.removeClass('scrolling');
	};

	scrollYEnd = () => {
		this.slideYDragging = undefined;
		document.body.removeEventListener(
			isMobile ? 'touchmove' : 'mousemove',
			this.scrollY,
		);
		document.body.removeEventListener(
			isMobile ? 'touchend' : 'mouseup',
			this.scrollYEnd,
		);
		this.container.removeClass('scrolling');
	};

	scrollXStart = (event: MouseEvent | TouchEvent) => {
		const offset = this.getEventClientOffset(event);
		this.container.addClass('scrolling');
		this.slideXDragging = {
			point: offset.x,
			position: parseInt(this.slideX?.css('left') || '0'),
		};
		document.body.addEventListener(
			isMobile ? 'touchmove' : 'mousemove',
			this.scrollX,
		);
		document.body.addEventListener(
			isMobile ? 'touchend' : 'mouseup',
			this.scrollXEnd,
		);
	};

	scrollYStart = (event: MouseEvent | TouchEvent) => {
		const offset = this.getEventClientOffset(event);
		this.container.addClass('scrolling');
		this.slideYDragging = {
			point: offset.y,
			position: parseInt(this.slideY?.css('top') || '0'),
		};
		document.body.addEventListener(
			isMobile ? 'touchmove' : 'mousemove',
			this.scrollY,
		);
		document.body.addEventListener(
			isMobile ? 'touchend' : 'mouseup',
			this.scrollYEnd,
		);
	};

	bindXScrollEvent = () => {
		if (this.x) {
			this.slideX?.on(
				isMobile ? 'touchstart' : 'mousedown',
				this.scrollXStart,
			);
		}
	};

	bindYScrollEvent = () => {
		if (this.y) {
			this.slideY?.on(
				isMobile ? 'touchstart' : 'mousedown',
				this.scrollYStart,
			);
		}
	};

	reRenderShadow = (width: number) => {
		if (this.shadow) {
			this.shadowLeft?.css('left', width + 'px');
			this.shadowRight?.css('left', width + this.oWidth - 4 + 'px');
		}
	};

	reRenderX = (left: number) => {
		if (this.x) {
			this.scrollBarX?.css('left', left + 'px');
			const value = this.sWidth - this.oWidth;
			let min = value <= 0 ? 0 : left / value;
			min = Math.min(1, min);
			this.slideX?.css('left', (this.oWidth - this.xWidth) * min + 'px');
			this.reRenderShadow(left);
			this.emit('change');
		}
	};

	reRenderY = (top: number) => {
		if (this.y) {
			this.scrollBarY?.css('top', top + 'px');
			const value = this.sHeight - this.oHeight;
			let min = value <= 0 ? 0 : top / value;
			min = Math.min(1, min);
			this.slideY?.css('top', (this.oHeight - this.yHeight) * min + 'px');
			this.emit('change');
		}
	};

	destroy() {
		this.slideX?.off(
			isMobile ? 'touchstart' : 'mousedown',
			this.scrollXStart,
		);
		this.slideY?.off(
			isMobile ? 'touchstart' : 'mousedown',
			this.scrollYStart,
		);
		if (isMobile) {
			if (this.x)
				this.container.off('touchstart', this.bindContainerTouchX);
			if (this.y)
				this.container.off('touchstart', this.bindContainerTouchY);
		} else {
			this.container.off(
				isFirefox ? 'DOMMouseScroll' : 'mousewheel',
				this.bindWheelScroll,
			);
		}
		this.container.off('scroll', this.scroll);
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
