import {
	$,
	NodeInterface,
	ListPlugin,
	isEngine,
	SchemaBlock,
	PluginEntry,
	PluginOptions,
} from '@aomao/engine';

export interface OrderedListOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}

export default class<
	T extends OrderedListOptions = OrderedListOptions,
> extends ListPlugin<T> {
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
			this.editor.on('paste:markdown', (child) =>
				this.pasteMarkdown(child),
			);
			// 有序列表原生结构和markdown结构一样，不检测，以免太多误报
			// this.editor.on(
			// 	'paste:markdown-check',
			// 	(child) => !this.checkMarkdown(child)?.match,
			// );
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
		const range = change.range.get();
		const activeBlocks = block.findBlocks(range);
		if (activeBlocks) {
			const selection = range.createSelection();

			if (list.getPluginNameByNodes(activeBlocks) === 'orderedlist') {
				list.unwrap(activeBlocks);
			} else {
				list.toNormal(activeBlocks, 'ol', start);
			}
			selection.move();
			change.range.select(range);
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

	checkMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown || !node.isText()) return;

		const text = node.text();
		if (!text) return;

		const reg = /(^|\r\n|\n)\s*(\d{1,9}\.\s+)/;
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

		const { list } = this.editor;

		const createList = (
			nodes: Array<string>,
			start?: number,
			indent?: number,
		) => {
			const listNode = $(
				`<${this.tagName}>${nodes.join('')}</${this.tagName}>`,
			);
			if (start) {
				listNode.attributes('start', start);
			}
			if (indent) {
				listNode.attributes(this.editor.list.INDENT_KEY, indent);
			}
			list.addBr(listNode);
			return listNode.get<Element>()?.outerHTML;
		};
		const text = node.text();
		let newText = match[1] || '';
		const rows = text.split(/\n|\r\n/);
		let nodes: Array<string> = [];
		let indent = 0;
		let start: number | undefined = undefined;
		rows.forEach((row) => {
			const match = /^(\s*)(\d{1,9}\.)/.exec(row);
			if (match) {
				const codeLength = match[2].length;
				if (start === undefined)
					start = parseInt(match[2].substr(0, codeLength - 1), 10);
				const content = row.substr(
					(/^\s+/.test(row.substr(codeLength))
						? codeLength + 1
						: codeLength) + match[1].length,
				);
				if (match[1].length !== indent && nodes.length > 0) {
					newText += createList(nodes, undefined, indent);
					nodes = [];
					indent = Math.ceil(match[1].length / 2);
				}
				nodes.push(`<li>${content}</li>`);
			} else if (nodes.length > 0) {
				newText += createList(nodes, start, indent) + '\n' + row + '\n';
				nodes = [];
				start = undefined;
			} else {
				newText += row + '\n';
			}
		});
		if (nodes.length > 0) {
			newText += createList(nodes, start, indent) + '\n';
		}
		node.text(newText);
	}
}
