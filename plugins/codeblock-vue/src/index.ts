import {
	Plugin,
	isEngine,
	PluginEntry,
	NodeInterface,
	CARD_KEY,
	isServer,
	CARD_VALUE_KEY,
	Parser,
	SchemaInterface,
	unescape,
	CARD_TYPE_KEY,
} from '@aomao/engine';
import CodeBlockComponent, { CodeBlockEditor } from './component';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};

// 缩写替换
const MODE_ALIAS: { [key: string]: string } = {
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
};

export default class extends Plugin<Options> {
	static get pluginName() {
		return 'codeblock';
	}

	init() {
		this.editor.on('paser:html', node => this.parseHtml(node));
		this.editor.on('paste:schema', schema => this.pasteSchema(schema));
		this.editor.on('paste:each', child => this.pasteHtml(child));
		if (isEngine(this.editor) && this.markdown) {
			this.editor.on('keydown:enter', event => this.markdown(event));
			this.editor.on('paste:each', child => this.pasteMarkdown(child));
		}
	}

	execute(mode: string, value: string) {
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
		const component = card.insert(CodeBlockComponent.cardName, {
			mode,
			code: value,
		});
		setTimeout(() => {
			(component as CodeBlockComponent).focusEditor();
		}, 200);
	}

	hotkey() {
		return this.options.hotkey || '';
	}

	markdown(event: KeyboardEvent) {
		if (!isEngine(this.editor) || this.options.markdown === false) return;
		const { change } = this.editor;
		const range = change.getRange();

		if (!range.collapsed || change.isComposing() || !this.markdown) return;

		const block = this.editor.block.closest(range.startNode);

		if (!this.editor.node.isRootBlock(block)) {
			return;
		}

		const chars = this.editor.block.getLeftText(block);
		const match = /^```(.*){0,20}$/.exec(chars);

		if (match) {
			const modeText = (undefined === match[1]
				? ''
				: match[1]
			).toLowerCase();
			const mode = MODE_ALIAS[modeText] || modeText;

			if (mode || mode === '') {
				event.preventDefault();
				this.editor.block.removeLeftText(block);
				this.editor.command.execute(
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
					'data-syntax': {
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
		if (!isEngine(this.editor)) return;
		if (node.attributes('data-syntax') || node.first()?.name === 'code') {
			let code = new Parser(node, this.editor).toText();
			code = unescape(code);
			this.editor.card.replaceNode(node, 'codeblock', {
				mode: node.attributes('data-syntax') || 'plain',
				code,
			});
			node.remove();
		}
	}

	pasteMarkdown(node: NodeInterface) {
		if (
			!isEngine(this.editor) ||
			!this.markdown ||
			!this.editor.node.isBlock(node)
		)
			return;
		const text = node.text();
		const match = /^```(.*){0,20}$/.exec(text);
		if (!match) return;
		const modeText = (undefined === match[1] ? '' : match[1]).toLowerCase();
		const mode = MODE_ALIAS[modeText] || modeText;
		let code = '';
		let next = node.next();
		while (next) {
			const text = next.text();
			if (/^```/.test(text)) {
				next.remove();
				break;
			}
			const codeText = new Parser(next.html(), this.editor).toText();
			code += unescape(codeText) + '\n';
			const temp = next.next();
			next.remove();
			next = temp;
		}
		if (code.endsWith('\n')) code = code.substr(0, code.length - 1);
		this.editor.card.replaceNode(node, 'codeblock', {
			mode,
			code,
		});
		node.remove();
	}

	parseHtml(root: NodeInterface) {
		const { $ } = this.editor;
		if (isServer) return;

		root.find(`[${CARD_KEY}=${CodeBlockComponent.cardName}`).each(
			cardNode => {
				const node = $(cardNode);
				const card = this.editor.card.find(node) as CodeBlockComponent;
				const value = card?.getValue();
				if (value && value.code) {
					node.empty();
					const codeEditor = new CodeBlockEditor(this.editor, {});

					const content = codeEditor.container.find(
						'.data-codeblock-content',
					);
					content.css({
						border: '1px solid #e8e8e8',
						'max-width': '750px',
					});
					codeEditor.render(value.mode || 'plain', value.code);
					content.addClass('am-engine-view');
					content.hide();
					document.body.appendChild(content[0]);
					content.traverse(node => {
						if (
							node.type === Node.ELEMENT_NODE &&
							(node.get<HTMLElement>()?.classList?.length || 0) >
								0
						) {
							const element = node.get<HTMLElement>()!;
							const style = window.getComputedStyle(element);
							[
								'color',
								'margin',
								'padding',
								'background',
							].forEach(attr => {
								(element.style as any)[
									attr
								] = style.getPropertyValue(attr);
							});
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
				} else node.remove();
			},
		);
	}
}
export { CodeBlockComponent };
