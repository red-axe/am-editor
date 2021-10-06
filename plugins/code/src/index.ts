import { NodeInterface, InlinePlugin, PluginOptions } from '@aomao/engine';
import './index.css';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: string;
}
export default class extends InlinePlugin<Options> {
	static get pluginName() {
		return 'code';
	}

	init() {
		super.init();
		this.editor.on('paser:html', (node) => this.parseHtml(node));
	}

	tagName = 'code';

	markdown =
		this.options.markdown === undefined ? '`' : this.options.markdown;

	hotkey() {
		return this.options.hotkey || 'mod+e';
	}

	parseHtml(root: NodeInterface) {
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
	}
}
