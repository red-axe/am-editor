import { isEngine, MarkPlugin, PluginOptions } from '@aomao/engine';
import type MarkdownIt from 'markdown-it';
import './index.css';

export interface MarkOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}
export default class<
	T extends MarkOptions = MarkOptions,
> extends MarkPlugin<T> {
	tagName = 'mark';

	static get pluginName() {
		return 'mark';
	}

	init(): void {
		super.init();
		if (isEngine(this.editor)) {
			this.editor.on('markdown-it', this.markdownIt);
		}
	}

	hotkey() {
		return this.options.hotkey || '';
	}

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) {
			mardown.use(require('markdown-it-mark'));
			mardown.enable('mark');
		}
	};

	destroy(): void {
		this.editor.off('markdown-it', this.markdownIt);
	}
}
