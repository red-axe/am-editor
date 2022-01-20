import { MarkPlugin, PluginOptions } from '@aomao/engine';

export interface UnderlineOptions extends PluginOptions {
	hotkey?: string | Array<string>;
}
export default class<
	T extends UnderlineOptions = UnderlineOptions,
> extends MarkPlugin<T> {
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
