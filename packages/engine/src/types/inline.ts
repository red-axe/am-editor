import { NodeInterface } from './node';
import {
	PluginInterface,
	ElementPluginInterface,
	PluginOptions,
} from './plugin';
import { RangeInterface } from './range';
import { SchemaInterface } from './schema';

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
	 * 获取向上第一个非 Inline 节点
	 */
	closestNotInline(node: NodeInterface): NodeInterface;
	/**
	 * 给当前光标节点添加inline包裹
	 * @param inline inline标签
	 * @param range 光标，默认获取当前光标
	 */
	wrap(inline: NodeInterface | Node | string, range?: RangeInterface): void;
	/**
	 * 移除inline包裹
	 * @param range 光标，默认当前编辑器光标,或者需要移除的inline节点
	 */
	unwrap(range?: RangeInterface | NodeInterface): void;
	/**
	 * 插入inline标签
	 * @param inline inline标签
	 * @param range 光标
	 */
	insert(inline: NodeInterface | Node | string, range?: RangeInterface): void;
	/**
	 * 分割inline标签
	 * @param range 光标，默认获取当前光标
	 */
	split(range?: RangeInterface): void;
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
	/**
	 * 标准化inline节点，不能嵌套在mark标签内，不能嵌套inline标签
	 * @param node
	 */
	flat(
		node: NodeInterface | RangeInterface,
		schema?: SchemaInterface,
	): void | NodeInterface;
}

export interface InlineInterface<T extends PluginOptions = PluginOptions>
	extends ElementPluginInterface<T> {
	readonly kind: string;
	/**
	 * 标签名称
	 */
	readonly tagName: string;
	/**
	 * Markdown 规则，可选
	 */
	readonly markdown?: string;
	/**
	 * 初始化
	 */
	init(): void;
	/**
	 * 查询状态
	 */
	queryState(): any;

	/**
	 * 是否触发执行增加当前mark标签包裹，否则将移除当前mark标签的包裹
	 * @param args 在调用 command.execute 执行插件传入时的参数
	 */
	isTrigger?(...args: any): boolean;
}
