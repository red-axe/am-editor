import {
	$,
	ConversionFromValue,
	ConversionToValue,
	MarkPlugin,
	PluginOptions,
} from '@aomao/engine';

export interface StrikethroughOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: string;
}
export default class<
	T extends StrikethroughOptions = StrikethroughOptions,
> extends MarkPlugin<T> {
	tagName = 'del';

	static get pluginName() {
		return 'strikethrough';
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+x';
	}

	markdown =
		this.options.markdown === undefined ? '~~' : this.options.markdown;

	conversion(): { from: ConversionFromValue; to: ConversionToValue }[] {
		return [
			{
				from: (name, style) => {
					return (
						name === 'span' &&
						(style['text-decoration'] || '').includes(
							'line-through',
						)
					);
				},
				to: (_, style, attrs) => {
					const newNode = $(`<${this.tagName} />`);
					style['text-decoration'] = style['text-decoration']
						.split(/\s+/)
						.filter((value) => value !== 'line-through')
						.join(' ')
						.trim();
					newNode.css(style);
					newNode.attributes(attrs);
					return newNode;
				},
			},
			{
				from: 's',
				to: this.tagName,
			},
			{
				from: 'strike',
				to: this.tagName,
			},
		];
	}
}
