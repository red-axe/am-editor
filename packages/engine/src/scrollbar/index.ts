import { EventEmitter2 } from 'eventemitter2';
import throttle from 'lodash/throttle';
import { DATA_ELEMENT, UI } from '../constants';
import { NodeInterface } from '../types';
import { $ } from '../node';
import { isFirefox, isMacos, isMobile, removeUnit } from '../utils';
import { isNode } from '../node/utils';
import './index.css';

export type ScrollbarDragging = {
	point: number;
	position: number;
};

export type ScrollbarCustomeOptions = {
	onScrollX?: (x: number) => number;
	getOffsetWidth?: (width: number) => number;
	getScrollLeft?: (left: number) => number;
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
	#observer?: ResizeObserver;
	#reverse?: boolean;
	#content?: NodeInterface;
	shadowTimer?: NodeJS.Timeout;
	#enableScroll: boolean = true;
	#scroll?: ScrollbarCustomeOptions;
	#isScrolling = false;
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
		scroll?: ScrollbarCustomeOptions,
	) {
		super();
		this.container = isNode(container) ? $(container) : container;
		this.x = x;
		this.y = y;
		this.shadow = shadow;
		this.#scroll = scroll;
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
			if (!hasScrollbar && $(child).hasClass('data-scrollbar')) {
				hasScrollbar = true;
			}
		});
		if (!hasScrollbar) {
			this.container.css('position', 'relative');
			this.container.addClass('data-scrollable');
			if (this.x) {
				this.scrollBarX = $(
					`<div ${DATA_ELEMENT}="${UI}" class="data-scrollbar data-scrollbar-x"><div class="data-scrollbar-trigger"></div></div>`,
				);
				this.slideX = this.scrollBarX.find('.data-scrollbar-trigger');
				this.container.append(this.scrollBarX);
				this.container.addClass('scroll-x');
			}
			if (this.y) {
				this.scrollBarY = $(
					`<div ${DATA_ELEMENT}="${UI}" class="data-scrollbar data-scrollbar-y"><div class="data-scrollbar-trigger"></div></div>`,
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

	getWidth() {
		const element = this.container.get<HTMLElement>();
		if (!element) return 0;
		const width = this.container.width();
		const offsetWidth = this.#scroll?.getOffsetWidth
			? this.#scroll.getOffsetWidth(width)
			: width;
		return offsetWidth;
	}

	refresh = () => {
		const element = this.container.get<HTMLElement>();
		if (element) {
			const scrollEnd = () => {
				setTimeout(() => {
					this.#isScrolling = false;
				}, 0);
			};
			const { scrollTop } = element;
			const contentElement = this.#content?.get<HTMLElement>();
			const sPLeft = removeUnit(this.container.css('padding-left'));
			const sPRight = removeUnit(this.container.css('padding-right'));
			const sPTop = removeUnit(this.container.css('padding-top'));
			const sPBottom = removeUnit(this.container.css('padding-bottom'));
			const scrollWidth = contentElement
				? this.#content!.width() + sPLeft + sPRight
				: element.scrollWidth;
			const scrollHeight = contentElement
				? this.#content!.height() + sPTop + sPBottom
				: element.scrollHeight;
			this.oWidth = this.getWidth();
			this.oHeight =
				this.container.height() -
				removeUnit(this.container.css('border-top-width')) -
				removeUnit(this.container.css('border-bottom-width'));
			this.sWidth = scrollWidth;
			this.sHeight = scrollHeight;
			this.xWidth = Math.floor((this.oWidth * this.oWidth) / scrollWidth);
			this.yHeight = Math.floor(
				(this.oHeight * this.oHeight) / scrollHeight,
			);
			if (this.x) {
				this.slideX?.css('width', this.xWidth + 'px');
				const display =
					Math.round(this.oWidth) - sPLeft - sPRight ===
						this.sWidth ||
					(contentElement &&
						Math.round(this.#content!.width()) <=
							Math.round(this.oWidth - sPLeft - sPRight))
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
					Math.round(this.oHeight) - sPTop - sPBottom ===
						this.sHeight ||
					(contentElement &&
						Math.round(this.#content!.height()) <=
							Math.round(this.oHeight - sPTop - sPBottom))
						? 'none'
						: 'block';
				this.slideY?.css('display', display);
				this.emit('display', display);
			}
			// 实际内容宽度小于容器滚动宽度（有内容删除了）
			if (
				this.x &&
				contentElement &&
				element.scrollWidth - sPLeft - sPRight > this.#content!.width()
			) {
				this.#isScrolling = true;
				let left =
					element.scrollWidth -
					sPLeft -
					sPRight -
					this.#content!.width();
				if (this.#scroll) {
					const { onScrollX, getScrollLeft } = this.#scroll;

					left = getScrollLeft
						? getScrollLeft(-0) + element.scrollLeft - left
						: element.scrollLeft - left;
					if (left < 0) left = 0;
					if (onScrollX) {
						const result = onScrollX(left);
						if (result > 0) element.scrollLeft = result;
						else element.scrollLeft = 0;
					}
					this.scroll({ left });
				} else {
					element.scrollLeft -= left;
					scrollEnd();
				}
				return;
			}
			// 实际内容高度小于容器滚动高度（有内容删除了）
			if (
				this.y &&
				contentElement &&
				element.scrollHeight - sPTop - sPBottom !==
					this.#content!.height()
			) {
				this.#isScrolling = true;
				element.scrollTop -=
					element.scrollHeight -
					sPTop -
					sPBottom -
					this.#content!.height();
				scrollEnd();
				return;
			}
			const left = this.#scroll?.getScrollLeft
				? this.#scroll.getScrollLeft(element.scrollLeft)
				: element.scrollLeft;
			if (this.#scroll) {
				const { onScrollX } = this.#scroll;
				if (onScrollX) {
					this.#isScrolling = true;
					const result = onScrollX(left);
					if (result > 0) element.scrollLeft = result;
					else element.scrollLeft = 0;
					scrollEnd();
				}
				this.scroll({ left });
			} else {
				this.reRenderX(left);
			}
			this.reRenderY(scrollTop);
		}
	};

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

	scroll = (event: Event | { top?: number; left?: number }) => {
		let top = 0;
		let left = 0;
		if (!this.#scroll && event instanceof Event) {
			const { scrollTop, scrollLeft } = event.target as HTMLElement;
			top = scrollTop;
			left = scrollLeft;
		} else if (!(event instanceof Event)) {
			if (event.top === undefined) {
				event.top = this.container.get<HTMLElement>()?.scrollTop || 0;
			}
			if (event.left === undefined) {
				event.left = this.container.get<HTMLElement>()?.scrollLeft || 0;
			}
			top = event.top;
			left = event.left;
		} else if (!this.#isScrolling) {
			this.refresh();
			return;
		} else return;

		this.reRenderX(left);
		this.reRenderY(top);
	};
	wheelXScroll = throttle(
		(event: any) => {
			event.preventDefault();
			const dir =
				(isMacos
					? event.wheelDeltaX
					: event.wheelDelta / 120 || -event.detail) > 0
					? 'up'
					: 'down';
			const containerElement = this.container.get<HTMLElement>();
			if (!containerElement) return;
			const width = this.container.width();
			const containerWidth = this.#scroll?.getOffsetWidth
				? this.#scroll.getOffsetWidth(width)
				: width;
			const step = Math.max(
				containerWidth /
					(isMacos ? 20 - Math.abs(event.wheelDelta) : 8),
				20,
			);

			let left =
				(this.#scroll?.getScrollLeft
					? this.#scroll.getScrollLeft(containerElement.scrollLeft)
					: containerElement.scrollLeft) +
				(dir === 'up' ? -step : step);

			left =
				dir === 'up'
					? Math.max(0, left)
					: Math.min(left, this.sWidth - this.oWidth);
			if (this.#scroll) {
				const { onScrollX } = this.#scroll;
				if (onScrollX) {
					const result = onScrollX(left);
					if (result > 0) containerElement.scrollLeft = result;
					else containerElement.scrollLeft = 0;
				}
				this.scroll({ left });
			} else {
				containerElement.scrollLeft = left;
			}
		},
		isMacos ? 50 : 0,
		{ trailing: true },
	);

	wheelYScroll = throttle(
		(event: any) => {
			event.preventDefault();
			const dir =
				(isMacos
					? event.wheelDeltaX
					: event.wheelDelta / 120 || -event.detail) > 0
					? 'up'
					: 'down';
			const containerElement = this.container.get<HTMLElement>();
			if (!containerElement) return;
			const containerHeight = this.container.height();
			const step = Math.max(
				containerHeight /
					(isMacos ? 20 - Math.abs(event.wheelDelta) : 8),
				20,
			);
			let top =
				containerElement.scrollTop + (dir === 'up' ? -step : step);
			top =
				dir === 'up'
					? Math.max(0, top)
					: Math.min(top, this.sHeight - this.oHeight);
			containerElement.scrollTop = top;
		},
		isMacos ? 100 : 0,
		{ trailing: true },
	);

	bindWheelScroll = (event: any) => {
		if (!this.#enableScroll) return;
		// 滚轮x和y一致并且x的绝对值要大于y的绝对值才做横向滚动
		let isX =
			this.x &&
			event.wheelDeltaX !== event.wheelDeltaY &&
			Math.abs(event.wheelDeltaX) > Math.abs(event.wheelDeltaY);
		if (isX) {
			if (this.slideX && this.slideX.css('display') !== 'none') {
				this.wheelXScroll(event);
			}
		} else if (this.y && event.wheelDeltaY !== 0) {
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
				this.container.on('touchstart', this.bindContainerTouchX, {
					passive: true,
				});
			}
			if (this.y) {
				this.container.on('touchstart', this.bindContainerTouchY, {
					passive: true,
				});
			}
		} else {
			// 在节点上滚动鼠标滚轮
			this.container.on(
				isFirefox ? 'DOMMouseScroll' : 'mousewheel',
				this.bindWheelScroll,
			);
		}
		this.container.on('scroll', this.scroll, {
			passive: true,
		});
		const containerElement = this.container.get<HTMLElement>();
		if (!containerElement) return;
		// this.#observer = new ResizeObserver(() => {
		// 	console.log('resize')
		// 	this.refresh();
		// });
		// this.#observer.observe(containerElement);
		window.addEventListener('resize', this.refresh);
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
			const containerElement = this.container.get<HTMLElement>()!;
			const x = (this.sWidth - this.oWidth) * min;
			if (this.#scroll) {
				const { onScrollX } = this.#scroll;
				if (onScrollX) {
					const result = onScrollX(x);
					if (result > 0) containerElement.scrollLeft = result;
					else containerElement.scrollLeft = 0;
				}
				this.scroll({ left: x });
			} else {
				containerElement.scrollLeft = x;
			}
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
			{ passive: true },
		);
		document.body.addEventListener(
			isMobile ? 'touchend' : 'mouseup',
			this.scrollXEnd,
			{ passive: true },
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
			{ passive: true },
		);
		document.body.addEventListener(
			isMobile ? 'touchend' : 'mouseup',
			this.scrollYEnd,
			{ passive: true },
		);
	};

	bindXScrollEvent = () => {
		if (this.x) {
			this.slideX?.on(
				isMobile ? 'touchstart' : 'mousedown',
				this.scrollXStart,
				{ passive: true },
			);
		}
	};

	bindYScrollEvent = () => {
		if (this.y) {
			this.slideY?.on(
				isMobile ? 'touchstart' : 'mousedown',
				this.scrollYStart,
				{ passive: true },
			);
		}
	};

	reRenderShadow = (width: number) => {
		if (this.shadow) {
			const element = this.container.get<HTMLElement>();
			if (element) {
				this.shadowLeft?.css(
					'left',
					(this.#scroll ? element.scrollLeft : width) + 'px',
				);
			}
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
			this.emit('change', {
				x: left,
				y: removeUnit(this.scrollBarY?.css('top') || '0'),
			});
			this.oWidth = this.getWidth();
			this.reRenderShadow(left);
		}
	};

	reRenderY = (top: number) => {
		if (this.y) {
			this.scrollBarY?.css('top', top + 'px');
			const value = this.sHeight - this.oHeight;
			let min = value <= 0 ? 0 : top / value;
			min = Math.min(1, min);
			this.slideY?.css('top', (this.oHeight - this.yHeight) * min + 'px');
			this.emit('change', {
				x: removeUnit(this.scrollBarX?.css('left') || '0'),
				y: top,
			});
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
		window.removeEventListener('resize', this.refresh);
		window.removeEventListener('scroll', this.refresh);
	}
}

export default Scrollbar;
