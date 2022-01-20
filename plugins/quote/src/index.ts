import {
	$,
	isEngine,
	NodeInterface,
	BlockPlugin,
	PluginEntry,
	PluginOptions,
} from '@aomao/engine';
import './index.css';

export interface QuoteOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}
export default class<
	T extends QuoteOptions = QuoteOptions,
> extends BlockPlugin<T> {
	tagName: string = 'blockquote';

	canMerge = true;

	static get pluginName() {
		return 'quote';
	}

	init() {
		super.init();
		this.editor.schema.addAllowIn(this.tagName);
		this.editor.on('parse:html', (node) => this.parseHtml(node));
		if (isEngine(this.editor)) {
			this.editor.on('paste:each', (child) => this.pasteHtml(child));
			this.editor.on('keydown:backspace', (event) =>
				this.onBackspace(event),
			);
			this.editor.on('keydown:enter', (event) => this.onEnter(event));
			this.editor.on('paste:markdown', (child) =>
				this.pasteMarkdown(child),
			);
			this.editor.on('paste:each', (child) => this.pasteEach(child));
			this.editor.on(
				'paste:markdown-check',
				(child) => !this.checkMarkdown(child)?.match,
			);
		}
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { change, block, node } = this.editor;
		if (!this.queryState()) {
			block.wrap(`<${this.tagName} />`);
		} else {
			const range = change.range.get();
			const blockquote = change.blocks[0].closest(this.tagName);
			const selection = range.createSelection();
			node.unwrap(blockquote);
			selection.move();
			change.range.select(range);
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
		const { node, command } = this.editor;
		const blockApi = this.editor.block;
		const plugin = blockApi.findPlugin(block);
		// fix: 列表、引用等 markdown 快捷方式不应该在标题内生效
		if (
			block.name !== 'p' ||
			(plugin &&
				(plugin.constructor as PluginEntry).pluginName === 'heading')
		) {
			return;
		}
		if (['>'].indexOf(text) < 0) return;
		event.preventDefault();
		blockApi.removeLeftText(block);
		if (node.isEmpty(block)) {
			block.empty();
			block.append('<br />');
		}
		command.execute((this.constructor as PluginEntry).pluginName);
		return false;
	}

	pasteEach(node: NodeInterface) {
		if (node.isText() && node.parent()?.name === this.tagName) {
			this.editor.node.wrap(node, $('<p></p>'));
		}
	}

	checkMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown || !node.isText()) return;

		const text = node.text();
		if (!text) return;

		const reg = /(^|\r\n|\n)([>]{1,})/;
		const match = reg.exec(text);
		return {
			reg,
			match,
		};
	}

	pasteMarkdown(node: NodeInterface) {
		const result = this.checkMarkdown(node);
		if (!result) return;
		const { match } = result;
		if (!match) return;

		const text = node.text();
		let newText = match[1] || '';
		const rows = text.split(/\n|\r\n/);
		let nodes: Array<string> = [];
		rows.forEach((row) => {
			const match = /^([>]{1,})/.exec(row);
			if (match) {
				const codeLength = match[1].length;
				const content = row.substr(
					/^\s+/.test(row.substr(codeLength))
						? codeLength + 1
						: codeLength,
				);
				const container = $('<div></div>');
				container.html(content);
				const childNodes = container.children();
				if (
					childNodes.length > 1 ||
					(childNodes.length === 1 &&
						!this.editor.node.isBlock(childNodes[0]) &&
						!childNodes.eq(0)?.isBlockCard())
				) {
					nodes.push(`<p>${content}</p>`);
				} else {
					nodes.push(content);
				}
			} else if (nodes.length > 0) {
				newText +=
					`<${this.tagName}>${nodes.join('')}</${this.tagName}>` +
					'\n' +
					row +
					'\n';
				nodes = [];
			} else {
				newText += row + '\n';
			}
		});
		if (nodes.length > 0) {
			newText +=
				`<${this.tagName}>${nodes.join('')}</${this.tagName}>` + '\n';
		}
		node.text(newText);
	}

	onBackspace(event: KeyboardEvent) {
		if (!isEngine(this.editor)) return;
		const { change, node } = this.editor;
		const range = change.range.get();
		const blockApi = this.editor.block;

		const inEnd = blockApi.isLastOffset(range, 'end');
		if (inEnd && !range.collapsed) {
			const startBlock = blockApi.closest(range.startNode);
			const endBlock = blockApi.closest(range.endNode);
			const startParentBlock = startBlock.parent();
			const endParentBlock = endBlock.parent();
			if (
				startParentBlock &&
				endParentBlock &&
				endParentBlock.name === 'blockquote' &&
				!startParentBlock.equal(endParentBlock)
			) {
				endParentBlock.remove();
				return;
			}
		}

		const inFirst = blockApi.isFirstOffset(range, 'start');
		if (!inFirst) return;
		const block = blockApi.closest(range.startNode);
		const parentBlock = block.parent();

		if (
			parentBlock &&
			parentBlock.name === 'blockquote' &&
			node.isBlock(block)
		) {
			event.preventDefault();
			if (block.prevElement()) {
				change.mergeAfterDelete(block);
			} else {
				if (node.isEmpty(parentBlock)) {
					const newBlock = $('<p><br/></p>');
					parentBlock.replaceWith(newBlock);
					range.select(newBlock, true).collapse(false);
					change.apply(range);
				} else {
					blockApi.unwrap('<blockquote />');
				}
			}
			return false;
		}
		return;
	}

	onEnter(event: KeyboardEvent) {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const blockApi = this.editor.block;
		const range = change.range.get();
		// 选区选中最后的节点
		const block = blockApi.closest(range.endNode);

		const parent = block.parent();
		if (
			parent?.name === this.tagName &&
			'p' === block.name &&
			block.nextElement()
		) {
			event.preventDefault();
			blockApi.insertOrSplit(range, block);
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

	pasteHtml(node: NodeInterface) {
		if (!isEngine(this.editor)) return;
		if (node.name === this.tagName) {
			const nodeApi = this.editor.node;
			node.css('padding-left', '');
			node.css('text-indent', '');
			if (nodeApi.isEmpty(node)) {
				node.append('<p><br/></p>');
			}
			this.editor.normalize(node);
			return false;
		}
		return true;
	}
}
