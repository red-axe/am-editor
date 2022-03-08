import { $, MarkPlugin } from '@aomao/engine';
import type { PluginOptions, ConversionData, SchemaMark } from '@aomao/engine';

export interface BackcolorOptions extends PluginOptions {
	hotkey?: { key: string; args: Array<string> };
}
export default class<
	T extends BackcolorOptions = BackcolorOptions,
> extends MarkPlugin<T> {
	static get pluginName() {
		return 'backcolor';
	}
	readonly mergeLeval = 2;
	tagName = 'span';

	style = {
		'background-color': '@var0',
	};

	variable = {
		'@var0': {
			required: true,
			value: '@color',
		},
	};

	schema(): SchemaMark | SchemaMark[] {
		const schemas = super.schema() as SchemaMark;
		schemas.attributes!.style['background'] = '@color';
		return schemas;
	}

	conversion(): ConversionData {
		return [
			{
				from: (name, styles) => {
					return name === this.tagName && !!styles.background;
				},
				to: (name, styles, attributes) => {
					const toNode = $(`<${name} />`);
					const background = styles['background'];
					delete styles['background'];
					styles['background-color'] = background;
					toNode.css(styles);
					Object.keys(attributes).forEach((name) => {
						toNode.attributes(name, attributes[name]);
					});
					return toNode;
				},
			},
		];
	}

	isTrigger(color: string, defaultColor?: string) {
		return defaultColor === undefined || color !== defaultColor;
	}

	hotkey() {
		return this.options.hotkey || [];
	}
}
