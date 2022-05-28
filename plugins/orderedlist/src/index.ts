import {
	NodeInterface,
	ListPlugin,
	isEngine,
	SchemaBlock,
	PluginOptions,
} from '@aomao/engine';
import type MarkdownIt from 'markdown-it';

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
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.on('markdown-it', this.markdownIt);
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
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, list, block } = editor;
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

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) {
			mardown.enable('list');
		}
	};

	destroy(): void {
		this.editor.off('markdown-it', this.markdownIt);
	}
}
