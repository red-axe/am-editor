import {
	$,
	ConversionFromValue,
	ConversionToValue,
	isEngine,
	MarkPlugin,
	PluginOptions,
} from '@aomao/engine';
import type MarkdownIt from 'markdown-it';
import mdSub from 'markdown-it-sub';

export interface SubOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}

const MARKDOWN_IT = 'markdown-it';
export default class<T extends SubOptions = SubOptions> extends MarkPlugin<T> {
	tagName = 'sub';

	static get pluginName() {
		return 'sub';
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

	execute(...args: any): void {
		const isSup = this.editor.command.queryState('sup');
		if (isSup) this.editor.command.execute('sup');
		super.execute(...args);
	}

	hotkey() {
		return this.options.hotkey || 'mod+,';
	}

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) {
			mardown.use(mdSub);
			mardown.enable('sub');
		}
	};

	destroy(): void {
		this.editor.off(MARKDOWN_IT, this.markdownIt);
	}
}
