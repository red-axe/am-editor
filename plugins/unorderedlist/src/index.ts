import {
	NodeInterface,
	List,
	isAllListedByType,
	cancelList,
} from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};

export default class extends List<Options> {
	schema(): any {
		return [
			{
				ul: {
					'data-indent': '@number',
					'data-id': '*',
				},
			},
			{
				li: {
					'data-id': '*',
				},
			},
		];
	}

	isCurentList(node: NodeInterface) {
		return !node.hasClass('data-list') && node.name === 'ul';
	}

	execute() {
		if (!this.engine) return;
		const { change } = this.engine;
		change.separateBlocks();
		const range = change.getRange();
		const activeBlocks = range.getActiveBlocks();
		if (activeBlocks) {
			const bookmark = range.createBookmark();
			const isList = isAllListedByType(activeBlocks);
			if (isList) {
				cancelList(activeBlocks);
			} else {
				this.toNormal(activeBlocks, 'ul');
			}
			if (bookmark) range.moveToBookmark(bookmark);
			change.select(range);
			change.mergeAdjacentList();
		}
	}

	hotkey() {
		return this.options.hotkey || 'mod+shift+8';
	}

	//设置markdown
	onKeydownSpace?(event: KeyboardEvent, node: NodeInterface) {
		if (!this.engine || this.options.markdown === false) return;

		const block = node.getClosestBlock();
		// fix: 列表、引用等 markdown 快捷方式不应该在标题内生效
		if (!block.isHeading() || /^h\d$/i.test(block.name || '')) {
			return;
		}

		const { change } = this.engine;
		const range = change.getRange();
		const text = range.getBlockLeftText(block[0]);
		if (['*', '-', '+'].indexOf(text) < 0) return;
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
		let block = range.startNode.getClosestBlock();
		// 在列表里
		if (['ul'].indexOf(block.name || '') >= 0) {
			// 矫正这种情况，<ul><cursor /><li>foo</li></ul>
			const li = block.first();

			if (!li || li.isText()) {
				// <ul><cursor />foo</ul>
				event.preventDefault();
				change.mergeAfterDeletePrevNode(block);
				return false;
			} else {
				block = li;
				range.setStart(block[0], 0);
				range.collapse(true);
				change.select(range);
			}
		}

		if (block.name === 'li') {
			if (block.hasClass('data-list-node') && block.first()?.isCard()) {
				return;
			}

			event.preventDefault();
			const listRoot = block.closest('ul');

			if (block.parent()?.isRoot()) {
				// <p>foo</p><li><cursor />bar</li>
				change.mergeAfterDeletePrevNode(block);
				return false;
			}

			if (listRoot.length > 0) {
				this.execute();
			} else {
				// <p><li><cursor />foo</li></p>
				change.unwrapNode(block);
			}

			return false;
		}
		return;
	}
}
