import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants';
import { CardInterface, EngineInterface } from '../../types';
import { CardType } from '../enum';

class Default {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	block(component: CardInterface, event: KeyboardEvent) {
		const { change, card } = this.engine;
		const range = change.range.get();
		// 左侧光标
		const cardLeft = range.commonAncestorNode.closest(CARD_LEFT_SELECTOR);
		if (cardLeft.length > 0) {
			// 其它情况
			if (!event.metaKey && !event.ctrlKey) {
				card.focusPrevBlock(component, range, true);
				change.range.select(range);
			}
			return true;
		}
		// 右侧光标
		const cardRight = range.commonAncestorNode.closest(CARD_RIGHT_SELECTOR);
		if (cardRight.length > 0) {
			// 其它情况
			if (!event.metaKey && !event.ctrlKey) {
				card.focusNextBlock(component, range, true);
				change.range.select(range);
			}
		}
		return true;
	}

	trigger(event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.range.get();
		const card = this.engine.card.getSingleCard(range);
		if (!card) return true;
		if (card.type === CardType.BLOCK) return this.block(card, event);
		return true;
	}
}
export default Default;
