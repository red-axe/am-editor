import { MarkPlugin, PluginOptions } from '@aomao/engine';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: string;
}
export default class extends MarkPlugin<Options> {
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
