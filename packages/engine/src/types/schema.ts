import { NodeInterface } from './node';

/**
 * 规则值类型
 */
export type SchemaValueBase =
	| RegExp
	| Array<string>
	| string
	| ((propValue: string) => boolean)
	| '@number'
	| '@length'
	| '@color'
	| '@url'
	| '*';

/**
 * 规则对象值类型
 */
export type SchemaValueObject = {
	required: boolean;
	value: SchemaValueBase;
};
/**
 * 规则值类型
 */
export type SchemaValue = SchemaValueObject | SchemaValueBase;
/**
 * 属性规则
 */
export type SchemaAttributes = {
	[key: string]: SchemaValue;
};
/**
 * 样式规则
 */
export type SchemaStyle = {
	style: { [key: string]: SchemaValue };
};
/**
 * 全局规则
 */
export type SchemaGlobal = {
	/**
	 * 节点类型
	 */
	type: 'block' | 'mark' | 'inline';
	/**
	 * 属性规则
	 */
	attributes: SchemaAttributes | SchemaStyle;
};
/**
 * 规则
 */
export type SchemaRule = {
	name: string;
	type: 'block' | 'mark' | 'inline';
	attributes?: SchemaAttributes | SchemaStyle;
	isVoid?: boolean;
};
/**
 * block 规则
 */
export type SchemaBlock = SchemaRule & {
	type: 'block';
	allowIn?: Array<string>;
	canMerge?: boolean;
};
/**
 * mark 规则
 */
export type SchemaMark = SchemaRule & {
	type: 'mark';
};

export interface SchemaInterface {
	/**
	 * 规则集合
	 */
	data: {
		blocks: Array<SchemaRule>;
		inlines: Array<SchemaRule>;
		marks: Array<SchemaRule>;
		globals: { [key: string]: SchemaAttributes | SchemaStyle };
	};
	/**
	 * 增加规则，不允许设置div标签，div将用作card使用
	 * 只有 type 和 attributes 时，将作为此类型全局属性，与其它所有同类型标签属性将合并
	 * @param rules 规则
	 * @param isMerge 是否合并
	 */
	add(
		rules: SchemaRule | SchemaGlobal | Array<SchemaRule | SchemaGlobal>,
		isMerge?: boolean,
	): void;
	/**
	 * 移除一个规则
	 * @param rule
	 */
	remove(rule: SchemaRule): void;
	/**
	 * 查找规则
	 * @param callback 查找条件
	 */
	find(callback: (rule: SchemaRule) => boolean): Array<SchemaRule>;
	/**
	 * 获取类型有哪些标签名称
	 * @param type
	 */
	getTags(type: 'blocks' | 'inlines' | 'marks'): string[];
	/**
	 * 获取节点类型
	 * @param node 节点
	 * @param filter 过滤
	 */
	getType(
		node: NodeInterface | Node,
		filter?: (rule: SchemaRule) => boolean,
	): 'block' | 'mark' | 'inline' | undefined;
	/**
	 * 根据节点获取符合的规则
	 * @param node 节点
	 * @param filter 过滤
	 * @returns
	 */
	getRule(
		node: NodeInterface | Node,
		filter?: (rule: SchemaRule) => boolean,
	): SchemaRule | undefined;
	/**
	 * 检测节点是否符合某一属性规则
	 * @param node 节点
	 * @param attributes 属性规则
	 */
	checkNode(
		node: NodeInterface | Node,
		attributes?: SchemaAttributes | SchemaStyle,
	): boolean;
	/**
	 * 检测值是否符合规则
	 * @param rule 规则
	 * @param attributesName 属性名称
	 * @param attributesValue 属性值
	 * @param force 是否强制比较值
	 */
	checkValue(
		rule: SchemaAttributes | SchemaStyle,
		attributesName: string,
		attributesValue: string,
		force?: boolean,
	): boolean;
	/**
	 * 过滤节点样式
	 * @param styles 样式
	 * @param rule 规则
	 * @param callback 回调
	 */
	filterStyles(
		styles: { [k: string]: string },
		rule: SchemaRule,
		callback?: (name: string, value: string) => void,
	): void;
	/**
	 * 过滤节点属性
	 * @param attributes 属性
	 * @param rule 规则
	 * @param callback 回调
	 */
	filterAttributes(
		attributes: { [k: string]: string },
		rule: SchemaRule,
		callback?: (name: string, value: string) => void,
	): void;
	/**
	 * 过滤满足node节点规则的属性和样式
	 * @param node 节点，用于获取规则
	 * @param attributes 属性
	 * @param styles 样式
	 * @returns
	 */
	filter(
		node: NodeInterface,
		attributes: { [k: string]: string },
		styles: { [k: string]: string },
		apply?: boolean,
	): void;
	/**
	 * 克隆当前schema对象
	 */
	clone(): SchemaInterface;
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
	/**
	 * 给一个block节点添加允许放入的block子节点
	 * @param parent 允许放入的父节点
	 * @param child 允许放入的节点，默认 p
	 */
	addAllowIn(parent: string, child?: string): void;
	/**
	 * 获取允许有子block节点的标签集合
	 * @returns
	 */
	getAllowInTags(): Array<string>;
	/**
	 * 获取能够合并的block节点的标签集合
	 * @returns
	 */
	getCanMergeTags(): Array<string>;
}
