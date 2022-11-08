import {
	DrawOptions,
	DrawStyle,
	TinyCanvasInterface,
} from '../types/tiny-canvas';

type Options = {
	container?: HTMLElement;
	limitHeight?: number;
	canvasCache?: Array<HTMLCanvasElement>;
	canvasCount?: number;
};

type CallbackOptions = DOMRect & {
	context: CanvasRenderingContext2D | null;
};

type HandleOptions = DOMRect & {
	callback: (options: CallbackOptions) => void;
};

class TinyCanvas implements TinyCanvasInterface {
	private options: Options = {
		limitHeight: 5000,
		canvasCache: [],
		canvasCount: 0,
	};

	private width: number = 0;
	private height: number = 0;

	constructor(options: Options) {
		if (!options.container) throw new Error('need a cantainer!');
		this.options = { ...this.options, ...options };
		options.container.style['line-height'] = '0px';
	}

	private removeCanvas() {
		const { canvasCache } = this.options;
		canvasCache?.forEach((canvas) => {
			canvas?.parentElement?.removeChild(canvas);
		});
		this.options.canvasCache = [];
		this.options.canvasCount = 0;
	}

	private getCanvas(key: number) {
		const { canvasCache } = this.options;
		key = key > 0 ? key - 1 : key;
		return canvasCache ? canvasCache[key] : undefined;
	}

	resize(width: number, height: number) {
		if (this.width === width && this.height === height) return;
		this.width = width;
		this.height = height;
		const { limitHeight, canvasCount, container } = this.options;
		let { canvasCache } = this.options;
		const index = Math.ceil(height / (limitHeight || 0));
		if (index !== canvasCount) {
			this.removeCanvas();
			canvasCache = [];
			for (let i = 0; i < index; i++) {
				const canvas = document.createElement('canvas');
				canvas.style['vertical-align'] = 'bottom';
				canvas.setAttribute('width', width.toString());
				if (i === index - 1) {
					canvas.setAttribute(
						'height',
						(height % (limitHeight || 0)).toString(),
					);
				} else {
					canvas.setAttribute(
						'height',
						(limitHeight || 0).toString(),
					);
				}
				container?.appendChild(canvas);
				canvasCache.push(canvas);
			}
			this.options.canvasCache = canvasCache;
			this.options.canvasCount = canvasCache.length;
		} else {
			const canvas = this.getCanvas(index);
			canvasCache?.forEach((can) => {
				const w = can.getAttribute('width');
				if (!w || parseInt(w) !== width) {
					can.setAttribute('width', width.toString());
				}
			});
			if (canvas) {
				const h = canvas.getAttribute('height');
				const nh = height % (limitHeight || 0);
				if (!h || parseInt(h) !== nh) {
					canvas.setAttribute('height', nh.toString());
				}
			}
		}
	}

	private handleSingleRect(options: HandleOptions & { index: number }) {
		const { x, y, index, width, height, callback } = options;
		const { limitHeight } = this.options;
		const canvas = this.getCanvas(index);
		if (canvas) {
			const context = canvas.getContext('2d');
			const rect = new DOMRect(
				x,
				y - (limitHeight || 0) * (index - 1),
				width,
				height,
			);
			callback(
				Object.assign({}, rect.toJSON(), {
					context,
				}),
			);
		}
	}

	handleFillRect(options: CallbackOptions & DrawStyle) {
		const { context, x, y, width, height, fill, stroke } = options;
		if (!context) return;
		context.fillStyle = fill === undefined ? '#FFEC3D' : fill;
		context.strokeStyle = stroke === undefined ? '#FFEC3D' : stroke;
		context.fillRect(x, y, width, height);
	}

	drawRect(options: DrawOptions) {
		const { x, y, width, height, fill, stroke } = options;
		const rect = new DOMRect(x, y, width, height);
		this.handleRect(
			Object.assign({}, rect.toJSON(), {
				callback: (options: CallbackOptions) => {
					this.handleFillRect(
						Object.assign({}, options, { fill, stroke }),
					);
				},
			}),
		);
	}

	private handleRect(options: HandleOptions) {
		const { x, y, width, height, callback } = options;
		const { limitHeight } = this.options;
		const last = {
			x: x + width,
			y: y + height,
		};
		const dftIndex = Math.ceil(y / (limitHeight || 0));
		const lastIndex = Math.ceil(last.y / (limitHeight || 0));
		const rect = new DOMRect(x, y, width, height);
		const rectJson = rect.toJSON();
		this.handleSingleRect(
			Object.assign({}, rectJson, {
				index: dftIndex,
				callback,
			}),
		);
		if (dftIndex !== lastIndex) {
			this.handleSingleRect(
				Object.assign({}, rectJson, {
					index: lastIndex,
					callback,
				}),
			);
		}
	}

	getImageData(options: DOMRect) {
		const { x, y, width, height } = options;
		const { limitHeight } = this.options;
		const index = Math.ceil(y / (limitHeight || 0));
		const canvas = this.getCanvas(index);
		const context = canvas?.getContext('2d');
		return context?.getImageData(x, y, width, height);
	}

	handleClear = (opts: CallbackOptions) => {
		const { context, x, y, width, height } = opts;
		context?.clearRect(x, y, width, height);
	};

	clearRect(options: DOMRect) {
		const { x, y, width, height } = options;
		const rect = new DOMRect(x, y, width, height);
		this.handleRect(
			Object.assign({}, rect.toJSON(), {
				callback: this.handleClear,
			}),
		);
	}

	clear() {
		const { canvasCache } = this.options;
		canvasCache?.forEach((canvas) => {
			const context = canvas.getContext('2d');
			const width = Number(canvas.getAttribute('width'));
			const height = Number(canvas.getAttribute('height'));
			context?.clearRect(0, 0, width, height);
		});
	}

	destroy() {
		this.removeCanvas();
	}
}
export default TinyCanvas;
