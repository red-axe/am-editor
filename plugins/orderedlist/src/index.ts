import {
	NodeInterface,
	List,
	SchemaRule,
	isEngine,
	SchemaBlock,
} from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};

export default class extends List<Options> {
	tagName = 'ol';

	attributes = {
		start: '@var0',
		'data-indent': '@var1',
	};

	variable = {
		'@var0': '@number',
		'@var1': '@number',
	};

	allowIn = ['blockquote'];

	static get pluginName() {
		return 'orderedlist';
	}

	schema(): Array<SchemaBlock> {
		const scheam = super.schema() as SchemaBlock;
		return [
			scheam,
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
		this.execute(parseInt(text.replace(/\./, ''), 10));
		return false;
	}
}
