import type MarkdownIt from 'markdown-it';
import {
	NodeInterface,
	InlinePlugin,
	PluginOptions,
	isEngine,
} from '@aomao/engine';
import './index.css';

export interface CodeOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}
export default class<
	T extends CodeOptions = CodeOptions,
> extends InlinePlugin<T> {
	static get pluginName() {
		return 'code';
	}

	init() {
		super.init();
		this.editor.on('parse:html', this.parseHtml);
		if (isEngine(this.editor)) {
			this.editor.on('markdown-it', this.markdownIt);
		}
	}

	tagName = 'code';

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) mardown.enable('backticks');
	};

	hotkey() {
		return this.options.hotkey || 'mod+e';
	}

	parseHtml = (root: NodeInterface) => {
		root.find(this.tagName).css({
			'font-family': 'monospace',
			'font-size': 'inherit',
			'background-color': 'rgba(0,0,0,.06)',
			padding: '0 2px',
			'border-radius': '6px',
			'line-height': 'inherit',
			'overflow-wrap': 'break-word',
			'text-indent': '0',
		});
	};

	destroy() {
		this.editor.off('parse:html', this.parseHtml);
		this.editor.off('markdown-it', this.markdownIt);
	}
}
