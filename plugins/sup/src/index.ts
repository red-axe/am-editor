import {
	$,
	ConversionFromValue,
	ConversionToValue,
	isEngine,
	MarkPlugin,
	PluginOptions,
} from '@aomao/engine';
import type MarkdownIt from 'markdown-it';
import mdSup from 'markdown-it-sup';

export interface SupOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}

const MARKDOWN_IT = 'markdown-it';

export default class<T extends SupOptions = SupOptions> extends MarkPlugin<T> {
	tagName = 'sup';

	static get pluginName() {
		return 'sup';
	}

	init() {
		super.init();
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.on(MARKDOWN_IT, this.markdownIt);
		}
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

	execute(...args: any): void {
		const isSup = this.editor.command.queryState('sup');
		if (isSup) {
			super.execute(...args);
		}
		const isSub = this.editor.command.queryState('sub');
		if (isSub) {
			this.editor.command.execute('sub');
		}
		if (!isSup) {
			super.execute(...args);
		}
	}

	hotkey() {
		return this.options.hotkey || 'mod+.';
	}

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) {
			mardown.use(mdSup);
			mardown.enable('sup');
		}
	};

	destroy(): void {
		this.editor.off(MARKDOWN_IT, this.markdownIt);
	}
}
