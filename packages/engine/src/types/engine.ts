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
import { CardEntry, CardModelInterface } from './card';
import { ClipboardInterface } from './clipboard';
import { LanguageInterface } from './language';
import { MarkModelInterface } from './mark';
import { ListModelInterface } from './list';
import { TypingInterface } from './typing';
import { InlineModelInterface } from './inline';
import { BlockModelInterface } from './block';

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
	 * 移除绑定事件
	 * @param eventType 事件类型
	 * @param listener 事件回调
	 */
	off(eventType: string, listener: EventListener): void;
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

export interface EngineEntry {
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
	 * 编辑器根节点，默认为编辑器父节点
	 */
	root: NodeInterface;

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
