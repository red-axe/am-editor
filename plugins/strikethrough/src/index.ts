import {
	$,
	ConversionFromValue,
	ConversionToValue,
	isEngine,
	MarkPlugin,
	PluginOptions,
} from '@aomao/engine';
import type MarkdownIt from 'markdown-it';

export interface StrikethroughOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}
export default class<
	T extends StrikethroughOptions = StrikethroughOptions,
> extends MarkPlugin<T> {
	tagName = 'del';

	static get pluginName() {
		return 'strikethrough';
	}

	init() {
		super.init();
		if (isEngine(this.editor)) {
			this.editor.on('markdown-it', this.markdownIt);
		}
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+x';
	}

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

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) {
			mardown.enable('strikethrough');
		}
	};

	destroy(): void {
		this.editor.off('markdown-it', this.markdownIt);
	}
}
