import { isEngine, MarkPlugin, PluginOptions } from '@aomao/engine';
import type MarkdownIt from 'markdown-it';

export interface ItalicOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}
export default class<
	T extends ItalicOptions = ItalicOptions,
> extends MarkPlugin<T> {
	static get pluginName() {
		return 'italic';
	}

	tagName = 'em';

	init(): void {
		super.init();
		if (isEngine(this.editor)) {
			this.editor.on('markdown-it', this.markdownIt);
		}
	}

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) mardown.enable('emphasis');
	};

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
