import { NodeInterface } from './node';

export type SchemaValue =
	| RegExp
	| Array<string>
	| string
	| ((propValue: string) => boolean)
	| '@number'
	| '@length'
	| '@color'
	| '@url'
	| '*';
export type SchemaAttributes = {
	[key: string]: SchemaValue;
};

export type SchemaStyle = {
	style: { [key: string]: SchemaValue };
};

export type SchemaMap = {
	[k: string]: SchemaAttributes | SchemaStyle;
};

export type SchemaGlobal = {
	type: 'block' | 'mark' | 'inline';
	attributes: SchemaAttributes | SchemaStyle;
};

export type SchemaRule = {
	name: string;
	type: 'block' | 'mark' | 'inline';
	attributes?: SchemaAttributes | SchemaStyle;
	isVoid?: boolean;
	isLimit?: boolean;
};

export type SchemaMark = SchemaRule & {
	copyOnEnter?: boolean;
};

export type SchemaBlock = SchemaRule & {
	allowIn?: Array<string>;
	disableMark?: Array<string>;
};

export interface SchemaInterface {
	/**
	 * 规则集合
	 */
	data: {
		blocks: Array<SchemaRule>;
		inlines: Array<SchemaRule>;
		marks: Array<SchemaRule>;
		globals: SchemaAttributes | SchemaStyle;
	};
	/**
	 * 增加规则，不允许设置div标签，div将用作card使用
	 * 只有 type 和 attributes 时，将作为此类型全局属性，与其它所有同类型标签属性将合并
	 * @param rules 规则
	 */
	add(
		rules: SchemaRule | SchemaGlobal | Array<SchemaRule | SchemaGlobal>,
	): void;
	/**
	 * 查找规则
	 * @param callback 查找条件
	 */
	find(callback: (rule: SchemaRule) => boolean): Array<SchemaRule>;
	/**
	 * 检测节点的属性和值是否符合规则
	 * @param node 节点
	 * @param type 指定类型
	 */
	check(node: NodeInterface, type?: 'block' | 'mark' | 'inline'): boolean;
	/**
	 * 检测节点是否符合某一属性规则
	 * @param node 节点
	 * @param type 节点类型 "block" | "mark" | "inline"
	 * @param attributes 属性规则
	 */
	checkNode(
		node: NodeInterface,
		type: 'block' | 'mark' | 'inline',
		attributes?: SchemaAttributes | SchemaStyle,
	): boolean;
	/**
	 * 检测样式值是否符合节点样式规则
	 * @param name 节点名称
	 * @param styleName 样式名称
	 * @param styleValue 样式值
	 */
	checkStyle(name: string, styleName: string, styleValue: string): boolean;
	/**
	 * 检测值是否符合节点属性的规则
	 * @param name 节点名称
	 * @param attributesName 属性名称
	 * @param attributesValue 属性值
	 */
	checkAttributes(
		name: string,
		attributesName: string,
		attributesValue: string,
	): boolean;
	/**
	 * 检测值是否符合规则
	 * @param rule 规则
	 * @param attributesName 属性名称
	 * @param attributesValue 属性值
	 */
	checkValue(
		rule: SchemaAttributes | SchemaStyle,
		attributesName: string,
		attributesValue: string,
	): boolean;
	/**
	 * 检测样式值是否符合节点样式规则
	 * @param name 节点名称
	 * @param styleName 样式名称
	 * @param styleValue 样式值
	 * @param type 指定类型
	 */
	checkStyle(
		name: string,
		styleName: string,
		styleValue: string,
		type?: 'block' | 'mark' | 'inline',
	): void;
	/**
	 * 检测值是否符合节点属性的规则
	 * @param name 节点名称
	 * @param attributesName 属性名称
	 * @param attributesValue 属性值
	 * @param type 指定类型
	 */
	checkAttributes(
		name: string,
		attributesName: string,
		attributesValue: string,
		type?: 'block' | 'mark' | 'inline',
	): void;
	/**
	 * 过滤节点样式
	 * @param name 节点名称
	 * @param styles 样式
	 * @param type 指定类型
	 */
	filterStyles(
		name: string,
		styles: { [k: string]: string },
		type?: 'block' | 'mark' | 'inline',
	): void;
	/**
	 * 过滤节点属性
	 * @param name 节点名称
	 * @param attributes 属性
	 * @param type 指定类型
	 */
	filterAttributes(
		name: string,
		attributes: { [k: string]: string },
		type?: 'block' | 'mark' | 'inline',
	): void;
	/**
	 * 克隆当前schema对象
	 */
	clone(): SchemaInterface;
	/**
	 * 将相同标签的属性和gloals属性合并转换为map格式
	 * @param type 指定转换的类别 "block" | "mark" | "inline"
	 */
	toAttributesMap(type?: 'block' | 'mark' | 'inline'): SchemaMap;
	/**
	 * 获取合并后的Map格式
	 * @param 类型，默认为所有
	 */
	getMapCache(type?: 'block' | 'mark' | 'inline'): SchemaMap;
	/**
	 * 查找节点符合规则的最顶层的节点名称
	 * @param name 节点名称
	 * @returns 最顶级的block节点名称
	 */
	closest(name: string): string;
	/**
	 * 判断子节点名称是否允许放入指定的父节点中
	 * @param source 父节点名称
	 * @param target 子节点名称
	 * @returns true | false
	 */
	isAllowIn(source: string, target: string): boolean;
}

export const isSchemaRule = (
	rule: SchemaRule | SchemaGlobal,
): rule is SchemaRule => {
	return !!rule['name'];
};
