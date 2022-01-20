import { MarkPlugin, PluginOptions } from '@aomao/engine';

export interface BoldOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: string;
}
export default class<
	T extends BoldOptions = BoldOptions,
> extends MarkPlugin<T> {
	static get pluginName() {
		return 'bold';
	}

	tagName = 'strong';

	markdown =
		this.options.markdown === undefined ? '**' : this.options.markdown;

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
