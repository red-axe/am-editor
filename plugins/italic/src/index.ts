import { MarkPlugin, PluginOptions } from '@aomao/engine';

export interface ItalicOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: string;
}
export default class<
	T extends ItalicOptions = ItalicOptions,
> extends MarkPlugin<T> {
	static get pluginName() {
		return 'italic';
	}

	tagName = 'em';

	markdown =
		this.options.markdown === undefined ? '_' : this.options.markdown;

	hotkey() {
		return this.options.hotkey || 'mod+i';
	}

	conversion() {
		return [
			{
				from: {
					span: {
						style: {
							'font-style': 'italic',
						},
					},
				},
				to: this.tagName,
			},
			{
				from: 'i',
				to: this.tagName,
			},
		];
	}
}
