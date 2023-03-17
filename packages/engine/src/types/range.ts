import { Path } from '../model';
import { EditorInterface } from './editor';
import { NodeInterface } from './node';
import { SelectionInterface } from './selection';

export interface Range {
	prototype: RangeInterface;
	new (): RangeInterface;
	/**
	 * 从一个 Point 位置获取 RangeInterface 对象
	 */
	create: (
		editor: EditorInterface,
		doc?: Document,
		point?: { x: number; y: number },
	) => RangeInterface;
	/**
	 * 从 Window 、Selection、Range 中创建 RangeInterface 对象
	 */
	from: (
		editor: EditorInterface,
		win?: Window | globalThis.Selection | globalThis.Range,
	) => RangeInterface | null;
	/**
	 * 从路径转换为光标
	 * @param path
	 * @param context 上下文，默认编辑器节点
	 * @param includeCardCursor 是否还原到卡片两侧光标处，必须保证 参数 path 中包含光标位置信息
	 * @param root 根节点，默认编辑器根节点
	 */
	fromPath(
		path: Path[],
		context?: NodeInterface,
		includeCardCursor?: boolean,
		root?: NodeInterface,
	): RangeInterface;
}

export type RangePath = {
	path: number[];
	id: string;
	bi: number;
};

export interface RangeInterface {
	/**
	 * 原生range对象
	 */
	readonly base: globalThis.Range;
	/**
	 * 开始节点
	 */
	readonly startNode: NodeInterface;
	/**
	 * 结束节点
	 */
	readonly endNode: NodeInterface;
	/**
	 * 开始节点和结束节点的共同父节点
	 */
	readonly commonAncestorNode: NodeInterface;
	/**
	 * 开始节点
	 */
	readonly startContainer: Node;
	/**
	 * 结束节点
	 */
	readonly endContainer: Node;
	/**
	 * 开始节点和结束节点的共同父节点
	 */
	readonly commonAncestorContainer: Node;
	/**
	 * 光标的开始节点位置和结束节点位置是否重合
	 */
	readonly collapsed: boolean;
	/**
	 * 结束节点的偏移量
	 */
	readonly endOffset: number;
	/**
	 * 开始节点的偏移量
	 */
	readonly startOffset: number;
	/**
	 * 复制选区中的内容
	 */
	cloneContents(): DocumentFragment;
	/**
	 * 删除选区中的内容
	 */
	deleteContents(): void;
	/**
	 * 提取选区中的内容
	 */
	extractContents(): DocumentFragment;
	/**
	 * 获取选区中的 rect
	 */
	getBoundingClientRect(): DOMRect;
	/**
	 * 获取选区中的 rect
	 */
	getClientRects(): DOMRectList;
	/**
	 * 在光标位置插入一个节点
	 * @param node
	 */
	insertNode(node: Node | NodeInterface): void;
	/**
	 * 判断一个节点的偏移量是否在选区中
	 * @param node
	 * @param offset
	 */
	isPointInRange(node: Node | NodeInterface, offset: number): boolean;
	/**
	 * 如果点在范围之前，则返回 -1，如果点在范围内，则返回 0，如果点在范围之后，则返回 1。
	 * @param node
	 * @param offset
	 */
	comparePoint(node: Node | NodeInterface, offset: number): number;
	/**
	 * 设置range的结束节点和偏移量
	 * @param node
	 * @param offset
	 */
	setEnd(node: Node | NodeInterface, offset: number): void;
	/**
	 * 让range的结束节点选择在节点的后面
	 * @param node
	 */
	setEndAfter(node: Node | NodeInterface): void;
	/**
	 * 让range的结束节点选择在节点的前面
	 * @param node
	 */
	setEndBefore(node: Node | NodeInterface): void;
	/**
	 * 设置range的开始节点和偏移量
	 * @param node
	 * @param offset
	 */
	setStart(node: Node | NodeInterface, offset: number): void;
	/**
	 * 让range的开始节点选择在节点的后面
	 * @param node
	 */
	setStartAfter(node: Node | NodeInterface): void;
	/**
	 * 让range的开始节点选择在节点的前面
	 * @param node
	 */
	setStartBefore(node: Node | NodeInterface): void;
	/**
	 * 转换为字符串
	 */
	toString(): string;
	/**
	 * 转换为原生range对象
	 */
	toRange(): globalThis.Range;
	/**
	 * 设置range选择在开始节点或者结束节点位置重合
	 * @param toStart
	 */
	collapse(toStart?: boolean): RangeInterface;
	/**
	 * 复制range对象
	 */
	cloneRange(): RangeInterface;
	/**
	 * 选中一个节点
	 * @param node 节点
	 * @param contents 是否只选中内容
	 */
	select(node: NodeInterface | Node, contents?: boolean): RangeInterface;
	/**
	 * 获取光标选中的文本
	 */
	getText(): string | null;
	/**
	 * 获取光标所占的区域
	 */
	getClientRect(): DOMRect;
	/**
	 * 将选择标记从 TextNode 扩大到最近非TextNode节点
	 * range 实质所选择的内容不变
	 */
	enlargeFromTextNode(): RangeInterface;
	/**
	 * 将选择标记从非 TextNode 缩小到TextNode节点上，与 enlargeFromTextNode 相反
	 * range 实质所选择的内容不变
	 */
	shrinkToTextNode(): RangeInterface;
	/**
	 * 扩大边界
	 * <p><strong><span>[123</span>abc]</strong>def</p>
	 * to
	 * <p>[<strong><span>123</span>abc</strong>]def</p>
	 * @param range 选区
	 * @param toBlock 是否扩大到块级节点
	 * @param toTop 是否尽可能扩大的可编辑节点下
	 */
	enlargeToElementNode(toBlock?: boolean, toTop?: boolean): RangeInterface;
	/**
	 * 缩小边界
	 * <body>[<p><strong>123</strong></p>]</body>
	 * to
	 * <body><p><strong>[123]</strong></p></body>
	 */
	shrinkToElementNode(): RangeInterface;
	/**
	 * 创建 selection，通过插入 span 节点标记位置
	 * @param key 可选唯一标识
	 */
	createSelection(key?: string): SelectionInterface;
	/**
	 * 获取子选区集合
	 * @param includeCard 是否包含卡片
	 * @param filterSingleSelectableCard 是否过滤掉 singleSelectable = false 的卡片（不能单独选中）
	 */
	getSubRanges(
		includeCard?: boolean,
		filterSingleSelectableCard?: boolean,
	): Array<RangeInterface>;
	/**
	 * 设置一个节点为开始节点和结束节点到range
	 * @param node
	 * @param start
	 * @param end
	 */
	setOffset(
		node: Node | NodeInterface,
		start: number,
		end: number,
	): RangeInterface;
	/**
	 * 在选区中获取所有的节点
	 */
	findElements(): Array<Node>;
	/**
	 * 选区是否在卡片中
	 */
	inCard(): boolean;
	/**
	 * 获取选区开始位置的节点
	 */
	getStartOffsetNode(): Node;
	/**
	 * 获取选区结束位置的节点
	 */
	getEndOffsetNode(): Node;
	/**
	 * 让光标滚动到光标结束节点位置
	 */
	scrollIntoView(): void;
	/**
	 * 在视图内，让光标滚动到光标结束节点位置
	 */
	scrollRangeIntoView(): void;
	/**
	 * 光标未重合或者在视图内，让光标滚动到光标结束节点位置
	 * @param node
	 * @param view
	 */
	scrollIntoViewIfNeeded(node: NodeInterface, view: NodeInterface): void;
	/**
	 * 是否包含卡片
	 */
	containsCard(): boolean;
	/**
	 * 在光标位置对blcok添加或者删除br标签
	 * @param isLeft
	 */
	handleBr(isLeft?: boolean): RangeInterface;

	/**
	 * 获取开始位置前的节点
	 * <strong>foo</strong>|bar
	 */
	getPrevNode(): NodeInterface | undefined;

	/**
	 * 获取结束位置后的节点
	 * foo|<strong>bar</strong>
	 */
	getNextNode(): NodeInterface | undefined;
	/**
	 * 深度剪切
	 */
	deepCut(): void;

	/**
	 * 对比两个范围是否相等
	 *范围
	 */
	equal(range: RangeInterface | globalThis.Range): boolean;
	/**
	 * 获取当前选区最近的根节点
	 */
	getRootBlock(): NodeInterface | undefined;
	/**
	 * 过滤路径
	 * @param includeCardCursor
	 */
	filterPath(includeCardCursor?: boolean): (node: Node) => boolean;
	/**
	 * 获取光标路径
	 * @param includeCardCursor 是否包含卡片两侧光标
	 * @param root 根节点，默认编辑器根节点
	 */
	toPath(
		includeCardCursor?: boolean,
		root?: NodeInterface,
	): { start: RangePath; end: RangePath } | undefined;
}
