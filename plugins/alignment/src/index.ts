import { NodeInterface, Plugin } from '@aomao/engine';

export type Options = {
	hotkey?: {
		left?: string;
		center?: string;
		right?: string;
		justify?: string;
	};
};
export default class extends Plugin<Options> {
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
		if (!this.engine) return;
		const { change } = this.engine;
		change.setBlocks({
			style: {
				'text-align': align,
			},
		});
		this.repairListStylePosition(change.blocks, align);
	}

	queryState() {
		if (!this.engine) return;
		const { change } = this.engine;
		const blocks = change.blocks;

		if (blocks.length === 0) {
			return;
		}

		let fisrtBlock = blocks[0];
		if (['ul', 'ol', 'blockquote'].includes(fisrtBlock.name || '')) {
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

	schema() {
		return [
			{
				block: {
					style: {
						'text-align': ['left', 'center', 'right', 'justify'],
					},
				},
			},
		];
	}

	onCustomizeKeydown(
		type:
			| 'enter'
			| 'backspace'
			| 'space'
			| 'tab'
			| 'at'
			| 'slash'
			| 'selectall',
		event: KeyboardEvent,
	) {
		if (!this.engine || type !== 'backspace') return;
		const range = this.engine.change.getRange();
		if (!range.isBlockFirstOffset('start')) return;
		// 改变对齐
		const align = this.queryState();
		if (align === 'center') {
			event.preventDefault();
			this.execute('left');
			return false;
		}

		if (align === 'right') {
			event.preventDefault();
			this.execute('center');
			return false;
		}
		return;
	}
}
