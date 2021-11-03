import isHotkey from 'is-hotkey';
import { CardInterface, EngineInterface } from '../../types';
import { CardType } from '../enum';

class Up {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	inline(component: CardInterface, event: KeyboardEvent) {
		const { change, card } = this.engine;
		const range = change.range.get();
		event.preventDefault();
		card.focusPrevBlock(component, range, false);
		change.range.select(range);
		return false;
	}

	block(component: CardInterface, event: KeyboardEvent) {
		const { change, card } = this.engine;
		const range = change.range.get();
		event.preventDefault();
		card.focusPrevBlock(component, range, false);
		change.range.select(range);
		return false;
	}

	trigger(event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.range.get();
		const card = this.engine.card.getSingleCard(range);
		if (!card) return true;
		if (isHotkey('shift+up', event)) {
			return;
		}
		return card.type === CardType.INLINE
			? this.inline(card, event)
			: this.block(card, event);
	}
}
export default Up;
