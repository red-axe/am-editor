<template>
	<span
		:class="[
			'colorpicker-group-item',
			{
				'colorpicker-group-item-border': needBorder,
				'colorpicker-group-item-active': active,
				'colorpicker-group-item-special': special,
			},
		]"
		@click="triggerSelect"
		:title="title"
	>
		<span :style="refreshStyles.block">
			<svg :style="refreshStyles.check" viewBox="0 0 18 18">
				<path
					d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"
				/>
			</svg>
		</span>
	</span>
</template>
<script lang="ts">
import {
	AnyColor,
	Colord,
	colord,
	HslaColor,
	HsvaColor,
	RgbaColor,
} from 'colord';
import { defineComponent } from 'vue';
import { colorPickerItemProps } from '../../../types';
import Palette from './palette';

export default defineComponent({
	name: 'am-color-plicker-item',
	props: colorPickerItemProps,
	setup(props) {
		const triggerSelect = (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			if (props.onSelect) props.onSelect(props.color, event);
		};

		//接近白色的颜色，需要添加一个边框。不然看不见
		const special = 'transparent' === props.color;

		const title = props.engine.language.get<string>(
			'toolbar',
			'colorPicker',
			props.color.toUpperCase(),
		);

		return {
			title,
			special,
			triggerSelect,
		};
	},
	data() {
		const state = this.toState(this.color || '#FFFFFF');
		const needBorder =
			['#ffffff', '#fafafa', 'transparent'].indexOf(state.hex) >= 0;
		return {
			state,
			needBorder,
			styles: this.getStyles(state),
		};
	},
	computed: {
		refreshStyles(): any {
			return this.getStyles();
		},
	},
	methods: {
		getContrastingColor(color: {
			hsl: HslaColor;
			hex: string;
			rgb: RgbaColor;
			hsv: HsvaColor;
			oldHue: any;
			source: any;
		}) {
			if (color.hex === 'transparent') {
				return 'rgba(0,0,0,0.4)';
			}

			const yiq =
				(color.rgb.r * 299 + color.rgb.g * 587 + color.rgb.b * 114) /
				1000;
			return yiq >= 210 ? '#8C8C8C' : '#FFFFFF';
		},
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
				oldHue: (color as any)['h'] || oldHue || hsl.h,
				source: (color as any)['source'],
			};
		},
		getStyles(state?: any) {
			return {
				check: {
					fill: this.getContrastingColor(state || this.state),
					display: this.active ? 'block' : 'none',
				},
				block: {
					backgroundColor: this.color,
					border: this.setStroke
						? '1px solid '.concat(Palette.getStroke(this.color))
						: undefined,
				},
			};
		},
	},
});
</script>
