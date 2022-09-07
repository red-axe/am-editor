import {
	$,
	Plugin,
	NodeInterface,
	CARD_KEY,
	isEngine,
	SchemaInterface,
	PluginOptions,
	decodeCardValue,
	READY_CARD_KEY,
} from '@aomao/engine';
import locales from './locale';
import type MarkdownIt from 'markdown-it';
import renderHTMLTemplate from './component/utils/render';
import MulitCodeblockComponent from './component';
import type { MulitCodeblockValue } from './component';
import { mk_mulit_codeblock } from './component/utils/markdown';
import './component/style.css';
import { languageMap } from './component/utils/index';

export interface MulitCodeblockOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	language?: string[];
}

export default class extends Plugin<MulitCodeblockOptions> {
	static get pluginName() {
		return 'mulit_codeblock';
	}

	init() {
		const { editor } = this;

		editor.language.add(locales);
		editor.on('parse:html', this.parseHtml);
		editor.on('paste:schema', this.pasteSchema);
		editor.on('paste:each', this.pasteHtml);
		editor.on('markdown-it', this.markdownIt);
	}

	execute() {
		const { editor, options } = this;

		if (!isEngine(editor) || editor.readonly) {
			return;
		}

		const { card } = editor;
		const { language } = options;
		const config = {
			langs: [
				{
					language: 'javascript',
					text: '',
				},
			],
			language: languageMap,
		};

		if (language && language.length) {
			config.langs = [
				{
					language: language[0],
					text: '',
				},
			];
			config.language = language;
		}

		card.insert<MulitCodeblockValue, MulitCodeblockComponent>(
			MulitCodeblockComponent.cardName,
			{
				...config,
				wrap: false,
				theme: 'default',
				height: 'auto',
			},
			true,
		);
	}

	hotkey() {
		return this.options.hotkey || 'mod+option+m';
	}

	markdownIt = (markdown: MarkdownIt) => {
		if (this.options.markdown !== false) {
			mk_mulit_codeblock(markdown);
		}
	};

	pasteSchema = (schema: SchemaInterface) => {
		schema.add({
			type: 'block',
			name: 'div',
			attributes: {
				'data-type': {
					required: true,
					value: MulitCodeblockComponent.cardName,
				},
				'data-value': '*',
			},
		});
	};

	pasteHtml = (node: NodeInterface) => {
		const { editor } = this;

		if (!isEngine(editor) || editor.readonly) {
			return;
		}

		const { cardName } = MulitCodeblockComponent;

		if (node.isElement()) {
			const type = node.attributes('data-type');
			if (type === cardName) {
				const value = node.attributes('data-value');
				const cardValue = decodeCardValue(value);

				editor.card.replaceNode(node, cardName, cardValue);
				node.remove();
				return false;
			}
		}
		return true;
	};

	parseHtml = (root: NodeInterface) => {
		const { cardName } = MulitCodeblockComponent;

		root.find(
			`[${CARD_KEY}="${cardName}"],[${READY_CARD_KEY}="${cardName}"]`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = this.editor.card.find<
				MulitCodeblockValue,
				MulitCodeblockComponent
			>(node);
			const value = card?.getValue();

			if (value) {
				node.empty();
				const div = $(renderHTMLTemplate(cardName, value));
				node.replaceWith(div);
			} else {
				node.remove();
			}
		});
	};

	destroy() {
		const { editor } = this;

		editor.off('parse:html', this.parseHtml);
		editor.off('paste:schema', this.pasteSchema);
		editor.off('paste:each', this.pasteHtml);
	}
}

export { MulitCodeblockComponent };
export type { MulitCodeblockValue };
