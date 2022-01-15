import ElementPluginEntry from './element';

import type {
	InlineInterface,
	NodeInterface,
	PluginEntry as PluginEntryType,
	PluginInterface,
	PluginOptions,
} from '../types';
import { $ } from '../node';
import { isEngine } from '../utils';

abstract class InlineEntry<T extends PluginOptions = PluginOptions>
	extends ElementPluginEntry<T>
	implements InlineInterface<T>
{
	readonly kind: string = 'inline';
	/**
	 * 标签名称
	 */
	abstract readonly tagName: string;
	/**
	 * Markdown 规则，可选
	 */
	readonly markdown?: string;

	init() {
		super.init();
		const editor = this.editor;
		if (isEngine(editor) && this.markdown) {
			// inline 样式的粘贴的时候不检测，以免误报
			// editor.on(
			// 	'paste:markdown-check',
			// 	(child) => !this.checkMarkdown(child)?.match,
			// );
			editor.on('paste:markdown', (child) => this.pasteMarkdown(child));
		}
	}

	execute(...args: any) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const inlineNode = $(`<${this.tagName} />`);
		this.setStyle(inlineNode, ...args);
		this.setAttributes(inlineNode, ...args);
		const { inline } = editor;
		const trigger = this.isTrigger
			? this.isTrigger(...args)
			: !this.queryState();
		if (trigger) {
			inline.wrap(inlineNode);
		} else {
			inline.unwrap();
		}
	}

	queryState() {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change } = editor;
		//如果没有属性和样式限制，直接查询是否包含当前标签名称
		if (!this.style && !this.attributes)
			return change.inlines.some((node) => node.name === this.tagName);
		//获取属性和样式限制内的值集合
		const values: Array<string> = [];
		change.inlines.forEach((node) => {
			values.push(...Object.values(this.getStyle(node)));
			values.push(...Object.values(this.getAttributes(node)));
		});
		return values.length === 0 ? undefined : values;
	}

	/**
	 * 是否触发执行增加当前inline标签包裹，否则将移除当前inline标签的包裹
	 * @param args 在调用 command.execute 执行插件传入时的参数
	 */
	isTrigger?(...args: any): boolean;
	/**
	 * 解析markdown
	 * @param event 事件
	 * @param text markdown文本
	 * @param node 触发节点
	 */
	triggerMarkdown(event: KeyboardEvent, text: string, node: NodeInterface) {
		const editor = this.editor;
		if (!isEngine(editor) || !this.markdown) return;
		const { change, command } = editor;
		const key = this.markdown.replace(/(\*|\^|\$)/g, '\\$1');
		const match = new RegExp(`^(.*)${key}(.+?)${key}$`).exec(text);
		if (match) {
			let range = change.range.get();
			const visibleChar = match[1] && /\S$/.test(match[1]);
			const codeChar = match[2];
			event.preventDefault();
			let leftText = text.substr(
				0,
				text.length - codeChar.length - 2 * this.markdown.length,
			);
			node.get<Text>()!.splitText(
				(leftText + codeChar).length + 2 * this.markdown.length,
			);
			if (visibleChar) {
				leftText += ' ';
			}
			node[0].nodeValue = leftText + codeChar;
			range.setStart(node[0], leftText.length);
			range.setEnd(node[0], (leftText + codeChar).length);
			change.range.select(range);
			command.execute((this.constructor as PluginEntryType).pluginName);
			range = change.range.get();
			range.collapse(false);
			const inline = editor.inline.closest(range.startNode);
			const inlineNext = inline.next();
			if (
				inline &&
				inlineNext &&
				inlineNext.isText() &&
				/^\u200B/g.test(inlineNext.text())
			) {
				range.setStart(inlineNext, 1);
				range.setEnd(inlineNext, 1);
			}
			change.range.select(range);
			editor.node.insertText('\xa0');
			return false;
		}
		return;
	}

	checkMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown) return;
		if (!node.isText()) return;

		let text = node.text();
		if (!text) return;

		const key = this.markdown.replace(/(\*|\^|\$)/g, '\\$1');
		const reg = new RegExp(`(${key}([^${key}\r\n]+)${key})`);

		return {
			reg,
			match: reg.exec(text),
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
			newText += textNode.textContent;
			//从匹配结束位置分割
			textNode = regNode.splitText(match[0].length);

			//获取中间字符
			const inlineNode = $(
				`<${this.tagName}>${match[2]}</${this.tagName}>`,
			);

			this.setStyle(inlineNode);
			this.setAttributes(inlineNode);
			newText += inlineNode.get<Element>()?.outerHTML;
		}
		newText += textNode.textContent;

		node.text(newText);
	}
}

export default InlineEntry;

export const isInlinePlugin = (
	plugin: PluginInterface,
): plugin is InlineInterface => {
	return plugin.kind === 'inline';
};
