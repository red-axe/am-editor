import { EngineInterface } from '../../types';

class Enter {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	trigger(event: KeyboardEvent) {
		const { change, node, $ } = this.engine;
		const range = change.getRange();
		// 选区选中最后的节点
		let block = this.engine.block.closest(range.endNode);
		// 嵌套 block
		const parent = block.parent();
		if (parent && parent.inEditor() && node.isBlock(parent)) {
			if ('li' === parent.name && 'p' === block.name) {
				if (
					1 === block.children().length &&
					'br' === block.first()?.name
				) {
					block.first()!.remove();
				}
				const selection = range.createSelection();
				change.unwrapNode(block);
				selection.move();
				block = this.engine.block.closest(range.endNode);
			}

			if (
				range.collapsed &&
				this.engine.block.isLastOffset(range, 'end') &&
				this.engine.block.isFirstOffset(range, 'end')
			) {
				event.preventDefault();
				if (['li'].indexOf(parent.name) >= 0) {
					this.engine.block.unwrap('<'.concat(parent.name!, ' />'));
					this.engine.block.setBlocks(
						'<'.concat(parent.name!, ' />'),
					);
				} else {
					this.engine.block.unwrap('<'.concat(parent.name!, ' />'));
					this.engine.block.setBlocks('<p />');
				}
				return false;
			}
		}
		if (this.engine.node.isRootBlock(block)) {
			event.preventDefault();
			this.engine.block.insertOrSplit(range, block);
			return false;
		}
		// 列表
		if (block.name === 'li') {
			if (this.engine.node.isCustomize(block)) {
				return;
			}
			event.preventDefault();
			// <li>foo<cursor /><li>
			if (this.engine.block.isLastOffset(range, 'end')) {
				// <li><cursor /><li>
				if (
					range.collapsed &&
					this.engine.block.isFirstOffset(range, 'end')
				) {
					const listRoot = block.closest('ul,ol');
					this.engine.block.unwrap('<'.concat(listRoot.name!, ' />'));
					this.engine.block.setBlocks('<p />');
				} else {
					const li = $('<li><br /></li>');
					li.attributes(block.attributes());
					this.engine.block.insertEmptyBlock(range, li);
				}
			} else {
				this.engine.block.split();
			}
			this.engine.list.merge();
			range.scrollIntoView();
			return false;
		}
		return true;
	}
}

export default Enter;
