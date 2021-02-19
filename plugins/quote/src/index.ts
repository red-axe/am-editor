import { NodeInterface, Plugin, unwrapNode } from '@aomao/engine';
import './index.css';

const TAG_NAME = 'blockquote';
export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};
export default class extends Plugin<Options> {
	execute() {
		if (!this.engine) return;
		const { change } = this.engine;
		if (!this.queryState()) {
			change.wrapBlock(`<${TAG_NAME} />`);
		} else {
			const range = change.getRange();
			const blockquote = change.blocks[0].closest(TAG_NAME);
			const bookmark = range.createBookmark();
			unwrapNode(blockquote);
			if (bookmark) range.moveToBookmark(bookmark);
			change.select(range);
			return;
		}
	}

	queryState() {
		if (!this.engine) return;
		const { change } = this.engine;
		const blocks = change.blocks;
		if (blocks.length === 0) {
			return false;
		}
		const blockquote = blocks[0].closest(TAG_NAME);
		return blockquote.length > 0 && !!blockquote.get<Element>()?.className;
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+u';
	}

	schema() {
		return TAG_NAME;
	}

	//设置markdown
	onKeydownSpace(event: KeyboardEvent, node: NodeInterface) {
		if (!this.engine || this.options.markdown === false) return;

		const block = node.getClosestBlock();
		// fix: 列表、引用等 markdown 快捷方式不应该在标题内生效
		if (!block.isHeading() || /^h\d$/i.test(block.name || '')) {
			return;
		}

		const { change } = this.engine;
		const range = change.getRange();
		const text = range.getBlockLeftText(block[0]);
		if (['>'].indexOf(text) < 0) return;
		event.preventDefault();
		range.removeBlockLeftText(block[0]);
		if (block.isEmpty()) {
			block.empty();
			block.append('<br />');
		}
		this.execute();
		return false;
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
		const { change } = this.engine;
		const range = change.getRange();
		if (!range.isBlockFirstOffset('start')) return;
		const block = range.startNode.getClosestBlock();
		const parentBlock = block.parent();

		if (
			parentBlock &&
			parentBlock.name === 'blockquote' &&
			block.isHeading()
		) {
			event.preventDefault();
			if (block.prevElement()) {
				change.mergeAfterDeletePrevNode(block);
			} else {
				change.unwrapBlock('<blockquote />');
			}
			return false;
		}
		return;
	}
}
