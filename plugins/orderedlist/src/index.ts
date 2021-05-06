import {
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
			this.editor.on('paste:each', child => this.pasteMarkdown(child));
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
		if (!isEngine(this.editor) || !this.markdown) return;
		if (
			this.editor.node.isBlock(node) ||
			(node.parent()?.isFragment && node.isText())
		) {
			const { $ } = this.editor;
			const reg = /^(\d{1,9}\.)/;
			let start: number | undefined = undefined;
			const convertToNode = (node: NodeInterface) => {
				const textNode = node.isText() ? node : node.first();
				if (!textNode?.isText()) return;
				const text = textNode.text();
				const match = reg.exec(text);
				if (!match) return;

				const codeLength = match[1].length;
				if (!start)
					start = parseInt(match[1].substr(0, codeLength - 1), 10);

				const newTextNode = $(
					textNode
						.get<Text>()!
						.splitText(
							/^\s+/.test(text.substr(codeLength))
								? codeLength + 1
								: codeLength,
						),
				);
				let li = $('<li />');
				if (!node.isText()) {
					textNode.remove();
					node.children().each(child => {
						li.append(child);
					});
				} else {
					li.append(newTextNode);
				}
				return li;
			};
			const startLi = convertToNode(node);
			if (!startLi) return;
			const nodes = [];
			nodes.push(startLi);

			if (!node.isText()) {
				let next = node.next();
				while (next) {
					const li = convertToNode(next);
					if (!li) break;
					nodes.push(li);
					const temp = next.next();
					next.remove();
					next = temp;
				}
			}

			const root = $(`<${this.tagName} start="${start || 1}" />`);
			nodes.forEach(li => {
				root.append(li);
			});
			node.before(root);
			node.remove();
			this.editor.list.addBr(root);
			root.allChildren().forEach(child => {
				if (child) this.editor.trigger('paste:each', $(child));
			});
		}
	}
}
