import {
	isEngine,
	NodeInterface,
	ElementPlugin,
	PluginEntry,
} from '@aomao/engine';

export type Options = {
	hotkey?: {
		left?: string;
		center?: string;
		right?: string;
		justify?: string;
	};
};
export default class extends ElementPlugin<Options> {
	kind = 'block';

	style = {
		'text-align': '@var0',
	};

	variable = {
		'@var0': ['left', 'center', 'right', 'justify'],
	};

	static get pluginName() {
		return 'alignment';
	}

	init() {
		super.init();
		this.editor.on('keydown:backspace', event => this.onBackspace(event));
	}
	repairListStylePosition(blocks: Array<NodeInterface>, align: string) {
		if (!blocks || blocks.length === 0) {
			return;
		}

		blocks.forEach(block => {
			if (block.name === 'li') {
				if (align === 'left') {
					block.css('list-style-position', 'outside');
				} else {
					block.css('list-style-position', 'inside');
				}
			}
		});
	}

	execute(align: 'left' | 'center' | 'right' | 'justify') {
		if (!isEngine(this.editor)) return;
		const { change, block } = this.editor;
		block.setBlocks({
			style: {
				'text-align': align,
			},
		});
		this.repairListStylePosition(change.blocks, align);
	}

	queryState() {
		if (!isEngine(this.editor)) return;
		const { change, schema } = this.editor;
		const blocks = change.blocks;

		if (blocks.length === 0) {
			return;
		}

		let fisrtBlock = blocks[0];
		const topTags = schema.getAllowInTags();
		if (topTags.indexOf(fisrtBlock.name) > -1) {
			fisrtBlock = blocks[1] || fisrtBlock.first() || fisrtBlock;
		}

		let align = fisrtBlock.css('text-align');
		// https://css-tricks.com/almanac/properties/t/text-align/
		if (align === 'start') {
			align = 'left';
		}

		if (align === 'end') {
			align = 'right';
		}
		return align;
	}

	hotkey() {
		const leftHotkey = this.options.hotkey?.left || 'mod+shift+l';
		const centerHotkey = this.options.hotkey?.center || 'mod+shift+c';
		const rightHotkey = this.options.hotkey?.right || 'mod+shift+r';
		const justifyHotkey = this.options.hotkey?.justify || 'mod+shift+j';
		return [
			{ key: leftHotkey, args: 'left' },
			{ key: centerHotkey, args: 'center' },
			{ key: rightHotkey, args: 'right' },
			{ key: justifyHotkey, args: 'justify' },
		];
	}

	onBackspace(event: KeyboardEvent) {
		if (!isEngine(this.editor)) return;
		const { change, block } = this.editor;
		const range = change.getRange();
		if (!block.isFirstOffset(range, 'start')) return;
		// 改变对齐
		const align = this.queryState();
		if (align === 'center') {
			event.preventDefault();
			this.editor.command.execute(
				(this.constructor as PluginEntry).pluginName,
				'left',
			);
			return false;
		}

		if (align === 'right') {
			event.preventDefault();
			this.editor.command.execute(
				(this.constructor as PluginEntry).pluginName,
				'center',
			);
			return false;
		}
		return;
	}
}
