import isHotkey from 'is-hotkey';
import {
	CARD_CENTER_SELECTOR,
	CARD_LEFT_SELECTOR,
	CARD_RIGHT_SELECTOR,
} from '../../constants';
import {
	CardEntry,
	CardInterface,
	EngineInterface,
	RangeInterface,
} from '../../types';
import { CardType } from '../enum';

class Left {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	inline(card: CardInterface, event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.range.get().cloneRange();
		const { singleSelectable } = card.constructor as CardEntry;
		// 左侧光标
		const cardLeft = range.commonAncestorNode.closest(CARD_LEFT_SELECTOR);
		if (cardLeft.length > 0) {
			const prev = card.root.prev();
			if (!prev) {
				card.focus(range, true);
			} else {
				range.setStartBefore(card.root[0]);
				range.collapse(true);
			}
			change.range.select(range);
			return true;
		}
		// 右侧光标
		const cardRight = range.commonAncestorNode.closest(CARD_RIGHT_SELECTOR);
		const isCenter = cardLeft.length === 0 && cardRight.length === 0;
		if (cardRight.length > 0 || isCenter) {
			event.preventDefault();
			if (isCenter) {
				card.select(false);
				card.toolbarModel?.hide();
				card.activate(false);
			} else if (range.collapsed) {
				const cardComponent = this.engine.card.find(range.startNode);
				if (cardComponent && cardComponent.onSelectLeft) {
					return cardComponent.onSelectLeft(event);
				}
			}
			if (!isCenter && singleSelectable !== false) {
				this.engine.card.select(card, event);
			} else {
				card.focus(range, true);
				card.select(false);
				card.toolbarModel?.hide();
				change.range.select(range);
			}
			return false;
		}
		return true;
	}

	block(component: CardInterface, event: KeyboardEvent) {
		const { change, card } = this.engine;
		const range = change.range.get();
		// 左侧光标
		const cardLeft = range.commonAncestorNode.closest(CARD_LEFT_SELECTOR);
		if (cardLeft.length > 0) {
			const prev = component.root.prev();
			if (prev) {
				event.preventDefault();
				card.focusPrevBlock(component, range, false);
				change.range.select(range);
				return false;
			}
			return;
		}
		// 右侧光标
		const cardRight = range.commonAncestorNode.closest(CARD_RIGHT_SELECTOR);
		const isCenter = cardLeft.length === 0 && cardRight.length === 0;
		if (isCenter) {
			component.select(false);
			component.toolbarModel?.hide();
			component.activate(false);
		}
		if (cardRight.length > 0) {
			if (range.collapsed) {
				const cardComponent = card.find(range.startNode);
				if (cardComponent && cardComponent.onSelectLeft) {
					return cardComponent.onSelectLeft(event);
				}
			}
			event.preventDefault();
			card.select(component, event);
			return false;
		}
		if (card.getSingleSelectedCard(range)) {
			event.preventDefault();
			component.focus(range, true);
			component.select(false);
			component.toolbarModel?.hide();
			change.range.select(range);
			return false;
		}
		return true;
	}

	fincPrevCard(range: RangeInterface) {
		if (!range.collapsed) return null;
		const { startNode, startOffset } = range;
		if (startNode.isText() && startOffset === 0) {
			const prev = startNode.prevElement();
			if (prev && prev.isCard()) {
				return this.engine.card.find(prev);
			}
		}
		return null;
	}

	trigger(event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.range.get();
		const card = this.engine.card.getSingleCard(range);
		if (!card) {
			const prevCard = this.fincPrevCard(range);
			if (prevCard) {
				event.preventDefault();
				prevCard.focus(range, false);
				change.range.select(range);
				return false;
			}
			return true;
		}
		if (isHotkey('shift+left', event)) {
			return false;
		}
		return card.type === CardType.INLINE
			? this.inline(card, event)
			: this.block(card, event);
	}
}
export default Left;
