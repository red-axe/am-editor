import cloneDeep from 'lodash/cloneDeep';
import { getStyleMap } from '../utils';
import { DATA_ELEMENT } from '../constants';
import {
	EditorInterface,
	NodeInterface,
	ConversionInterface,
	ConversionData,
	ConversionFromValue,
	ConversionToValue,
} from '../types';

class Conversion implements ConversionInterface {
	private editor: EditorInterface;

	private data: ConversionData = [];

	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	getData() {
		return this.data;
	}

	clone() {
		const dupData = cloneDeep(this.data);
		const dupConversion = new Conversion(this.editor);
		dupConversion.data = dupData;
		return dupConversion;
	}

	add(from: ConversionFromValue, to: ConversionToValue) {
		this.data.push({ from, to });
	}

	transform(
		node: NodeInterface,
		filter?: (item: {
			from: ConversionFromValue;
			to: ConversionToValue;
		}) => boolean,
	) {
		let name = node.name;
		let attributes = node.attributes();
		let style = getStyleMap(attributes.style || '');
		let replace = false;
		//删除属性中的style属性
		delete attributes.style;
		// 光标相关节点
		if (node.isCursor()) {
			name = attributes[DATA_ELEMENT].toLowerCase();
			attributes = {};
			style = {};
		}

		const rule = this.data.find((item) => {
			if (filter && !filter(item)) return;
			const { from, to } = item;
			let result = false;
			if (typeof from === 'string') {
				result = from === name;
			} else if (typeof from === 'function') {
				result = from(name, style, attributes);
			} else {
				const elementNames = Object.keys(from);
				result =
					elementNames.indexOf(name) >= 0 &&
					elementNames.some((elementName: string) => {
						const elementRules = from[elementName];
						return (
							Object.keys(elementRules.style || {}).every(
								(styleName) => {
									const styleValue =
										elementRules.style![styleName];
									return !!style[styleName] &&
										Array.isArray(styleValue)
										? styleValue.indexOf(style[styleName]) >
												-1
										: styleValue === style[styleName];
								},
							) &&
							Object.keys(elementRules.attributes || {}).every(
								(attributesName) => {
									const attributesValue =
										elementRules.attributes![
											attributesName
										];
									return !!style[attributesName] &&
										Array.isArray(attributesValue)
										? attributesValue.indexOf(
												style[attributesName],
										  ) > -1
										: attributesValue ===
												style[attributesName];
								},
							)
						);
					});
			}
			if (result) {
				if (typeof to === 'string') {
					name = to;
					style = {};
					attributes = {};
				} else {
					const result =
						typeof to === 'function'
							? to(name, style, attributes)
							: to;
					let resultNode: NodeInterface = result as NodeInterface;
					if (result.hasOwnProperty('replace')) {
						const newResult = result as {
							node: NodeInterface;
							replace: boolean;
						};
						resultNode = newResult.node;
						replace = newResult.replace;
					}
					name = resultNode.name;
					style = resultNode.css();
					attributes = resultNode.attributes();
				}
			}
			return result;
		});
		return rule
			? { rule, node: { name, style, attributes }, replace }
			: undefined;
	}
}
export default Conversion;
