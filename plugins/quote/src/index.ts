import {
	$,
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
			this.editor.on('paste:markdown', child =>
				this.pasteMarkdown(child),
			);
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

	pasteMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown || !node.isText()) return;

		const text = node.text();
		if (!text) return;

		const reg = /(^|\r\n|\n)([>]{1,})/;
		let match = reg.exec(text);
		if (!match) return;

		let newText = '';
		const rows = text.split(/\n|\r\n/);
		let nodes: Array<string> = [];
		rows.forEach(row => {
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
		const range = change.getRange();
		const blockApi = this.editor.block;
		if (!blockApi.isFirstOffset(range, 'start')) return;
		const block = blockApi.closest(range.startNode);
		const parentBlock = block.parent();

		if (
			parentBlock &&
			parentBlock.name === 'blockquote' &&
			node.isRootBlock(block)
		) {
			event.preventDefault();
			if (block.prevElement()) {
				change.mergeAfterDeletePrevNode(block);
			} else {
				blockApi.unwrap('<blockquote />');
			}
			return false;
		}
		return;
	}

	onEnter(event: KeyboardEvent) {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const blockApi = this.editor.block;
		const range = change.getRange();
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
}
