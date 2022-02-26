import { EventListener, NodeInterface } from './node';
import { CardInterface } from './card';
import { RangeInterface, RangePath } from './range';
import { Path } from 'sharedb';
import { ClipboardData } from './clipboard';

/**
 * Change 事件
 */
export interface ChangeEventInterface {
	/**
	 * 是否组合输入中
	 */
	isComposing: boolean;
	/**
	 * 是否选择中
	 */
	isSelecting: boolean;
	/**
	 * 是否在卡片中输入
	 * @param e
	 */
	isCardInput(e: Event): boolean;
	/**
	 * 输入事件
	 * @param callback
	 */
	onInput(callback: (event: InputEvent) => void): void;
	/**
	 * 选择事件
	 * @param callback
	 */
	onSelect(callback: (event: Event) => void): void;
	/**
	 * 粘贴事件
	 * @param callback
	 */
	onPaste(
		callback: (data: ClipboardData & { isPasteText: boolean }) => void,
	): void;
	/**
	 * 拖动事件
	 * @param callback
	 */
	onDrop(
		callback: (params: {
			event: DragEvent;
			range?: RangeInterface;
			card?: CardInterface;
			files: Array<File | null>;
		}) => void,
	): void;
	/**
	 * 绑定事件到 document 中
	 * @param eventType
	 * @param listener
	 * @param index
	 */
	onDocument(
		eventType: string,
		listener: EventListener,
		index?: number,
	): void;
	/**
	 * 绑定事件到 window 中
	 * @param eventType
	 * @param listener
	 * @param index
	 */
	onWindow(eventType: string, listener: EventListener, index?: number): void;
	/**
	 * 绑定事件到编辑器容器节点中
	 * @param eventType
	 * @param listener
	 * @param index
	 */
	onContainer(
		eventType: string,
		listener: EventListener,
		index?: number,
	): void;
	/**
	 * 绑定事件到编辑器根节点中
	 * @param eventType
	 * @param listener
	 * @param index
	 */
	onRoot(eventType: string, listener: EventListener, index?: number): void;
	/**
	 * 销毁
	 */
	destroy(): void;
}

export type ChangeEventOptions = {
	bindInput?: () => boolean;
	bindSelect?: () => boolean;
	bindPaste?: () => boolean;
	bindDrop?: () => boolean;
};

export type ChangeOptions = {
	/**
	 * 值改变事件
	 */
	onChange?: (trigger: 'remote' | 'local' | 'both') => void;
	/**
	 * 光标选择事件
	 */
	onSelect?: () => void;
	/**
	 * 值实时变化事件
	 */
	onRealtimeChange?: (trigger: 'remote' | 'local') => void;
	/**
	 * 设置值后触发
	 */
	onSetValue?: () => void;
};

export interface ChangeConstructor {
	/**
	 * 构造函数
	 */
	new (container: NodeInterface, options: ChangeOptions): ChangeInterface;
}
export interface ChangeRangeInterface {
	/**
	 * 获取当前选区的范围
	 */
	get(): RangeInterface;
	/**
	 * 获取安全可控的光标对象
	 * @param range 默认当前光标
	 */
	toTrusty(range?: RangeInterface): RangeInterface;
	/**
	 * 选中指定的范围
	 * @param range 光标
	 * @param triggerSelect 时候触发onSelect事件
	 */
	select(range: RangeInterface, triggerSelect?: boolean): void;
	/**
	 * 聚焦编辑器
	 * @param toStart true:开始位置,false:结束位置，默认为之前操作位置
	 */
	focus(toStart?: boolean): void;
	/**
	 * 取消焦点
	 */
	blur(): void;
}
/**
 * Change 接口
 */
export interface ChangeInterface {
	/**
	 * 初始化
	 */
	init(): void;
	/**
	 * 命令执行器的range位置
	 */
	rangePathBeforeCommand?: { start: RangePath; end: RangePath };
	/**
	 * 事件对象
	 */
	event: ChangeEventInterface;
	/**
	 * Range 对象
	 */
	range: ChangeRangeInterface;
	/**
	 * 当前光标位置处的所有 mark 节点
	 */
	marks: Array<NodeInterface>;
	/**
	 * 当前光标位置处的所有 block 节点
	 */
	blocks: Array<NodeInterface>;
	/**
	 * 当前光标位置处的所有 inline 节点
	 */
	inlines: Array<NodeInterface>;
	/**
	 * 编辑器值改变触发
	 */
	onChange: (trigger: 'remote' | 'local' | 'both') => void;
	/**
	 * 编辑器中光标改变触发
	 */
	onSelect: () => void;
	/**
	 * 设置编辑器值后触发
	 */
	onSetValue: () => void;
	/**
	 * 触发一个编辑器值改变事件
	 * @param isRemote 是否是远程操作
	 * @param node 触发后变更的节点
	 */
	change(isRemote?: boolean, node?: Array<NodeInterface>): void;
	/**
	 * 应用一个具有改变dom结构的操作
	 * @param range 光标
	 */
	apply(range?: RangeInterface): void;
	/**
	 * 把分隔开的文字组合成一个节点
	 */
	combinText(): void;
	/**
	 * 是否在组合输入法中
	 */
	isComposing(): boolean;
	/**
	 *光标是否在选择中
	 */
	isSelecting(): boolean;
	/**
	 * 初始化一个编辑器空值
	 * @param range
	 */
	initValue(range?: RangeInterface): void;
	/**
	 * 给编辑器设置一个值
	 * @param value 值
	 * @param onParse 解析回调
	 * @param callback 渲染完成后回调
	 */
	setValue(
		value: string,
		onParse?: (node: NodeInterface) => void,
		callback?: (count: number) => void,
	): void;
	/**
	 * 设置html，会格式化为合法的编辑器值
	 * @param html html
	 * @param callback 异步渲染卡片后回调
	 */
	setHtml(html: string, callback?: (count: number) => void): void;
	/**
	 * 设置markdown，会格式化为合法的编辑器值
	 * @param text markdown文本
	 * @param callback 异步渲染卡片后回调
	 */
	setMarkdown(text: string, callback?: (count: number) => void): void;
	/**
	 * 获取编辑器值
	 */
	getOriginValue(container?: NodeInterface): string;
	/**
	 * 获取编辑值
	 * @param options
	 */
	getValue(options: { ignoreCursor?: boolean }): string;
	/**
	 * 在执行一个操作前缓存当前光标
	 */
	cacheRangeBeforeCommand(): void;
	/**
	 * 获取当前缓存的光标路径
	 */
	getRangePathBeforeCommand():
		| { start: RangePath; end: RangePath }
		| undefined;
	/**
	 * 当前编辑器是否未空值
	 */
	isEmpty(): boolean;
	/**
	 * 插入片段
	 * @param fragment 片段
	 * @param callback 插入后的回调函数
	 * @param followActiveMark 删除后空标签是否跟随当前激活的mark样式
	 */
	insert(
		fragment: DocumentFragment,
		range?: RangeInterface,
		callback?: (range: RangeInterface) => void,
		followActiveMark?: boolean,
	): void;
	/**
	 * 在当前光标位置粘贴一段html
	 * @param html html
	 * @param range 光标位置
	 * @param callback 卡片渲染回调
	 */
	paste(
		html: string,
		range?: RangeInterface,
		callback?: (count: number) => void,
	): void;
	/**
	 * 删除内容
	 * @param range 光标，默认获取当前光标
	 * @param isDeepMerge 删除后是否合并
	 * @param followActiveMark 删除后空标签是否跟随当前激活的mark样式
	 */
	delete(
		range?: RangeInterface,
		isDeepMerge?: boolean,
		followActiveMark?: boolean,
	): void;
	/**
	 * 去除当前光标最接近的block节点或传入的节点外层包裹
	 * @param node 节点
	 */
	unwrap(node?: NodeInterface): void;
	/**
	 * 删除当前光标最接近的block节点或传入的节点的前面一个节点后合并
	 * @param node 节点
	 */
	mergeAfterDelete(node?: NodeInterface): void;
	/**
	 * 销毁
	 */
	destroy(): void;
}

export type DragoverOptions = {
	className?: string;
};
