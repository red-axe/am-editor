import { NodeInterface, Inline, isEngine, PluginEntry } from '@aomao/engine';
import Toolbar from './toolbar';
import locales from './locales';

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

	markdown =
		this.options.markdown !== false ? '\\[(.+?)\\]\\(([\\S]+?)\\)$' : '';

	init() {
		super.init();
		if (isEngine(this.editor)) {
			this.toolbar = new Toolbar(this.editor);
		}
		this.editor.on('paser:html', node => this.parseHtml(node));
		this.editor.language.add(locales);
	}

	hotkey() {
		return this.options.hotkey || { key: 'mod+k', args: ['_blank'] };
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { inline } = this.editor;
		if (!this.queryState()) {
			const inlineNode = this.editor.$(`<${this.tagName} />`);
			this.setStyle(inlineNode, ...arguments);
			this.setAttributes(inlineNode, ...arguments);
			const text = arguments.length > 2 ? arguments[2] : '';

			if (!!text) {
				inlineNode.text(text);
				inline.insert(inlineNode);
			} else {
				this.editor.history.startCache();
				inline.wrap(inlineNode);
			}
			const { change } = this.editor;
			const range = change.getRange();
			if (!range.collapsed && change.inlines.length > 0) {
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

	triggerMarkdown(event: KeyboardEvent, text: string, node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown) return;
		const match = new RegExp(this.markdown).exec(text);
		if (match) {
			const { change, $ } = this.editor;
			event.preventDefault();
			const text = match[1];
			const url = match[2];
			// 移除 markdown 语法
			const markdownTextNode = node
				.get<Text>()!
				.splitText(node.text().length - match[0].length);
			markdownTextNode.splitText(match[0].length);
			$(markdownTextNode).remove();
			this.editor.command.execute(
				(this.constructor as PluginEntry).pluginName,
				'_blank',
				url,
				text,
			);
			change.insertText('\xA0');
			return false;
		}
		return;
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
