import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants';
import {
	CardEntry,
	CardInterface,
	CardType,
	EngineInterface,
} from '../../types';

class Down {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	inline(card: CardInterface, event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.getRange();
		event.preventDefault();
		card.focusNextBlock(range, false);
		change.select(range);
		return false;
	}

	block(card: CardInterface, event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.getRange();

		event.preventDefault();
		card.focusNextBlock(range, false);
		change.select(range);
		return false;
	}

	trigger(event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.getRange();
		const card = this.engine.card.getSingleCard(range);
		if (!card) return true;
		const cardEntry = card.constructor as CardEntry;
		return cardEntry.cardType === CardType.INLINE
			? this.inline(card, event)
			: this.block(card, event);
	}
}
export default Down;
