import { NodeInterface, Plugin } from '@aomao/engine';

export type Options = {
	hotkey?: { key: string; args: Array<string> };
	defaultSize: string;
};

export const fontsizeMap = {
	9: 12,
	10: 13,
	'11': 14,
	// 14px 是 10.5pt，页面上字号显示 11
	'1515': 15,
	12: 16,
	14: 19,
	16: 22,
	18: 24,
	22: 29,
	24: 32,
	30: 40,
	36: 48,
};

export default class extends Plugin<Options> {
	parseFontsize() {
		return Object.keys(fontsizeMap).map(pt => {
			return parseInt(pt, 10);
		});
	}
	processFontsize(fontsize: string = '') {
		const fontsizeList = this.parseFontsize();
		const match = /([\d\.]+)(pt|px)$/i.exec(fontsize);
		if (match) {
			const unit = match[2];
			if (unit === 'pt') {
				return match[1];
			} else if (unit === 'px') {
				for (var i = 0; i < fontsizeList.length; i++) {
					if (
						Math.round(parseInt(match[1], 10)) ===
						fontsizeMap[fontsizeList[i]]
					) {
						return String(fontsizeList[i]);
					}
				}
				return String(Math.round((parseInt(match[1], 10) * 72) / 96));
			}
		}
		return '';
	}

	execute(
		size: string,
		defaultSize: string = this.options.defaultSize || '11',
	) {
		if (!this.engine) return;
		const { change } = this.engine;
		const mark = `<span class="data-fontsize-${size};" />`;
		if (size !== defaultSize) {
			change.addMark(mark);
		} else {
			change.removeMark(mark);
		}
	}

	queryState() {
		if (!this.engine) return;
		const { change } = this.engine;
		const fontsizes: Array<string> = [];
		change.marks.forEach(node => {
			let fontsize = '';
			if (node.name === 'span') {
				fontsize = this.processFontsize(node.css('font-size'));
			}
			if (!!fontsize) {
				fontsizes.push(fontsize);
			}
		});
		if (fontsizes.length > 0) {
			return fontsizes[0];
		}
		return this.options.defaultSize || '11';
	}

	hotkey() {
		return this.options.hotkey || [];
	}

	schema() {
		return [
			{
				span: {
					class: /^data-fontsize-\d+$/,
				},
			},
		];
	}

	pasteEach(node: NodeInterface) {
		if (node.name === 'span') {
			const value = parseInt(
				this.processFontsize(node.get<HTMLElement>()?.style.fontSize),
				10,
			);
			const fontsizeList = this.parseFontsize();
			if (fontsizeList.indexOf(value) >= 0) {
				node.addClass(`data-fontsize-${value}`);
			}
			node.css('font-size', '');
		}
	}
}
