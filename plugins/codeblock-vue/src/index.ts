import {
	$,
	Plugin,
	isEngine,
	PluginEntry,
	NodeInterface,
	CARD_KEY,
	CARD_VALUE_KEY,
	Parser,
	SchemaInterface,
	unescape,
	CARD_TYPE_KEY,
	PluginOptions,
	READY_CARD_KEY,
	decodeCardValue,
	VIEW_CLASS_NAME,
	SchemaBlock,
} from '@aomao/engine';
import type MarkdownIt from 'markdown-it';
import Token from 'markdown-it/lib/token';
import CodeBlockComponent, {
	CodeBlockEditor,
	CodeBlockValue,
} from './component';
import locales from './locales';

export interface CodeBlockOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
	alias?: Record<string, string>;
	styleMap?: Record<string, string>;
}

const DATA_SYNTAX = 'data-syntax';

export default class<
	T extends CodeBlockOptions = CodeBlockOptions,
> extends Plugin<T> {
	static get pluginName() {
		return 'codeblock';
	}

	init() {
		this.editor.language.add(locales);
		this.editor.on('parse:html', this.parseHtml);
		this.editor.on('paste:schema', this.pasteSchema);
		this.editor.on('paste:each', this.pasteHtml);
		if (isEngine(this.editor)) {
			this.editor.on('markdown-it', this.markdownIt);
		}
	}

	execute(mode: string, value: string) {
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
		if (!value) {
			const data = this.editor.getSelectionData();
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
				},
			},
		]);
	};

	pasteHtml = (node: NodeInterface) => {
		if (!isEngine(this.editor) || node.isText()) return;
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
			let code = new Parser(node, this.editor).toText(
				undefined,
				undefined,
				false,
			);
			code = unescape(code.replace(/\u200b/g, ''));
			this.editor.card.replaceNode<CodeBlockValue>(node, 'codeblock', {
				mode: syntax || 'plain',
				code,
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
		const codeEditor = new CodeBlockEditor(this.editor, {
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
			const card = this.editor.card.find(
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
		this.editor.off('parse:html', this.parseHtml);
		this.editor.off('paste:schema', this.pasteSchema);
		this.editor.off('paste:each', this.pasteHtml);
		if (isEngine(this.editor)) {
			this.editor.off('markdown-it', this.markdownIt);
		}
	}
}
export { CodeBlockComponent };
export type { CodeBlockValue };
