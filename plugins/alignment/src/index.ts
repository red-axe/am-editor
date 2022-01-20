import {
	isEngine,
	NodeInterface,
	ElementPlugin,
	PluginEntry,
	PluginOptions,
} from '@aomao/engine';

export interface AlignmentOptions extends PluginOptions {
	hotkey?: {
		left?: string;
		center?: string;
		right?: string;
		justify?: string;
	};
}
export default class<
	T extends AlignmentOptions = AlignmentOptions,
> extends ElementPlugin<T> {
	kind = 'block';

	style = {
		'text-align': '@var0',
		// 列表节点前的符号位置
		'list-style-position': '@var1',
	};

	variable = {
		'@var0': ['center', 'right', 'justify'],
		'@var1': ['outside', 'inside'],
	};

	static get pluginName() {
		return 'alignment';
	}

	init() {
		super.init();
		this.editor.on('keydown:backspace', this.onBackspace);
	}

	destroy() {
		this.editor.off('keydown:backspace', this.onBackspace);
	}

	execute(align?: 'left' | 'center' | 'right' | 'justify') {
		if (!isEngine(this.editor) || this.editor.readonly) return;
		const { change, block } = this.editor;
		block.setBlocks({
			style: {
				'text-align':
					!align || ['left'].indexOf(align) > -1 ? '' : align,
			},
		});
		change.blocks.forEach((block) => {
			if (block.name === 'li') {
				this.editor.list.addAlign(block, align);
			}
		});
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

	onBackspace = (event: KeyboardEvent) => {
		if (!isEngine(this.editor)) return;
		const { change, block } = this.editor;
		const range = change.range.get();
		if (
			block.isLastOffset(range, 'end') ||
			!block.isFirstOffset(range, 'start') ||
			change.blocks.length > 1
		)
			return;
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
	};
}
