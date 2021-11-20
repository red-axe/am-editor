import { ConversionInterface } from './conversion';
import { NodeInterface } from './node';
import { SchemaInterface } from './schema';

export type Callbacks = {
	/**
	 * 遍历节点开始
	 */
	onOpen?: (
		node: NodeInterface,
		name: string,
		attributes: { [k: string]: string },
		styles: { [k: string]: string },
	) => boolean | void;
	/**
	 * 遍历节点结束
	 */
	onClose?: (
		node: NodeInterface,
		name: string,
		attributes: { [k: string]: string },
		styles: { [k: string]: string },
	) => void;
	/**
	 * 遍历节点文本
	 */
	onText?: (node: NodeInterface, test: string) => void;
};

export interface ParserInterface {
	/**
	 * 根节点
	 */
	root: NodeInterface;
	/**
	 * 标准化节点
	 * @param root 根节点
	 * @param schema Schema
	 * @param conversion 转换规则
	 */
	normalize(
		root: NodeInterface,
		schema: SchemaInterface,
		conversion: ConversionInterface | null,
	): void;
	/**
	 * 遍历节点
	 * @param node 根节点
	 * @param conversionRules 标签名称转换器
	 * @param callbacks 回调
	 * @param isCardNode 是否是卡片
	 * @param includeCard 是否包含卡片
	 */
	traverse(
		node: NodeInterface,
		schema: SchemaInterface | null,
		conversion: ConversionInterface | null,
		callbacks: Callbacks,
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
		conversion?: ConversionInterface | null,
		replaceSpaces?: boolean,
		customTags?: boolean,
	): string;

	/**
	 * 转换为HTML代码
	 * @param inner 内包裹节点
	 * @param outter 外包裹节点
	 */
	toHTML(inner?: Node, outter?: Node): string;

	/**
	 * 返回DOM树
	 */
	toDOM(
		schema?: SchemaInterface | null,
		conversion?: ConversionInterface | null,
	): DocumentFragment;

	/**
	 * 转换为文本
	 * @param schema Schema 规则
	 * @param includeCard 是否遍历卡片内部，默认不遍历
	 * @param formatOL 是否格式化有序列表，<ol><li>a</li><li>b</li></ol>  ->  1. a  2. b 默认转换
	 */
	toText(
		schema?: SchemaInterface,
		includeCard?: boolean,
		formatOL?: boolean,
	): string;
}
