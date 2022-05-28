import { isEngine, MarkPlugin, PluginOptions } from '@aomao/engine';
import type MarkdownIt from 'markdown-it';

export interface ItalicOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}
const MARKDOWN_IT = 'markdown-it';
export default class<
	T extends ItalicOptions = ItalicOptions,
> extends MarkPlugin<T> {
	static get pluginName() {
		return 'italic';
	}

	tagName = 'em';

	init(): void {
		super.init();
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.on(MARKDOWN_IT, this.markdownIt);
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

	destroy() {
		this.editor.off(MARKDOWN_IT, this.markdownIt);
	}
}
