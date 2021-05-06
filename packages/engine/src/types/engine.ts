import {
	EventInterface,
	NodeInterface,
	Selector,
	EventListener,
	NodeModelInterface,
	Context,
	NodeEntry,
} from './node';
import { ChangeInterface } from './change';
import { OTInterface } from './ot';
import { SchemaInterface } from './schema';
import { ConversionInterface } from './conversion';
import { HistoryInterface } from './history';
import { PluginEntry, PluginModelInterface, PluginOptions } from './plugin';
import { CommandInterface } from './command';
import { CardEntry, CardInterface, CardModelInterface } from './card';
import { ClipboardData, ClipboardInterface } from './clipboard';
import { LanguageInterface } from './language';
import { MarkModelInterface } from './mark';
import { ListModelInterface } from './list';
import { TypingInterface } from './typing';
import { InlineModelInterface } from './inline';
import { BlockModelInterface } from './block';
import { RequestInterface } from './request';
import { RangeInterface } from './range';

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
	 * 销毁
	 */
	destroy(): void;
}

export interface EditorInterface {
	/**
	 * 类型
	 */
	readonly kind: 'engine' | 'view';
	/**
	 * 节点查询器
	 * @param selector 表达式
	 * @param context 上下文根节点，默认为document
	 * @param clazz 节点解析类
	 */
	$(
		selector: Selector,
		context?: Context | null | false,
		clazz?: NodeEntry,
	): NodeInterface;
	/**
	 * 语言
	 */
	language: LanguageInterface;
	/**
	 * 编辑器节点
	 */
	container: NodeInterface;
	/**
	 * 编辑器根节点，默认为编辑器父节点
	 */
	root: NodeInterface;
	/**
	 * 卡片
	 */
	card: CardModelInterface;
	/**
	 * 插件
	 */
	plugin: PluginModelInterface;
	/**
	 * 节点s管理
	 */
	node: NodeModelInterface;
	/**
	 * List 列表标签管理
	 */
	list: ListModelInterface;
	/**
	 * Mark 标签管理
	 */
	mark: MarkModelInterface;
	/**
	 * inline 标签管理
	 */
	inline: InlineModelInterface;
	/**
	 * block 标签管理
	 */
	block: BlockModelInterface;
	/**
	 * 事件
	 */
	event: EventInterface;
	/**
	 * 标签过滤规则
	 */
	schema: SchemaInterface;
	/**
	 * 标签转换规则
	 */
	conversion: ConversionInterface;
	/**
	 * 剪切板
	 */
	clipboard: ClipboardInterface;
	/**
	 * 绑定事件
	 * @param eventType 事件类型
	 * @param listener 事件回调
	 * @param rewrite 是否重写
	 */
	on(eventType: string, listener: EventListener, rewrite?: boolean): void;
	/**
	 * 全选ctrl+a键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keydown:all',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 卡片最小化时触发
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param rewrite
	 */
	on(
		eventType: 'card:minimize',
		listener: (card: CardInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 卡片最大化时触发
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param rewrite
	 */
	on(
		eventType: 'card:maximize',
		listener: (card: CardInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML 代码之前触发
	 * @param root DOM节点
	 */
	on(
		eventType: 'paser:value-before',
		listener: (root: NodeInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML，遍历子节点时触发。返回false跳过当前节点
	 * @param node 当前遍历的节点
	 * @param value 当前已经生成的xml代码
	 */
	on(
		eventType: 'paser:value',
		listener: (node: NodeInterface, value: Array<string>) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML。生成xml代码结束后触发
	 * @param value xml代码
	 */
	on(
		eventType: 'paser:value-after',
		listener: (value: Array<string>) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 转换为HTML代码之前触发
	 * @param root 需要转换的根节点
	 */
	on(
		eventType: 'paser:html-before',
		listener: (root: NodeInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 转换为HTML代码
	 * @param root 需要转换的根节点
	 */
	on(
		eventType: 'paser:html',
		listener: (root: NodeInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 转换为HTML代码之后触发
	 * @param root 需要转换的根节点
	 */
	on(
		eventType: 'paser:html-after',
		listener: (root: NodeInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 复制DOM节点时触发
	 * @param node 当前遍历的子节点
	 */
	on(
		eventType: 'copy',
		listener: (root: NodeInterface) => void,
		rewrite?: boolean,
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
		eventType: 'paser:value-before',
		listener: (root: NodeInterface) => void,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML，遍历子节点时触发。返回false跳过当前节点
	 * @param node 当前遍历的节点
	 * @param value 当前已经生成的xml代码
	 */
	off(
		eventType: 'paser:value',
		listener: (node: NodeInterface, value: Array<string>) => boolean | void,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML。生成xml代码结束后触发
	 * @param value xml代码
	 */
	off(
		eventType: 'paser:value-after',
		listener: (value: Array<string>) => void,
	): void;
	/**
	 * 转换为HTML代码之前触发
	 * @param root 需要转换的根节点
	 */
	off(
		eventType: 'paser:html-before',
		listener: (root: NodeInterface) => void,
	): void;
	/**
	 * 转换为HTML代码
	 * @param root 需要转换的根节点
	 */
	off(eventType: 'paser:html', listener: (root: NodeInterface) => void): void;
	/**
	 * 转换为HTML代码之后触发
	 * @param root 需要转换的根节点
	 */
	off(
		eventType: 'paser:html-after',
		listener: (root: NodeInterface) => void,
	): void;
	/**
	 * 复制DOM节点时触发
	 * @param node 当前遍历的子节点
	 */
	off(eventType: 'copy', listener: (root: NodeInterface) => void): void;
	/**
	 * 触发事件
	 * @param eventType 事件名称
	 * @param args 触发参数
	 */
	trigger(eventType: string, ...args: any): any;
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
	trigger(eventType: 'paser:value-before', root: NodeInterface): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML，遍历子节点时触发。返回false跳过当前节点
	 * @param node 当前遍历的节点
	 * @param value 当前已经生成的xml代码
	 */
	trigger(
		eventType: 'paser:value',
		node: NodeInterface,
		value: Array<string>,
	): boolean | void;
	/**
	 * 解析DOM节点，生成符合标准的 XML。生成xml代码结束后触发
	 * @param value xml代码
	 */
	trigger(eventType: 'paser:value-after', value: Array<string>): void;
	/**
	 * 转换为HTML代码之前触发
	 * @param root 需要转换的根节点
	 */
	trigger(eventType: 'paser:html-before', root: NodeInterface): void;
	/**
	 * 转换为HTML代码
	 * @param root 需要转换的根节点
	 */
	trigger(eventType: 'paser:html', root: NodeInterface): void;
	/**
	 * 转换为HTML代码之后触发
	 * @param root 需要转换的根节点
	 */
	trigger(eventType: 'paser:html-after', root: NodeInterface): void;
	/**
	 * 复制DOM节点时触发
	 * @param node 当前遍历的子节点
	 */
	trigger(eventType: 'copy', root: NodeInterface): void;
	/**
	 * 显示成功的信息
	 * @param message 信息
	 */
	messageSuccess(message: string): void;
	/**
	 * 显示错误信息
	 * @param error 错误信息
	 */
	messageError(error: string): void;
}

export type EngineOptions = {
	lang?: string;
	className?: string;
	tabIndex?: number;
	root?: Node;
	scrollNode?: Node;
	plugins?: Array<PluginEntry>;
	cards?: Array<CardEntry>;
	config?: { [k: string]: PluginOptions };
};

export interface Engine {
	/**
	 * 构造函数
	 */
	new (selector: Selector, options?: EngineOptions): EngineInterface;
}

export interface EngineInterface extends EditorInterface {
	/**
	 * 选项
	 */
	options: EngineOptions;
	/**
	 * 滚动条节点
	 */
	scrollNode: NodeInterface | null;
	/**
	 * 是否只读
	 */
	readonly: boolean;
	/**
	 * 编辑器更改
	 */
	change: ChangeInterface;

	/**
	 * 编辑器命令
	 */
	command: CommandInterface;
	/**
	 * 按键处理
	 */
	typing: TypingInterface;
	/**
	 * 协同编辑
	 */
	ot: OTInterface;

	/**
	 * 历史记录
	 */
	history: HistoryInterface;
	/**
	 * 请求
	 */
	request: RequestInterface;

	/**
	 * 聚焦到编辑器
	 */
	focus(): void;
	/**
	 * 是否是子编辑器
	 */
	isSub(): boolean;
	/**
	 * 是否聚焦到编辑器
	 */
	isFocus(): boolean;
	/**
	 * 获取编辑器值
	 * @param ignoreCursor 是否包含光标位置信息
	 */
	getValue(ignoreCursor?: boolean): string;
	/**
	 * 异步获取编辑器值，将等候插件处理完成后再获取值
	 * 比如插件上传等待中，将等待上传完成后再获取值
	 * @param ignoreCursor 是否包含光标位置信息
	 */
	getValueAsync(ignoreCursor: boolean): Promise<string>;
	/**
	 * 获取编辑器的html
	 */
	getHtml(): string;
	/**
	 * 设置编辑器值
	 * @param value 值
	 */
	setValue(value: string): EngineInterface;
	/**
	 * 设置json格式值，主要用于协同
	 * @param value 值
	 */
	setJsonValue(value: Array<any>): EngineInterface;
	/**
	 * 绑定事件
	 * @param eventType 事件类型
	 * @param listener 事件回调
	 * @param rewrite 是否重写
	 */
	on(eventType: string, listener: EventListener, rewrite?: boolean): void;
	/**
	 * 全选ctrl+a键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keydown:all',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 卡片最小化时触发
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param rewrite
	 */
	on(
		eventType: 'card:minimize',
		listener: (card: CardInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 卡片最大化时触发
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param rewrite
	 */
	on(
		eventType: 'card:maximize',
		listener: (card: CardInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML 代码之前触发
	 * @param root DOM节点
	 */
	on(
		eventType: 'paser:value-before',
		listener: (root: NodeInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML，遍历子节点时触发。返回false跳过当前节点
	 * @param node 当前遍历的节点
	 * @param value 当前已经生成的xml代码
	 */
	on(
		eventType: 'paser:value',
		listener: (node: NodeInterface, value: Array<string>) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML。生成xml代码结束后触发
	 * @param value xml代码
	 */
	on(
		eventType: 'paser:value-after',
		listener: (value: Array<string>) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 转换为HTML代码之前触发
	 * @param root 需要转换的根节点
	 */
	on(
		eventType: 'paser:html-before',
		listener: (root: NodeInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 转换为HTML代码
	 * @param root 需要转换的根节点
	 */
	on(
		eventType: 'paser:html',
		listener: (root: NodeInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 转换为HTML代码之后触发
	 * @param root 需要转换的根节点
	 */
	on(
		eventType: 'paser:html-after',
		listener: (root: NodeInterface) => void,
		rewrite?: boolean,
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
		rewrite?: boolean,
	): void;
	/**
	 * 设置本次粘贴所需保留标签的白名单，以及属性
	 * @param schema 标签白名单管理实例
	 */
	on(
		eventType: 'paste:schema',
		listener: (schema: SchemaInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 解析粘贴数据，还未生成符合编辑器数据的片段之前触发
	 * @param root 粘贴的DOM节点
	 */
	on(
		eventType: 'paste:origin',
		listener: (root: NodeInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 解析粘贴数据，生成符合编辑器数据的片段之后整理阶段触发
	 * @param node 粘贴片段遍历的子节点
	 */
	on(
		eventType: 'paste:each',
		listener: (root: NodeInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 生成粘贴数据DOM片段后，还未写入到编辑器之前触发
	 * @param fragment 粘贴的片段
	 */
	on(
		eventType: 'paste:before',
		listener: (fragment: DocumentFragment) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 插入当前粘贴的片段后触发，此时还未渲染卡片
	 * @param range 当前插入后的光标实例
	 */
	on(
		eventType: 'paste:insert',
		listener: (range: RangeInterface) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 粘贴完成后触发
	 */
	on(eventType: 'paste:after', listener: () => void, rewrite?: boolean): void;
	/**
	 * 复制DOM节点时触发
	 * @param node 当前遍历的子节点
	 */
	on(
		eventType: 'copy',
		listener: (root: NodeInterface) => void,
		rewrite?: boolean,
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
		eventType: 'paser:value-before',
		listener: (root: NodeInterface) => void,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML，遍历子节点时触发。返回false跳过当前节点
	 * @param node 当前遍历的节点
	 * @param value 当前已经生成的xml代码
	 */
	off(
		eventType: 'paser:value',
		listener: (node: NodeInterface, value: Array<string>) => boolean | void,
	): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML。生成xml代码结束后触发
	 * @param value xml代码
	 */
	off(
		eventType: 'paser:value-after',
		listener: (value: Array<string>) => void,
	): void;
	/**
	 * 转换为HTML代码之前触发
	 * @param root 需要转换的根节点
	 */
	off(
		eventType: 'paser:html-before',
		listener: (root: NodeInterface) => void,
	): void;
	/**
	 * 转换为HTML代码
	 * @param root 需要转换的根节点
	 */
	off(eventType: 'paser:html', listener: (root: NodeInterface) => void): void;
	/**
	 * 转换为HTML代码之后触发
	 * @param root 需要转换的根节点
	 */
	off(
		eventType: 'paser:html-after',
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
	 * 解析粘贴数据，生成符合编辑器数据的片段之后整理阶段触发
	 * @param node 粘贴片段遍历的子节点
	 */
	off(eventType: 'paste:each', listener: (root: NodeInterface) => void): void;
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
	 * 触发事件
	 * @param eventType 事件名称
	 * @param args 触发参数
	 */
	trigger(eventType: string, ...args: any): any;
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
	trigger(eventType: 'paser:value-before', root: NodeInterface): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML，遍历子节点时触发。返回false跳过当前节点
	 * @param node 当前遍历的节点
	 * @param value 当前已经生成的xml代码
	 */
	trigger(
		eventType: 'paser:value',
		node: NodeInterface,
		value: Array<string>,
	): boolean | void;
	/**
	 * 解析DOM节点，生成符合标准的 XML。生成xml代码结束后触发
	 * @param value xml代码
	 */
	trigger(eventType: 'paser:value-after', value: Array<string>): void;
	/**
	 * 转换为HTML代码之前触发
	 * @param root 需要转换的根节点
	 */
	trigger(eventType: 'paser:html-before', root: NodeInterface): void;
	/**
	 * 转换为HTML代码
	 * @param root 需要转换的根节点
	 */
	trigger(eventType: 'paser:html', root: NodeInterface): void;
	/**
	 * 转换为HTML代码之后触发
	 * @param root 需要转换的根节点
	 */
	trigger(eventType: 'paser:html-after', root: NodeInterface): void;
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
	 * 解析粘贴数据，生成符合编辑器数据的片段之后整理阶段触发
	 * @param node 粘贴片段遍历的子节点
	 */
	trigger(eventType: 'paste:each', root: NodeInterface): void;
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
	 * 回车键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keydown:enter',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 删除键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keydown:backspace',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * Tab键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keydown:tab',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * Shift-Tab键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keydown:shift-tab',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * @ 符合键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keydown:at',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 空格键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keydown:space',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 反斜杠键按下，唤出Toolbar，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keydown:slash',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 左方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keydown:left',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 右方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keydown:right',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 上方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keydown:up',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 下方向键按下，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keydown:down',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 回车键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keyup:enter',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 删除键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keyup:backspace',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * Tab键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keyup:tab',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 空格键按下弹起，返回false，终止处理其它监听
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'keyup:space',
		listener: (event: KeyboardEvent) => boolean | void,
		rewrite?: boolean,
	): void;
	/**
	 * 编辑器光标选择变化时触发
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(eventType: 'select', listener: () => void, rewrite?: boolean): void;
	/**
	 * 编辑器值变化时触发
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'change',
		listener: (value: string) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 设置编辑器值之前
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param rewrite
	 */
	on(
		eventType: 'beforeSetValue',
		listener: (value: string) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 设置编辑器值之后
	 * @param eventType
	 * @param listener
	 * @param rewrite
	 */
	on(
		eventType: 'afterSetValue',
		listener: () => void,
		rewrite?: boolean,
	): void;
	/**
	 * 编辑器聚焦
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param rewrite
	 */
	on(eventType: 'focus', listener: () => void, rewrite?: boolean): void;
	/**
	 * 编辑器失去焦点
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param rewrite
	 */
	on(eventType: 'blur', listener: () => void, rewrite?: boolean): void;
	/**
	 * 编辑器只读切换时
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param rewrite
	 */
	on(
		eventType: 'readonly',
		listener: (readonly: boolean) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 执行命令之前
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param rewrite
	 */
	on(
		eventType: 'beforeCommandExecute',
		listener: (name: string, ...args: any) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 执行命令之后
	 * @param eventType
	 * @param listener name:插件名称、args:参数
	 * @param rewrite
	 */
	on(
		eventType: 'afterCommandExecute',
		listener: (name: string, ...args: any) => void,
		rewrite?: boolean,
	): void;
	/**
	 * 拖动文件到编辑器时触发
	 * @param files 文件集合
	 */
	on(
		eventType: 'drop:files',
		listener: (files: Array<File>) => void,
		rewrite?: boolean,
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
	off(eventType: 'change', listener: (value: string) => void): void;
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
	trigger(eventType: 'change', value: string): void;
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
	 * 销毁
	 */
	destroy(): void;
}

/**
 * 是否是引擎
 * @param editor 编辑器
 */
export const isEngine = (
	editor: EditorInterface,
): editor is EngineInterface => {
	return editor.kind === 'engine';
};
