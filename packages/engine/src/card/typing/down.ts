import isHotkey from 'is-hotkey';
import { CardInterface, EngineInterface } from '../../types';
import { CardType } from '../enum';
import { unactivateCard } from './utils';

class Down {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	common(component: CardInterface, event: KeyboardEvent) {
		const { change, card } = this.engine;
		const range = change.range.get();
		unactivateCard(this.engine, component);
		const next = component.root.next();
		if (next) {
			event.preventDefault();
			card.focusNextBlock(component, range, false);
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
		const { change, block, card } = this.engine;
		const range = change.range.get();
		const singleCard = card.getSingleCard(range);
		if (range.collapsed) {
			const closetBlock = block.closest(range.startNode);
			const next = closetBlock.next();
			if (next?.isCard()) {
				const cardComponent = card.find(next);
				if (cardComponent && cardComponent.onSelectDown) {
					return cardComponent.onSelectDown(event);
				}
			}
		}
		if (!singleCard) {
			return true;
		}
		if (isHotkey('shift+down', event)) {
			return true;
		}
		return singleCard.type === CardType.INLINE
			? this.inline(singleCard, event)
			: this.block(singleCard, event);
	}
}
export default Down;
