import { isEngine, MarkPlugin, PluginOptions } from '@aomao/engine';
import type MarkdownIt from 'markdown-it';
import mdMark from 'markdown-it-mark';
import './index.css';

export interface MarkOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}
const MARKDOWN_IT = 'markdown-it';
export default class<
	T extends MarkOptions = MarkOptions,
> extends MarkPlugin<T> {
	tagName = 'mark';

	static get pluginName() {
		return 'mark';
	}

	init(): void {
		super.init();
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.on(MARKDOWN_IT, this.markdownIt);
		}
	}

	hotkey() {
		return this.options.hotkey || '';
	}

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) {
			mardown.use(mdMark);
			mardown.enable('mark');
		}
	};

	destroy(): void {
		this.editor.off(MARKDOWN_IT, this.markdownIt);
	}
}
