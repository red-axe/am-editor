import { NodeInterface } from './node';
import { PluginInterface, ElementPluginInterface } from './plugin';
import { RangeInterface } from './range';
import { SchemaBlock } from './schema';

export interface BlockModelInterface {
	/**
	 * 初始化
	 */
	init(): void;
	/**
	 * 根据节点查找block插件实例
	 * @param node 节点
	 */
	findPlugin(node: NodeInterface): Array<BlockInterface>;
	/**
	 * 查找Block节点的一级节点。如 div -> H2 返回 H2节点
	 * @param parentNode 父节点
	 * @param childNode 子节点
	 */
	findTop(parentNode: NodeInterface, childNode: NodeInterface): NodeInterface;
	/**
	 * 获取最近的block节点，找不到返回 node
	 * @param node 节点
	 */
	closest(node: NodeInterface): NodeInterface;
	/**
	 * 在光标位置包裹一个block节点
	 * @param block 节点
	 * @param range 光标
	 */
	wrap(block: NodeInterface | Node | string, range?: RangeInterface): void;
	/**
	 * 移除光标所在block节点包裹
	 * @param block 节点
	 * @param range 光标
	 */
	unwrap(block: NodeInterface | Node | string, range?: RangeInterface): void;
	/**
	 * 获取节点相对于光标开始位置、结束位置下的兄弟节点集合
	 * @param range 光标
	 * @param block 节点
	 */
	getSiblings(
		range: RangeInterface,
		block: NodeInterface,
	): Array<{ node: NodeInterface; position: 'left' | 'center' | 'right' }>;
	/**
	 * 分割当前光标选中的block节点
	 * @param range 光标
	 */
	split(range?: RangeInterface): void;
	/**
	 * 在当前光标位置插入block节点
	 * @param block 节点
	 * @param remove 是否移除当前位置上的block
	 * @param range 光标
	 */
	insert(
		block: NodeInterface | Node | string,
		remove?: boolean,
		range?: RangeInterface,
	): void;
	/**
	 * 设置当前光标所在的所有block节点为新的节点或设置新属性
	 * @param block 需要设置的节点或者节点属性
	 * @param range 光标
	 */
	setBlocks(
		block: string | { [k: string]: any },
		range?: RangeInterface,
	): void;
	/**
	 * 合并当前光标位置相邻的block
	 * @param range 光标
	 */
	merge(range?: RangeInterface): void;
	/**
	 * 查找对范围有效果的所有 Block
	 * @param range 范围
	 */
	findBlocks(range: RangeInterface): Array<NodeInterface>;
	/**
	 * 判断范围的 {Edge}Offset 是否在 Block 的开始位置
	 * @param range 光标
	 * @param edge start ｜ end
	 */
	isFirstOffset(range: RangeInterface, edge: 'start' | 'end'): boolean;
	/**
	 * 判断范围的 {Edge}Offset 是否在 Block 的最后位置
	 * @param range 光标
	 * @param edge start ｜ end
	 */
	isLastOffset(range: RangeInterface, edge: 'start' | 'end'): boolean;
	/**
	 * 获取范围内的所有 Block
	 * @param range  光标s
	 */
	getBlocks(range: RangeInterface): Array<NodeInterface>;

	/**
	 * 获取 Block 左侧文本
	 * @param block 节点
	 */
	getLeftText(block: NodeInterface | Node): string;

	/**
	 * 删除 Block 左侧文本
	 * @param block 节点
	 */
	removeLeftText(block: NodeInterface | Node): void;
	/**
	 * 生成 cursor 左侧或右侧的节点，放在一个和父节点一样的容器里
	 * isLeft = true：左侧
	 * isLeft = false：右侧
	 * @param param0
	 */
	createSide({
		block,
		range,
		isLeft,
		clone,
		keepID,
	}: {
		block: NodeInterface | Node;
		range: RangeInterface;
		isLeft: boolean;
		clone?: boolean;
		keepID?: boolean;
	}): NodeInterface;
	/**
	 * 整理块级节点
	 * @param domNode 节点
	 * @param root 根节点
	 */
	flatten(domNode: NodeInterface, root: NodeInterface): void;
	/**
	 * 根据规则获取需要为节点创建 data-id 的标签名称集合
	 * @returns
	 */
	getMarkIdTags(): Array<string>;
	/**
	 * 给节点创建data-id
	 * @param node 节点
	 * @param index 索引
	 * @returns
	 */
	createDataID(node: Node | NodeInterface, index: number): string;
	/**
	 * 获取或产生节点的data-id
	 * @param root 根节点
	 * @param node 节点
	 * @returns
	 */
	generateDataID(root: Element, node: HTMLElement): string | null;
	/**
	 * 在根节点内为需要创建data-id的子节点创建data-id
	 * @param root 根节点
	 */
	generateDataIDForDescendant(root: Element): void;
	/**
	 * 为节点创建一个随机data-id
	 * @param node 节点
	 * @param isCreate 如果有，是否需要重新创建
	 * @returns
	 */
	generateRandomID(node: Node | NodeInterface, isCreate?: boolean): string;
	/**
	 * 在根节点内为需要创建data-id的子节点创建随机data-id
	 * @param node 节点
	 * @param isCreate 如果有，是否需要重新创建
	 */
	generateRandomIDForDescendant(root: Node, isCreate?: boolean): void;
	/**
	 * 判断一个节点是否需要创建data-id
	 * @param name 节点名称
	 * @returns
	 */
	needMarkDataID(name: string): boolean;
	/**
	 * br 换行改成段落
	 * @param block 节点
	 */
	brToBlock(block: NodeInterface): void;

	/**
	 * 插入一个空的block节点
	 * @param range 光标所在位置
	 * @param block 节点
	 * @returns
	 */
	insertEmptyBlock(range: RangeInterface, block: NodeInterface): void;
	/**
	 * 在光标位置插入或分割节点
	 * @param range 光标所在位置
	 * @param block 节点
	 */
	insertOrSplit(range: RangeInterface, block: NodeInterface): void;
}

export interface BlockInterface extends ElementPluginInterface {
	readonly kind: string;
	/**
	 * 标签名称
	 */
	readonly tagName: string | Array<string>;
	/**
	 * 该节点允许可以放入的block节点，默认为编辑器顶层节点
	 */
	readonly allowIn?: Array<string>;
	/**
	 * 禁用的mark插件样式
	 */
	readonly disableMark?: Array<string>;
	/**
	 * 是否能够合并
	 */
	readonly canMerge?: boolean;
	/**
	 * 获取当前插件定义规则
	 */
	schema(): SchemaBlock | Array<SchemaBlock>;

	/**
	 * Markdown 处理
	 * @returns 返回false表示已拦截处理
	 */
	markdown?(
		event: KeyboardEvent,
		text: string,
		block: NodeInterface,
		node: NodeInterface,
	): boolean | void;
}

export const isBlockPlugin = (
	plugin: PluginInterface,
): plugin is BlockInterface => {
	return plugin.kind === 'block';
};
