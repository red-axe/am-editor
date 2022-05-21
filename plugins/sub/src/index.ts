import {
	$,
	ConversionFromValue,
	ConversionToValue,
	isEngine,
	MarkPlugin,
	PluginOptions,
} from '@aomao/engine';
import type MarkdownIt from 'markdown-it';

export interface SubOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}
export default class<T extends SubOptions = SubOptions> extends MarkPlugin<T> {
	tagName = 'sub';

	static get pluginName() {
		return 'sub';
	}

	init() {
		super.init();
		if (isEngine(this.editor)) {
			this.editor.on('markdown-it', this.markdownIt);
		}
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

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) {
			mardown.use(require('markdown-it-sub'));
			mardown.enable('sub');
		}
	};

	destroy(): void {
		this.editor.off('markdown-it', this.markdownIt);
	}
}
