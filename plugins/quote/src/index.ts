import {
	isEngine,
	NodeInterface,
	BlockPlugin,
	PluginEntry,
} from '@aomao/engine';
import './index.css';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};
export default class extends BlockPlugin<Options> {
	tagName: string = 'blockquote';

	canMerge = true;

	static get pluginName() {
		return 'quote';
	}

	init() {
		super.init();
		this.editor.on('paser:html', node => this.parseHtml(node));
		if (isEngine(this.editor)) {
			this.editor.on('keydow:backspace', event =>
				this.onBackspace(event),
			);
			this.editor.on('keydow:enter', event => this.onEnter(event));
			this.editor.on('paste:each', child => this.pasteMarkdown(child));
		}
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { change, block, node } = this.editor;
		if (!this.queryState()) {
			block.wrap(`<${this.tagName} />`);
		} else {
			const range = change.getRange();
			const blockquote = change.blocks[0].closest(this.tagName);
			const selection = range.createSelection();
			node.unwrap(blockquote);
			selection.move();
			change.select(range);
			return;
		}
	}

	queryState() {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const blocks = change.blocks;
		if (blocks.length === 0) {
			return false;
		}
		const blockquote = blocks[0].closest(this.tagName);
		return this.isSelf(blockquote);
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+u';
	}

	//设置markdown
	markdown(event: KeyboardEvent, text: string, block: NodeInterface) {
		if (this.options.markdown === false || !isEngine(this.editor)) return;
		const plugins = this.editor.block.findPlugin(block);
		// fix: 列表、引用等 markdown 快捷方式不应该在标题内生效
		if (
			block.name !== 'p' ||
			plugins.find(
				plugin =>
					(plugin.constructor as PluginEntry).pluginName ===
					'heading',
			)
		) {
			return;
		}
		if (['>'].indexOf(text) < 0) return;
		event.preventDefault();
		this.editor.block.removeLeftText(block);
		if (this.editor.node.isEmpty(block)) {
			block.empty();
			block.append('<br />');
		}
		this.editor.command.execute(
			(this.constructor as PluginEntry).pluginName,
		);
		return false;
	}

	pasteMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown) return;
		if (
			(node.name === 'p' && this.editor.node.isBlock(node)) ||
			(node.parent()?.isFragment && node.isText())
		) {
			const { $ } = this.editor;
			const reg = /^([>]{1,})/;
			const convertToNode = (node: NodeInterface) => {
				const textNode = node.isText() ? node : node.first();
				if (!textNode?.isText()) return;
				const text = textNode.text();
				const match = reg.exec(text);
				if (!match) return;

				const codeLength = match[1].length;
				const newTextNode = $(
					textNode
						.get<Text>()!
						.splitText(
							/^\s+/.test(text.substr(codeLength))
								? codeLength + 1
								: codeLength,
						),
				);
				let quoteNode = $(`<${this.tagName} />`);
				if (!node.isText()) {
					textNode.remove();
					node.get<Element>()?.normalize();
					node.children().each(child => {
						if (child.nodeType === Node.TEXT_NODE) {
							const pNode = $('<p />');
							pNode.append(child);
							quoteNode.append(pNode);
						} else quoteNode.append(child);
					});
				} else {
					const pNode = $('<p />');
					pNode.append(newTextNode);
					quoteNode.append(pNode);
				}
				return quoteNode;
			};
			const startQuote = convertToNode(node);
			if (!startQuote) return;
			const nodes = [];
			nodes.push(startQuote);

			if (!node.isText()) {
				let next = node.next();
				while (next) {
					const quoteNode = convertToNode(next);
					if (!quoteNode) break;
					nodes.push(quoteNode);
					const temp = next.next();
					next.remove();
					next = temp;
				}
			}
			let prevNode = node;
			nodes.forEach(quoteNode => {
				prevNode.after(quoteNode);
				quoteNode.allChildren().forEach(child => {
					if (child) this.editor.trigger('paste:each', $(child));
				});
				prevNode = quoteNode;
			});
			node.remove();
		}
	}

	onBackspace(event: KeyboardEvent) {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const range = change.getRange();
		if (!this.editor.block.isFirstOffset(range, 'start')) return;
		const block = this.editor.block.closest(range.startNode);
		const parentBlock = block.parent();

		if (
			parentBlock &&
			parentBlock.name === 'blockquote' &&
			this.editor.node.isRootBlock(block)
		) {
			event.preventDefault();
			if (block.prevElement()) {
				change.mergeAfterDeletePrevNode(block);
			} else {
				this.editor.block.unwrap('<blockquote />');
			}
			return false;
		}
		return;
	}

	onEnter(event: KeyboardEvent) {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const range = change.getRange();
		// 选区选中最后的节点
		const block = this.editor.block.closest(range.endNode);

		const parent = block.parent();
		if (
			parent?.name === this.tagName &&
			'p' === block.name &&
			block.nextElement()
		) {
			event.preventDefault();
			this.editor.block.insertOrSplit(range, block);
			return false;
		}
		return;
	}

	parseHtml(root: NodeInterface) {
		root.find('blockquote').css({
			'margin-top': '5px',
			'margin-bottom': '5px',
			'padding-left': '1em',
			'margin-left': '0px',
			'border-left': '3px solid #eee',
			opacity: '0.6',
		});
	}
}
