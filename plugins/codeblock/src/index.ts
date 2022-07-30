import {
	$,
	Plugin,
	isEngine,
	NodeInterface,
	CARD_KEY,
	CARD_VALUE_KEY,
	Parser,
	SchemaInterface,
	unescape,
	CARD_TYPE_KEY,
	READY_CARD_KEY,
	decodeCardValue,
	VIEW_CLASS_NAME,
	SchemaBlock,
} from '@aomao/engine';
import type MarkdownIt from 'markdown-it';
import CodeBlockComponent, {
	CodeBlockEditor,
	CodeBlockValue,
} from './component';
import locales from './locales';
import { CodeBlockOptions } from './types';

const DATA_SYNTAX = 'data-syntax';
const PARSE_HTML = 'parse:html';
const PASTE_SCHEMA = 'paste:schema';
const PASTE_EACH = 'paste:each';
const MARKDOWN_IT = 'markdown-it';
export default class<
	T extends CodeBlockOptions = CodeBlockOptions,
> extends Plugin<T> {
	static get pluginName() {
		return 'codeblock';
	}

	init() {
		const editor = this.editor;
		editor.language.add(locales);
		editor.on(PARSE_HTML, this.parseHtml);
		editor.on(PASTE_SCHEMA, this.pasteSchema);
		editor.on(PASTE_EACH, this.pasteHtml);
		if (isEngine(editor)) {
			editor.on(MARKDOWN_IT, this.markdownIt);
		}
	}

	execute(mode: string, value: string) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { card } = editor;
		if (!value) {
			const data = editor.getSelectionData();
			if (data) value = data.text;
		}
		const component = card.insert<
			CodeBlockValue,
			CodeBlockComponent<CodeBlockValue>
		>(CodeBlockComponent.cardName, {
			mode,
			code: value,
		});
		setTimeout(() => {
			component.focusEditor();
		}, 200);
	}

	hotkey() {
		return this.options.hotkey || '';
	}

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) {
			mardown.enable('code');
			mardown.enable('fence');
		}
	};

	pasteSchema = (schema: SchemaInterface) => {
		schema.add([
			{
				type: 'block',
				name: 'pre',
				attributes: {
					[DATA_SYNTAX]: '*',
					class: '*',
					language: '*',
					'auto-wrap': '*',
				},
			},
			{
				type: 'block',
				name: 'code',
				attributes: {
					[DATA_SYNTAX]: {
						required: true,
						value: '*',
					},
					'auto-wrap': '*',
				},
			},
			{
				type: 'block',
				name: 'code',
				attributes: {
					language: {
						required: true,
						value: '*',
					},
				},
			},
			{
				type: 'block',
				name: 'code',
				attributes: {
					class: {
						required: true,
						value: (val) => {
							return val.includes('language');
						},
					},
				},
				allowIn: ['pre', '$root'],
			} as SchemaBlock,
			{
				type: 'block',
				name: 'div',
				attributes: {
					[DATA_SYNTAX]: {
						required: true,
						value: '*',
					},
					'auto-wrap': '*',
				},
			},
		]);
	};

	pasteHtml = (node: NodeInterface) => {
		const editor = this.editor;
		if (!isEngine(editor) || node.isText()) return;
		if (
			node.get<HTMLElement>()?.hasAttribute(DATA_SYNTAX) ||
			node.name === 'pre'
		) {
			let syntax: string | undefined = node.attributes(DATA_SYNTAX);
			if (!syntax) {
				const getSyntaxForClass = (node: NodeInterface) => {
					const classList = node?.get<HTMLElement>()?.classList;
					if (!classList) return;
					for (let i = 0; i < classList.length; i++) {
						const className = classList.item(i);
						if (className && className.startsWith('language-')) {
							const classArray = className.split('-');
							classArray.shift();
							return classArray.join('-');
						}
					}
					return undefined;
				};
				if (node.name === 'pre') {
					syntax = node.attributes('language');
					if (!syntax) {
						syntax = getSyntaxForClass(node);
					}
				}
				const code = node.find('code');
				if (!syntax && code.length > 0) {
					syntax =
						code.attributes(DATA_SYNTAX) ||
						code.attributes('language');
					if (!syntax) {
						syntax = getSyntaxForClass(code);
					}
				}
			}
			let code = new Parser(node, editor).toText(
				undefined,
				undefined,
				false,
			);
			code = unescape(code.replace(/\u200b/g, ''));
			if (code.endsWith('\n')) {
				code = code.slice(0, -1);
			}
			editor.card.replaceNode<CodeBlockValue>(node, 'codeblock', {
				mode: syntax || 'plain',
				code,
				autoWrap: node.attributes('auto-wrap') === 'true',
			});
			node.remove();
			return false;
		}
		return true;
	};

	parseHtml = (
		root: NodeInterface,
		callback?: (
			node: NodeInterface,
			value: CodeBlockValue,
		) => NodeInterface,
	) => {
		const results: NodeInterface[] = [];
		const synatxMap = {};
		CodeBlockComponent.getModes().forEach((item) => {
			synatxMap[item.value] = item.syntax;
		});
		const editor = this.editor;
		const codeEditor = new CodeBlockEditor(editor, {
			synatxMap,
			styleMap: this.options.styleMap,
		});
		const contentClassName = 'data-codeblock-content';
		const content = codeEditor.container.find(`.${contentClassName}`);
		content.css({
			border: '1px solid #e8e8e8',
			padding: '8px',
		});
		content.addClass(VIEW_CLASS_NAME);
		content.css('background', '#f9f9f9');
		root.find(
			`[${CARD_KEY}="${CodeBlockComponent.cardName}"],[${READY_CARD_KEY}="${CodeBlockComponent.cardName}"]`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = editor.card.find(
				node,
			) as CodeBlockComponent<CodeBlockValue>;
			const value =
				card?.getValue() ||
				decodeCardValue(node.attributes(CARD_VALUE_KEY));
			if (value) {
				node.empty();
				content.empty();
				codeEditor.render(value.mode || 'plain', value.code || '');
				const newContent = content.clone(true);
				node.append(newContent);
				node.removeAttributes(CARD_KEY);
				node.removeAttributes(CARD_TYPE_KEY);
				node.removeAttributes(CARD_VALUE_KEY);
				node.attributes(DATA_SYNTAX, value.mode || 'plain');
				node.attributes('auto-wrap', value.autoWrap ? 'true' : 'false');
				newContent
					.removeClass(VIEW_CLASS_NAME)
					.removeClass(contentClassName);
				let newNode = node;
				if (callback) {
					newNode = callback(node, value);
					node.replaceWith(newNode);
				}
				results.push(newNode);
			} else node.remove();
		});
		codeEditor.destroy();
		return results;
	};

	destroy() {
		const editor = this.editor;
		editor.off(PARSE_HTML, this.parseHtml);
		editor.off(PASTE_SCHEMA, this.pasteSchema);
		editor.off(PASTE_EACH, this.pasteHtml);
		if (isEngine(editor)) {
			editor.off(MARKDOWN_IT, this.markdownIt);
		}
	}
}
export { CodeBlockComponent };
export type { CodeBlockValue };
