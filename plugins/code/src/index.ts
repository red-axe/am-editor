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
const PARSE_HTML = 'parse:html';
const MARKDOWN_IT = 'markdown-it';
export default class<
	T extends CodeOptions = CodeOptions,
> extends InlinePlugin<T> {
	static get pluginName() {
		return 'code';
	}

	init() {
		super.init();
		const editor = this.editor;
		editor.on(PARSE_HTML, this.parseHtml);
		if (isEngine(editor)) {
			editor.on(MARKDOWN_IT, this.markdownIt);
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
		const editor = this.editor;
		editor.off(PARSE_HTML, this.parseHtml);
		editor.off(MARKDOWN_IT, this.markdownIt);
	}
}
