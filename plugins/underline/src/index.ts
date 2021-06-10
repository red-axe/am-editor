import { MarkPlugin } from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
};
export default class extends MarkPlugin<Options> {
	tagName = 'u';

	static get pluginName() {
		return 'underline';
	}

	hotkey() {
		return this.options.hotkey || 'mod+u';
	}

	conversion() {
		return [
			{
				from: {
					span: {
						style: {
							'text-decoration': 'underline',
						},
					},
				},
				to: this.tagName,
			},
		];
	}
}
