import {
	PluginEntry,
	CardEntry,
	LanguageInterface,
	NodeInterface,
	CommandInterface,
	RequestInterface,
	CardModelInterface,
	PluginModelInterface,
	NodeModelInterface,
	NodeIdInterface,
	MarkModelInterface,
	InlineModelInterface,
	BlockModelInterface,
	EventInterface,
	SchemaInterface,
	ConversionInterface,
	ClipboardInterface,
	CardInterface,
	PluginOptions,
	RangeInterface,
} from '.';
import { ListModelInterface } from './list';
import { EventListener } from './node';

export interface EditorOptions {
	/**
	 * 语言，默认zh-CN
	 */
	lang?: string;
	/**
	 * 本地化
	 */
	locale?: Record<string, {}>;
	/**
	 * 插件配置
	 */
	plugins?: Array<PluginEntry>;
	/**
	 * 卡片配置
	 */
	cards?: Array<CardEntry>;
	/**
	 * 插件选项，每个插件具体选项请在插件查看
	 */
	config?:
		| Record<string, PluginOptions>
		| ((editor: EditorInterface) => Record<string, PluginOptions>);
	/**
	 * 阅读器根节点，默认为阅读器所在节点的父节点
	 */
	root?: Node;
	/**
	 * 滚动条节点，查找父级样式 overflow 或者 overflow-y 为 auto 或者 scroll 的节点
	 */
	scrollNode?: Node | (() => Node | null);
	/**
	 * 懒惰渲染卡片（仅限已启用 lazyRender 的卡片），默认为 true
	 */
	lazyRender?: boolean;
	/**
	 * 字体图标链接
	 * 默认： url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.woff2?t=1638071536645') format('woff2'),
       url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.woff?t=1638071536645') format('woff'),
       url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.ttf?t=1638071536645') format('truetype');
	 */
	iconFonts?: Record<'url' | 'format', string>[] | string | false;
}

export interface EditorInterface<T extends EditorOptions = EditorOptions> {
	options: T;
	/**
	 * 类型
	 */
	readonly kind: 'engine' | 'view' | 'editor';
	/**
	 * 语言
	 */
	language: LanguageInterface;
	/**
	 * 编辑器节点
	 */
	readonly container: NodeInterface;
	/**
	 * 滚动条节点
	 */
	readonly scrollNode: NodeInterface | null;
	/**
	 * 编辑器根节点，默认为编辑器父节点
	 */
	readonly root: NodeInterface;
	/**
	 * 编辑器命令
	 */
	command: CommandInterface;
	/**
	 * 请求
	 */
	request: RequestInterface;
	/**
	 * 卡片
	 */
	card: CardModelInterface;
	/**
	 * 插件
	 */
	plugin: PluginModelInterface;
	/**
	 * 节点管理
	 */
	node: NodeModelInterface;
	/**
	 * 节点id管理器
	 */
	nodeId: NodeIdInterface;
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
	 * 设置滚动节点
	 * @param node 节点
	 */
	setScrollNode(node: HTMLElement): void;
	/**
	 * 获取选中区域的的数据 html 和 文本
	 * @param range 光标范围
	 */
	getSelectionData(
		range?: RangeInterface,
	): Record<'html' | 'text', string> | undefined;
	/**
	 * 销毁编辑器
	 */
	destroy(): void;
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
	 * 复制DOM节点时触发
	 * @param node 当前遍历的子节点
	 */
	on(
		eventType: 'copy',
		listener: (root: NodeInterface) => void,
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
	 * 复制DOM节点时触发
	 * @param node 当前遍历的子节点
	 */
	off(eventType: 'copy', listener: (root: NodeInterface) => void): void;
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
	 * 复制DOM节点时触发
	 * @param node 当前遍历的子节点
	 */
	trigger(eventType: 'copy', root: NodeInterface): void;
	/**
	 * 显示成功的信息
	 * @param message 信息
	 */
	messageSuccess(type: string, message: string, ...args: any[]): void;
	/**
	 * 显示错误信息
	 * @param error 错误信息
	 */
	messageError(type: string, error: string, ...args: any[]): void;
	/**
	 * 消息确认
	 * @param message 消息
	 */
	messageConfirm(
		type: string,
		message: string,
		...args: any[]
	): Promise<boolean>;
}
