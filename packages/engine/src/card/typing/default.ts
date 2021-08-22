import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants';
import {
	CardEntry,
	CardInterface,
	CardType,
	EngineInterface,
} from '../../types';

class Default {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	block(card: CardInterface, event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.getRange();
		// 左侧光标
		const cardLeft = range.commonAncestorNode.closest(CARD_LEFT_SELECTOR);
		if (cardLeft.length > 0) {
			// 其它情况
			if (!event.metaKey && !event.ctrlKey) {
				card.focusPrevBlock(range, true);
				change.select(range);
			}
			return true;
		}
		// 右侧光标
		const cardRight = range.commonAncestorNode.closest(CARD_RIGHT_SELECTOR);
		if (cardRight.length > 0) {
			// 其它情况
			if (!event.metaKey && !event.ctrlKey) {
				card.focusNextBlock(range, true);
				change.select(range);
			}
		}
		return true;
	}

	trigger(event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.getRange();
		const card = this.engine.card.getSingleCard(range);
		if (!card) return true;
		if (card.type === CardType.BLOCK) return this.block(card, event);
		return true;
	}
}
export default Default;
