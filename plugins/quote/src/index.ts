import {
	$,
	isEngine,
	NodeInterface,
	BlockPlugin,
	PluginOptions,
} from '@aomao/engine';
import type MarkdownIt from 'markdown-it';
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
		this.editor.on('parse:html', this.parseHtml);
		if (isEngine(this.editor)) {
			this.editor.on('paste:each', this.pasteHtml);
			this.editor.on('keydown:backspace', this.onBackspace);
			this.editor.on('keydown:enter', this.onEnter);
			this.editor.on('paste:each', this.pasteEach);
			this.editor.on('markdown-it', this.markdownIt);
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

	pasteEach = (node: NodeInterface) => {
		if (node.isText() && node.parent()?.name === this.tagName) {
			this.editor.node.wrap(node, $('<p></p>'));
		}
	};

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) {
			mardown.enable('blockquote');
		}
	};

	onBackspace = (event: KeyboardEvent) => {
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
	};

	onEnter = (event: KeyboardEvent) => {
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
	};

	parseHtml = (root: NodeInterface) => {
		root.find('blockquote').css({
			'margin-top': '5px',
			'margin-bottom': '5px',
			'padding-left': '1em',
			'margin-left': '0px',
			'border-left': '3px solid #eee',
			opacity: '0.6',
		});
	};

	pasteHtml = (node: NodeInterface) => {
		if (!isEngine(this.editor)) return;
		if (node.name === this.tagName) {
			const nodeApi = this.editor.node;
			node.css('padding-left', '');
			node.css('text-indent', '');
			if (nodeApi.isEmpty(node)) {
				node.empty().append('<p><br/></p>');
			}
			this.editor.normalize(node);
			return false;
		}
		return true;
	};

	destroy() {
		this.editor.off('parse:html', this.parseHtml);
		if (isEngine(this.editor)) {
			this.editor.off('paste:each', this.pasteHtml);
			this.editor.off('keydown:backspace', this.onBackspace);
			this.editor.off('keydown:enter', this.onEnter);
			this.editor.off('paste:each', this.pasteEach);
			this.editor.off('markdown-it', this.markdownIt);
		}
	}
}
