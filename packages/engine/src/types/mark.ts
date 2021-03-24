import { NodeInterface } from './node';
import { PluginInterface } from './plugin';
import { RangeInterface } from './range';
import { SchemaMark } from './schema';

export interface MarkModelInterface {
	/**
	 * 初始化
	 */
	init(): void;
	/**
	 * 根据节点查找mark插件实例
	 * @param node 节点
	 */
	findPlugin(node: NodeInterface): Array<MarkInterface>;
	/**
	 * 获取向上第一个非 Mark 节点
	 */
	closestNotMark(node: NodeInterface): NodeInterface;
	/**
	 * 比较两个节点是否相同，包括attributes、style、class
	 * @param source 源节点
	 * @param target 目标节点
	 * @param isCompareValue 是否比较每项属性的值
	 */
	compare(
		source: NodeInterface,
		target: NodeInterface,
		isCompareValue?: boolean,
	): boolean;
	/**
	 * 判断源节点是否包含目标节点的所有属性和样式
	 * @param source 源节点
	 * @param target 目标节点
	 */
	contain(source: NodeInterface, target: NodeInterface): boolean;
	/**
	 * 如果源节点包含目标节点的所有属性和样式，那么移除源节点所包含的样式和属性
	 * @param source 源节点
	 * @param target 目标节点
	 */
	removeByContain(source: NodeInterface, target: NodeInterface): void;
	/**
	 * 移除一个节点下的所有空 Mark，通过 callback 可以设置其它条件
	 * @param root 节点
	 * @param callback 回调
	 */
	unwrapEmptyMarks(
		root: NodeInterface,
		callback?: (node: NodeInterface) => boolean,
	): void;

	/**
	 * 在光标重叠位置时分割
	 * @param range 光标
	 * @param removeMark 要移除的mark空节点
	 */
	splitOnCollapsed(range: RangeInterface, removeMark?: NodeInterface): void;
	/**
	 * 在光标位置不重合时分割
	 * @param range 光标
	 * @param removeMark 要移除的空mark节点
	 */
	splitOnExpanded(range: RangeInterface, removeMark?: NodeInterface): void;
	/**
	 * 分割mark标签
	 * @param range 光标，默认获取当前光标
	 * @param removeMark 需要移除的空mark标签
	 */
	split(
		range?: RangeInterface,
		removeMark?: NodeInterface | Node | string,
	): void;
	/**
	 * 在当前光标选区包裹mark标签
	 * @param mark mark标签
	 * @param both mark标签两侧节点
	 */
	wrap(mark: NodeInterface | Node | string, range?: RangeInterface): void;
	/**
	 * 去掉mark包裹
	 * @param range 光标
	 * @param removeMark 要移除的mark标签
	 */
	unwrap(
		removeMark?: NodeInterface | Node | string,
		range?: RangeInterface,
	): void;
	/**
	 * 合并当前选区的mark节点
	 * @param range 光标，默认当前选区光标
	 */
	merge(range?: RangeInterface): void;
	/**
	 * 光标处插入mark标签
	 * @param mark mark标签
	 * @param range 指定光标，默认为编辑器选中的光标
	 */
	insert(mark: NodeInterface | Node | string, range?: RangeInterface): void;
	/**
	 * 查找对范围有效果的所有 Mark
	 * @param range 范围
	 */
	findMarks(range: RangeInterface): Array<NodeInterface>;
	/**
	 * 从下开始往上遍历删除空 Mark，当遇到空 Block，添加 BR 标签
	 * @param node 节点
	 * @param addBr 是否添加br
	 */
	removeEmptyMarks(node: NodeInterface, addBr?: boolean): void;
}

export interface MarkInterface extends PluginInterface {
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
	 * 回车后是否复制mark效果，默认为true，允许
	 */
	readonly copyOnEnter?: boolean;

	init(): void;

	queryState(): any;

	schema(): SchemaMark;

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

export const isMarkPlugin = (
	plugin: PluginInterface,
): plugin is MarkInterface => {
	return plugin.kind === 'mark';
};
