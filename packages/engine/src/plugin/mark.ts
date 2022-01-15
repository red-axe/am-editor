import ElementPluginEntry from './element';
import type {
	MarkInterface,
	NodeInterface,
	SchemaMark,
	PluginEntry as PluginEntryType,
	PluginInterface,
	PluginOptions,
} from '../types';
import { $ } from '../node';
import { isEngine } from '../utils';

abstract class MarkEntry<T extends PluginOptions = PluginOptions>
	extends ElementPluginEntry<T>
	implements MarkInterface<T>
{
	readonly kind: string = 'mark';
	/**
	 * 标签名称
	 */
	abstract readonly tagName: string;
	/**
	 * Markdown 规则，可选
	 */
	readonly markdown?: string;
	/**
	 * 回车后是否复制mark效果，默认为 true，允许
	 * <p><strong>abc<cursor /></strong></p>
	 * 在光标处回车后，第二行默认会继续 strong 样式，如果为 false，将不在加 strong 样式
	 */
	readonly copyOnEnter?: boolean;
	/**
	 * 是否跟随样式，开启后在此标签后输入将不在有mark标签效果，光标重合状态下也无非执行此mark命令。默认 true 跟随
	 * <strong>abc<cursor /></strong> 或者 <strong><cursor />abc</strong>
	 * 在此处输入，如果 followStyle 为 true，那么就会在 strong 节点后输入 或者 strong 节点前输入
	 * <strong>ab<cursor />c</strong> 如果光标在中间为值，还是会继续跟随样式效果
	 * <strong>abc<cursor /></strong><em><strong>123</strong></em> 如果 followStyle 为 true，后方还是有 strong 节点效果，那么还是会继续跟随样式，在 strong abc 后面完成输入
	 */
	readonly followStyle: boolean = true;
	/**
	 * 在包裹相通节点并且属性名称一致，值不一致的mark节点的时候，是合并前者的值到新的节点还是移除前者mark节点，默认 false 移除
	 * 节点样式(style)的值将始终覆盖掉
	 * <span a="1">abc</span>
	 * 在使用 <span a="2"></span> 包裹上方节点时
	 * 如果合并值，就是 <span a="1,2">abc</span> 否则就是 <span a="2">abc</span>
	 */
	readonly combineValueByWrap: boolean = false;
	/**
	 * 合并级别，值越大就合并在越外围
	 */
	readonly mergeLeval: number = 1;

	init() {
		super.init();
		const editor = this.editor;
		if (isEngine(editor) && this.markdown) {
			// mark 样式的粘贴的时候不检测，以免误报
			// editor.on(
			// 	'paste:markdown-check',
			// 	(child) => !this.checkMarkdown(child)?.match,
			// );
			editor.on('paste:markdown', (node) => this.pasteMarkdown(node));
		}
	}

	execute(...args: any) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, mark } = editor;
		const markNode = this.createElement(...args);
		const trigger = this.isTrigger
			? this.isTrigger(...args)
			: !this.queryState();
		if (trigger) {
			if (!this.followStyle && change.range.get().collapsed) {
				return;
			}
			mark.wrap(markNode);
		} else {
			mark.unwrap(markNode);
		}
	}

	queryState() {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		//如果没有属性和样式限制，直接查询是否包含当前标签名称
		if (!this.style && !this.attributes)
			return change.marks.some((node) => node.name === this.tagName);
		//获取属性和样式限制内的值集合
		const values: Array<string> = [];
		change.marks.forEach((node) => {
			values.push(...Object.values(this.getStyle(node)));
			values.push(...Object.values(this.getAttributes(node)));
		});
		return values.length === 0 ? undefined : values;
	}

	schema(): SchemaMark | Array<SchemaMark> {
		const schema = super.schema();
		if (Array.isArray(schema)) {
			return schema.map((schema) => {
				return {
					...schema,
				} as SchemaMark;
			});
		}
		return {
			...schema,
		} as SchemaMark;
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
		const editor = this.editor;
		if (!isEngine(editor) || !this.markdown) return;
		const { block, change, command } = editor;
		const key = this.markdown.replace(/(\*|\^|\$)/g, '\\$1');
		const match = new RegExp(`^(.*)${key}(.+?)${key}$`).exec(text);

		if (match) {
			//限制block下某些禁用的mark插件
			const blockPlugin = block.findPlugin(node);
			const pluginName = (this.constructor as PluginEntryType).pluginName;
			if (
				blockPlugin &&
				blockPlugin.disableMark &&
				blockPlugin.disableMark.indexOf(pluginName) > -1
			)
				return;
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
		const reg =
			key === '_'
				? new RegExp(`\\s+(${key}([^${key}\\r\\n]+)${key})\\s+`)
				: new RegExp(`(${key}([^${key}\\r\\n]+)${key})`);
		let match = reg.exec(text);
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
			newText += textNode.textContent;
			//从匹配结束位置分割
			textNode = regNode.splitText(match[0].length);

			//获取中间字符
			const markNode = $(
				`<${this.tagName}>${match[2]}</${this.tagName}>`,
			);
			this.setStyle(markNode);
			this.setAttributes(markNode);
			newText += markNode.get<Element>()?.outerHTML;
		}
		newText += textNode.textContent;

		node.text(newText);
	}
}

export default MarkEntry;

export const isMarkPlugin = (
	plugin: PluginInterface,
): plugin is MarkInterface => {
	return plugin.kind === 'mark';
};
