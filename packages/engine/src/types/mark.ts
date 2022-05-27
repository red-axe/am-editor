import { NodeInterface } from './node';
import {
	ElementPluginInterface,
	PluginInterface,
	PluginOptions,
} from './plugin';
import { RangeInterface } from './range';
import { SchemaMark } from './schema';

/**
 * mark 节点管理器
 */
export interface MarkModelInterface {
	/**
	 * 初始化
	 */
	init(): void;
	/**
	 * 根据节点查找mark插件实例
	 * @param node 节点
	 */
	findPlugin(node: NodeInterface): MarkInterface | undefined;
	/**
	 * 获取最近的 Mark 节点，找不到返回 node
	 */
	closest(node: NodeInterface): NodeInterface;
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
	 * 分割mark标签
	 * @param range 光标，默认获取当前光标
	 * @param removeMark 需要移除的空mark标签
	 */
	split(
		range?: RangeInterface,
		removeMark?: NodeInterface | Node | string | Array<NodeInterface>,
	): void;
	/**
	 * 在当前光标选区包裹mark标签
	 * @param mark mark标签
	 * @param both mark标签两侧节点
	 */
	wrap(mark: NodeInterface | Node | string, range?: RangeInterface): void;
	/**
	 *
	 * @param node 包裹一个节点
	 * @param mark 包裹的样式
	 * @param plugin 包裹的样式节点所属mark插件，如果循环传入可提高效率，否则每次都需要查找
	 * @returns 未处理返回 void，因为某些原因不能包裹返回 false，包裹成功返回 NodeInterface
	 */
	wrapByNode(
		node: NodeInterface,
		mark: NodeInterface,
		plugin?: MarkInterface,
	): false | void | NodeInterface;
	/**
	 * 移除多个节点的mark
	 * @param nodes 要移除的节点集合
	 * @param removeMark 要移除的mark样式
	 */
	unwrapByNodes(
		nodes: NodeInterface[],
		removeMark?: NodeInterface | Array<NodeInterface>,
	): void;
	/**
	 * 去掉mark包裹
	 * @param range 光标
	 * @param removeMark 要移除的mark标签
	 */
	unwrap(
		removeMark?: NodeInterface | Node | string | Array<NodeInterface>,
		range?: RangeInterface,
	): void;
	/**
	 * 合并当前选区的mark节点
	 * @param range 光标，默认当前选区光标
	 */
	merge(range?: RangeInterface): void;
	/**
	 * 合并mark样式
	 * @param marks
	 */
	mergeMarks(marks: Array<NodeInterface>): void;
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
	/**
	 * 修复空 mark 节点占位符
	 * @param node mark 节点
	 */
	repairCursor(node: NodeInterface | Node): void;
}

export interface MarkInterface<T extends PluginOptions = PluginOptions>
	extends ElementPluginInterface<T> {
	readonly kind: string;
	/**
	 * 标签名称
	 */
	readonly tagName: string;
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
	readonly followStyle?: boolean;
	/**
	 * 在包裹相通节点并且属性名称一致，值不一致的mark节点的时候，是合并前者的值到新的节点还是移除前者mark节点，默认 false 移除
	 * 节点样式(style)的值将始终覆盖掉
	 * <span a="1">abc</span>
	 * 在使用 <span a="2"></span> 包裹上方节点时
	 * 如果合并值，就是 <span a="1,2">abc</span> 否则就是 <span a="2">abc</span>
	 */
	readonly combineValueByWrap?: boolean;
	/**
	 * 合并级别，值越大就合并在越外围，默认为1
	 */
	readonly mergeLeval: number;
	/**
	 * 初始化
	 */
	init(): void;
	/**
	 * 查询状态
	 */
	queryState(): any;
	/**
	 * 生成规则
	 */
	schema(): SchemaMark | Array<SchemaMark>;

	/**
	 * 是否触发执行增加当前mark标签包裹，否则将移除当前mark标签的包裹
	 * @param args 在调用 command.execute 执行插件传入时的参数
	 */
	isTrigger?(...args: any): boolean;
}
