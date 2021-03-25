import { NodeInterface, Inline, isEngine } from '@aomao/engine';
import Toolbar from './toolbar';

import './index.css';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};
export default class extends Inline<Options> {
	private toolbar?: Toolbar;

	static get pluginName() {
		return 'link';
	}

	attributes = {
		target: '@var0',
		href: '@var1',
	};

	variable = {
		'@var0': ['_blank', '_parent', '_top', '_self'],
		'@var1': '*',
	};

	tagName = 'a';

	//markdown = this.options.markdown !== false ? '`' : '';

	init() {
		super.init();
		if (isEngine(this.editor)) {
			this.toolbar = new Toolbar(this.editor);
		}
	}

	hotkey() {
		return this.options.hotkey || { key: 'mod+k', args: ['_blank'] };
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const inlineNode = this.editor.$(`<${this.tagName} />`);
		this.setStyle(inlineNode, ...arguments);
		this.setAttributes(inlineNode, ...arguments);
		const { inline } = this.editor;
		if (!this.queryState()) {
			inline.wrap(inlineNode);
			const { change } = this.editor;
			if (!change.getRange().collapsed && change.inlines.length > 0) {
				this.toolbar?.show(change.inlines[0]);
			}
		}
	}

	queryState() {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const inlineNode = change.inlines.find(node => this.isSelf(node));
		this.toolbar?.hide(inlineNode);
		if (inlineNode) {
			if (change.getRange().collapsed) this.toolbar?.show(inlineNode);
			return true;
		}
		return false;
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
