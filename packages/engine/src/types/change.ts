import { EventListener, NodeInterface } from './node';
import { ActiveTrigger, CardInterface, CardType } from './card';
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
	event: ChangeEventInterface;
	marks: Array<NodeInterface>;
	blocks: Array<NodeInterface>;
	inlines: Array<NodeInterface>;
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
	 * 获取安全可控的光标对象
	 * @param range 默认当前光标
	 */
	getSafeRange(range?: RangeInterface): RangeInterface;
	/**
	 * 选中指定的范围
	 * @param range 光标
	 */
	select(range: RangeInterface): ChangeInterface;
	/**
	 * 聚焦编辑器
	 * @param toStart true:开始位置,false:结束位置，默认为之前操作位置
	 */
	focus(toStart?: boolean): ChangeInterface;
	/**
	 * 取消焦点
	 */
	blur(): ChangeInterface;
	/**
	 * 应用一个具有改变dom结构的操作
	 * @param range 光标
	 */
	apply(range?: RangeInterface): void;
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
	/**
	 * 插入片段
	 * @param fragment 片段
	 * @param callback 插入后的回调函数
	 */
	insertFragment(fragment: DocumentFragment, callback?: () => void): void;
	/**
	 * 删除内容
	 * @param range 光标，默认获取当前光标
	 * @param isDeepMerge 删除后是否合并
	 */
	deleteContent(range?: RangeInterface, isDeepMerge?: boolean): void;
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
