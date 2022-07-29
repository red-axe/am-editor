import { EditorInterface } from './editor';
import { NodeInterface } from './node';
import { TinyCanvasInterface } from './tiny-canvas';
import { RangeInterface } from './range';
import {
	DropdownButtonOptions,
	DropdownSwitchOptions,
	ToolbarItemOptions,
} from './toolbar';
import { CardActiveTrigger, CardType, SelectStyleType } from '../card/enum';
import { Placement } from './position';

export interface CardOptions<T extends CardValue = CardValue> {
	editor: EditorInterface;
	value?: Partial<T>;
	root?: NodeInterface;
}

export type CardValue = {
	id?: string;
	type?: CardType;
};

export interface CardToolbarInterface {
	/**
	 * 创建卡片的toolbar
	 */
	create(): void;
	/**
	 * 隐藏toolbar，包含dnd
	 */
	hide(): void;
	/**
	 * 展示toolbar，包含dnd
	 * @param event 鼠标事件，用于定位
	 */
	show(event?: MouseEvent): void;
	/**
	 * 只隐藏卡片的toolbar，不包含dnd
	 */
	hideCardToolbar(): void;
	/**
	 * 只显示卡片的toolbar，不包含dnd
	 * @param event 鼠标事件，用于定位
	 */
	showCardToolbar(event?: MouseEvent): void;
	/**
	 * 获取工具栏容器
	 */
	getContainer(): NodeInterface | undefined;
	/**
	 * 设置工具栏偏移量[上x，上y，下x，下y]
	 * @param offset 偏移量 [tx,ty,bx,by]
	 */
	setOffset(offset: Array<number>): void;
	/**
	 * 设置默认对齐方式
	 * @param align
	 */
	setDefaultAlign(align: Placement): void;
	/**
	 * 更新位置
	 */
	update(): void;
	/**
	 * 销毁
	 */
	destroy(): void;
}

export type CardToolbarItemOptions =
	| {
			key?: string;
			type: 'dnd';
			content?: string;
			title?: string;
	  }
	| {
			key?: string;
			type: 'separator';
			node?: NodeInterface;
	  }
	| {
			key?: string;
			type: 'delete' | 'maximize' | 'copy';
			disabled?: boolean;
			content?: string;
			title?: string;
			onClick?: (event: MouseEvent, node: NodeInterface) => void;
	  }
	| {
			key?: string;
			type: 'more';
			disabled?: boolean;
			content?: string;
			title?: string | (() => string);
			items: Array<DropdownSwitchOptions | DropdownButtonOptions>;
	  };

export interface CardEntry<T extends CardValue = CardValue> {
	prototype: CardInterface;
	new (options: CardOptions<T>): CardInterface;
	/**
	 * 卡片名称
	 */
	readonly cardName: string;
	/**
	 * 卡片类型 block inline
	 */
	readonly cardType: CardType;
	/**
	 * 是否能自动选中
	 */
	readonly autoSelected: boolean;
	/**
	 * 是否能自动激活
	 */
	readonly autoActivate: boolean;
	/**
	 * 是否能单独选中
	 */
	readonly singleSelectable: boolean;
	/**
	 * 是否能协作，默认为true
	 */
	readonly collab: boolean;
	/**
	 * 是否能聚焦
	 */
	readonly focus: boolean;
	/**
	 * 卡片选中后的样式效果，默认为 border
	 */
	readonly selectStyleType: SelectStyleType;
	/**
	 * 是否在卡片处于视图内时才渲染，默认 false
	 */
	readonly lazyRender: boolean;
}

export interface CardInterface<T extends CardValue = CardValue> {
	/**
	 * 初始化调用
	 */
	init(): void;
	/**
	 * 卡片ID
	 */
	readonly id: string;
	/**
	 * 卡片名称
	 */
	readonly name: string;
	/**
	 * 卡片是否可编辑
	 */
	readonly isEditable: boolean;
	/**
	 * 卡片根节点
	 */
	readonly root: NodeInterface;
	/**
	 * 是否激活
	 */
	readonly activated: boolean;
	/**
	 * 是否选中
	 */
	readonly selected: boolean;
	/**
	 * 可编辑的节点
	 */
	readonly contenteditable: Array<string>;
	/**
	 * 卡片是否处于懒加载中
	 */
	readonly loading: boolean;
	/**
	 * 卡片类型，设置卡片类型会触发card重新渲染
	 */
	type: CardType;
	/**
	 * 是否最大化
	 */
	isMaximize: boolean;
	/**
	 * 激活者，协同状态下有效
	 */
	activatedByOther: string | false;
	/**
	 * 选中者，协同状态下有效
	 */
	selectedByOther: string | false;
	/**
	 * 工具栏
	 */
	toolbarModel?: CardToolbarInterface;
	/**
	 * 大小调整
	 */
	resizeModel?: ResizeInterface;
	/**
	 * 获取Card内的 DOM 节点
	 * @param selector
	 */
	find(selector: string): NodeInterface;
	/**
	 * 通过 data-card-element 的值，获取当前Card内的 DOM 节点
	 * @param key key
	 */
	findByKey(key: string): NodeInterface | undefined;
	/**
	 * 获取卡片的中心节点
	 */
	getCenter(): NodeInterface;
	/**
	 * 判断节点是否属于卡片的中心节点
	 * @param node 节点
	 */
	isCenter(node: NodeInterface): boolean;
	/**
	 * 判断节点是否在卡片的左右光标处
	 * @param node 节点
	 */
	isCursor(node: NodeInterface): boolean;
	/**
	 * 判断节点是否在卡片的左光标处
	 * @param node 节点
	 */
	isLeftCursor(node: NodeInterface): boolean;
	/**
	 * 判断节点是否在卡片的右光标处
	 * @param node 节点
	 */
	isRightCursor(node: NodeInterface): boolean;
	/**
	 * 聚焦卡片
	 * @param range 光标
	 * @param toStart 是否开始位置
	 */
	focus(range: RangeInterface, toStart?: boolean): void;
	/**
	 * 当卡片聚焦时触发
	 */
	onFocus?(): void;
	/**
	 * 激活Card
	 * @param activated 是否激活
	 */
	activate(activated: boolean): void;
	/**
	 * 选择Card
	 * @param selected 是否选中
	 */
	select(selected: boolean): void;
	/**
	 * 选中状态变化时触发
	 * @param selected 是否选中
	 */
	onSelect(selected: boolean): void;
	/**
	 * 协同状态下，选中状态变化时触发
	 * @param selected 是否选中
	 * @param value { color:协同者颜色 , rgb:颜色rgb格式 }
	 */
	onSelectByOther(
		selected: boolean,
		value?: {
			color: string;
			rgb: string;
		},
	): NodeInterface | void;
	/**
	 * 在卡片右侧光标容器位置按下左键触发，可以实现如何选中卡片内部自定义操作
	 */
	onSelectLeft?(event: KeyboardEvent): boolean | void;
	/**
	 * 在卡片左侧光标容器位置按下右键触发，可以实现如何选中卡片内部自定义操作
	 */
	onSelectRight?(event: KeyboardEvent): boolean | void;
	/**
	 * 在卡片下方按下上键触发(block类型有效)，可以实现如何选中卡片内部自定义操作
	 */
	onSelectUp?(event: KeyboardEvent): boolean | void;
	/**
	 * 在卡片上方按下下键触发(block类型有效)，可以实现如何选中卡片内部自定义操作
	 */
	onSelectDown?(event: KeyboardEvent): boolean | void;
	/**
	 * 激活状态变化时触发
	 * @param activated 是否激活
	 */
	onActivate(activated: boolean): void;
	/**
	 * 协同状态下，激活状态变化时触发
	 * @param activated 是否激活
	 * @param value { color:协同者颜色 , rgb:颜色rgb格式 }
	 */
	onActivateByOther(
		activated: boolean,
		value?: {
			color: string;
			rgb: string;
		},
	): NodeInterface | void;
	/**
	 * 可编辑器区域值改变时触发
	 * @param trigger 是否远程触发
	 * @param node 可编辑器区域节点
	 */
	onChange?(trigger: 'remote' | 'local', node: NodeInterface): void;
	/**
	 * 卡片值变更时，返回false则阻止写入历史记录
	 * @param value
	 */
	writeHistoryOnValueChange?(value: T): void | false;
	/**
	 * 设置卡片值
	 * @param value 值
	 */
	setValue(value: Partial<T>): void;
	/**
	 * 获取卡片值
	 */
	getValue(): T;
	/**
	 * 工具栏配置项
	 */
	toolbar?(): Array<CardToolbarItemOptions | ToolbarItemOptions>;
	/**
	 * 是否可改变卡片大小，或者传入渲染节点
	 */
	resize?: boolean | (() => NodeInterface | void);
	/**
	 * 最大化
	 */
	maximize(): void;
	/**
	 * 最小化
	 */
	minimize(): void;
	/**
	 * 渲染前触发，异步加载、懒加载会调用这个方法
	 */
	beforeRender?(): void;
	/**
	 * 渲染卡片
	 * @param args 渲染自定义参数
	 */
	render(...args: any): NodeInterface | string | void;
	/**
	 * 销毁
	 */
	destroy?(): void;
	/**
	 * 插入后触发
	 */
	didInsert?(): void;
	/**
	 * 更新后触发
	 */
	didUpdate?(): void;
	/**
	 * 渲染后触发
	 */
	didRender(): void;
	/**
	 * 渲染可编辑器卡片协同选择区域
	 * @param node 背景画布
	 * @param range 渲染光标
	 */
	drawBackground?(
		node: NodeInterface,
		range: RangeInterface,
		targetCanvas: TinyCanvasInterface,
	): DOMRect | RangeInterface[] | void | false;
	/**
	 * 获取可编辑区域选中的所有节点
	 */
	getSelectionNodes?(): Array<NodeInterface>;
	/**
	 * 卡片自行处理mark样式
	 * @param mark 如果为空，则移除所有mark样式
	 * @param warp 如果为true，则将mark样式添加到卡片节点,否则移除
	 */
	executeMark?(mark?: NodeInterface, warp?: boolean): void;
	/**
	 * 查询当前卡片包含的所有mark样式
	 * @param clone 是否克隆
	 */
	queryMarks?(clone?: boolean): NodeInterface[];
}

export interface CardModel {
	prototype: CardModelInterface;
	new (editor: EditorInterface): CardModelInterface;
}

export interface CardModelInterface {
	readonly classes: { [k: string]: CardEntry };
	/**
	 * 当前激活的卡片
	 */
	readonly active: CardInterface | undefined;
	/**
	 * 当前卡片实例集合
	 */
	readonly components: Array<CardInterface>;
	/**
	 * 当前卡片实例长度
	 */
	readonly length: number;
	/**
	 * 实例化卡片
	 * @param cards 卡片集合
	 */
	init(cards: Array<CardEntry>): void;
	/**
	 * 增加卡片
	 * @param name 名称
	 * @param clazz 类
	 */
	add(clazz: CardEntry): void;
	/**
	 * 遍历所有已创建的卡片
	 * @param callback 回调函数
	 */
	each(callback: (card: CardInterface) => boolean | void): void;
	/**
	 * 查询父节点距离最近的卡片
	 * @param selector 查询器
	 * @param ignoreEditable 是否忽略可编辑节点
	 */
	closest(
		selector: Node | NodeInterface,
		ignoreEditable?: boolean,
	): NodeInterface | undefined;
	/**
	 * 根据选择器查找Card
	 * @param selector 卡片ID，或者子节点
	 * @param ignoreEditable 是否忽略可编辑节点
	 */
	find<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(
		selector: NodeInterface | Node | string,
		ignoreEditable?: boolean,
	): T | undefined;
	/**
	 * 根据选择器查找Block 类型 Card
	 * @param selector 卡片ID，或者子节点
	 */
	findBlock<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(
		selector: Node | NodeInterface,
	): T | undefined;
	/**
	 * 获取单个卡片
	 * @param range 光标范围
	 */
	getSingleCard<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(
		range: RangeInterface,
	): T | undefined;
	/**
	 * 获取选区选中一个节点时候的卡片
	 * @param rang 选区
	 */
	getSingleSelectedCard<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(
		rang: RangeInterface,
	): T | undefined;
	/**
	 * 插入卡片
	 * @param range 选区
	 * @param card 卡片
	 * @param args 插入时渲染时额外的参数
	 */
	insertNode<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(
		range: RangeInterface,
		card: T,
		...args: any
	): T;
	/**
	 * 移除卡片节点
	 * @param card 卡片
	 */
	removeNode(card: CardInterface): void;
	/**
	 * 将指定节点替换成等待创建的Card DOM 节点
	 * @param node 节点
	 * @param name 卡片名称
	 * @param value 卡片值
	 */
	replaceNode<V extends CardValue>(
		node: NodeInterface,
		name: string,
		value?: Partial<V>,
	): NodeInterface;
	/**
	 * 更新卡片重新渲染
	 * @param card 卡片
	 * @param value 值
	 * @param args 更新时渲染时额外的参数
	 */
	updateNode<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(
		card: T,
		value: Partial<E>,
		...args: any
	): void;
	/**
	 * 激活卡片节点所在的卡片
	 * @param node 节点
	 * @param trigger 激活方式
	 * @param event 事件
	 */
	activate(
		node: NodeInterface,
		trigger?: CardActiveTrigger,
		event?: MouseEvent,
	): void;
	/**
	 * 选中卡片
	 * @param card 卡片
	 * @param event 触发事件
	 */
	select(card: CardInterface, event?: MouseEvent | KeyboardEvent): void;
	/**
	 * 聚焦卡片
	 * @param card 卡片
	 * @param toStart 是否聚焦到开始位置
	 */
	focus(card: CardInterface, toStart?: boolean): void;
	/**
	 * 插入卡片
	 * @param name 卡片名称
	 * @param value 卡片值
	 * @param args 插入时渲染时额外的参数
	 */
	insert<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(
		name: string,
		value?: Partial<E>,
		...args: any
	): T;
	/**
	 * 更新卡片
	 * @param selector 卡片选择器
	 * @param value 要更新的卡片值
	 * @param args 更新时渲染时额外的参数
	 */
	update<V extends CardValue = CardValue>(
		selector: NodeInterface | Node | string,
		value: Partial<V>,
		...args: any
	): void;
	/**
	 * 替换卡片
	 * @param source 源卡片
	 * @param name 新卡片名称
	 * @param value 新卡片值
	 * @param args 替换时渲染时额外的参数
	 */
	replace<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(
		source: CardInterface,
		name: string,
		value?: Partial<E>,
		...args: any
	): T;
	/**
	 * 移除卡片
	 * @param selector 卡片选择器
	 * @param hasModify 是否触发修改事件
	 */
	remove(selector: NodeInterface | Node | string, hasModify?: boolean): void;
	/**
	 * 协作者移除卡片
	 * @param selector 卡片选择器
	 */
	removeRemote(selector: NodeInterface | Node | string): void;
	/**
	 * 创建卡片
	 * @param name 插件名称
	 * @param options 选项
	 */
	create<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(
		name: string,
		options?: {
			value?: Partial<E>;
			root?: NodeInterface;
		},
	): T;
	/**
	 * 渲染
	 * @param container 需要重新渲染包含卡片的节点，如果不传，则渲染全部待创建的卡片节点
	 * @param callback 渲染完成后回调
	 * @param lazyRender 是否懒渲染，默认取决于editor的lazyRender属性
	 */
	render(
		container?: NodeInterface,
		callback?: (count: number) => void,
		lazyRender?: boolean,
	): void;
	/**
	 * 渲染单个卡片
	 * @param card 卡片实例
	 * @param args 渲染自定义参数
	 */
	renderComponent(card: CardInterface, ...args: any): void;
	/**
	 * 重新渲染卡片
	 * @param cards 卡片集合
	 */
	reRender(...cards: Array<CardInterface>): void;
	/**
	 * 释放卡片
	 */
	gc(): void;
	/**
	 * 聚焦上一个块级节点
	 * @param range 光标
	 * @param hasModify 没有节点时，是否创建一个空节点并聚焦
	 */
	focusPrevBlock(
		card: CardInterface,
		range: RangeInterface,
		hasModify: boolean,
	): void;
	/**
	 * 聚焦下一个块级节点
	 * @param range 光标
	 * @param hasModify 没有节点时，是否创建一个空节点并聚焦
	 */
	focusNextBlock(
		card: CardInterface,
		range: RangeInterface,
		hasModify: boolean,
	): void;

	/**
	 * 销毁
	 */
	destroy(): void;
}

export interface MaximizeInterface {
	/**
	 * 恢复
	 */
	restore(): void;
	/**
	 * 最大化
	 */
	maximize(): void;
}

export type ResizeCreateOptions = {
	/**
	 * 开始拖动
	 */
	dragStart?: (point: { x: number; y: number }) => void;
	/**
	 * 拖动中
	 */
	dragMove?: (height: number) => void;
	/**
	 * 拖动结束
	 */
	dragEnd?: () => void;
};

export interface ResizeInterface {
	/**
	 * 创建并绑定事件
	 * @param options 可选项
	 */
	create(options: ResizeCreateOptions): void;
	/**
	 * 渲染
	 * @param container 渲染到的目标节点，默认为当前卡片根节点
	 * @param minHeight 最小高度，默认80px
	 */
	render(container?: NodeInterface, minHeight?: number): void;
	/**
	 * 拉动开始
	 * @param event 事件
	 */
	dragStart(event: MouseEvent): void;
	/**
	 * 拉动移动中
	 * @param event 事件
	 */
	dragMove(event: MouseEvent): void;
	/**
	 * 拉动结束
	 */
	dragEnd(event: MouseEvent): void;
	/**
	 * 展示
	 */
	show(): void;
	/**
	 * 隐藏
	 */
	hide(): void;
	/**
	 * 注销
	 */
	destroy(): void;
}
