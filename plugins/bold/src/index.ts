import { MarkPlugin } from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};
export default class extends MarkPlugin<Options> {
	static get pluginName() {
		return 'bold';
	}

	tagName = 'strong';

	markdown = this.options.markdown !== false ? '**' : '';

	hotkey() {
		return this.options.hotkey || 'mod+b';
	}

	conversion() {
		return [
			{
				from: {
					span: {
						style: {
							'font-weight': ['bold', '700'],
						},
					},
				},
				to: this.tagName,
			},
			{
				from: 'b',
				to: this.tagName,
			},
		];
	}
}
