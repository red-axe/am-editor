import { $, MarkPlugin } from '@aomao/engine';
import type {
	ConversionFromValue,
	ConversionToValue,
	PluginOptions,
} from '@aomao/engine';

export interface UnderlineOptions extends PluginOptions {
	hotkey?: string | Array<string>;
}
export default class<
	T extends UnderlineOptions = UnderlineOptions,
> extends MarkPlugin<T> {
	tagName = 'u';

	static get pluginName() {
		return 'underline';
	}

	hotkey() {
		return this.options.hotkey || 'mod+u';
	}

	conversion(): { from: ConversionFromValue; to: ConversionToValue }[] {
		return [
			{
				from: (name, style) => {
					return (
						name === 'span' &&
						(style['text-decoration'] || '').includes('underline')
					);
				},
				to: (_, style, attrs) => {
					const newNode = $(`<${this.tagName} />`);
					style['text-decoration'] = style['text-decoration']
						.split(/\s+/)
						.filter((value) => value !== 'underline')
						.join(' ')
						.trim();
					newNode.css(style);
					newNode.attributes(attrs);
					return newNode;
				},
			},
		];
	}
}
