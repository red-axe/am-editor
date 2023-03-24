import React from 'react';
import classnames from 'classnames-es-ts';
import {
	AnyColor,
	Colord,
	colord,
	HslaColor,
	HsvaColor,
	RgbaColor,
} from 'colord';
import { EngineInterface } from '@aomao/engine';
import Palette from './palette';

export type ColorPickerItemProps = {
	engine: EngineInterface;
	color: string;
	activeColors: Array<string>;
	setStroke?: boolean;
	onSelect?: (color: string, event: React.MouseEvent) => void;
};

const ColorPickerItem: React.FC<ColorPickerItemProps> = ({
	engine,
	color,
	activeColors,
	setStroke,
	onSelect,
}) => {
	const toState = (
		color: (AnyColor | Colord) & {
			hex?: string;
			h?: string;
			source?: string;
		},
		oldHue?: number,
	) => {
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
	};

	const getContrastingColor = (color: {
		hsl: HslaColor;
		hex: string;
		rgb: RgbaColor;
		hsv: HsvaColor;
		oldHue: any;
		source: any;
	}) => {
		if (color.hex === 'transparent') {
			return 'rgba(0,0,0,0.4)';
		}

		const yiq =
			(color.rgb.r * 299 + color.rgb.g * 587 + color.rgb.b * 114) / 1000;
		return yiq >= 210 ? '#8C8C8C' : '#FFFFFF';
	};

	const triggerSelect = (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		if (onSelect) onSelect(color, event);
	};
	const state = toState(color || '#FFFFFF');
	//接近白色的颜色，需要添加一个边框。不然看不见
	const needBorder =
		['#ffffff', '#fafafa', 'transparent'].indexOf(state.hex) >= 0;
	//是否激活
	const active = activeColors.indexOf(color) >= 0;
	const special = 'transparent' === color;
	const styles: any = {
		check: {
			fill: getContrastingColor(state),
			display: active ? 'block' : 'none',
		},
		block: {
			backgroundColor: color,
		},
	};
	if (setStroke) {
		styles.block.border = '1px solid '.concat(Palette.getStroke(color));
	}
	return (
		<span
			className={classnames('colorpicker-group-item', {
				'colorpicker-group-item-border': needBorder,
				'colorpicker-group-item-active': active,
				'colorpicker-group-item-special': special,
			})}
			onClick={triggerSelect}
			title={
				engine.language.get('toolbar', 'colorPicker')[
					color.toUpperCase()
				]
			}
		>
			<span style={styles.block}>
				<svg style={styles.check} viewBox="0 0 18 18">
					<path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
				</svg>
			</span>
		</span>
	);
};

export default ColorPickerItem;
