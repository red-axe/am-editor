import { EngineInterface } from '../../types';

class Backspace {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}
	/**
	 * 列表删除事件
	 * @param e 事件
	 * @param isDeepMerge 是否深度合并
	 */
	trigger(event: KeyboardEvent, isDeepMerge?: boolean) {
		const { change, command, list, node } = this.engine;
		let range = change.getRange();

		if (range.collapsed) {
			const block = this.engine.block.closest(range.startNode);
			if ('li' === block.name && list.isFirst(range)) {
				event.preventDefault();
				command.execute(list.getPluginNameByNode(block));
				return false;
			}
		} else {
			const startBlock = this.engine.block.closest(range.startNode);
			const endBlock = this.engine.block.closest(range.endNode);
			if ('li' === startBlock.name || 'li' === endBlock.name) {
				event.preventDefault();
				const cloneRange = range.cloneRange();
				change.deleteContent(undefined, isDeepMerge);
				list.addBr(startBlock);
				list.addBr(endBlock);
				range.setStart(
					cloneRange.startContainer,
					cloneRange.startOffset,
				);
				range.collapse(true);
				list.merge();
				change.select(range);
				return false;
			}
		}
		if (!this.engine.block.isFirstOffset(range, 'start')) return;
		let block = this.engine.block.closest(range.startNode);
		// 在列表里
		if (['ul', 'ol'].indexOf(block.name) >= 0) {
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
			if (node.isCustomize(block)) {
				return;
			}

			event.preventDefault();
			const listRoot = block.closest('ul');

			if (block.parent()?.isEditable()) {
				// <p>foo</p><li><cursor />bar</li>
				change.mergeAfterDeletePrevNode(block);
				return false;
			}

			if (listRoot.length > 0) {
				command.execute(list.getPluginNameByNode(listRoot));
			} else {
				// <p><li><cursor />foo</li></p>
				change.unwrapNode(block);
			}

			return false;
		}
		return true;
	}
}

export default Backspace;
