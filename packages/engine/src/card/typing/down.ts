import isHotkey from 'is-hotkey';
import { CardInterface, CardType, EngineInterface } from '../../types';

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
		if (isHotkey('shift+down', event)) {
			return true;
		}
		return card.type === CardType.INLINE
			? this.inline(card, event)
			: this.block(card, event);
	}
}
export default Down;
