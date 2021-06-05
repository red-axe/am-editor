import {
	$,
	NodeInterface,
	ListPlugin,
	isEngine,
	SchemaBlock,
	PluginEntry,
} from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};

export default class extends ListPlugin<Options> {
	tagName = 'ol';

	attributes = {
		start: '@var0',
		'data-indent': '@var1',
	};

	variable = {
		'@var0': '@number',
		'@var1': '@number',
	};

	allowIn = ['blockquote', '$root'];

	static get pluginName() {
		return 'orderedlist';
	}

	init() {
		super.init();
		if (isEngine(this.editor)) {
			this.editor.on('paste:markdown', child =>
				this.pasteMarkdown(child),
			);
		}
	}

	schema(): Array<SchemaBlock> {
		const scheam = super.schema() as SchemaBlock;
		return [
			scheam,
			{
				name: 'ol',
				type: 'block',
			},
			{
				name: 'li',
				type: 'block',
				allowIn: ['ol'],
			},
		];
	}

	isCurrent(node: NodeInterface) {
		const { list } = this.editor!;
		return !node.hasClass(list.CUSTOMZIE_UL_CLASS) && node.name === 'ol';
	}

	execute(start: number = 1) {
		if (!isEngine(this.editor)) return;
		const { change, list, block } = this.editor;
		list.split();
		const range = change.getRange();
		const activeBlocks = block.findBlocks(range);
		if (activeBlocks) {
			const selection = range.createSelection();

			if (list.getPluginNameByNodes(activeBlocks) === 'orderedlist') {
				list.unwrap(activeBlocks);
			} else {
				list.toNormal(activeBlocks, 'ol', start);
			}
			selection.move();
			change.select(range);
			list.merge();
		}
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+7';
	}

	//设置markdown
	markdown(event: KeyboardEvent, text: string, block: NodeInterface) {
		if (!isEngine(this.editor) || this.options.markdown === false) return;
		if (block.name !== 'p') {
			return;
		}

		if (!/^\d{1,9}\.$/.test(text)) return;
		event.preventDefault();
		this.editor.block.removeLeftText(block);
		if (this.editor.node.isEmpty(block)) {
			block.empty();
			block.append('<br />');
		}
		this.editor.command.execute(
			(this.constructor as PluginEntry).pluginName,
			parseInt(text.replace(/\./, ''), 10),
		);
		return false;
	}

	pasteMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown || !node.isText()) return;

		const text = node.text();
		if (!text) return;

		const reg = /(^|\r\n|\n)(\d{1,9}\.)/;
		let match = reg.exec(text);
		if (!match) return;

		const { list } = this.editor;

		const createList = (nodes: Array<string>, start?: number) => {
			const listNode = $(
				`<${this.tagName} start="${start || 1}">${nodes.join('')}</${
					this.tagName
				}>`,
			);
			list.addBr(listNode);
			return listNode.get<Element>()?.outerHTML;
		};

		let newText = '';
		const rows = text.split(/\n|\r\n/);
		let nodes: Array<string> = [];
		let start: number | undefined = undefined;
		rows.forEach(row => {
			const match = /^(\d{1,9}\.)/.exec(row);
			if (match) {
				const codeLength = match[1].length;
				if (start === undefined)
					start = parseInt(match[1].substr(0, codeLength - 1), 10);
				const content = row.substr(
					/^\s+/.test(row.substr(codeLength))
						? codeLength + 1
						: codeLength,
				);
				nodes.push(`<li>${content}</li>`);
			} else if (nodes.length > 0) {
				newText += createList(nodes, start) + '\n' + row + '\n';
				nodes = [];
				start = undefined;
			} else {
				newText += row + '\n';
			}
		});
		if (nodes.length > 0) {
			newText += createList(nodes, start) + '\n';
		}
		node.text(newText);
	}
}
