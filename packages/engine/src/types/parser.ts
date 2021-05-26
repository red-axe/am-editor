import { NodeInterface } from './node';
import { SchemaInterface } from './schema';

export type Callbacks = {
	onOpen?: (
		node: NodeInterface,
		name: string,
		attrs: { [k: string]: string },
		styles: { [k: string]: string },
	) => boolean | void;
	onClose?: (
		node: NodeInterface,
		name: string,
		attrs: { [k: string]: string },
		styles: { [k: string]: string },
	) => void;
	onText?: (node: NodeInterface, test: string) => void;
};

export interface ParserInterface {
	/**
	 * 遍历节点
	 * @param node 根节点
	 * @param conversionRules 标签名称转换器
	 * @param callbacks 回调
	 * @param isCardNode 是否是卡片
	 * @param includeCard 是否包含卡片
	 */
	walkTree(
		node: NodeInterface,
		conversionRules: any,
		callbacks: Callbacks,
		isCardNode?: boolean,
		includeCard?: boolean,
	): void;

	/**
	 * 遍历 DOM 树，生成符合标准的 XML 代码
	 * @param schemaRules 标签保留规则
	 * @param conversionRules 标签转换规则
	 * @param replaceSpaces 是否替换空格
	 * @param customTags 是否将光标、卡片节点转换为标准代码
	 */
	toValue(
		schema?: SchemaInterface | null,
		conversionRules?: any,
		replaceSpaces?: boolean,
		customTags?: boolean,
	): string;

	/**
	 * 转换为HTML代码
	 * @param inner 内包裹节点
	 * @param outter 外包裹节点
	 */
	toHTML(inner?: Node, outter?: Node): { html: string; text: string };

	/**
	 * 返回DOM树
	 */
	toDOM(
		schema?: SchemaInterface | null,
		conversionRules?: any,
	): DocumentFragment;

	/**
	 * 转换为文本
	 * @param conversionRules 标签转换规则
	 * @param includeCard 是否包含卡片
	 */
	toText(
		schema?: SchemaInterface | null,
		conversionRules?: any,
		includeCard?: boolean,
	): string;
}
