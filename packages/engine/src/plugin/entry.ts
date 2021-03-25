import { ClipboardData } from '../types/clipboard';
import { EditorInterface } from '../types/engine';
import { LanguageInterface } from '../types/language';
import { isNode, NodeInterface } from '../types/node';
import { PluginOptions, PluginInterface } from '../types/plugin';
import { RangeInterface } from '../types/range';
import {
	SchemaAttributes,
	SchemaGlobal,
	SchemaInterface,
	SchemaRule,
	SchemaStyle,
	SchemaValue,
} from '../types/schema';
import { toHex } from '../utils';

abstract class PluginEntry<T extends PluginOptions = {}>
	implements PluginInterface {
	protected readonly editor: EditorInterface;
	protected options: T;
	constructor(editor: EditorInterface, options: PluginOptions) {
		this.editor = editor;
		this.options = (options || {}) as T;
	}
	static readonly pluginName: string;
	readonly kind: string = 'plugin';
	/**
	 * 规则缓存
	 */
	private sechamCache?: SchemaRule | SchemaGlobal | Array<SchemaRule>;
	/**
	 * 标签名称，没有标签名称，style 和 attributes 将以全局属性方式添加
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
	init(): void {
		this.editor.schema.add(this.schema());
	}
	/**
	 * 获取插件本地化语言
	 */
	getLang(): LanguageInterface {
		return this.editor.language;
	}
	/**
	 * 将当前插件style属性应用到节点
	 * @param node 节点
	 * @param args style 对应 variable 中的变量参数
	 */
	setStyle(node: NodeInterface | Node, ...args: Array<any>) {
		const { $ } = this.editor;
		if (isNode(node)) node = $(node);
		if (this.style) {
			Object.keys(this.style).forEach(styleName => {
				let styleValue = this.style![styleName];
				if (typeof styleValue === 'object')
					styleValue = styleValue.value;
				//替换变量
				styleValue.match(/@var\d/g)?.forEach(regMatch => {
					const index = parseInt(regMatch.replace('@var', ''), 10);
					styleValue = (styleValue as string).replace(
						new RegExp(regMatch, 'gm'),
						args[index] || '',
					);
				});
				(node as NodeInterface).css(styleName, styleValue);
			});
		}
	}
	/**
	 * 将当前插件attributes属性应用到节点
	 * @param node 节点
	 * @param args attributes 对应 variable 中的变量参数
	 */
	setAttributes(node: NodeInterface | Node, ...args: Array<any>) {
		const { $ } = this.editor;
		if (isNode(node)) node = $(node);
		if (this.attributes) {
			Object.keys(this.attributes).forEach(attributesName => {
				let attributesValue = this.attributes![attributesName];
				if (typeof attributesValue === 'object')
					attributesValue = attributesValue.value;
				//替换变量
				attributesValue.match(/@var\d/g)?.forEach(regMatch => {
					const index = parseInt(regMatch.replace('@var', ''), 10);
					attributesValue = (attributesValue as string).replace(
						new RegExp(regMatch, 'gm'),
						args[index] || '',
					);
				});
				(node as NodeInterface).attributes(
					attributesName,
					attributesValue,
				);
			});
		}
	}
	/**
	 * 获取节点符合当前插件规则的样式
	 * @param node 节点
	 * @returns 样式名称和样式值键值对
	 */
	getStyle(node: NodeInterface | Node) {
		const { $ } = this.editor;
		if (isNode(node)) node = $(node);
		const values: { [k: string]: string } = {};
		if (this.style && this.isSelf(node)) {
			Object.keys(this.style).forEach(styleName => {
				node = node as NodeInterface;
				let value =
					styleName.toLowerCase().indexOf('color') > -1
						? toHex(node.css(styleName) || '')
						: node.css(styleName);
				let styleValue = this.style![styleName];
				if (typeof styleValue === 'object') {
					value = styleValue.format(value);
				}
				if (!!value) values[styleName] = value;
			});
		}
		return values;
	}
	/**
	 * 获取节点符合当前插件规则的属性
	 * @param node 节点
	 * @returns 属性名称和属性值键值对
	 */
	getAttributes(node: NodeInterface | Node) {
		const { $ } = this.editor;
		if (isNode(node)) node = $(node);
		const values: { [k: string]: string } = {};
		if (this.attributes && this.isSelf(node)) {
			Object.keys(this.attributes).forEach(attributesName => {
				let value = (node as NodeInterface).attributes(attributesName);
				let attributesValue = this.attributes![attributesName];
				if (typeof attributesValue === 'object') {
					value = attributesValue.format(value);
				}
				if (!!value) values[attributesName] = value;
			});
		}
		return values;
	}
	/**
	 * 检测当前节点是否符合当前插件设置的规则
	 * @param node 节点
	 * @returns true | false
	 */
	isSelf(node: NodeInterface | Node) {
		const { $ } = this.editor;
		if (isNode(node)) node = $(node);
		let schema:
			| SchemaRule
			| SchemaGlobal
			| Array<SchemaRule>
			| undefined = this.schema();
		if (Array.isArray(schema))
			schema = schema.find(
				({ name }) => name === (node as NodeInterface).name,
			);
		if (!schema) return false;
		return (
			(Array.isArray(this.tagName)
				? this.tagName.indexOf(node.name) > -1
				: node.name === this.tagName) &&
			this.editor.schema.checkNode(node, schema.type, schema.attributes)
		);
	}
	/**
	 * 查询插件状态
	 * @param args 插件需要的参数
	 */
	queryState?(...args: any): any;
	/**
	 * 执行插件
	 * @param args 插件需要的参数
	 */
	abstract execute(...args: any): void;
	/**
	 * 插件本地化语言
	 */
	locales?(): {};
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
	schema(): SchemaRule | SchemaGlobal | Array<SchemaRule> {
		if (this.sechamCache) return this.sechamCache;
		let attributes: SchemaAttributes | SchemaStyle = {};
		if (this.attributes) {
			//替换变量
			Object.keys(this.attributes).forEach(attributesName => {
				let attributesValue = this.attributes![attributesName];
				if (typeof attributesValue === 'object')
					attributesValue = attributesValue.value;
				attributes[attributesName] = attributesValue;
				attributesValue
					.match(/@var\d/g)
					?.forEach((regMatch: string) => {
						if (!this.variable)
							throw 'Please specify the variable type';
						attributes[attributesName] = this.variable[regMatch];
					});
			});
		}
		if (this.style) {
			//替换变量
			const style: { [key: string]: SchemaValue } = {};
			Object.keys(this.style).forEach(styleName => {
				let styleValue = this.style![styleName];
				if (typeof styleValue === 'object')
					styleValue = styleValue.value;

				styleValue.match(/@var\d/g)?.forEach((regMatch: string) => {
					if (!this.variable)
						throw 'Please specify the variable type';
					style[styleName] = this.variable[regMatch];
				});
			});
			attributes = { ...attributes, style };
		}

		this.sechamCache = {
			type: this.kind as any,
			attributes,
		} as SchemaGlobal;
		if (typeof this.tagName === 'string')
			(this.sechamCache as SchemaRule).name = this.tagName.toLowerCase();
		else if (Array.isArray(this.tagName)) {
			const sechamValue: Array<SchemaRule> = [];
			this.tagName.forEach(name => {
				sechamValue.push({ ...(this.sechamCache as SchemaRule), name });
			});
			this.sechamCache = sechamValue;
		}

		return this.sechamCache;
	}
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

export default PluginEntry;
