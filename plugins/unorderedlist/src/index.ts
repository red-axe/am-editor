import {
	NodeInterface,
	ListPlugin,
	SchemaBlock,
	isEngine,
	PluginEntry,
} from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};

export default class extends ListPlugin<Options> {
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
			this.editor.on('paste:each', child => this.pasteMarkdown(child));
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
		const range = change.getRange();
		const activeBlocks = block.findBlocks(range);
		if (activeBlocks) {
			const selection = range.createSelection();
			if (list.getPluginNameByNodes(activeBlocks) === 'unorderedlist') {
				list.unwrap(activeBlocks);
			} else {
				list.toNormal(activeBlocks, 'ul');
			}
			selection.move();
			change.select(range);
			list.merge();
		}
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+8';
	}

	//设置markdown
	markdown(event: KeyboardEvent, text: string, block: NodeInterface) {
		if (!isEngine(this.editor) || this.options.markdown === false) return;

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
		if (['*', '-', '+'].indexOf(text) < 0) return;
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
			this.editor.node.isBlock(node) ||
			(node.parent()?.isFragment && node.isText())
		) {
			const { $ } = this.editor;
			const reg = /^([\*-\+]{1,}\s+)/;
			const convertToNode = (node: NodeInterface) => {
				const textNode = node.isText() ? node : node.first();
				if (!textNode?.isText()) return;
				const text = textNode.text();
				const match = reg.exec(text);
				if (!match) return;

				const codeLength = match[1].length;
				const newTextNode = $(
					textNode.get<Text>()!.splitText(codeLength),
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

			const root = $(`<${this.tagName} />`);
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
