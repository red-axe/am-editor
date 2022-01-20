import {
	$,
	NodeInterface,
	ListPlugin,
	SchemaBlock,
	isEngine,
	PluginEntry,
	PluginOptions,
} from '@aomao/engine';

export interface UnorderedlistOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}

export default class<
	T extends UnorderedlistOptions = UnorderedlistOptions,
> extends ListPlugin<T> {
	static get pluginName() {
		return 'unorderedlist';
	}

	tagName = 'ul';

	attributes = {
		'data-indent': '@var0',
	};

	variable = {
		'@var0': '@number',
	};

	allowIn = ['blockquote', '$root'];

	init() {
		super.init();
		if (isEngine(this.editor)) {
			this.editor.on(
				'paste:markdown-check',
				(child) => !this.checkMarkdown(child)?.match,
			);
			this.editor.on('paste:markdown', (child) =>
				this.pasteMarkdown(child),
			);
		}
	}

	schema(): Array<SchemaBlock> {
		const scheam = super.schema() as SchemaBlock;
		return [
			scheam,
			{
				name: 'ul',
				type: 'block',
			},
			{
				name: 'li',
				type: 'block',
				allowIn: ['ul'],
			},
		];
	}

	isCurrent(node: NodeInterface) {
		return (
			!node.hasClass(this.editor.list.CUSTOMZIE_UL_CLASS) &&
			node.name === 'ul'
		);
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { change, list, block } = this.editor;
		list.split();
		const range = change.range.get();
		const activeBlocks = block.findBlocks(range);
		if (activeBlocks) {
			const selection = range.createSelection();
			if (list.getPluginNameByNodes(activeBlocks) === 'unorderedlist') {
				list.unwrap(activeBlocks);
			} else {
				list.toNormal(activeBlocks, 'ul');
			}
			selection.move();
			change.range.select(range);
			list.merge();
		}
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+8';
	}

	//设置markdown
	markdown(event: KeyboardEvent, text: string, block: NodeInterface) {
		if (!isEngine(this.editor) || this.options.markdown === false) return;
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
		if (['*', '-', '+'].indexOf(text) < 0) return;
		event.preventDefault();
		blockApi.removeLeftText(block);
		if (node.isEmpty(block)) {
			block.empty();
			block.append('<br />');
		}
		command.execute((this.constructor as PluginEntry).pluginName);
		return false;
	}

	checkMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown || !node.isText()) return;

		const text = node.text();
		if (!text) return;

		const reg = /(^|\r\n|\n)\s*([\*\-\+]{1,}\s+)/g;
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
		rows.forEach((row) => {
			const match = /^(\s*)([\*\-\+]{1,}\s+)/.exec(row);
			if (match) {
				const codeLength = match[2].length;
				const content = row.substr(codeLength + match[1].length);
				if (match[1].length !== indent && nodes.length > 0) {
					newText += createList(nodes, undefined, indent);
					nodes = [];
					indent = Math.ceil(match[1].length / 2);
				}
				nodes.push(`<li>${content}</li>`);
			} else if (nodes.length > 0) {
				newText +=
					createList(nodes, undefined, indent) + '\n' + row + '\n';
				nodes = [];
			} else {
				newText += row + '\n';
			}
		});
		if (nodes.length > 0) {
			newText += createList(nodes, undefined, indent) + '\n';
		}
		node.text(newText);
	}
}
