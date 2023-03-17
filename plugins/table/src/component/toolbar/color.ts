import {
	$,
	DATA_ELEMENT,
	NodeInterface,
	UI,
	TRIGGER_CARD_ID,
	isMobile,
	EditorInterface,
	Position,
} from '@aomao/engine';
import {
	AnyColor,
	Colord,
	colord,
	HslaColor,
	HsvaColor,
	RgbaColor,
} from 'colord';
import Palette from './palette';

export type Options = {
	colors: Array<
		Array<{
			color: string;
			border?: string;
		}>
	>;
	defaultColor?: string;
	onChange?: (color: string) => void;
	onDestroy?: () => void;
};

class Color {
	#editor: EditorInterface;
	#options: Options;
	#color: string;
	#button: NodeInterface;
	#cardId: string;
	#container?: NodeInterface;
	#position?: Position;

	constructor(editor: EditorInterface, cardId: string, options: Options) {
		this.#editor = editor;
		this.#cardId = cardId;
		this.#options = options;
		this.#position = new Position(this.#editor);
		this.#color = options.defaultColor || 'transparent';
		this.#button = $(`<div class="table-color-dropdown-trigger">
        <button type="button" class="table-color-dropdown-button-text">
            <svg width="16px" height="16px" viewBox="0 0 16 16" style="margin-bottom: ${
				this.#color === 'transparent' ? -5 : -3
			}">
                <g ="none" strokeWidth="1" fill="none" fillRule="evenodd">
                    <path d="M11.9745711,7.921875 C11.9745711,7.921875 13.2147672,9.2863447 13.2147672,10.1226326 C13.2147672,10.8142992 12.6566789,11.3802083 11.9745711,11.3802083 C11.2924632,11.3802083 10.734375,10.8142992 10.734375,10.1226326 C10.734375,9.2863447 11.9745711,7.921875 11.9745711,7.921875 Z M9.07958999,6.47535893 L6.28501575,3.68078468 L3.4904415,6.47535893 L9.07958999,6.47535893 Z M5.3326566,3.04215357 L4.28223263,1.9917296 C4.22692962,1.93642659 4.22692962,1.84676271 4.28223263,1.7914597 L5.03228902,1.0414033 C5.08759203,0.986100299 5.17725591,0.986100299 5.23255892,1.0414033 L6.4546098,2.26345418 C6.46530408,2.27146914 6.4755605,2.28033918 6.48528564,2.29006432 L10.4848531,6.28963174 C10.5954591,6.40023775 10.5954591,6.57956552 10.4848531,6.69017153 L6.4838816,10.691143 C6.37327559,10.801749 6.19394782,10.801749 6.08334181,10.691143 L2.08377439,6.69157557 C1.97316838,6.58096956 1.97316838,6.40164179 2.08377439,6.29103578 L5.3326566,3.04215357 Z" fill="#595959"/>
                    <rect stroke="${Palette.getStroke(this.#color)}" fill="${
			this.#color
		}" strokeWidth="0.5" x="2" y="12.75" width="12" height="1.5" rx="0.125" />
                </g>
            </svg>
        </button>
        <button type="button" class="table-color-dropdown-arrow">
            <span class="table-color-dropdown-empty"></span>
            <span class="data-icon data-icon-arrow"></span>
        </button>
        </div>`);
		this.#button
			.find('.table-color-dropdown-arrow')
			.on('mousedown', (event: MouseEvent) => {
				event.preventDefault();
				if (
					this.#container !== undefined &&
					this.#container.length > 0
				) {
					this.remove();
				} else this.render();
			});
		this.#button
			.find('.table-color-dropdown-button-text')
			.on('mousedown', (event: MouseEvent) => {
				event.preventDefault();
				const { onChange } = this.#options;
				if (onChange) onChange(this.#color!);
			});
	}

	getButton() {
		return this.#button;
	}

	select(color: string) {
		const stroke = Palette.getStroke(color);
		const rectElement = this.#button.find('rect');
		rectElement.attributes('stroke', stroke);
		rectElement.attributes('fill', color);
		this.#button
			.find('svg')
			.css('margin-bottom', color === 'transparent' ? -5 : -3);
	}

	change(color: string) {
		this.#color = color;
		this.select(color);
		const { onChange } = this.#options;
		if (onChange) onChange(color);
	}

	toState(
		color: (AnyColor | Colord) & {
			hex?: string;
			h?: string;
			source?: string;
		},
		oldHue?: number,
	) {
		let c = color.hex ?? color;
		if (c === 'transparent') {
			c = 'rgba(0,0,0,0)';
		}
		const tinyColor = colord(c);
		const hsl = tinyColor.toHsl();
		const hsv = tinyColor.toHsv();
		const rgb = tinyColor.toRgb();
		const hex = tinyColor.toHex();

		if (hsl.s === 0) {
			hsl.h = oldHue || 0;
			hsv.h = oldHue || 0;
		}

		const transparent = hex === '000000' && rgb.a === 0;
		return {
			hsl: hsl,
			hex: transparent ? 'transparent' : '#'.concat(hex),
			rgb: rgb,
			hsv: hsv,
			oldHue: color['h'] || oldHue || hsl.h,
			source: color['source'],
		};
	}

	render() {
		this.#container = $(
			`<div class="data-table-color-tool${
				isMobile ? ' data-table-color-tool-mobile' : ''
			}" ${DATA_ELEMENT}="${UI}" ${TRIGGER_CARD_ID}="${
				this.#cardId
			}"></div>`,
		);

		const colorPanle = $(`<div class="data-table-color-tool-panle"></div>`);
		const { colors } = this.#options;

		const getItem = (
			color: { color: string; border?: string },
			display?: boolean,
		) => {
			//接近白色的颜色，需要添加一个边框。不然看不见
			const state = this.toState(color.color || '#FFFFFF');
			const needBorder =
				['#ffffff', '#fafafa', 'transparent'].indexOf(state.hex) >= 0;
			const item = $(`<span class="data-table-color-tool-item${
				needBorder ? ' data-table-color-tool-border' : ''
			}"><span style="background-color:${color.color}${
				color.border
					? `;${
							!needBorder
								? `border:1px solid ${color.border}`
								: ''
					  }`
					: ''
			}"><svg
            style="fill: ${
				color.color.toUpperCase() === '#8C8C8C' ? '#FFFFFF' : '#8C8C8C'
			};
            display: ${
				color.color === this.#color && display !== false
					? 'block'
					: 'none'
			};"
            viewBox="0 0 18 18"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg></span></span>`);
			item.on('mousedown', (event: MouseEvent) => {
				event.preventDefault();
				event.stopPropagation();
				colorPanle.find('svg').each((svg) => {
					(svg as SVGAElement).style.display = 'none';
				});
				if (display !== false) item.find('svg').css('display', 'block');
				this.change(color.color);
			});
			return item;
		};

		const defaultItem = $(
			`<div class="data-table-color-tool-group data-table-color-tool-default"></div>`,
		);
		const item = getItem({ color: 'transparent' }, false);
		defaultItem.append(item);
		defaultItem.on('mousedown', (event: MouseEvent) => {
			event.preventDefault();
			colorPanle.find('svg').each((svg) => {
				(svg as SVGAElement).style.display = 'none';
			});
			this.change('transparent');
		});
		const nofillText = this.#editor.language.get(
			'table',
			'color',
			'nonFillText',
		);
		defaultItem.append(
			$(
				`<span class="data-table-color-tool-default-text">${nofillText}</span>`,
			),
		);
		this.#container.append(defaultItem);

		colors.forEach((group) => {
			const groupElement = $(
				`<div class="data-table-color-tool-group"></div>`,
			);
			group.forEach((color) => {
				const item = getItem(color);
				groupElement.append(item);
			});
			colorPanle.append(groupElement);
		});
		this.#container.append(colorPanle);
		this.#position?.bind(this.#container, this.#button);
		document.addEventListener('mousedown', this.windowClick, true);
	}

	windowClick = (event: MouseEvent) => {
		const { target } = event;
		if (!target) return;
		if (
			$(target).closest(
				'.data-table-color-tool,.table-color-dropdown-arrow',
			).length === 0
		)
			this.remove();
	};

	remove() {
		this.#container?.remove();
		this.#position?.destroy();
		document.removeEventListener('mousedown', this.windowClick, true);
		this.#container = undefined;
	}

	destroy() {
		this.remove();
		const { onDestroy } = this.#options;
		if (onDestroy) onDestroy();
	}
}

export default Color;
