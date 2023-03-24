import { NodeInterface, Selector, EventListener } from './node';
import { ChangeInterface } from './change';
import { SchemaInterface } from './schema';
import { HistoryInterface } from './history';
import { CardInterface } from './card';
import { ClipboardData } from './clipboard';
import { TypingInterface } from './typing';
import { RangeInterface } from './range';
import { EditorInterface, EditorOptions } from './editor';
import { HotkeyInterface } from './hotkey';
import { Model, Operation, Element, Node } from '../model';

/**
 * 编辑器容器接口
 */
export interface ContainerInterface {
	/**
	 * 初始化
	 */
	init(): void;
	/**
	 * 是否聚焦
	 */
	isFocus(): boolean;
	/**
	 * 获取节点
	 */
	getNode(): NodeInterface;
	/**
	 * 设置是否可编辑
	 * @param readonly 是否可编辑
	 */
	setReadonly(readonly: boolean): void;
	/**
	 * 显示占位符
	 */
	showPlaceholder(): void;
	/**
	 * 隐藏占位符
	 */
	hidePlaceholder(): void;
	/**
	 * 销毁
	 */
	destroy(): void;
}
export interface EngineOptions extends EditorOptions {
	/**
	 * 样式名称
	 */
	className?: string;
	/**
	 * tab 键的索引
	 */
	tabIndex?: number;
	/**
	 * 占位内容
	 */
	placeholder?: string;
	/**
	 * 是否只读
	 */
	readonly?: boolean;
	/**
	 * 在编辑器头部单击空白处是否自动添加空行
	 */
	autoPrepend?: boolean;
	/**
	 * 在编辑器尾部单击空白处是否自动添加空行
	 */
	autoAppend?: boolean;
	/**
	 * markdown 配置
	 */
	markdown?: {
		/**
		 * markdown 模式，默认 执行 check 函数返回 true 就直接转换
		 * 1. 使用 confirm 模式，调用 engine.messageConfirm 确认后再次转换
		 * 2. false 为关闭全部 markdown 功能
		 */
		mode?: 'confirm' | false;
		/**
		 * 检测是否为 markdown 语法，如果为 true 则将 makrdown 转换后粘贴
		 */
		check?: (text: string, html: string) => Promise<string | false>;
	};
}

export interface Engine<T extends EngineOptions = EngineOptions> {
	/**
	 * 构造函数
	 */
	new (selector: Selector, options?: T): EngineInterface<T>;
}

export interface EngineInterface<T extends EngineOptions = EngineOptions>
	extends EditorInterface<T> {
	/**
	 * 选项
	 */
	options: T;
	/**
	 * 是否只读
	 */
	readonly: boolean;
	/**
	 * 编辑器更改
	 */
	change: ChangeInterface;
	/**
	 * 按键处理
	 */
	typing: TypingInterface;
	/**
	 * 协同编辑
	 */
	model: Model;
	/**
	 * 历史记录
	 */
	history: HistoryInterface;
	/**
	 * 快捷键
	 */
	hotkey: HotkeyInterface;
	/**
	 * 聚焦到编辑器
	 */
	focus(toStart?: boolean): void;
	/**
	 * 让编辑器失去焦点
	 */
	blur(): void;
	/**
	 * 是否聚焦到编辑器
	 */
	isFocus(): boolean;
	/**
	 * 是否为空内容
	 */
	isEmpty(): boolean;
	/**
	 * 获取编辑器值
	 * @deprecated 请使用 model.toValue 性能更好
	 * @param ignoreCursor 是否包含光标位置信息
	 */
	getValue(ignoreCursor?: boolean): string;
	/**
	 * 异步获取编辑器值，将等候插件处理完成后再获取值
	 * 比如插件上传等待中，将等待上传完成后再获取值
	 * @param ignoreCursor 是否包含光标位置信息，默认不包含
	 * @param callback 有插件还有动作未执行完时回调，返回 false 终止获取值，返回 number 设置当前动作等待时间，毫秒
	 */
	getValueAsync(
		ignoreCursor?: boolean,
		callback?: (
			name: string,
			card?: CardInterface,
			...args: any
		) => boolean | number | void,
	): Promise<string>;
	/**
	 * 获取编辑器的html
	 * @deprecated 请使用 model.toHTML 性能更好
	 */
	getHtml(): string;
	/**
	 * 设置编辑器值
	 * @param value 值
	 * @param callback 异步渲染卡片后的回调
	 */
	setValue(
		value: string,
		callback?: (count: number) => void,
	): EngineInterface;
	/**
	 * 设置html，会格式化为合法的编辑器值
	 * @param html html
	 * @param callback 异步渲染卡片后的回调
	 */
	setHtml(html: string, callback?: (count: number) => void): EngineInterface;
	/**
	 * 设置markdown，会格式化为合法的编辑器值
	 * @param text markdown文本
	 * @param callback 异步渲染卡片后回调
	 */
	setMarkdown(
		text: string,
		callback?: (count: number) => void,
	): EngineInterface;
	/**
	 * 设置json格式值，主要用于协同
	 * @param callback 异步渲染卡片后的回调
	 */
	setJsonValue(
		value: Element,
		callback?: (count: number) => void,
	): EngineInterface;
	/**
	 * 获取JSON格式的值
	 */
	getJsonValue(): Element;
	/**
	 * 获取纯文本
	 * @deprecated 请使用 model.toText 性能更好
	 * @param includeCard 是否包含卡片内的
	 */
	getText(includeCard?: boolean): string;
	/**
	 * 展示 placeholder
	 */
	showPlaceholder(): void;
	/**
	 * 隐藏 placeholder
	 */
	hidePlaceholder(): void;
	/**
	 * 保证所有行内元素都在段落内
	 * @param container 容器
	 */
	normalize(container?: NodeInterface): void;
	/**
	 * 绑定事件
	 * @param eventType 事件类型
	 * @param listener 事件回调
	 * @param options 是否重写
	 */
	on<R = any, F extends EventListener<R> = EventListener<R>>(
		eventType: string,
		listener: F,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 全选ctrl+a键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keydown:all',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 卡片最小化时触发
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param options
	 */
	on(
		eventType: 'card:minimize',
		listener: (card: CardInterface) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 卡片最大化时触发
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param options
	 */
	on(
		eventType: 'card:maximize',
		listener: (card: CardInterface) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML 代码之前触发
	 * @param root DOM节点
	 */
	on(
		eventType: 'parse:value-before',
		listener: (root: NodeInterface) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML，遍历子节点时触发。返回false跳过当前节点
	 * @param node 当前遍历的节点
	 * @param attributes 当前节点已过滤后的属性
	 * @param styles 当前节点已过滤后的样式
	 * @param value 当前已经生成的xml代码
	 */
	on(
		eventType: 'parse:value',
		listener: (
			node: NodeInterface,
			attributes: { [key: string]: string },
			styles: { [key: string]: string },
			value: Array<string>,
		) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 解析 model node 时触发
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'parse:node',
		listener: (node: Node) => false | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 解析DOM节点，生成文本，遍历子节点时触发。返回false跳过当前节点
	 * @param node 当前遍历的节点
	 * @param attributes 当前节点已过滤后的属性
	 * @param styles 当前节点已过滤后的样式
	 * @param value 当前已经生成的文本
	 */
	on(
		eventType: 'parse:text',
		listener: (
			node: NodeInterface,
			attributes: { [key: string]: string },
			styles: { [key: string]: string },
			value: Array<string>,
		) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML。生成xml代码结束后触发
	 * @param value xml代码
	 */
	on(
		eventType: 'parse:value-after',
		listener: (value: Array<string>) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 转换为HTML代码之前触发
	 * @param root 需要转换的根节点
	 */
	on(
		eventType: 'parse:html-before',
		listener: (root: NodeInterface) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 转换为HTML代码
	 * @param root 需要转换的根节点
	 */
	on(
		eventType: 'parse:html',
		listener: (root: NodeInterface) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 转换为HTML代码之后触发
	 * @param root 需要转换的根节点
	 */
	on(
		eventType: 'parse:html-after',
		listener: (root: NodeInterface) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 当粘贴到编辑器事件发生时触发，返回false，将不在处理粘贴
	 * @param data 粘贴板相关数据
	 * @param source 粘贴的富文本
	 */
	on(
		eventType: 'paste:event',
		listener: (
			data: ClipboardData & { isPasteText: boolean },
			source: string,
		) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 设置本次粘贴所需保留标签的白名单，以及属性
	 * @param schema 标签白名单管理实例
	 */
	on(
		eventType: 'paste:schema',
		listener: (schema: SchemaInterface) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 解析粘贴数据，还未生成符合编辑器数据的片段之前触发
	 * @param root 粘贴的DOM节点
	 */
	on(
		eventType: 'paste:origin',
		listener: (root: NodeInterface) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 解析粘贴数据，生成符合编辑器数据的片段之后扁平化阶段触发
	 * @param node 粘贴片段遍历的子节点
	 */
	on(
		eventType: 'paste:each',
		listener: (root: NodeInterface) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 解析粘贴数据，生成符合编辑器数据的片段之后扁平化阶段触发
	 * @param node 所有粘贴片段遍历后的根节点
	 */
	on(
		eventType: 'paste:each-after',
		listener: (root: NodeInterface) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 生成粘贴数据DOM片段后，还未写入到编辑器之前触发
	 * @param fragment 粘贴的片段
	 */
	on(
		eventType: 'paste:before',
		listener: (fragment: DocumentFragment) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 插入当前粘贴的片段后触发，此时还未渲染卡片
	 * @param range 当前插入后的光标实例
	 */
	on(
		eventType: 'paste:insert',
		listener: (range: RangeInterface) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 粘贴完成后触发
	 */
	on(eventType: 'paste:after', listener: () => void, options?: boolean): void;
	/**
	 * 复制DOM节点时触发
	 * @param node 当前遍历的子节点
	 */
	on(
		eventType: 'copy',
		listener: (root: NodeInterface) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * DOM改变触发
	 * @param eventType
	 * @param ops
	 */
	on(
		eventType: 'ops',
		listener: (ops: Operation[]) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 移除绑定事件
	 * @param eventType 事件类型
	 * @param listener 事件回调
	 */
	off(eventType: string, listener: EventListener): void;
	/**
	 * 全选ctrl+a键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keydown:all',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * 卡片最小化时触发
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	off(
		eventType: 'card:minimize',
		listener: (card: CardInterface) => void,
	): void;
	/**
	 * 卡片最大化时触发
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	off(
		eventType: 'card:maximize',
		listener: (card: CardInterface) => void,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML 代码之前触发
	 * @param root DOM节点
	 */
	off(
		eventType: 'parse:value-before',
		listener: (root: NodeInterface) => void,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML，遍历子节点时触发。返回false跳过当前节点
	 * @param node 当前遍历的节点
	 * @param attributes 当前节点已过滤后的属性
	 * @param styles 当前节点已过滤后的样式
	 * @param value 当前已经生成的xml代码
	 */
	off(
		eventType: 'parse:value',
		listener: (
			node: NodeInterface,
			attributes: { [key: string]: string },
			styles: { [key: string]: string },
			value: Array<string>,
		) => boolean | void,
	): void;
	/**
	 * 解析 model node 时触发
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	off(
		eventType: 'parse:node',
		listener: (node: Node) => false | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 解析DOM节点，生成文本，遍历子节点时触发。返回false跳过当前节点
	 * @param node 当前遍历的节点
	 * @param attributes 当前节点已过滤后的属性
	 * @param styles 当前节点已过滤后的样式
	 * @param value 当前已经生成的文本
	 */
	off(
		eventType: 'parse:text',
		listener: (
			node: NodeInterface,
			attributes: { [key: string]: string },
			styles: { [key: string]: string },
			value: Array<string>,
		) => boolean | void,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML。生成xml代码结束后触发
	 * @param value xml代码
	 */
	off(
		eventType: 'parse:value-after',
		listener: (value: Array<string>) => void,
	): void;
	/**
	 * 转换为HTML代码之前触发
	 * @param root 需要转换的根节点
	 */
	off(
		eventType: 'parse:html-before',
		listener: (root: NodeInterface) => void,
	): void;
	/**
	 * 转换为HTML代码
	 * @param root 需要转换的根节点
	 */
	off(eventType: 'parse:html', listener: (root: NodeInterface) => void): void;
	/**
	 * 转换为HTML代码之后触发
	 * @param root 需要转换的根节点
	 */
	off(
		eventType: 'parse:html-after',
		listener: (root: NodeInterface) => void,
	): void;
	/**
	 * 当粘贴到编辑器事件发生时触发，返回false，将不在处理粘贴
	 * @param data 粘贴板相关数据
	 * @param source 粘贴的富文本
	 */
	off(
		eventType: 'paste:event',
		listener: (
			data: ClipboardData & { isPasteText: boolean },
			source: string,
		) => boolean | void,
	): void;
	/**
	 * 设置本次粘贴所需保留标签的白名单，以及属性
	 * @param schema 标签白名单管理实例
	 */
	off(
		eventType: 'paste:schema',
		listener: (schema: SchemaInterface) => void,
	): void;
	/**
	 * 解析粘贴数据，还未生成符合编辑器数据的片段之前触发
	 * @param root 粘贴的DOM节点
	 */
	off(
		eventType: 'paste:origin',
		listener: (root: NodeInterface) => void,
	): void;
	/**
	 * 解析粘贴数据，生成符合编辑器数据的片段之后扁平化阶段触发
	 * @param node 粘贴片段遍历的子节点
	 */
	off(eventType: 'paste:each', listener: (root: NodeInterface) => void): void;
	/**
	 * 解析粘贴数据，生成符合编辑器数据的片段之后扁平化阶段触发
	 * @param node 所有粘贴片段遍历后的根节点
	 */
	off(
		eventType: 'paste:each-after',
		listener: (root: NodeInterface) => void,
	): void;
	/**
	 * 生成粘贴数据DOM片段后，还未写入到编辑器之前触发
	 * @param fragment 粘贴的片段
	 */
	off(
		eventType: 'paste:before',
		listener: (fragment: DocumentFragment) => void,
	): void;
	/**
	 * 插入当前粘贴的片段后触发，此时还未渲染卡片
	 * @param range 当前插入后的光标实例
	 */
	off(
		eventType: 'paste:insert',
		listener: (range: RangeInterface) => void,
	): void;
	/**
	 * 粘贴完成后触发
	 */
	off(eventType: 'paste:after', listener: () => void): void;
	/**
	 * 复制DOM节点时触发
	 * @param node 当前遍历的子节点
	 */
	off(eventType: 'copy', listener: (root: NodeInterface) => void): void;
	/**
	 * DOM改变触发
	 * @param eventType
	 * @param ops
	 */
	off(eventType: 'ops', listener: (ops: Operation[]) => void): void;
	/**
	 * 触发事件
	 * @param eventType 事件名称
	 * @param args 触发参数
	 */
	trigger<R = any>(eventType: string, ...args: any): R;
	/**
	 * 全选ctrl+a键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'keydown:all', event: KeyboardEvent): boolean | void;
	/**
	 * 卡片最小化时触发
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	trigger(eventType: 'card:minimize', card: CardInterface): void;
	/**
	 * 卡片最大化时触发
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	trigger(eventType: 'card:maximize', card: CardInterface): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML 代码之前触发
	 * @param root DOM节点
	 */
	trigger(eventType: 'parse:value-before', root: NodeInterface): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML，遍历子节点时触发。返回false跳过当前节点
	 * @param node 当前遍历的节点
	 * @param attributes 当前节点已过滤后的属性
	 * @param styles 当前节点已过滤后的样式
	 * @param value 当前已经生成的xml代码
	 */
	trigger(
		eventType: 'parse:value',
		node: NodeInterface,
		attributes: { [key: string]: string },
		styles: { [key: string]: string },
		value: Array<string>,
	): boolean | void;
	/**
	 * 解析 model node 时触发
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	trigger(
		eventType: 'parse:node',
		listener: (node: Node) => false | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 解析DOM节点，生成文本，遍历子节点时触发。返回false跳过当前节点
	 * @param node 当前遍历的节点
	 * @param attributes 当前节点已过滤后的属性
	 * @param styles 当前节点已过滤后的样式
	 * @param value 当前已经生成的文本
	 */
	trigger(
		eventType: 'parse:text',
		node: NodeInterface,
		attributes: { [key: string]: string },
		styles: { [key: string]: string },
		value: Array<string>,
	): boolean | void;
	/**
	 * 解析DOM节点，生成符合标准的 XML。生成xml代码结束后触发
	 * @param value xml代码
	 */
	trigger(eventType: 'parse:value-after', value: Array<string>): void;
	/**
	 * 转换为HTML代码之前触发
	 * @param root 需要转换的根节点
	 */
	trigger(eventType: 'parse:html-before', root: NodeInterface): void;
	/**
	 * 转换为HTML代码
	 * @param root 需要转换的根节点
	 */
	trigger(eventType: 'parse:html', root: NodeInterface): void;
	/**
	 * 转换为HTML代码之后触发
	 * @param root 需要转换的根节点
	 */
	trigger(eventType: 'parse:html-after', root: NodeInterface): void;
	/**
	 * 当粘贴到编辑器事件发生时触发，返回false，将不在处理粘贴
	 * @param data 粘贴板相关数据
	 * @param source 粘贴的富文本
	 */
	trigger(
		eventType: 'paste:event',
		data: ClipboardData & { isPasteText: boolean },
		source: string,
	): boolean | void;
	/**
	 * 设置本次粘贴所需保留标签的白名单，以及属性
	 * @param schema 标签白名单管理实例
	 */
	trigger(eventType: 'paste:schema', schema: SchemaInterface): void;
	/**
	 * 解析粘贴数据，还未生成符合编辑器数据的片段之前触发
	 * @param root 粘贴的DOM节点
	 */
	trigger(eventType: 'paste:origin', root: NodeInterface): void;
	/**
	 * 解析粘贴数据，生成符合编辑器数据的片段之后扁平化阶段触发
	 * @param node 粘贴片段遍历的子节点
	 */
	trigger(eventType: 'paste:each', root: NodeInterface): void;
	/**
	 * 解析粘贴数据，生成符合编辑器数据的片段之后扁平化阶段触发
	 * @param node 所有粘贴片段遍历后的根节点
	 */
	trigger(eventType: 'paste:each-after', root: NodeInterface): void;
	/**
	 * 生成粘贴数据DOM片段后，还未写入到编辑器之前触发
	 * @param fragment 粘贴的片段
	 */
	trigger(eventType: 'paste:before', fragment: DocumentFragment): void;
	/**
	 * 插入当前粘贴的片段后触发，此时还未渲染卡片
	 * @param range 当前插入后的光标实例
	 */
	trigger(eventType: 'paste:insert', range: RangeInterface): void;
	/**
	 * 粘贴完成后触发
	 */
	trigger(eventType: 'paste:after'): void;
	/**
	 * 复制DOM节点时触发
	 * @param node 当前遍历的子节点
	 */
	trigger(eventType: 'copy', root: NodeInterface): void;
	/**
	 * DOM改变触发
	 * @param eventType
	 * @param ops
	 */
	trigger(eventType: 'ops', ops: Operation[]): void;
	/**
	 * 回车键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keydown:enter',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 删除键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keydown:backspace',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * Tab键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keydown:tab',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * Shift-Tab键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keydown:shift-tab',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * @ 符合键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keydown:at',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 空格键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keydown:space',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 反斜杠键按下，唤出Toolbar，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keydown:slash',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 左方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keydown:left',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 右方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keydown:right',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 上方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keydown:up',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 下方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keydown:down',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 回车键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keyup:enter',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 删除键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keyup:backspace',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * Tab键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keyup:tab',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 空格键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'keyup:space',
		listener: (event: KeyboardEvent) => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 编辑器光标选择变化时触发
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(eventType: 'select', listener: () => void, options?: boolean): void;
	/**
	 * 编辑器值变化时触发
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'change',
		listener: (value: string, trigger: 'remote' | 'local' | 'both') => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 编辑器值有变化时就触发，与 change 相比，change 需要在组合输入法完成输入后才会触发，在一定时间内如果内容没有改版也不会触发 change
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'realtimeChange',
		listener: (trigger: 'remote' | 'local') => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 设置编辑器值之前
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param options
	 */
	on(
		eventType: 'beforeSetValue',
		listener: (value: string) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 设置编辑器值之后
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'afterSetValue',
		listener: () => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 编辑器聚焦
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param options
	 */
	on(eventType: 'focus', listener: () => void, options?: boolean): void;
	/**
	 * 编辑器失去焦点
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param options
	 */
	on(eventType: 'blur', listener: () => void, options?: boolean): void;
	/**
	 * 编辑器只读切换时
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param options
	 */
	on(
		eventType: 'readonly',
		listener: (readonly: boolean) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 执行命令之前
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param options
	 */
	on(
		eventType: 'beforeCommandExecute',
		listener: (name: string, ...args: any) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 执行命令之后
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param options
	 */
	on(
		eventType: 'afterCommandExecute',
		listener: (name: string, ...args: any) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 拖动文件到编辑器时触发
	 * @param files 文件集合
	 */
	on(
		eventType: 'drop:files',
		listener: (files: Array<File>) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 历史撤销
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'undo',
		listener: () => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 历史重做
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	on(
		eventType: 'redo',
		listener: () => boolean | void,
		options?: boolean | AddEventListenerOptions,
	): void;
	/**
	 * 回车键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keydown:enter',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * 删除键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keydown:backspace',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * Tab键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keydown:tab',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * Shift-Tab键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keydown:shift-tab',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * @ 符合键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keydown:at',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * 空格键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keydown:space',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * 反斜杠键按下，唤出Toolbar，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keydown:slash',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;

	/**
	 * 左方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keydown:left',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * 右方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keydown:right',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * 上方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keydown:up',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * 下方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keydown:down',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * 回车键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keyup:enter',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * 删除键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keyup:backspace',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * Tab键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keyup:tab',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * 空格键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'keyup:space',
		listener: (event: KeyboardEvent) => boolean | void,
	): void;
	/**
	 * 编辑器光标选择变化时触发
	 * @param eventType
	 * @param listener
	 */
	off(eventType: 'select', listener: () => void): void;
	/**
	 * 编辑器值变化时触发
	 * @param eventType
	 * @param listener
	 */
	off(
		eventType: 'change',
		listener: (value: string, trigger: 'remote' | 'local' | 'both') => void,
	): void;
	/**
	 * 编辑器值有变化时就触发，与 change 相比，change 需要在组合输入法完成输入后才会触发，在一定时间内如果内容没有改版也不会触发 change
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	off(
		eventType: 'realtimeChange',
		listener: (trigger: 'remote' | 'local') => void,
	): void;
	/**
	 * 设置编辑器值之前
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	off(eventType: 'beforeSetValue', listener: (value: string) => void): void;
	/**
	 * 设置编辑器值之后
	 * @param eventType
	 * @param listener
	 */
	off(eventType: 'afterSetValue', listener: () => void): void;
	/**
	 * 编辑器聚焦
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	off(eventType: 'focus', listener: () => void): void;
	/**
	 * 编辑器失去焦点
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	off(eventType: 'blur', listener: () => void): void;
	/**
	 * 编辑器只读切换时
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	off(eventType: 'readonly', listener: (readonly: boolean) => void): void;
	/**
	 * 执行命令之前
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	off(
		eventType: 'beforeCommandExecute',
		listener: (name: string, ...args: any) => void,
	): void;
	/**
	 * 执行命令之后
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	off(
		eventType: 'afterCommandExecute',
		listener: (name: string, ...args: any) => void,
	): void;
	/**
	 * 拖动文件到编辑器时触发
	 * @param files 文件集合
	 */
	off(eventType: 'drop:files', listener: (files: Array<File>) => void): void;
	/**
	 * 历史撤销
	 * @param eventType
	 * @param listener
	 */
	off(eventType: 'undo', listener: () => boolean | void): void;
	/**
	 * 历史重做
	 * @param eventType
	 * @param listener
	 */
	off(eventType: 'redo', listener: () => boolean | void): void;
	/**
	 * 回车键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'keydown:enter', event: KeyboardEvent): boolean | void;
	/**
	 * 删除键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(
		eventType: 'keydown:backspace',
		event: KeyboardEvent,
	): boolean | void;
	/**
	 * Tab键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'keydown:tab', event: KeyboardEvent): boolean | void;
	/**
	 * Shift-Tab键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(
		eventType: 'keydown:shift-tab',
		event: KeyboardEvent,
	): boolean | void;
	/**
	 * @ 符合键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'keydown:at', event: KeyboardEvent): boolean | void;
	/**
	 * 空格键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'keydown:space', event: KeyboardEvent): boolean | void;
	/**
	 * 反斜杠键按下，唤出Toolbar，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'keydown:slash', event: KeyboardEvent): boolean | void;
	/**
	 * 左方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'keydown:left', event: KeyboardEvent): boolean | void;
	/**
	 * 右方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'keydown:right', event: KeyboardEvent): boolean | void;
	/**
	 * 上方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'keydown:up', event: KeyboardEvent): boolean | void;
	/**
	 * 下方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'keydown:down', event: KeyboardEvent): boolean | void;
	/**
	 * 回车键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'keyup:enter', event: KeyboardEvent): boolean | void;
	/**
	 * 删除键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'keyup:backspace', event: KeyboardEvent): boolean | void;
	/**
	 * Tab键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'keyup:tab', event: KeyboardEvent): boolean | void;
	/**
	 * 空格键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'keyup:space', event: KeyboardEvent): boolean | void;
	/**
	 * 编辑器光标选择变化时触发
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'select'): void;
	/**
	 * 编辑器值变化时触发
	 * @param eventType
	 * @param listener
	 */
	trigger(
		eventType: 'change',
		value: string,
		trigger: 'remote' | 'local' | 'both',
	): void;
	/**
	 * 编辑器值有变化时就触发，与 change 相比，change 需要在组合输入法完成输入后才会触发，在一定时间内如果内容没有改版也不会触发 change
	 * @param eventType
	 * @param listener
	 * @param options
	 */
	trigger(
		eventType: 'realtimeChange',
		trigger: 'remote' | 'local' | 'both',
	): void;
	/**
	 * 设置编辑器值之前
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	trigger(eventType: 'beforeSetValue', value: string): void;
	/**
	 * 设置编辑器值之后
	 * @param eventType
	 * @param listener
	 */
	trigger(eventType: 'afterSetValue'): void;
	/**
	 * 编辑器聚焦
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	trigger(eventType: 'focus'): void;
	/**
	 * 编辑器失去焦点
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	trigger(eventType: 'blur'): void;
	/**
	 * 编辑器只读切换时
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	trigger(eventType: 'readonly', readonly: boolean): void;
	/**
	 * 执行命令之前
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	trigger(
		eventType: 'beforeCommandExecute',
		name: string,
		...args: any
	): void;
	/**
	 * 执行命令之后
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 */
	trigger(eventType: 'afterCommandExecute', name: string, ...args: any): void;
	/**
	 * 拖动文件到编辑器时触发
	 * @param files 文件集合
	 */
	trigger(eventType: 'drop:files', files: Array<File>): void;
	/**
	 * 历史撤销
	 * @param eventType
	 */
	trigger(eventType: 'undo'): void;
	/**
	 * 历史重做
	 * @param eventType
	 */
	trigger(eventType: 'redo'): void;
	/**
	 * 销毁
	 */
	destroy(): void;
}
