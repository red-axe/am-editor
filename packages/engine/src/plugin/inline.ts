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
}

export default InlineEntry;

export const isInlinePlugin = (
	plugin: PluginInterface,
): plugin is InlineInterface => {
	return plugin.kind === 'inline';
};
