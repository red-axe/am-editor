import {
	$,
	NodeInterface,
	InlinePlugin,
	isEngine,
	PluginEntry,
	PluginOptions,
} from '@aomao/engine';
import Toolbar from './toolbar';
import locales from './locales';

import './index.css';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: string;
}
export default class extends InlinePlugin<Options> {
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
		'@var1': {
			required: true,
			value: '*',
		},
	};

	tagName = 'a';

	markdown =
		this.options.markdown === undefined
			? '\\[(.+?)\\]\\(([\\S]+?)\\)$'
			: this.options.markdown;

	init() {
		super.init();
		const editor = this.editor;
		if (isEngine(editor)) {
			this.toolbar = new Toolbar(editor, {
				onConfirm: this.options.onConfirm,
			});
		}
		editor.on('paser:html', (node) => this.parseHtml(node));
		editor.on('select', () => {
			this.query();
		});
		editor.language.add(locales);
	}

	hotkey() {
		return this.options.hotkey || { key: 'mod+k', args: ['_blank'] };
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { inline, change, history } = this.editor;
		if (!this.queryState()) {
			const inlineNode = $(`<${this.tagName} />`);
			this.setStyle(inlineNode, ...arguments);
			this.setAttributes(inlineNode, ...arguments);
			const text = arguments.length > 2 ? arguments[2] : '';

			if (!!text) {
				inlineNode.text(text);
				inline.insert(inlineNode);
			} else {
				history.startCache();
				inline.wrap(inlineNode);
			}
			const range = change.getRange();
			if (!range.collapsed && change.inlines.length > 0) {
				this.toolbar?.show(change.inlines[0]);
			}
		} else {
			const inlineNode = change.inlines.find((node) => this.isSelf(node));
			if (inlineNode && inlineNode.length > 0) {
				inline.unwrap(inlineNode);
			}
		}
	}

	query() {
		if (!isEngine(this.editor)) return;
		const { change, inline } = this.editor;
		const range = change.getRange();
		const inlineNode = inline
			.findInlines(range)
			.find((node) => this.isSelf(node));
		this.toolbar?.hide(inlineNode);
		if (inlineNode && !inlineNode.isCard()) {
			if (range.collapsed) this.toolbar?.show(inlineNode);
			return true;
		}
		return false;
	}

	queryState() {
		return this.query();
	}

	triggerMarkdown(event: KeyboardEvent, text: string, node: NodeInterface) {
		const editor = this.editor;
		if (!isEngine(editor) || !this.markdown) return;
		const match = new RegExp(this.markdown).exec(text);
		if (match) {
			const { command } = editor;
			event.preventDefault();
			const text = match[1];
			const url = match[2];
			// 移除 markdown 语法
			const markdownTextNode = node
				.get<Text>()!
				.splitText(node.text().length - match[0].length);
			markdownTextNode.splitText(match[0].length);
			$(markdownTextNode).remove();
			command.execute(
				(this.constructor as PluginEntry).pluginName,
				'_blank',
				url,
				text,
			);
			editor.node.insertText('\xA0');
			return false;
		}
		return;
	}

	checkMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown || !node.isText()) return;

		const text = node.text();
		if (!text) return;

		const reg = /(\[(.+?)\]\(([\S]+?)\))/;
		const match = reg.exec(text);
		return {
			reg,
			match,
		};
	}

	pasteMarkdown(node: NodeInterface) {
		const result = this.checkMarkdown(node);
		if (!result) return;
		let { reg, match } = result;
		if (!match) return;

		let newText = '';
		let textNode = node.clone(true).get<Text>()!;
		while (
			textNode.textContent &&
			(match = reg.exec(textNode.textContent))
		) {
			//从匹配到的位置切断
			let regNode = textNode.splitText(match.index + 1);
			newText += textNode.textContent;
			//从匹配结束位置分割
			textNode = regNode.splitText(match[0].length - 1);

			const text = match[2];
			const url = match[3];

			const inlineNode = $(`<${this.tagName} />`);
			this.setAttributes(inlineNode, '_blank', url);
			inlineNode.text(!!text ? text : url);

			newText += inlineNode.get<Element>()?.outerHTML;
		}
		newText += textNode.textContent;
		node.text(newText);
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
