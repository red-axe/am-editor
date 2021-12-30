import { CardInterface } from './card';
import { NodeInterface } from './node';
import { BlockInterface } from './block';
import { RangeInterface } from './range';
import { PluginOptions } from './plugin';

/**
 * 列表删除键处理器
 */
export interface BackspaceInterface {
	trigger(event: KeyboardEvent, isDeepMerge?: boolean): boolean | undefined;
}
/**
 * 列表接口
 */
export interface ListInterface<T extends PluginOptions = PluginOptions>
	extends BlockInterface<T> {
	/**
	 * 自定义列表卡片名称
	 */
	cardName?: string;
	/**
	 * 判断节点是否是当前插件所需的list节点
	 * @param node 节点
	 */
	isCurrent(node: NodeInterface): boolean;
}

/**
 * 列表管理器
 */
export interface ListModelInterface {
	/**
	 * 自定义列表样式
	 */
	readonly CUSTOMZIE_UL_CLASS: string;
	/**
	 * 自定义列表样式
	 */
	readonly CUSTOMZIE_LI_CLASS: string;
	/**
	 * 列表缩进key
	 */
	readonly INDENT_KEY: string;
	/**
	 * 删除事件处理器
	 */
	backspaceEvent?: BackspaceInterface;
	/**
	 * 初始化
	 */
	init(): void;
	/**
	 * 判断列表项节点是否为空
	 * @param node 节点
	 */
	isEmptyItem(node: NodeInterface): boolean;
	/**
	 * 判断两个节点是否是一样的List节点
	 * @param sourceNode 源节点
	 * @param targetNode 目标节点
	 */
	isSame(sourceNode: NodeInterface, targetNode: NodeInterface): boolean;
	/**
	 * 判断节点集合是否是指定类型的List列表
	 * @param blocks 节点集合
	 * @param name 节点标签类型
	 * @param card 是否是指定的自定义列表项的卡片名称
	 */
	isSpecifiedType(
		blocks: Array<NodeInterface>,
		name?: 'ul' | 'ol',
		card?: string,
	): boolean;
	/**
	 * 获取所有List插件
	 */
	getPlugins(): Array<ListInterface>;
	/**
	 * 根据列表节点获取列表插件名称
	 * @param block 节点
	 */
	getPluginNameByNode(block: NodeInterface): string;
	/**
	 * 获取一个列表节点集合所属列表插件名称
	 * @param blocks 节点集合
	 */
	getPluginNameByNodes(blocks: Array<NodeInterface>): string;
	/**
	 * 清除自定义列表节点相关属性
	 * @param node 节点
	 */
	unwrapCustomize(node: NodeInterface): NodeInterface;
	/**
	 * 取消节点的列表
	 * @param blocks 节点集合
	 * @param normalBlock 要转换的block默认为 <p />
	 */
	unwrap(blocks: Array<NodeInterface>, normalBlock?: NodeInterface): void;
	/**
	 * 获取当前选区的修复列表后的节点集合
	 */
	normalize(): Array<NodeInterface>;
	/**
	 * 将选中列表项列表分割出来单独作为一个列表
	 */
	split(range?: RangeInterface): void;
	/**
	 * 合并列表
	 * @param blocks 节点集合，默认为当前选区的blocks
	 */
	merge(blocks?: Array<NodeInterface>, range?: RangeInterface): void;
	/**
	 * 给列表添加start序号
	 * @param block 列表节点
	 */
	addStart(block?: NodeInterface): void;
	/**
	 * 给列表节点增加缩进
	 * @param block 列表节点
	 * @param value 缩进值
	 */
	addIndent(block: NodeInterface, value: number, maxValue?: number): void;
	/**
	 * 给列表节点增加文字方向
	 * @param block 列表项节点
	 * @param align 方向
	 * @returns
	 */
	addAlign(
		block: NodeInterface,
		align?: 'left' | 'center' | 'right' | 'justify',
	): void;

	/**
	 * 获取列表节点 indent 值
	 * @param block 列表节点
	 * @returns
	 */
	getIndent(block: NodeInterface): number;

	/**
	 * 为自定义列表项添加卡片节点
	 * @param node 列表节点项
	 * @param cardName 卡片名称，必须是支持inline卡片类型
	 * @param value 卡片值
	 */
	addCardToCustomize(
		node: NodeInterface | Node,
		cardName: string,
		value?: any,
	): CardInterface | undefined;
	/**
	 * 为自定义列表项添加待渲染卡片节点
	 * @param node 列表节点项
	 * @param cardName 卡片名称，必须是支持inline卡片类型
	 * @param value 卡片值
	 */
	addReadyCardToCustomize(
		node: NodeInterface | Node,
		cardName: string,
		value?: any,
	): NodeInterface | undefined;
	/**
	 * 给列表添加BR标签
	 * @param node 列表节点项
	 */
	addBr(node: NodeInterface): void;
	/**
	 * 在列表处插入节点
	 * @param nodes 节点集合
	 * @param range 光标
	 */
	insert(fragment: DocumentFragment, range?: RangeInterface): void;
	/**
	 * block 节点转换为列表项节点
	 * @param block block 节点
	 * @param root 列表根节点
	 * @param cardName 可选，自定义列表项卡片名称
	 * @param value 可选，自定义列表项卡片值
	 * @returns root 根节点
	 */
	blockToItem(
		block: NodeInterface,
		root: NodeInterface,
		cardName?: string,
		value?: string,
	): NodeInterface;
	/**
	 * 将节点转换为自定义节点
	 * @param blocks 节点
	 * @param cardName 卡片名称
	 * @param value 卡片值
	 */
	toCustomize(
		blocks: Array<NodeInterface> | NodeInterface,
		cardName: string,
		value?: any,
		tagName?: 'ol' | 'ul',
	): Array<NodeInterface> | NodeInterface;
	/**
	 * 将节点转换为列表节点
	 * @param blocks 节点
	 * @param tagName 列表节点名称，ul 或者 ol，默认为ul
	 * @param start 有序列表开始序号
	 */
	toNormal(
		blocks: Array<NodeInterface> | NodeInterface,
		tagName?: 'ul' | 'ol',
		start?: number,
	): Array<NodeInterface> | NodeInterface;
	/**
	 * 判断选中的区域是否在列表的开始
	 * 选中的区域
	 */
	isFirst(range: RangeInterface): boolean;

	/**
	 * 判断选中的区域是否在列表的末尾
	 */
	isLast(range: RangeInterface): boolean;
}
