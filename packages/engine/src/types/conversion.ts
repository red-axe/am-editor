import { NodeInterface } from './node';

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

export type ConversionToValue =
	| string
	| NodeInterface
	| ((
			name: string,
			style: { [key: string]: string },
			attributes: { [key: string]: string },
	  ) => NodeInterface);

export type ConversionRule = {
	from: ConversionFromValue;
	to: ConversionToValue;
};

export type ConversionData = Array<ConversionRule>;

export interface ConversionInterface {
	getData(): ConversionData;

	clone(): ConversionInterface;

	add(from: ConversionFromValue, to: ConversionToValue): void;

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
		  }
		| undefined;
}
