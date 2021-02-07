import { ClipboardData } from './clipboard';
import { ContentViewInterface } from './content-view';
import { EngineInterface } from './engine';
import { LanguageInterface } from './language';
import { NodeInterface } from './node';
import { RangeInterface } from './range';
import { SchemaInterface } from './schema';

export type PluginOptions = {
	engine?: EngineInterface;
	contentView?: ContentViewInterface;
};

export interface PluginEntry {
	prototype: PluginInterface;
	new (name: string, options: PluginOptions): PluginInterface;
}

export interface PluginInterface {
	/**
	 * 插件名称
	 */
	readonly name: string;
	/**
	 * 初始化
	 */
	initialize?(): void;
	/**
	 * 获取插件本地化语言
	 */
	getLang(): LanguageInterface;
	/**
	 * 查询插件状态
	 * @param args 插件需要的参数
	 */
	queryState?(...args: any): any;
	/**
	 * 执行插件
	 * @param args 插件需要的参数
	 */
	execute(...args: any): void;
	/**
	 * 插件本地化语言
	 */
	locales?(): {};
	/**
	 * 插件热键绑定，返回ture，即执行插件，或者返回需要匹配的组合键字符，如 mod+b，匹配成功即执行插件，还可以带上插件执行所需要的参数，多个参数以数组形式返回{key:"mod+b",args:[]}
	 * @param e 键盘事件
	 */
	hotkey?(
		e: KeyboardEvent,
	):
		| boolean
		| string
		| { key: string; args: any }
		| Array<{ key: string; args: any }>
		| Array<string>;
	/**
	 * 设置插件所需保留标签的白名单，以及属性
	 */
	schema?(): any;
	/**
	 * 解析DOM节点，生成符合标准的 XML 代码之前触发
	 * @param root DOM节点
	 */
	parseValueBefore?(root: NodeInterface): void;
	/**
	 * 解析DOM节点，生成符合标准的 XML，遍历子节点时触发。返回false跳过当前节点
	 * @param node 当前遍历的节点
	 * @param value 当前已经生成的xml代码
	 */
	parseValue?(node: NodeInterface, value: Array<string>): void | boolean;
	/**
	 * 解析DOM节点，生成符合标准的 XML。生成xml代码结束后触发
	 * @param value xml代码
	 */
	parseValueAfter?(value: Array<string>): void;
	/**
	 * 转换为HTML代码之前触发
	 * @param root 需要转换的根节点
	 */
	parseHtmlBefore?(root: NodeInterface): void;
	/**
	 * 转换为HTML代码
	 * @param root 需要转换的根节点
	 */
	parseHtml?(root: NodeInterface): void;
	/**
	 * 转换为HTML代码之后触发
	 * @param root 需要转换的根节点
	 */
	parseHtmlAfter?(root: NodeInterface): void;
	/**
	 * 复制DOM节点时触发
	 * @param node 当前遍历的子节点
	 */
	copy?(node: NodeInterface): void;
	/**
	 * 当粘贴到编辑器事件发生时触发，返回false，将不在处理粘贴
	 * @param data 粘贴板相关数据
	 * @param value 当前编辑器的值
	 */
	pasteEvent?(
		data: ClipboardData & { isPasteText: boolean },
		value: string,
	): boolean | void;
	/**
	 * 设置本次粘贴所需保留标签的白名单，以及属性
	 * @param schema 标签白名单管理实例
	 */
	pasteSchema?(schema: SchemaInterface): void;
	/**
	 * 解析粘贴数据，还未生成符合编辑器数据的片段之前触发
	 * @param root 粘贴的DOM节点
	 */
	pasteOrigin?(root: NodeInterface): void;
	/**
	 * 解析粘贴数据，生成符合编辑器数据的片段之后整理阶段触发
	 * @param node 粘贴片段遍历的子节点
	 */
	pasteEach?(node: NodeInterface): void;
	/**
	 * 生成粘贴数据DOM片段后，还未写入到编辑器之前触发
	 * @param fragment 粘贴的片段
	 */
	pasteBefore?(fragment: DocumentFragment): void;
	/**
	 * 插入当前粘贴的片段后触发，此时还未渲染卡片
	 * @param range 当前插入后的光标实例
	 */
	pasteInsert?(range: RangeInterface): void;
	/**
	 * 粘贴完成后触发
	 */
	pasteAfter?(): void;
	/**
     * 拖动文件到编辑器时触发
     
     * @param files 文件集合
     */
	dropFiles?(files: Array<File>): void;
	/**
	 * 键盘按下指定键事件，返回false时不再执行后面的操作，包括编辑器本身的处理
	 * @param type 类型
	 * @param event 事件
	 */
	onCustomizeKeydown?(
		type:
			| 'enter'
			| 'backspace'
			| 'space'
			| 'tab'
			| 'shift-tab'
			| 'at'
			| 'slash'
			| 'selectall',
		event: KeyboardEvent,
	): boolean | void;
	/**
	 * 键盘按下指定键松开事件，返回false时不再执行后面的操作，包括编辑器本身的处理
	 * @param type 类型
	 * @param event 事件
	 */
	onCustomizeKeyup?(
		type: 'enter' | 'backspace' | 'space' | 'tab',
		event: KeyboardEvent,
	): boolean | void;
}

export interface PluginModelInterface {
	/**
	 * 实例化的插件集合
	 */
	components: { [k: string]: PluginInterface };
	/**
	 * 新增插件
	 * @param name 插件名称
	 * @param clazz 插件类
	 */
	add(name: string, clazz: PluginEntry): void;
	/**
	 * 遍历插件
	 * @param callback 回调
	 */
	each(
		callback: (
			name: string,
			clazz: PluginEntry,
			index?: number,
		) => boolean | void,
	): void;
	/**
	 * 设置引擎实例
	 * @param engine 引擎实例
	 */
	setEngine(engine: EngineInterface): void;
	/**
	 * 设置内容渲染实例
	 * @param engine 引擎实例
	 */
	setContentView(contentView: ContentViewInterface): void;
}
