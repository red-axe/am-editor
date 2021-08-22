import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants';
import {
	CardEntry,
	CardInterface,
	CardType,
	EngineInterface,
} from '../../types';

class Left {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	inline(card: CardInterface, event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.getRange();
		const { singleSelectable } = card.constructor as CardEntry;
		// 左侧光标
		const cardLeft = range.commonAncestorNode.closest(CARD_LEFT_SELECTOR);
		if (cardLeft.length > 0) {
			range.setStartBefore(card.root[0]);
			range.collapse(true);
			change.select(range);
			return true;
		}
		// 右侧光标
		const cardRight = range.commonAncestorNode.closest(CARD_RIGHT_SELECTOR);
		if (cardRight.length > 0) {
			event.preventDefault();
			if (singleSelectable !== false) {
				this.engine.card.select(card);
			} else {
				card.focus(range, true);
				change.select(range);
			}
			return false;
		}
		return true;
	}

	block(card: CardInterface, event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.getRange();
		// 左侧光标
		const cardLeft = range.commonAncestorNode.closest(CARD_LEFT_SELECTOR);
		if (cardLeft.length > 0) {
			event.preventDefault();
			card.focusPrevBlock(range, false);
			change.select(range);
			return false;
		}
		// 右侧光标
		const cardRight = range.commonAncestorNode.closest(CARD_RIGHT_SELECTOR);
		if (cardRight.length > 0) {
			event.preventDefault();
			this.engine.card.select(card);
			return false;
		}
		if (this.engine.card.getSingleSelectedCard(range)) {
			event.preventDefault();
			card.focus(range, true);
			change.select(range);
			return false;
		}
		return true;
	}

	trigger(event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.getRange();
		const card = this.engine.card.getSingleCard(range);
		if (!card) return true;
		return card.type === CardType.INLINE
			? this.inline(card, event)
			: this.block(card, event);
	}
}
export default Left;
