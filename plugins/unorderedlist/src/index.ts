import {
	NodeInterface,
	List,
	SchemaBlock,
	isEngine,
	PluginEntry,
} from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};

export default class extends List<Options> {
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

	allowIn = ['blockquote'];

	schema(): Array<SchemaBlock> {
		const scheam = super.schema() as SchemaBlock;
		return [
			scheam,
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
		this.execute();
		return false;
	}
}
