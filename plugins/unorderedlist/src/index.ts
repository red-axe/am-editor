import {
	$,
	NodeInterface,
	ListPlugin,
	SchemaBlock,
	isEngine,
	PluginEntry,
	PluginOptions,
} from '@aomao/engine';
import type MarkdownIt from 'markdown-it';

export interface UnorderedlistOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}

const MARKDOWN_IT = 'markdown-it';
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
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.on(MARKDOWN_IT, this.markdownIt);
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
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, list, block } = editor;
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

	markdownIt = (markdown: MarkdownIt) => {
		if (this.options.markdown !== false) {
			markdown.enable('list');
		}
	};

	destroy(): void {
		this.editor.off(MARKDOWN_IT, this.markdownIt);
	}
}
