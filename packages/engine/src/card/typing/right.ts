import isHotkey from 'is-hotkey';
import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants';
import { CardEntry, CardInterface, EngineInterface } from '../../types';
import { CardType } from '../enum';

class Right {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	inline(card: CardInterface, event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.range.get();
		const { singleSelectable } = card.constructor as CardEntry;
		// 左侧光标
		const cardLeft = range.commonAncestorNode.closest(CARD_LEFT_SELECTOR);
		const cardRight = range.commonAncestorNode.closest(CARD_RIGHT_SELECTOR);
		const isCenter = cardLeft.length === 0 && cardRight.length === 0;
		if (cardLeft.length > 0 || isCenter) {
			event.preventDefault();
			if (isCenter) {
				card.select(false);
				card.activate(false);
				card.toolbarModel?.hide();
			} else if (range.collapsed) {
				const cardComponent = this.engine.card.find(range.startNode);
				if (cardComponent && cardComponent.onSelectRight) {
					return cardComponent.onSelectRight(event);
				}
			}
			if (!isCenter && singleSelectable !== false) {
				this.engine.card.select(card, event);
			} else {
				card.focus(range, false);
				card.select(false);
				card.toolbarModel?.hide();
				change.range.select(range);
			}
			return false;
		}
		// 右侧光标
		if (cardRight.length > 0) {
			const next = card.root.next();
			if (!next) {
				card.focus(range, false);
			} else {
				range.setEndAfter(card.root[0]);
				range.collapse(false);
			}
			change.range.select(range);
		}
		return true;
	}

	block(component: CardInterface, event: KeyboardEvent) {
		const { change, card } = this.engine;
		const range = change.range.get();

		// 左侧光标
		const cardLeft = range.commonAncestorNode.closest(CARD_LEFT_SELECTOR);
		if (cardLeft.length > 0) {
			if (range.collapsed) {
				const cardComponent = this.engine.card.find(range.startNode);
				if (cardComponent && cardComponent.onSelectRight) {
					return cardComponent.onSelectRight(event);
				}
			}
			event.preventDefault();
			card.select(component, event);
			return false;
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
			const next = component.root.next();
			if (next) {
				event.preventDefault();
				card.focusNextBlock(component, range, false);
				change.range.select(range);
				return false;
			}
			return;
		}
		if (this.engine.card.getSingleSelectedCard(range)) {
			event.preventDefault();
			component.focus(range, false);
			component.select(false);
			component.toolbarModel?.hide();
			change.range.select(range);
			return false;
		}
		return true;
	}

	trigger(event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.range.get();
		const card = this.engine.card.getSingleCard(range);
		if (!card) return true;
		if (isHotkey('shift+right', event)) {
			return;
		}
		return card.type === CardType.INLINE
			? this.inline(card, event)
			: this.block(card, event);
	}
}
export default Right;
