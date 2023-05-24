import isHotkey from 'is-hotkey';
import { CardInterface, EngineInterface } from '../../types';
import { CardType } from '../enum';
import { unactivateCard } from './utils';

class Up {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	common(component: CardInterface, event: KeyboardEvent) {
		const { change, card } = this.engine;
		const range = change.range.get();
		unactivateCard(this.engine, component);
		const prev = component.root.prev();
		if (prev) {
			event.preventDefault();
			card.focusPrevBlock(component, range, false);
			change.range.select(range);
			return false;
		}
		return;
	}

	inline(component: CardInterface, event: KeyboardEvent) {
		return this.common(component, event);
	}

	block(component: CardInterface, event: KeyboardEvent) {
		return this.common(component, event);
	}

	trigger(event: KeyboardEvent) {
		const { change, card, block } = this.engine;
		const range = change.range.get();
		if (range.collapsed) {
			const closetBlock = block.closest(range.startNode);
			const prev = closetBlock.prev();
			if (prev?.isCard()) {
				const cardComponent = card.find(prev);
				if (cardComponent && cardComponent.onSelectUp) {
					return cardComponent.onSelectUp(event);
				}
			}
		}
		const singleCard = card.getSingleCard(range);
		if (!singleCard) {
			return true;
		}
		if (isHotkey('shift+up', event)) {
			return;
		}
		return singleCard.type === CardType.INLINE
			? this.inline(singleCard, event)
			: this.block(singleCard, event);
	}
}
export default Up;
