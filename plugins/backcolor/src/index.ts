import { Plugin, toHex } from '@aomao/engine';

export type Options = {
	hotkey?: { key: string; args: Array<string> };
};
export default class extends Plugin<Options> {
	execute(color: string, defaultColor?: string) {
		if (!this.engine) return;
		const { change } = this.engine;
		const mark = `<span style="background-color:${color};" />`;
		if (defaultColor === undefined || color !== defaultColor) {
			change.addMark(mark);
		} else {
			change.removeMark(mark);
		}
	}

	queryState() {
		if (!this.engine) return;
		const { change } = this.engine;
		const colors: Array<string> = [];
		change.marks.forEach(node => {
			let color = '';
			if (node.name === 'span') {
				color = toHex(node.css('background-color') || '');
			}
			if (!!color) {
				colors.push(color);
			}
		});
		if (colors.length > 0) {
			return colors[0];
		}
		return '';
	}

	hotkey() {
		return this.options.hotkey || [];
	}

	schema() {
		return [
			{
				span: {
					style: {
						'background-color': '@color',
					},
				},
			},
		];
	}
}
