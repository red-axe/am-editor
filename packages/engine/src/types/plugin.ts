import { ClipboardData } from './clipboard';
import { EditorInterface } from './engine';
import { LanguageInterface } from './language';
import { NodeInterface } from './node';
import { RangeInterface } from './range';
import {
	SchemaGlobal,
	SchemaInterface,
	SchemaRule,
	SchemaValue,
} from './schema';

export type PluginOptions = {};

export interface PluginEntry {
	prototype: PluginInterface;
	new (editor: EditorInterface, options: PluginOptions): PluginInterface;
	readonly pluginName: string;
}

export interface PluginInterface {
	readonly kind: string;
	/**
	 * 标签名称
	 */
	readonly tagName?: string | Array<string>;
	/**
	 * 标签样式，可选
	 * 使用变量表示值时，固定规则：@var0 @var1 @var2 ... 分别表示执行 command.execute 时传入的 参数1 参数2 参数3 ...
	 * { value:string,format:(value:string) => string } 可以在获取节点属性值时，对值进行自定义格式化处理
	 */
	readonly style?: {
		[key: string]:
			| string
			| { value: string; format: (value: string) => string };
	};
	/**
	 * 标签属性，可选
	 * 使用变量表示值时，固定规则：@var0 @var1 @var2 ... 分别表示执行 command.execute 时传入的 参数1 参数2 参数3 ...
	 * { value:string,format:(value:string) => string } 可以在获取节点属性值时，对值进行自定义格式化处理
	 */
	readonly attributes?: {
		[key: string]:
			| string
			| { value: string; format: (value: string) => string };
	};
	/**
	 * 在 style 或者 attributes 使用变量表示的值规则
	 * key 为如上所诉的变量名称 @var0 @var1 @var2 ...
	 */
	readonly variable?: { [key: string]: SchemaValue };
	/**
	 * 初始化
	 */
	init(): void;
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
	 * 将当前插件style属性应用到节点
	 * @param node 节点
	 * @param args style 对应 variable 中的变量参数
	 */
	setStyle(node: NodeInterface | Node, ...args: Array<any>): void;
	/**
	 * 将当前插件attributes属性应用到节点
	 * @param node 节点
	 * @param args attributes 对应 variable 中的变量参数
	 */
	setAttributes(node: NodeInterface | Node, ...args: Array<any>): void;
	/**
	 * 获取节点符合当前插件规则的样式
	 * @param node 节点
	 * @returns 样式名称和样式值键值对
	 */
	getStyle(node: NodeInterface | Node): { [key: string]: string };
	/**
	 * 获取节点符合当前插件规则的属性
	 * @param node 节点
	 * @returns 属性名称和属性值键值对
	 */
	getAttributes(node: NodeInterface | Node): { [key: string]: string };
	/**
	 * 检测当前节点是否符合当前插件设置的规则
	 * @param node 节点
	 * @returns true | false
	 */
	isSelf(node: NodeInterface | Node): boolean;
	/**
	 * 插件热键绑定，返回需要匹配的组合键字符，如 mod+b，匹配成功即执行插件，还可以带上插件执行所需要的参数，多个参数以数组形式返回{key:"mod+b",args:[]}
	 * @param event 键盘事件
	 */
	hotkey?(
		event?: KeyboardEvent,
	):
		| string
		| { key: string; args: any }
		| Array<{ key: string; args: any }>
		| Array<string>;
	/**
	 * 获取插件设置的属性和样式所生成的规则
	 */
	schema?(): SchemaRule | SchemaGlobal | Array<SchemaRule>;
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
}

export interface PluginModelInterface {
	/**
	 * 实例化的插件集合
	 */
	components: { [k: string]: PluginInterface };
	/**
	 * 实例化插件
	 * @param plugins 插件集合
	 * @param config 插件配置
	 */
	init(plugins: Array<PluginEntry>, config: { [k: string]: any }): void;
	/**
	 * 新增插件
	 * @param clazz 插件类
	 */
	add(clazz: PluginEntry, options?: PluginOptions): void;
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
}
