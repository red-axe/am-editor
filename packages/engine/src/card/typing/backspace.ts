import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants';
import { EngineInterface, NodeInterface } from '../../types';
import { CardType } from '../enum';

class Backspace {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}
	/**
	 * 焦点移动到当前光标最接近的block节点或传入的节点前一个 Block
	 * @param block 节点
	 * @param isRemoveEmptyBlock 如果前一个block为空是否删除，默认为否
	 */
	focusPrevBlock(block?: NodeInterface, isRemoveEmptyBlock: boolean = false) {
		const { change } = this.engine;
		const range = change.range.get();
		block = block || this.engine.block.closest(range.startNode);
		let prevBlock = block.prev();
		if (!prevBlock) {
			return;
		}
		// 前面是Card
		if (prevBlock.isCard()) {
			const card = this.engine.card.find(prevBlock);
			if (card) card.focus(range);
			return;
		}
		// 前面是列表
		if (this.engine.node.isList(prevBlock)) {
			prevBlock = prevBlock.last();
		}

		if (!prevBlock) {
			return;
		}

		if (isRemoveEmptyBlock && this.engine.node.isEmptyWithTrim(prevBlock)) {
			prevBlock.remove();
			return;
		}

		range.select(prevBlock, true);
		range.collapse(false);
		change.range.select(range.shrinkToTextNode());
	}
	/**
	 * 在卡片节点处按下backspace键
	 */
	trigger(event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.range
			.get()
			.cloneRange()
			.shrinkToElementNode()
			.shrinkToTextNode();
		if (!range.collapsed) return;
		// 查找当前光标所在卡片
		const card = this.engine.card.find(range.startNode);
		if (!card) {
			// 光标前面有Card，并且不是自定义列表，移除卡片
			const prevNode = range.getPrevNode();
			const prevParent = prevNode?.parent();
			if (
				!event['isDelete'] &&
				prevNode &&
				prevNode.isCard() &&
				(!prevParent || !this.engine.node.isCustomize(prevParent))
			) {
				event.preventDefault();
				const cloneRange = range.cloneRange();
				cloneRange.setStartBefore(prevNode);
				cloneRange.collapse(true);
				this.engine.card.remove(prevNode);
				change.range.select(cloneRange.shrinkToTextNode());
				cloneRange.handleBr();
				return false;
			}
			return true;
		}
		if (event['isDelete']) return true;
		// inline 卡片
		if (card.type === CardType.INLINE) {
			// 左侧光标
			const cardLeft = range.startNode.closest(CARD_LEFT_SELECTOR);
			if (cardLeft.length > 0) {
				const prev = card.root.prev();
				if (!prev) {
					event.preventDefault();
					change.mergeAfterDelete();
					return false;
				} else {
					// 左侧还是卡片删除卡片
					const leftCard = this.engine.card.find(prev);
					if (leftCard) {
						this.engine.card.remove(leftCard.id);
						range.handleBr();
						return false;
					}
					range.select(card.root).collapse(true);
				}
				change.range.select(range);
			}
			// 右侧光标
			const cardRight = range.startNode.closest(CARD_RIGHT_SELECTOR);
			if (cardRight.length > 0) {
				event.preventDefault();

				const cloneRange = range.cloneRange();
				cloneRange.setStartBefore(card.root);
				cloneRange.collapse(true);
				this.engine.card.remove(card.id);
				change.range.select(cloneRange.shrinkToTextNode());
				cloneRange.handleBr();
				return false;
			}
		} else {
			// 左侧光标
			const cardLeft = range.startNode.closest(CARD_LEFT_SELECTOR);
			if (cardLeft.length > 0) {
				event.preventDefault();
				if (card.root.parent()?.inEditor()) {
					change.unwrap(card.root.parent()!);
				} else {
					this.focusPrevBlock(card.root, true);
				}
				return false;
			}
			// 右侧光标
			const cardRight = range.startNode.closest(CARD_RIGHT_SELECTOR);

			if (cardRight.length > 0) {
				event.preventDefault();
				this.focusPrevBlock(card.root);
				this.engine.card.remove(card.id, false);
				if (change.isEmpty()) {
					change.initValue();
				}
				return false;
			}
		}
		//改变了光标选区，再次触发事件
		if (this.engine.trigger('keydown:backspace', event) === false)
			return false;
		return true;
	}
}
export default Backspace;
