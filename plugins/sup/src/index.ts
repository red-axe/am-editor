import {
	$,
	ConversionFromValue,
	ConversionToValue,
	MarkPlugin,
	PluginOptions,
} from '@aomao/engine';

export interface SupOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: string;
}
export default class<T extends SupOptions = SupOptions> extends MarkPlugin<T> {
	tagName = 'sup';

	static get pluginName() {
		return 'sup';
	}

	conversion(): { from: ConversionFromValue; to: ConversionToValue }[] {
		return [
			{
				from: (name, style) => {
					return (
						name === 'span' &&
						(style['vertical-align'] || '') === 'super'
					);
				},
				to: (_, style, attrs) => {
					const newNode = $(`<${this.tagName} />`);
					delete style['vertical-align'];
					newNode.css(style);
					newNode.attributes(attrs);
					return newNode;
				},
			},
		];
	}

	markdown =
		this.options.markdown === undefined ? '^' : this.options.markdown;

	hotkey() {
		return this.options.hotkey || 'mod+.';
	}
}
