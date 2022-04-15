import {
	$,
	DATA_ELEMENT,
	NodeInterface,
	UI,
	TRIGGER_CARD_ID,
	isMobile,
} from '@aomao/engine';

export type Options = {
	colors: Array<{
		background: string;
		color: string;
	}>;
	onFocus?: () => void;
	onBlur?: () => void;
	onChange?: (
		value: string,
		color?: {
			background: string;
			color: string;
		},
	) => void;
	onOk?: (event: MouseEvent) => void;
	onDestroy?: () => void;
};

class StatusEditor {
	protected options: Options;
	protected container?: NodeInterface;
	#color?: {
		background: string;
		color: string;
	};
	#value?: string;

	constructor(options: Options) {
		this.options = options;
	}

	focus() {
		this.container?.find('input').get<HTMLTextAreaElement>()?.focus();
	}

	change() {
		const { onChange } = this.options;
		if (onChange) onChange(this.#value!, this.#color);
	}

	updateActive(color: { background: string; color: string }) {
		const svgElements = this.container?.find('svg');
		svgElements?.css('display', 'none');
		const index = this.options.colors.findIndex(
			(c) => c.background === color.background && c.color === color.color,
		);
		if (index > -1) {
			svgElements?.eq(index)?.css('display', 'block');
		} else {
			this.#color = undefined;
		}
	}

	render(
		cardId: string,
		defaultValue: string,
		defaultColor: {
			background: string;
			color: string;
		},
	) {
		this.destroy();
		this.#value = defaultValue;
		this.#color = defaultColor;
		this.container = $(
			`<div class="data-card-status-editor${
				isMobile ? ' data-card-status-editor-mobile' : ''
			}" ${DATA_ELEMENT}="${UI}" ${TRIGGER_CARD_ID}="${cardId}"></div>`,
		);

		const { colors, onBlur, onFocus, onOk } = this.options;
		const input = $(`<input value="${defaultValue}" />`);

		input.on('focus', () => {
			if (onFocus) onFocus();
		});

		input.on('blur', () => {
			if (onBlur) onBlur();
		});

		input.on('input', (event: KeyboardEvent) => {
			this.#value = (event.target as HTMLTextAreaElement).value;
			this.change();
		});

		input.on(
			isMobile ? 'touchstart' : 'mousedown',
			(event: MouseEvent | TouchEvent) => {
				//event.preventDefault();
				//input.get<HTMLInputElement>()?.focus();
			},
		);
		if (onOk) {
			input.on('keydown', (event) => {
				if (-1 !== [13, 27].indexOf(event.keyCode)) {
					onOk(event);
				}
			});
		}

		this.container.append(input);
		const colorPanle = $(
			`<div class="data-status-editor-color-panle"></div>`,
		);
		colors.forEach((color) => {
			const item = $(`<span><span style="background-color:${
				color.background
			}"><svg 
            style="fill: ${
				color.background.toUpperCase() === '#8C8C8C'
					? '#FFFFFF'
					: '#8C8C8C'
			}; 
            display: ${
				color.background === defaultColor.background &&
				color.color === defaultColor.color
					? 'block'
					: 'none'
			};" 
            viewBox="0 0 18 18"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg></span></span>`);

			item.on('mousedown', (event: MouseEvent) => {
				event.preventDefault();
				this.#color = color;
				this.change();
			});
			colorPanle.append(item);
		});
		this.container.append(colorPanle);
		return this.container;
	}

	destroy() {
		this.container?.remove();
		const { onDestroy } = this.options;
		if (onDestroy) onDestroy();
	}
}

export default StatusEditor;
