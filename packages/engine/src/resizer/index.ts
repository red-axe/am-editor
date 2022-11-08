import type { NodeInterface, EventListener } from '../types';
import type {
	ResizerInterface,
	ResizerOptions,
	Point,
	ResizerPosition,
	Size,
} from '../types';
import { $ } from '../node';
import { isMobile } from '../utils';
import './index.css';

class Resizer implements ResizerInterface {
	private options: ResizerOptions;
	private root: NodeInterface;
	private image?: NodeInterface;
	private resizerNumber: NodeInterface;
	private point: Point = { x: 0, y: 0 };
	private position?: ResizerPosition;
	private size: Size;
	maxWidth: number;
	/**
	 * 是否改变大小中
	 */
	private resizing: boolean = false;

	constructor(options: ResizerOptions) {
		this.options = options;
		this.root = $(this.renderTemplate(options.imgUrl));
		if (options.imgUrl) this.image = this.root.find('img');
		this.image?.hide();
		this.resizerNumber = this.root.find('.data-resizer-number');
		const { width, height } = this.options;
		this.size = {
			width,
			height,
		};
		this.maxWidth = this.options.maxWidth;
	}

	renderTemplate(imgUrl?: string) {
		return `
			<span class="data-resizer">
				${imgUrl ? `<img src="${imgUrl}">` : ''}
				<span class="data-resizer-holder data-resizer-holder-right-top"></span>
				<span class="data-resizer-holder data-resizer-holder-right-bottom"></span>
				<span class="data-resizer-holder data-resizer-holder-left-bottom"></span>
				<span class="data-resizer-holder data-resizer-holder-left-top"></span>
				<span class="data-resizer-number"></span>
			</span>`;
	}

	onMouseDown(event: MouseEvent | TouchEvent, position: ResizerPosition) {
		if (this.resizing) return;
		event.preventDefault();
		event.stopPropagation();
		this.root.css(
			'top',
			['right-top', 'left-top'].indexOf(position) > -1 ? 'auto' : 0,
		);
		this.root.css(
			'left',
			['left-top', 'left-bottom'].indexOf(position) > -1 ? 'auto' : 0,
		);
		this.root.css(
			'bottom',
			['right-bottom', 'left-bottom'].indexOf(position) > -1 ? 'auto' : 0,
		);
		this.root.css(
			'right',
			['right-top', 'right-bottom'].indexOf(position) > -1 ? 'auto' : 0,
		);
		this.point = {
			x:
				window.TouchEvent && event instanceof TouchEvent
					? event.touches[0].clientX
					: (event as MouseEvent).clientX,
			y:
				window.TouchEvent && event instanceof TouchEvent
					? event.touches[0].clientY
					: (event as MouseEvent).clientY,
		};
		this.position = position;
		this.resizing = true;
		this.root.addClass('data-resizing');
		this.resizerNumber.addClass(`data-resizer-number-${this.position}`);
		this.resizerNumber.addClass('data-resizer-number-active');
		this.image?.show();
		document.addEventListener(
			isMobile ? 'touchmove' : 'mousemove',
			this.onMouseMove,
		);
		document.addEventListener(
			isMobile ? 'touchend' : 'mouseup',
			this.onMouseUp,
		);
	}

	onMouseMove = (event: MouseEvent | TouchEvent) => {
		event.preventDefault();
		event.stopPropagation();
		const { clientX, clientY } =
			window.TouchEvent && event instanceof TouchEvent
				? event.touches[0]
				: (event as MouseEvent);

		if (clientX !== this.point.x || clientY !== this.point.y) {
			//移动后的宽度
			const width = this.point.x - clientX;
			//移动后的高度
			const height = this.point.y - clientY;
			this.updateSize(width, height);
		}
		this.resizing = true;
	};

	onMouseUp = (event: MouseEvent | TouchEvent) => {
		event.preventDefault();
		event.stopPropagation();
		const root = this.root.get<HTMLElement>();
		if (!root) return;
		const { clientWidth, clientHeight } = root;
		this.size = {
			width: clientWidth,
			height: clientHeight,
		};
		this.resizerNumber.removeClass(`data-resizer-number-${this.position}`);
		this.resizerNumber.removeClass('data-resizer-number-active');
		this.position = undefined;
		this.resizing = false;
		this.root.removeClass('data-resizing');
		document.removeEventListener(
			isMobile ? 'touchmove' : 'mousemove',
			this.onMouseMove,
		);
		document.removeEventListener(
			isMobile ? 'touchend' : 'mouseup',
			this.onMouseUp,
		);
		const { onChange } = this.options;
		if (onChange) onChange(this.size);
		this.image?.hide();
	};

	updateSize(width: number, height: number) {
		if (['right-top', 'right-bottom'].indexOf(this.position || '') > -1) {
			width = this.size.width - width;
		} else {
			width = this.size.width + width;
		}
		this.setSize(width, height);
	}

	setSize(width: number, height: number) {
		if (width < 24) {
			width = 24;
		}
		const { rate } = this.options;
		if (width > this.maxWidth) {
			width = this.maxWidth;
		}

		height = width * rate;
		if (height < 24) {
			height = 24;
			width = height / rate;
		}
		width = Math.round(width);
		height = Math.round(height);
		this.root.css({
			width: width + 'px',
			height: height + 'px',
		});
		this.resizerNumber.html(`${width}\xB7${height}`);
	}

	on(eventType: string, listener: EventListener) {
		this.root.on(eventType, listener);
	}

	off(eventType: string, listener: EventListener) {
		this.root.off(eventType, listener);
	}

	render() {
		const { width, height } = this.options;
		this.setSize(width, height);
		this.root
			.find('.data-resizer-holder-right-top')
			.on(isMobile ? 'touchstart' : 'mousedown', (event) => {
				return this.onMouseDown(event, 'right-top');
			});
		this.root
			.find('.data-resizer-holder-right-bottom')
			.on(isMobile ? 'touchstart' : 'mousedown', (event) => {
				return this.onMouseDown(event, 'right-bottom');
			});
		this.root
			.find('.data-resizer-holder-left-bottom')
			.on(isMobile ? 'touchstart' : 'mousedown', (event) => {
				return this.onMouseDown(event, 'left-bottom');
			});
		this.root
			.find('.data-resizer-holder-left-top')
			.on(isMobile ? 'touchstart' : 'mousedown', (event) => {
				return this.onMouseDown(event, 'left-top');
			});
		return this.root;
	}

	destroy() {
		this.root.remove();
		document.removeEventListener('mousemove', this.onMouseMove);
		document.removeEventListener('mouseup', this.onMouseUp);
	}
}

export default Resizer;
