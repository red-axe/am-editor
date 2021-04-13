import PluginEntry from '../plugin/entry';
import {
	isEngine,
	InlineInterface,
	NodeInterface,
	PluginEntry as PluginEntryType,
} from '../types';

abstract class InlineEntry<T extends {} = {}> extends PluginEntry<T>
	implements InlineInterface {
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
		if (isEngine(this.editor) && this.markdown) {
			this.editor.on('paste:each', child => this.pasteMarkdown(child));
		}
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const inlineNode = this.editor.$(`<${this.tagName} />`);
		this.setStyle(inlineNode, ...arguments);
		this.setAttributes(inlineNode, ...arguments);
		const { inline } = this.editor;
		const trigger = this.isTrigger
			? this.isTrigger(...arguments)
			: !this.queryState();
		if (trigger) {
			inline.wrap(inlineNode);
		} else {
			inline.unwrap();
		}
	}

	queryState() {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		//如果没有属性和样式限制，直接查询是否包含当前标签名称
		if (!this.style && !this.attributes)
			return change.inlines.some(node => node.name === this.tagName);
		//获取属性和样式限制内的值集合
		const values: Array<string> = [];
		change.inlines.forEach(node => {
			values.push(...Object.values(this.getStyle(node)));
			values.push(...Object.values(this.getAttributes(node)));
		});
		return values.length === 0 ? undefined : values;
	}

	/**
	 * 是否触发执行增加当前mark标签包裹，否则将移除当前mark标签的包裹
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
		if (!isEngine(this.editor) || !this.markdown) return;
		const key = this.markdown.replace(/(\*|\^|\$)/g, '\\$1');
		const match = new RegExp(`^(.*)${key}(.+?)${key}$`).exec(text);
		if (match) {
			const { change } = this.editor;
			let range = change.getRange();
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
			change.select(range);
			this.editor.command.execute(
				(this.constructor as PluginEntryType).pluginName,
			);
			range = change.getRange();
			range.collapse(false);
			const inline = this.editor.inline.closest(range.startNode);
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
			change.select(range);
			change.insertText('\xa0');
			return false;
		}
		return;
	}

	pasteMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown) return;
		if (!node.isText()) return;
		const parent = node.parent();
		if (!parent) return;

		let textNode = node.get<Text>()!;
		if (!textNode.textContent) return;
		const inlines: Array<NodeInterface> = [];
		const key = this.markdown.replace(/(\*|\^|\$)/g, '\\$1');
		const reg = new RegExp(`(${key}([^${key}\r\n]+)${key})`);
		let match;
		while (
			textNode.textContent &&
			(match = reg.exec(textNode.textContent))
		) {
			//从匹配到的位置切断
			let regNode = textNode.splitText(match.index);
			//从匹配结束位置分割
			textNode = regNode.splitText(match[0].length);
			//移除匹配到的字符
			regNode.remove();
			//获取中间字符
			const inlineNode = this.editor.$(
				`<${this.tagName}>${match[2]}</${this.tagName}>`,
			);
			inlines.push(inlineNode);
			//追加node
			node.after(inlineNode);
			this.editor.inline.repairCursor(inlineNode);
		}
		if (match && textNode.textContent && textNode.textContent !== '') {
			node.after(textNode);
			this.editor.trigger('paste:each', textNode);
		}
		//如果有解析到节点，就再次触发事件，可能节点内还有markdown字符没有解析
		inlines.forEach(inline => {
			const child = inline.first();
			if (child?.isText()) this.editor.trigger('paste:each', child);
		});
	}
}

export default InlineEntry;
