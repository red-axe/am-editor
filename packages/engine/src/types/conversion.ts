import { NodeInterface } from './node';
/**
 * 转换器值的源类型
 */
export type ConversionFromValue =
	| string
	| {
			[elementName: string]: {
				style?: { [key: string]: string | Array<string> };
				attributes?: { [key: string]: string | Array<string> };
			};
	  }
	| ((
			name: string,
			style: { [key: string]: string },
			attributes: { [key: string]: string },
	  ) => boolean);

/**
 * 转换器值的目标类型
 */
export type ConversionToValue =
	| string
	| NodeInterface
	| ((
			name: string,
			style: { [key: string]: string },
			attributes: { [key: string]: string },
	  ) => NodeInterface | { node: NodeInterface; replace: boolean });
/**
 * 转换器规则
 */
export type ConversionRule = {
	from: ConversionFromValue;
	to: ConversionToValue;
};

export type ConversionData = Array<ConversionRule>;

/**
 * 转换接口
 */
export interface ConversionInterface {
	/**
	 * 获取转换数据
	 */
	getData(): ConversionData;
	/**
	 * 复制当前转换器实例
	 */
	clone(): ConversionInterface;
	/**
	 * 增加转换规则
	 * @param from 转换器值的源类型
	 * @param to 转换器值的目标类型
	 */
	add(from: ConversionFromValue, to: ConversionToValue): void;
	/**
	 * 转换
	 * @param node 要转换的节点
	 * @param filter 过滤规则
	 */
	transform(
		node: NodeInterface,
		filter?: (item: {
			from: ConversionFromValue;
			to: ConversionToValue;
		}) => boolean,
	):
		| {
				rule: ConversionRule;
				node: {
					name: string;
					style: {
						[k: string]: string;
					};
					attributes: {
						[k: string]: string;
					};
				};
				replace: boolean;
		  }
		| undefined;
}
