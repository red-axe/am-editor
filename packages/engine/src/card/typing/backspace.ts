import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants';
import { CardEntry, CardType, EngineInterface } from '../../types';

class Backspace {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}
	/**
	 * 在卡片节点处按下backspace键
	 */
	trigger(event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.getRange();
		if (!range.collapsed) return;
		// 查找当前光标所在卡片
		const card = this.engine.card.find(range.startNode);
		if (!card) {
			// 光标前面有Card，并且不是自定义列表，移除卡片
			const prevNode = range.getPrevNode();
			if (
				prevNode &&
				prevNode.isCard() &&
				!this.engine.node.isCustomize(prevNode)
			) {
				event.preventDefault();
				this.engine.card.remove(prevNode);
				return false;
			}
			return true;
		}
		// inline 卡片
		if ((card.constructor as CardEntry).cardType === CardType.INLINE) {
			// 左侧光标
			const cardLeft = range.startNode.closest(CARD_LEFT_SELECTOR);
			if (cardLeft.length > 0) {
				range.select(card.root).collapse(true);
				change.select(range);
			}
			// 右侧光标
			const cardRight = range.startNode.closest(CARD_RIGHT_SELECTOR);
			if (cardRight.length > 0) {
				event.preventDefault();
				this.engine.card.remove(card.id);
				range.addOrRemoveBr();
				return false;
			}
		} else {
			// 左侧光标
			const cardLeft = range.startNode.closest(CARD_LEFT_SELECTOR);
			if (cardLeft.length > 0) {
				event.preventDefault();
				if (card.root.parent()?.inEditor()) {
					change.unwrapNode(card.root.parent()!);
				} else {
					change.focusPrevBlock(card.root, true);
				}
				return false;
			}
			// 右侧光标
			const cardRight = range.startNode.closest(CARD_RIGHT_SELECTOR);

			if (cardRight.length > 0) {
				event.preventDefault();
				change.focusPrevBlock(card.root);
				this.engine.card.remove(card.id);
				return false;
			}
		}
		//改变了光标选区，再次触发事件
		if (this.engine.trigger('keydown:backspace') === false) return false;
		return true;
	}
}
export default Backspace;
