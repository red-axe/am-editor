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

export interface LinkOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: string;
}
export default class<
	T extends LinkOptions = LinkOptions,
> extends InlinePlugin<T> {
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
			? '[^!]\\[(.+?)\\]\\(s*([\\S]+?)\\s*\\)$'
			: this.options.markdown;

	init() {
		super.init();
		const editor = this.editor;
		if (isEngine(editor)) {
			this.toolbar = new Toolbar(editor, {
				onConfirm: this.options.onConfirm,
			});
		}
		editor.on('paste:each', (child) => this.pasteHtml(child));
		editor.on('parse:html', (node) => this.parseHtml(node));
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
		const { inline, change } = this.editor;
		if (!this.queryState()) {
			const inlineNode = $(`<${this.tagName} />`);
			this.setStyle(inlineNode, ...arguments);
			this.setAttributes(inlineNode, ...arguments);
			const text = arguments.length > 2 ? arguments[2] : '';

			if (!!text) {
				inlineNode.text(text);
				inline.insert(inlineNode);
			} else {
				inline.wrap(inlineNode);
			}
			const range = change.range.get();
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
		const { change } = this.editor;
		const inlineNode = change.inlines.find((node) => this.isSelf(node));
		this.toolbar?.hide(inlineNode);
		if (inlineNode && inlineNode.length > 0 && !inlineNode.isCard()) {
			const range = change.range.get();
			if (
				range.collapsed ||
				(inlineNode.contains(range.startNode) &&
					inlineNode.contains(range.endNode))
			) {
				this.toolbar?.show(inlineNode);
				return true;
			} else {
				this.toolbar?.hide();
			}
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

		const reg = /(\[(.+?)\]\(\s*([\S]+?)\s*\))/;
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
			let regNode = textNode.splitText(match.index);
			if (
				textNode.textContent.endsWith('!') ||
				match[2].startsWith('!')
			) {
				newText += textNode.textContent;
				textNode = regNode.splitText(match[0].length);
				newText += regNode.textContent;
				continue;
			}
			newText += textNode.textContent;
			//从匹配结束位置分割
			textNode = regNode.splitText(match[0].length);

			const text = match[2];
			const url = match[3];

			const inlineNode = $(`<${this.tagName} />`);
			this.setAttributes(inlineNode, '_blank', (url || '').trim());
			inlineNode.html(!!text ? text : url);

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

	pasteHtml(child: NodeInterface) {
		if (child.isText()) {
			const text = child.text();
			const { node, inline } = this.editor;
			if (
				/^https?:\/\/\S+$/.test(text.toLowerCase().trim()) &&
				!inline.closest(child).equal(child)
			) {
				node.wrap(
					child,
					$(`<${this.tagName} target="_blank" href="${text}"></a>`),
				);
				return false;
			}
		}
		return true;
	}
}
