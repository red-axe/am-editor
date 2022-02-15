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
} from '@aomao/engine';
import CodeBlockComponent, {
	CodeBlockEditor,
	CodeBlockValue,
} from './component';
import locales from './locales';

export interface CodeBlockOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
	alias?: Record<string, string>;
}

// 缩写替换
const MODE_ALIAS = {
	text: 'plain',
	sh: 'bash',
	ts: 'typescript',
	js: 'javascript',
	py: 'python',
	puml: 'plantuml',
	uml: 'plantuml',
	vb: 'basic',
	md: 'markdown',
	'c++': 'cpp',
	'c#': 'csharp',
};

export default class<
	T extends CodeBlockOptions = CodeBlockOptions,
> extends Plugin<T> {
	static get pluginName() {
		return 'codeblock';
	}

	init() {
		this.editor.language.add(locales);
		this.editor.on('parse:html', (node) => this.parseHtml(node));
		this.editor.on('paste:schema', (schema) => this.pasteSchema(schema));
		this.editor.on('paste:each', (child) => this.pasteHtml(child));
		if (isEngine(this.editor) && this.markdown) {
			this.editor.on('keydown:enter', (event) => this.markdown(event));
			this.editor.on(
				'paste:markdown-check',
				(child) => !this.checkMarkdown(child)?.match,
			);
			this.editor.on('paste:markdown-before', (child) =>
				this.pasteMarkdown(child),
			);
		}
	}

	execute(mode: string, value: string) {
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
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

	markdown(event: KeyboardEvent) {
		if (!isEngine(this.editor) || this.options.markdown === false) return;
		const { change, node, command } = this.editor;
		const blockApi = this.editor.block;
		const range = change.range.get();

		if (!range.collapsed || change.isComposing() || !this.markdown) return;

		const block = blockApi.closest(range.startNode);

		if (!node.isRootBlock(block)) {
			return;
		}

		const chars = blockApi.getLeftText(block);
		const match = /^`{3,}(.*){0,20}$/.exec(chars);

		if (match) {
			const modeText = (undefined === match[1] ? '' : match[1])
				.trim()
				.toLowerCase();
			const alias = { ...(this.options.alias || {}), ...MODE_ALIAS };
			const mode = alias[modeText] || modeText;

			if (mode || mode === '') {
				event.preventDefault();
				blockApi.removeLeftText(block);
				command.execute(
					(this.constructor as PluginEntry).pluginName,
					mode,
				);
				block.remove();
				return false;
			}
		}
		return;
	}

	pasteSchema(schema: SchemaInterface) {
		schema.add([
			{
				type: 'block',
				name: 'pre',
				attributes: {
					'data-syntax': '*',
					class: '*',
					language: '*',
				},
			},
			{
				type: 'block',
				name: 'code',
				attributes: {
					'data-syntax': {
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
						value: '*',
					},
				},
			},
			{
				type: 'block',
				name: 'div',
				attributes: {
					'data-syntax': {
						required: true,
						value: '*',
					},
				},
			},
		]);
	}

	pasteHtml(node: NodeInterface) {
		if (!isEngine(this.editor) || node.isText()) return;
		if (
			node.get<HTMLElement>()?.hasAttribute('data-syntax') ||
			node.name === 'pre'
		) {
			let syntax: string | undefined = node.attributes('data-syntax');
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
						code.attributes('data-syntax') ||
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
	}

	checkMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown || !node.isText()) return;
		const text = node.text();
		if (!text) return;
		const reg = /`{3,}/;
		const match = reg.exec(text);
		return {
			reg,
			match,
		};
	}

	pasteMarkdown(node: NodeInterface) {
		const result = this.checkMarkdown(node);
		if (!result) return;
		let { match } = result;
		if (!match) return;
		const { card } = this.editor;

		let newText = '';
		const nameMaps = {};
		CodeBlockComponent.getModes().forEach((item) => {
			nameMaps[item.value] = item.name;
		});
		const langs = Object.keys(nameMaps)
			.concat(Object.keys(MODE_ALIAS))
			.concat(Object.keys(this.options.alias || {}))
			.sort((a, b) => (a.length > b.length ? -1 : 1));

		const createCodeblock = (
			nodes: Array<string>,
			mode: string = 'text',
		) => {
			//获取中间字符
			const codeText = nodes.join('\n');
			let code = unescape(codeText);

			if (code.endsWith('\n')) code = code.substr(0, code.length - 2);
			const tempNode = $('<div></div>');
			const carNode = card.replaceNode<CodeBlockValue>(
				tempNode,
				'codeblock',
				{
					mode,
					code,
				},
			);
			tempNode.remove();

			return carNode.get<Element>()?.outerHTML;
		};

		const rows = node.text().split(/\n|\r\n/);
		let nodes: Array<string> = [];
		let isCode: boolean = false;
		let mode = 'text';
		rows.forEach((row) => {
			let match = /^(.*)`{3,}(\s)*$/.exec(row);
			if (match && isCode) {
				nodes.push(match[1]);
				newText += createCodeblock(nodes, mode) + '\n';
				mode = 'text';
				isCode = false;
				nodes = [];
				return;
			}
			match = /^`{3,}(.*)/.exec(row);
			if (match) {
				isCode = true;
				mode =
					langs.find(
						(key) =>
							match &&
							(match[1] || '')
								.trim()
								.toLowerCase()
								.indexOf(key) === 0,
					) || 'text';
				const alias = { ...(this.options.alias || {}), ...MODE_ALIAS };
				mode = alias[mode] || mode;
			} else if (isCode) {
				nodes.push(row);
			} else {
				newText += row + '\n';
			}
		});
		if (nodes.length > 0) {
			newText += createCodeblock(nodes, mode) + '\n';
		}
		node.text(newText);
	}

	parseHtml(
		root: NodeInterface,
		callback?: (
			node: NodeInterface,
			value: CodeBlockValue,
		) => NodeInterface,
	) {
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
				const synatxMap = {};
				CodeBlockComponent.getModes().forEach((item) => {
					synatxMap[item.value] = item.syntax;
				});
				const codeEditor = new CodeBlockEditor(this.editor, {
					synatxMap,
				});

				const content = codeEditor.container.find(
					'.data-codeblock-content',
				);
				content.css({
					border: '1px solid #e8e8e8',
					'max-width': '750px',
				});
				codeEditor.render(value.mode || 'plain', value.code || '');
				content.addClass('am-engine-view');
				content.hide();
				document.body.appendChild(content[0]);
				content.traverse((node) => {
					if (
						node.type === Node.ELEMENT_NODE &&
						(node.get<HTMLElement>()?.classList?.length || 0) > 0
					) {
						const element = node.get<HTMLElement>()!;
						const style = window.getComputedStyle(element);
						['color', 'margin', 'padding', 'background'].forEach(
							(attr) => {
								element.style[attr] =
									style.getPropertyValue(attr);
							},
						);
					}
				});
				content.show();
				content.css('background', '#f9f9f9');
				node.append(content);
				node.removeAttributes(CARD_KEY);
				node.removeAttributes(CARD_TYPE_KEY);
				node.removeAttributes(CARD_VALUE_KEY);
				node.attributes('data-syntax', value.mode || 'plain');
				content.removeClass('am-engine-view');
				if (callback) {
					node.replaceWith(callback(node, value));
				}
			} else node.remove();
		});
	}
}
export { CodeBlockComponent };
export type { CodeBlockValue };
