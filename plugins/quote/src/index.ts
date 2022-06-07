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

const PARSE_HTML = 'parse:html';
const KEYDOWN_BACKSPACE = 'keydown:backspace';
const KEYDOWN_ENTER = 'keydown:enter';
const PASTE_EACH = 'paste:each';
const MARKDOWN_IT = 'markdown-it';
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
		const editor = this.editor;
		editor.schema.addAllowIn(this.tagName);
		editor.on(PARSE_HTML, this.parseHtml);
		if (isEngine(editor)) {
			editor.on(PASTE_EACH, this.pasteHtml);
			editor.on(KEYDOWN_BACKSPACE, this.onBackspace);
			editor.on(KEYDOWN_ENTER, this.onEnter);
			editor.on(PASTE_EACH, this.pasteEach);
			editor.on(MARKDOWN_IT, this.markdownIt);
		}
	}

	execute() {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, block, node } = editor;
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
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change } = editor;
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
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, node } = editor;
		const range = change.range.get();
		const blockApi = editor.block;

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
		if (!range.collapsed) return;
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
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change } = editor;
		const blockApi = editor.block;
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
		const editor = this.editor;
		if (!isEngine(editor)) return;
		if (node.name === this.tagName) {
			const nodeApi = editor.node;
			node.css('padding-left', '');
			node.css('text-indent', '');
			if (nodeApi.isEmpty(node)) {
				node.empty().append('<p><br/></p>');
			}
			editor.normalize(node);
			return false;
		}
		return true;
	};

	destroy() {
		const editor = this.editor;
		editor.off(PARSE_HTML, this.parseHtml);
		if (isEngine(editor)) {
			editor.off(PASTE_EACH, this.pasteHtml);
			editor.off(KEYDOWN_BACKSPACE, this.onBackspace);
			editor.off(KEYDOWN_ENTER, this.onEnter);
			editor.off(PASTE_EACH, this.pasteEach);
			editor.off(MARKDOWN_IT, this.markdownIt);
		}
	}
}
