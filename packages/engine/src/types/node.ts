import { Path } from '../model';
import { RangeInterface } from './range';
import { SchemaInterface, SchemaRule } from './schema';

/**
 * 事件方法
 */
export type EventListener<R = any> = (...args: Array<Event | any>) => R;

/**
 * 事件接口
 */
export interface EventInterface {
	/**
	 * 事件集合
	 */
	readonly listeners: { [x: string]: EventListener[] };
	/**
	 * 绑定事件
	 * @param eventType 事件名称
	 * @param listener 事件处理方法
	 * @param options 是否重写事件
	 */
	on<R = any, F extends EventListener<R> = EventListener<R>>(
		eventType: string,
		listener: F,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 解除绑定
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: string,
		listener: EventListener,
		options?: boolean | EventListenerOptions,
	): void;
	/**
	 * 触发事件
	 * @param eventType 事件类型
	 * @param args 事件参数
	 */
	trigger<R = any>(eventType: string, ...args: any): R;
	/**
	 * 注销事件
	 */
	destroy(): void;
}
export type Selector =
	| string
	| HTMLElement
	| Node
	| Array<Node>
	| NodeList
	| NodeInterface
	| EventTarget;
export type Context = Element | Document;

export interface NodeEntry {
	prototype: NodeInterface;
	new (
		nodes: Node | NodeList | Array<Node>,
		context?: Context,
	): NodeInterface;
}

export interface NodeInterface {
	/**
	 * Node集合长度
	 */
	readonly length: number;
	/**
	 * 事件集合
	 */
	events: EventInterface[];
	/**
	 * Document
	 */
	document: Document | null;
	/**
	 * 根节点
	 */
	context: Context | undefined;
	/**
	 * 节点名称
	 */
	name: string;
	/**
	 * 节点类型
	 */
	type: number | undefined;
	/**
	 * Window
	 */
	window: Window | null;
	/**
	 * 显示状态
	 */
	display: string | undefined;
	/**
	 * 片段
	 */
	fragment?: DocumentFragment;
	/**
	 * Node 集合
	 */
	[n: number]: Node;

	/**
	 * 遍历
	 * @param {Function} callback 回调函数
	 * @return {NodeInterface} 返回当前实例
	 */
	each(
		callback: (node: Node, index: number) => boolean | void,
	): NodeInterface;

	/**
	 * 将 NodeInterface 转换为 Array
	 * @return {Array} 返回数组
	 */
	toArray(): Array<NodeInterface>;

	/**
	 * 判断当前节点是否为 Node.ELEMENT_NODE 节点类型
	 * @return {boolean}
	 */
	isElement(): boolean;

	/**
	 * 判断当前节点是否为 Node.TEXT_NODE 节点类型
	 * @return {boolean}
	 */
	isText(): boolean;

	/**
	 * 判断当前节点是否为Card组件
	 */
	isCard(): boolean;

	/**
	 * 判断当前节点是否为block类型的Card组件
	 */
	isBlockCard(): boolean;
	/**
	 * 判断当前节点是否为inline类型的Card组件
	 * @returns
	 */
	isInlineCard(): boolean;
	/**
	 * 是否是可编辑器卡片
	 * @returns
	 */
	isEditableCard(): boolean;
	/**
	 * 判断当前节点是否为根节点
	 * @param {Node} root 根节点
	 */
	isRoot(root?: Node | NodeInterface): boolean;

	/**
	 * 判断当前是否为可编辑节点
	 */
	isEditable(): boolean;

	/**
	 * 判断当前是否在根节点内
	 * @param {Node} root 根节点
	 */
	inEditor(root?: Node | NodeInterface): boolean;
	/**
	 * 是否是光标标记节点
	 * @returns
	 */
	isCursor(): boolean;
	/**
	 * 获取当前Node节点
	 */
	get<E extends Node>(): E | null;

	/**
	 * 获取当前第 index 节点
	 * @param {Number} index
	 * @return {NodeInterface|undefined} NodeInterface 类，或 undefined
	 */
	eq(index: number): NodeInterface | undefined;

	/**
	 * 获取当前节点所在父节点中的索引，仅计算节点类型为ELEMENT_NODE的节点
	 * @return {Number} 返回索引
	 */
	index(): number;

	/**
	 * 获取当前节点父节点
	 * @return {NodeInterface} 父节点
	 */
	parent(): NodeInterface | undefined;

	/**
	 * 查询当前节点的子节点
	 * @param {Node | string} selector 查询器
	 * @return {NodeInterface} 符合条件的子节点
	 */
	children(selector?: string): NodeInterface;

	/**
	 * 获取当前节点第一个子节点
	 * @return {NodeInterface} NodeInterface 子节点
	 */
	first(): NodeInterface | null;

	/**
	 * 获取当前节点最后一个子节点
	 * @return {NodeInterface} NodeInterface 子节点
	 */
	last(): NodeInterface | null;

	/**
	 * 返回元素节点之前的兄弟节点（包括文本节点、注释节点）
	 * @return {NodeInterface} NodeInterface 节点
	 */
	prev(): NodeInterface | null;

	/**
	 * 返回元素节点之后的兄弟节点（包括文本节点、注释节点）
	 * @return {NodeInterface} NodeInterface 节点
	 */
	next(): NodeInterface | null;

	/**
	 * 返回元素节点之前的兄弟元素节点（不包括文本节点、注释节点）
	 * @return {NodeInterface} NodeInterface 节点
	 */
	prevElement(): NodeInterface | null;

	/**
	 * 返回元素节点之后的兄弟元素节点（不包括文本节点、注释节点）
	 * @return {NodeInterface} NodeInterface 节点
	 */
	nextElement(): NodeInterface | null;

	/**
	 * 返回元素节点所在根节点路径，默认根节点为 document.body
	 * @param context 根节点，默认为 document.body
	 * @param filter 获取index的时候过滤
	 * @param callback 获取index的时候回调
	 * @return 路径
	 */
	getPath(
		context?: Node | NodeInterface,
		filter?: (node: Node) => boolean,
		callback?: (
			index: number,
			path: number[],
			node: NodeInterface,
		) => number[] | undefined,
	): Array<number>;

	/**
	 * 判断元素节点是否包含要查询的节点
	 * @param {NodeInterface | Node} node 要查询的节点
	 * @return {Boolean} 是否包含
	 */
	contains(node: NodeInterface | Node): boolean;

	/**
	 * 根据查询器查询当前元素节点
	 * @param {String} selector 查询器
	 * @return {NodeInterface} 返回一个 NodeInterface 实例
	 */
	find(selector: string): NodeInterface;

	/**
	 * 根据查询器查询符合条件的离当前元素节点最近的父节点
	 * @param {string} selector 查询器
	 * @return {NodeInterface} 返回一个 NodeInterface 实例
	 */
	closest(
		selector: string,
		callback?: (node: Node) => Node | undefined,
	): NodeInterface;

	/**
	 * 为当前元素节点绑定事件
	 * @param {String} eventType 事件类型
	 * @param {Function} listener 事件函数
	 * @return {NodeInterface} 返回当前实例
	 */
	on<R = any, F extends EventListener<R> = EventListener<R>>(
		eventType: string,
		listener: F,
		options?: boolean | AddEventListenerOptions,
	): NodeInterface;

	/**
	 * 移除当前元素节点事件
	 * @param {String} eventType 事件类型
	 * @param {Function} listener 事件函数
	 * @return {NodeInterface} 返回当前实例
	 */
	off(
		eventType: string,
		listener: EventListener,
		options?: boolean | EventListenerOptions,
	): NodeInterface;

	/**
	 * 获取当前元素节点相对于视口的位置
	 * @param {Object} defaultValue 默认值
	 * @return {Object}
	 * {
	 *  top,
	 *  bottom,
	 *  left,
	 *  right
	 * }
	 */
	getBoundingClientRect(defaultValue?: {
		top: number;
		bottom: number;
		left: number;
		right: number;
	}):
		| { top: number; bottom: number; left: number; right: number }
		| undefined;

	/**
	 * 移除当前元素所有已绑定的事件
	 * @return {NodeInterface} 当前 NodeInterface 实例
	 */
	removeAllEvents(): NodeInterface;

	/**
	 * 获取或设置元素节点属性
	 * @param {string|undefined} key 属性名称，key为空获取所有属性，返回Map
	 * @param {string|undefined} val 属性值，val为空获取当前key的属性，返回string|null
	 * @return {NodeInterface|{[k:string]:string}} 返回值或当前实例
	 */
	attributes(): { [k: string]: string };
	attributes(key: { [k: string]: string }): string;
	attributes(key: string, val: string | number): NodeInterface;
	attributes(key: string): string;
	attributes(
		key?: string | { [k: string]: string },
		val?: string | number,
	): NodeInterface | { [k: string]: string } | string;

	/**
	 * 移除元素节点属性
	 * @param {String} key 属性名称
	 * @return {NodeInterface} 返当前实例
	 */
	removeAttributes(key: string): NodeInterface;

	/**
	 * 判断元素节点是否包含某个 class
	 * @param {String} className 样式名称
	 * @return {Boolean} 是否包含
	 */
	hasClass(className: string): boolean;

	/**
	 * 为元素节点增加一个 class
	 * @param {String} className
	 * @return {NodeInterface} 返当前实例
	 */
	addClass(className: string): NodeInterface;

	/**
	 * 移除元素节点 class
	 * @param {String} className
	 * @return {NodeInterface} 返当前实例
	 */
	removeClass(className: string): NodeInterface;

	/**
	 * 获取或设置元素节点样式
	 * @param {String|undefined} key 样式名称
	 * @param {String|undefined} val 样式值
	 * @return {NodeInterface|{[k:string]:string}} 返回值或当前实例
	 */
	css(): { [k: string]: string };
	css(key: { [k: string]: string | number }): NodeInterface;
	css(key: string): string;
	css(key: string, val: string | number): NodeInterface;
	css(
		key?: string | { [k: string]: string | number },
		val?: string | number,
	): NodeInterface | { [k: string]: string } | string;

	/**
	 * 获取元素节点宽度
	 * @return {number} 宽度
	 */
	width(): number;

	/**
	 * 获取元素节点高度
	 * @return {Number} 高度
	 */
	height(): number;

	/**
	 * 获取或设置元素节点html文本
	 */
	html(): string;
	html(html: string): NodeInterface;
	html(html?: string): NodeInterface | string;

	/**
	 * 获取或设置元素节点文本
	 */
	text(): string;
	text(text: string): NodeInterface;
	text(text?: string): string | NodeInterface;

	/**
	 * 设置元素节点为显示状态
	 * @param {String} display display值
	 * @return {NodeInterface} 当前实例
	 */
	show(display?: string): NodeInterface;

	/**
	 * 设置元素节点为隐藏状态
	 * @return {NodeInterface} 当前实例
	 */
	hide(): NodeInterface;

	/**
	 * 移除当前实例所有元素节点
	 * @return {NodeInterface} 当前实例
	 */
	remove(): NodeInterface;

	/**
	 * 清空元素节点下的所有子节点
	 * @return {NodeInterface} 当前实例
	 */
	empty(): NodeInterface;

	/**
	 * 比较两个元素节点是否相同
	 * @param {NodeInterface|Node} node 比较的节点
	 * @return {Boolean} 是否相同
	 */
	equal(node: NodeInterface | Node): boolean;

	/**
	 * 复制元素节点
	 * @param deep 是否深度复制
	 */
	clone(deep?: boolean): NodeInterface;

	/**
	 * 在元素节点的开头插入指定内容
	 * @param {Selector} selector 选择器或元素节点
	 * @return {NodeInterface} 当前实例
	 */
	prepend(selector: Selector): NodeInterface;

	/**
	 * 在元素节点的结尾插入指定内容
	 * @param {Selector} selector 选择器或元素节点
	 * @return {NodeInterface} 当前实例
	 */
	append(selector: Selector): NodeInterface;

	/**
	 * 在元素节点前插入新的节点
	 * @param {Selector} selector 选择器或元素节点
	 * @return {NodeInterface} 当前实例
	 */
	before(selector: Selector): NodeInterface;

	/**
	 * 在元素节点后插入内容
	 * @param {Selector} selector 选择器或元素节点
	 * @return {NodeInterface} 当前实例
	 */
	after(selector: Selector): NodeInterface;

	/**
	 * 将元素节点替换为新的内容
	 * @param {Selector} selector 选择器或元素节点
	 * @return {NodeInterface} 当前实例
	 */
	replaceWith(selector: Selector): NodeInterface;
	/**
	 * 获取节点所在编辑器的根节点
	 */
	getRoot(): NodeInterface;
	/**
	 * 遍历所有子节点
	 * @param callback 回调函数，false：停止遍历 ，true：停止遍历当前节点及子节点，继续遍历下一个兄弟节点
	 * @param order true:顺序 ，false:倒序，默认 true
	 * @param includeEditableCard 是否包含可编辑器卡片
	 * @param onStart 开始遍历一个节点时的回调函数
	 * @param onEnd 遍历完(包括所有子节点)一个节点时的回调函数
	 */
	traverse(
		callback: (
			node: NodeInterface,
		) => boolean | void | null | NodeInterface,
		order?: boolean,
		includeCard?: boolean | 'editable',
		onStart?: (node: NodeInterface) => void,
		onEnd?: (node: NodeInterface, next: NodeInterface | null) => void,
	): void;
	/**
	 * 根据路径获取子节点
	 * @param path 路径
	 */
	getChildByPath(path: Path, filter?: (node: Node) => boolean): Node;

	/**
	 * 获取当前节点所在父节点中的索引
	 */
	getIndex(filter?: (node: Node) => boolean): number;

	/**
	 * 在指定容器里获取父节点
	 * @param container 容器节点，默认为编辑器根节点
	 */
	findParent(container?: Node | NodeInterface): NodeInterface | null;

	/**
	 * 获取节点下的所有子节点
	 * @param includeCard 是否包含卡片的节点
	 */
	allChildren(includeCard?: boolean | 'editable'): Array<NodeInterface>;

	/**
	 * 返回当前节点所在当前节点的顶级window对象的视图边界
	 */
	getViewport(): {
		top: number;
		left: number;
		bottom: number;
		right: number;
	};

	/**
	 * 判断view是否在node节点根据当前节点的顶级window对象计算的视图边界内
	 * @param view 是否在视图的节点
	 * @param simpleMode 简单模式，任一边界超出编辑器范围时，返回 true
	 */
	inViewport(view: NodeInterface, simpleMode?: boolean): boolean;

	/**
	 * 如果view节点不可见，将滚动到align位置，默认为nearest
	 * @param view 视图节点
	 * @param align 位置
	 */
	scrollIntoView(
		view: NodeInterface,
		align?: 'start' | 'center' | 'end' | 'nearest',
	): void;
}

export interface NodeModelInterface {
	/**
	 * 是否是空节点
	 * @param node 节点或节点名称
	 */
	isVoid(
		node: NodeInterface | Node | string,
		schema?: SchemaInterface,
	): boolean;
	/**
	 * 是否是mark标签
	 * @param node 节点
	 */
	isMark(node: NodeInterface | Node, schema?: SchemaInterface): boolean;
	/**
	 * 是否是inline标签
	 * @param node 节点
	 */
	isInline(node: NodeInterface | Node, schema?: SchemaInterface): boolean;
	/**
	 * 是否是block节点
	 * @param node 节点
	 */
	isBlock(node: NodeInterface | Node, schema?: SchemaInterface): boolean;
	/**
	 * 判断block节点的子节点是否不包含blcok节点
	 */
	isNestedBlock(node: NodeInterface | Node): boolean;
	/**
	 * 判断节点是否是顶级根节点，父级为编辑器根节点，且，子级节点没有block节点
	 * @param node 节点
	 * @returns
	 */
	isRootBlock(node: NodeInterface, schema?: SchemaInterface): boolean;
	/**
	 * 判断节点下的文本是否为空
	 * @param node 节点
	 * @param withTrim 是否 trim
	 */
	isEmpty(node: NodeInterface, withTrim?: boolean): boolean;
	/**
	 * 判断一个节点下的文本是否为空，或者只有空白字符
	 * @param node 节点
	 */
	isEmptyWithTrim(node: NodeInterface): boolean;
	/**
	 * 判断一个节点是否为空
	 * @param node 节点
	 */
	isEmptyWidthChild(node: NodeInterface): boolean;
	/**
	 * 判断节点是否为列表节点
	 * @param node 节点或者节点名称
	 */
	isList(node: NodeInterface | string | Node): boolean;
	/**
	 * 判断节点是否是自定义列表
	 * @param node 节点
	 */
	isCustomize(node: NodeInterface): boolean;
	/**
	 * 去除包裹
	 * @param node 需要去除包裹的节点
	 * @returns 返回移除外层后的所有子节点
	 */
	unwrap(node: NodeInterface): NodeInterface[];
	/**
	 * 包裹节点
	 * @param source 需要包裹的节点
	 * @param outer 包裹的外部节点
	 * @param mergeSame 合并相同名称的节点样式和属性在同一个节点上
	 */
	wrap(
		source: NodeInterface | Node,
		outer: NodeInterface,
		mergeSame?: boolean,
	): NodeInterface;
	/**
	 * 合并节点
	 * @param source 合并的节点
	 * @param target 需要合并的节点
	 * @param remove 合并后是否移除
	 */
	merge(source: NodeInterface, target: NodeInterface, remove?: boolean): void;
	/**
	 * 将源节点的子节点追加到目标节点，并替换源节点
	 * @param source 旧节点
	 * @param target 新节点
	 * @param copyId 是否复制id
	 */
	replace(
		source: NodeInterface,
		target: NodeInterface,
		copyId?: boolean,
	): NodeInterface;
	/**
	 * 在光标位置插入一个节点
	 * @param node 节点
	 * @param range 光标
	 * @param removeCurrentEmptyBlock 当前光标行是空行时是否删除
	 */
	insert(
		node: Node | NodeInterface,
		range?: RangeInterface,
		removeCurrentEmptyBlock?: boolean,
	): RangeInterface | undefined;
	/**
	 * 光标位置插入文本
	 * @param text 文本
	 * @param range 光标
	 */
	insertText(
		text: string,
		range?: RangeInterface,
	): RangeInterface | undefined;
	/**
	 * 设置节点属性
	 * @param node 节点
	 * @param props 属性
	 */
	setAttributes(node: NodeInterface, attributes: any): NodeInterface;
	/**
	 * 移除值为负的样式
	 * @param node 节点
	 * @param style 样式名称
	 */
	removeMinusStyle(node: NodeInterface, style: string): void;
	/**
	 * 合并节点下的子节点，两个相同的相邻节点的子节点，通常是 blockquote、ul、ol 标签
	 * @param node 当前节点
	 */
	mergeChild(node: NodeInterface): void;
	/**
	 * 删除节点两边标签
	 * @param node 节点
	 * @param tagName 标签名称，默认为br标签
	 */
	removeSide(node: NodeInterface, tagName?: string): void;
	/**
	 * 扁平化节点
	 * @param node 节点
	 * @param root 根节点，默认为node节点
	 */
	flat(node: NodeInterface, root?: NodeInterface): NodeInterface;
	/**
	 * 标准化节点
	 * @param node 节点
	 */
	normalize(node: NodeInterface): NodeInterface;
	/**
	 * 获取或设置元素节点html文本
	 * @param {string|undefined} val html文本
	 * @return {NodeEntry|string} 当前实例或html文本
	 */
	html(node: NodeInterface): string;
	html(node: NodeInterface, val: string): NodeInterface;
	html(node: NodeInterface, val?: string): NodeInterface | string;
	/**
	 * 复制元素节点
	 * @param node 节点
	 * @param deep 是否深度复制
	 * @param copyId 是否复制data-id，默认复制
	 * @return 复制后的元素节点
	 */
	clone(node: NodeInterface, deep?: boolean, copyId?: boolean): NodeInterface;
	/**
	 * 获取批量追加子节点后的outerHTML
	 * @param nodes 节点集合
	 * @param appendExp 追加的节点
	 */
	getBatchAppendHTML(nodes: Array<NodeInterface>, selector: Selector): string;

	/**
	 * 移除占位符 \u200B
	 * @param node 节点
	 */
	removeZeroWidthSpace(node: NodeInterface): void;
}

export interface NodeIdInterface {
	/**
	 * 初始化
	 */
	init(): void;
	/**
	 * 根据规则获取需要为节点创建 data-id 的标签名称集合
	 * @returns
	 */
	getRules(): { [key: string]: SchemaRule[] };

	/**
	 * 给节点创建data-id
	 * @param node 节点
	 * @returns
	 */
	create(node: Node | NodeInterface): string;

	/**
	 * 在根节点内为需要创建data-id的子节点创建data-id
	 * @param root 根节点
	 */
	generateAll(root: Element | NodeInterface, force?: boolean): void;
	/**
	 * 为节点创建一个随机data-id
	 * @param node 节点
	 * @param isCreate 如果有，是否需要重新创建
	 * @returns
	 */
	generate(
		root: Element | NodeInterface | DocumentFragment,
		force?: boolean,
	): string | undefined;
	/**
	 * 判断一个节点是否需要创建data-id
	 * @param name 节点名称
	 * @returns
	 */
	isNeed(node: NodeInterface): boolean;
}

export interface ElementInterface extends Element {
	matchesSelector(selectors: string): boolean;
	mozMatchesSelector(selectors: string): boolean;
	msMatchesSelector(selectors: string): boolean;
	oMatchesSelector(selectors: string): boolean;
}
