import { NodeInterface, Inline } from '@aomao/engine';
import './index.css';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};
export default class extends Inline<Options> {
	static get pluginName() {
		return 'code';
	}

	tagName = 'code';

	markdown = this.options.markdown !== false ? '`' : '';

	hotkey() {
		return this.options.hotkey || 'mod+e';
	}

	parseHtml(root: NodeInterface) {
		root.find(this.tagName).css({
			'font-family': 'monospace',
			'font-size': 'inherit',
			'background-color': 'rgba(0,0,0,.06)',
			padding: '0 2px',
			border: '1px solid rgba(0,0,0,.08)',
			'border-radius': '2px 2px',
			'line-height': 'inherit',
			'overflow-wrap': 'break-word',
			'text-indent': '0',
		});
	}
}
