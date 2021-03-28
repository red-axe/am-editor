import { NodeInterface } from './node';
import { PluginInterface } from './plugin';
import { RangeInterface } from './range';

export interface InlineModelInterface {
	/**
	 * 初始化
	 */
	init(): void;
	/**
	 * 获取最近的 Inline 节点，找不到返回 node
	 */
	closest(node: NodeInterface): NodeInterface;
	/**
	 * 给当前光标节点添加inline包裹
	 * @param inline inline标签
	 * @param range 光标，默认获取当前光标
	 */
	wrap(inline: NodeInterface | Node | string, range?: RangeInterface): void;
	/**
	 * 移除inline包裹
	 * @param range 光标，默认当前编辑器光标
	 */
	unwrap(range?: RangeInterface): void;
	/**
	 * 插入inline标签
	 * @param inline inline标签
	 * @param range 光标
	 */
	insert(inline: NodeInterface | Node | string, range?: RangeInterface): void;
	/**
	 * 获取光标范围内的所有 inline 标签
	 * @param range 光标
	 */
	findInlines(range: RangeInterface): Array<NodeInterface>;
	/**
	 * 修复inline节点光标占位符
	 * @param node inlne 节点
	 */
	repairCursor(node: NodeInterface | Node): void;
	/**
	 * 修复光标选区位置，&#8203;<a>&#8203;<anchor />acde<focus />&#8203;</a>&#8203; -><anchor />&#8203;<a>&#8203;acde&#8203;</a>&#8203;<focus />
	 * 否则在ot中，可能无法正确的应用inline节点两边&#8203;的更改
	 */
	repairRange(range?: RangeInterface): RangeInterface;
}

export interface InlineInterface extends PluginInterface {
	readonly kind: string;
	/**
	 * 标签名称
	 */
	readonly tagName: string;
	/**
	 * Markdown 规则，可选
	 */
	readonly markdown?: string;

	init(): void;

	queryState(): any;

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
	triggerMarkdown(
		event: KeyboardEvent,
		text: string,
		node: NodeInterface,
	): boolean | void;
}

export const isInlinePlugin = (
	plugin: PluginInterface,
): plugin is InlineInterface => {
	return plugin.kind === 'inline';
};
