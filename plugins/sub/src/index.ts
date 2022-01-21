import {
	$,
	ConversionFromValue,
	ConversionToValue,
	MarkPlugin,
	PluginOptions,
} from '@aomao/engine';

export interface SubOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: string;
}
export default class<T extends SubOptions = SubOptions> extends MarkPlugin<T> {
	tagName = 'sub';

	static get pluginName() {
		return 'sub';
	}

	conversion(): { from: ConversionFromValue; to: ConversionToValue }[] {
		return [
			{
				from: (name, style) => {
					return (
						name === 'span' &&
						(style['vertical-align'] || '') === 'sub'
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

	hotkey() {
		return this.options.hotkey || 'mod+,';
	}

	markdown =
		this.options.markdown === undefined ? '~' : this.options.markdown;
}
