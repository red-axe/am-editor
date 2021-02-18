import { EventListener, NodeInterface } from './node';
import {
	ActiveTrigger,
	CardInterface,
	CardModelInterface,
	CardType,
} from './card';
import { RangeInterface } from './range';
import { Path } from 'sharedb';
import { ClipboardData } from './clipboard';

export interface ChangeEventInterface {
	isComposing: boolean;
	isSelecting: boolean;

	isCardInput(e: Event): boolean;
	onInput(callback: (event?: Event) => void): void;
	onSelect(callback: (event?: Event) => void): void;
	onPaste(
		callback: (data: ClipboardData & { isPasteText: boolean }) => void,
	): void;
	onDrop(
		callback: (params: {
			event: DragEvent;
			range?: RangeInterface;
			card?: CardInterface;
			files: Array<File | null>;
		}) => void,
	): void;
	onDocument(
		eventType: string,
		listener: EventListener,
		rewrite?: boolean,
	): void;
	onWindow(
		eventType: string,
		listener: EventListener,
		rewrite?: boolean,
	): void;
	onContainer(eventType: string, listener: EventListener): void;
	destroy(): void;
}

export type ChangeEventOptions = {
	bindInput?: () => boolean;
	bindSelect?: () => boolean;
	bindPaste?: () => boolean;
	bindDrop?: () => boolean;
	bindContainer?: (eventType: string, listener: EventListener) => void;
	unbindContainer?: (eventType: string, listener: EventListener) => void;
};

export type ChangeOptions = {
	onChange?: (value: string) => void;
	onSelect?: () => void;
	onSetValue?: () => void;
};

export interface ChangeConstructor {
	/**
	 * 构造函数
	 */
	new (container: NodeInterface, options: ChangeOptions): ChangeInterface;
}

export interface ChangeInterface {
	rangePathBeforeCommand: Path[] | null;
	marks: Array<NodeInterface>;
	blocks: Array<NodeInterface>;
	onChange: (value: string) => void;
	onSelect: () => void;
	onSetValue: () => void;
	change(): void;
	/**
	 * 获取当前选区
	 */
	getSelectionRange(): RangeInterface;
	/**
	 * 获取当前选区的范围
	 */
	getRange(): RangeInterface;
	/**
	 * 选中指定的范围
	 * @param range 光标
	 */
	select(range: RangeInterface): ChangeInterface;
	/**
	 * 焦点
	 */
	focus(): ChangeInterface;
	/**
	 * 将焦点放在最前
	 */
	focusToStart(): ChangeInterface;
	/**
	 * 将焦点放在最后
	 */
	focusToEnd(): ChangeInterface;
	/**
	 * 取消焦点
	 */
	blur(): ChangeInterface;
	combinTextNode(): void;
	isComposing(): boolean;
	isSelecting(): boolean;
	setValue(value: string, onParse?: (node: Node) => void): void;
	getOriginValue(): string;
	getValue(options: { ignoreCursor?: boolean }): string;
	cacheRangeBeforeCommand(): void;
	getRangePathBeforeCommand(): Path[] | null;
	isEmpty(): boolean;
	destroy(): void;
	activateCard(
		node: NodeInterface,
		trigger?: ActiveTrigger,
		event?: MouseEvent,
	): void;
	selectCard(card: CardInterface): void;
	focusCard(card: CardInterface, toStart?: boolean): void;
	insertCard(name: string, type?: CardType, value?: any): CardInterface;
	updateCard(component: NodeInterface | Node | string, value: any): void;
	removeCard(component: NodeInterface | Node | string): void;
	/**
	 * 增加mark节点
	 * @param mark mark节点
	 * @param supplement mark两侧节点
	 */
	addMark(
		mark: NodeInterface | Node | string,
		supplement?: NodeInterface,
	): ChangeInterface;
	/**
	 * 插入文本
	 * @param text 文本
	 */
	insertText(text: string): ChangeInterface;
	/**
	 * 插入mark节点
	 * @param mark mark 节点或选择器
	 */
	insertMark(mark: NodeInterface | Node | string): ChangeInterface;
	/**
	 * 插入inline节点
	 * @param inline inline节点或选择器
	 */
	insertInline(inline: NodeInterface | Node | string): ChangeInterface;
	/**
	 * 插入block节点
	 * @param block block节点或选择器
	 * @param keepOld
	 */
	insertBlock(
		block: NodeInterface | Node | string,
		keepOld: boolean,
	): ChangeInterface;
	/**
	 * 插入片段
	 * @param fragment 片段
	 * @param callback 插入后的回调函数
	 */
	insertFragment(
		fragment: DocumentFragment,
		callback?: () => void,
	): ChangeInterface;
	/**
	 * 分割mark
	 * @param mark 需要删除的标签
	 */
	splitMark(mark?: NodeInterface | Node | string): ChangeInterface;
	/**
	 * 分割block
	 */
	splitBlock(): ChangeInterface;
	/**
	 * 移除mark标签
	 * @param mark mark 标签或选择器
	 */
	removeMark(mark?: NodeInterface | Node | string): ChangeInterface;
	/**
	 * 合并mark标签
	 */
	mergeMark(): ChangeInterface;
	/**
	 * 合并相邻的List
	 */
	mergeAdjacentList(): ChangeInterface;
	/**
	 * 合并相邻的Blockquote
	 */
	mergeAdjacentBlockquote(): ChangeInterface;
	/**
	 * 包裹inline标签
	 * @param inline inline节点或选择器
	 */
	wrapInline(inline: NodeInterface | Node | string): ChangeInterface;
	/**
	 * 包裹block标签
	 * @param block block节点或选择器
	 */
	wrapBlock(block: NodeInterface | Node | string): ChangeInterface;
	/**
	 * 清除inline包裹标签
	 */
	unwrapInline(): ChangeInterface;
	/**
	 * 清除block包裹标签
	 * @param block block节点或选择器
	 */
	unwrapBlock(block: NodeInterface | Node | string): ChangeInterface;
	/**
	 * 设置标签属性
	 * @param block 标签或者属性对象集合
	 */
	setBlocks(block: string | { [k: string]: any }): ChangeInterface;
	/**
	 * 删除内容
	 * @param isDeepMerge 删除后是否合并
	 */
	deleteContent(isDeepMerge?: boolean): ChangeInterface;
	/**
	 * 将选区的列表扣出来，并将切断的列表修复
	 */
	separateBlocks(): ChangeInterface;
	/**
	 * 删除节点，删除后如果是空段落，自动添加 BR
	 * @param node 要删除的节点
	 */
	addBrAfterDelete(node: NodeInterface): void;
	/**
	 * 去除当前光标最接近的block节点或传入的节点外层包裹
	 * @param node 节点
	 */
	unwrapNode(node?: NodeInterface): void;
	/**
	 * 删除当前光标最接近的block节点或传入的节点的前面一个节点后合并
	 * @param node 节点
	 */
	mergeAfterDeletePrevNode(node?: NodeInterface): void;
	/**
	 * 焦点移动到当前光标最接近的block节点或传入的节点前一个 Block
	 * @param block 节点
	 * @param isRemoveEmptyBlock 如果前一个block为空是否删除，默认为否
	 */
	focusPrevBlock(block?: NodeInterface, isRemoveEmptyBlock?: boolean): void;
}

export type DragoverOptions = {
	className?: string;
};
