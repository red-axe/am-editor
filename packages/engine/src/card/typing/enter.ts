import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants';
import {
	CardEntry,
	CardInterface,
	CardType,
	EngineInterface,
	RangeInterface,
} from '../../types';

class Enter {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	/**
	 * 在卡片处插入空段落
	 * @param range 光标
	 * @param card 卡片
	 * @param isStart 是否聚焦到开始位置
	 */
	insertNewline(
		range: RangeInterface,
		card: CardInterface,
		isStart: boolean,
	) {
		const { change, block } = this.engine;
		range.select(card.root);
		range.collapse(isStart);
		change.select(range);
		const emptyBlock = this.engine.$('<p><br /></p>');
		block.insert(emptyBlock);

		if (isStart) {
			card.focus(range, true);
		} else {
			range.select(emptyBlock, true);
			range.collapse(false);
		}
		change.select(range);
	}
	/**
	 * 在卡片节点处按下enter键
	 */
	trigger(event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.getRange();
		// 查找当前光标所在卡片
		const card = this.engine.card.find(range.startNode);
		if (!card) return true;

		if ((card.constructor as CardEntry).cardType === CardType.INLINE) {
			// 左侧光标
			const cardLeft = range.startNode.closest(CARD_LEFT_SELECTOR);
			if (cardLeft.length > 0) {
				range.select(card.root);
				range.collapse(true);
				change.select(range);
			}
			// 右侧光标
			const cardRight = range.startNode.closest(CARD_RIGHT_SELECTOR);
			if (cardRight.length > 0) {
				range.select(card.root);
				range.collapse(false);
				change.select(range);
			}
		} else {
			// 左侧光标
			const cardLeft = range.startNode.closest(CARD_LEFT_SELECTOR);
			if (cardLeft.length > 0) {
				event.preventDefault();
				const prev = card.root.prev();
				if (!prev || prev.isCard()) {
					card.focusPrevBlock(range, true);
					change.select(range);
				} else {
					this.insertNewline(range, card, true);
				}
				return false;
			}
			// 右侧光标
			const cardRight = range.startNode.closest(CARD_RIGHT_SELECTOR);
			if (cardRight.length > 0) {
				event.preventDefault();
				const next = card.root.next();
				if (!next || next.isCard()) {
					card.focusNextBlock(range, true);
					change.select(range);
				} else {
					this.insertNewline(range, card, false);
				}
				return false;
			}
		}
		return true;
	}
}

export default Enter;
