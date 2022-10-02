import { Plugin, isEngine, NodeInterface } from '@aomao/engine';
import type MarkdownIt from 'markdown-it';
import MermaidComponent from './component';
import type { MermaidValue } from './component';
import locales from './locales';
import mermaidMk from './component/markdown';

// const PARSE_HTML = 'parse:html';
// const PASTE_SCHEMA = 'paste:schema';
const PASTE_EACH = 'paste:each';
const MARKDOWN_IT = 'markdown-it';

export interface MermaidOptions {
	hotkey?: any;
	markdown?: boolean;
}

export default class extends Plugin<MermaidOptions> {
	static get pluginName() {
		return 'mermaid';
	}

	init() {
		// console.log('mermaid plugin init');
		const editor = this.editor;
		editor.language.add(locales);

		if (isEngine(editor)) {
			editor.on(MARKDOWN_IT, this.markdownIt);
			editor.on(PASTE_EACH, this.pasteHtml);
		}
	}

	execute(code: string) {
		// console.log('mermaid plugin execute');
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { card } = editor;

		card.insert<MermaidValue>(MermaidComponent.cardName, {
			code,
		});
	}

	hotkey() {
		return this.options.hotkey || '';
	}

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) {
			mermaidMk(mardown, this.editor);
		}
	};

	textList: string[] = [];

	pasteHtml = (node: NodeInterface) => {
		if (node.isText()) {
			this.textList.push(node.text().trim());
		}

		if (
			node.isText() &&
			(node.text().trim() === 'undefined' || node.text().trim() === '```')
		) {
			// console.log('this.textList', this.textList);
			if (
				this.textList.includes('```mermaid') &&
				(this.textList[this.textList.length - 1] === 'undefined' ||
					this.textList[this.textList.length - 1] === '```')
			) {
				node.remove();
				node.parent()?.remove();
				if (this.textList[this.textList.length - 1] === 'undefined') {
					this.textList = [];
				}
			}
		}
	};

	destroy() {
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.off(MARKDOWN_IT, this.markdownIt);
			editor.off(PASTE_EACH, this.pasteHtml);
		}
	}
}
export { MermaidComponent };
