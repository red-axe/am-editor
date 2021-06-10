import { MarkPlugin } from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};
export default class extends MarkPlugin<Options> {
	tagName = 'del';

	static get pluginName() {
		return 'strikethrough';
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+x';
	}

	markdown = this.options.markdown !== false ? '~~' : '';

	conversion() {
		return [
			{
				from: {
					span: {
						style: {
							'text-decoration': 'line-through',
						},
					},
				},
				to: this.tagName,
			},
			{
				from: 's',
				to: this.tagName,
			},
			{
				from: 'strike',
				to: this.tagName,
			},
		];
	}
}
