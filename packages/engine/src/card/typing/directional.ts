import isHotkey from 'is-hotkey';
import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants';
import {
	CardEntry,
	CardInterface,
	CardType,
	EngineInterface,
} from '../../types';

class Directional {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	inline(card: CardInterface, event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.getRange();
		const { singleSelectable } = card.constructor as CardEntry;
		if (isHotkey('up', event) || isHotkey('ctrl+p', event)) {
			event.preventDefault();
			card.focusPrevBlock(range, false);
			change.select(range);
			return false;
		}

		if (isHotkey('down', event) || isHotkey('ctrl+n', event)) {
			event.preventDefault();
			card.focusNextBlock(range, false);
			change.select(range);
			return false;
		}
		// 左侧光标
		const cardLeft = range.commonAncestorNode.closest(CARD_LEFT_SELECTOR);
		if (cardLeft.length > 0) {
			if (
				isHotkey('right', event) ||
				isHotkey('ctrl+e', event) ||
				isHotkey('ctrl+f', event)
			) {
				event.preventDefault();
				if (singleSelectable !== false) {
					this.engine.card.select(card);
				} else {
					card.focus(range, false);
					change.select(range);
				}
				return false;
			}

			if (
				isHotkey('left', event) ||
				isHotkey('ctrl+a', event) ||
				isHotkey('ctrl+b', event)
			) {
				range.setStartBefore(card.root[0]);
				range.collapse(true);
				change.select(range);
			}
			return true;
		}
		// 右侧光标
		const cardRight = range.commonAncestorNode.closest(CARD_RIGHT_SELECTOR);
		if (cardRight.length > 0) {
			if (
				isHotkey('left', event) ||
				isHotkey('ctrl+a', event) ||
				isHotkey('ctrl+b', event)
			) {
				event.preventDefault();
				if (singleSelectable !== false) {
					this.engine.card.select(card);
				} else {
					card.focus(range, true);
					change.select(range);
				}
				return false;
			}

			if (
				isHotkey('right', event) ||
				isHotkey('ctrl+e', event) ||
				isHotkey('ctrl+f', event)
			) {
				const cardNext = card.root.next();
				if (cardNext && cardNext.isCard()) {
					event.preventDefault();
					this.engine.card.select(this.engine.card.find(cardNext)!);
					return false;
				} else {
					range.setEndAfter(card.root[0]);
					range.collapse(false);
					change.select(range);
				}
			}
		}
		return true;
	}

	block(card: CardInterface, event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.getRange();

		if (isHotkey('up', event) || isHotkey('ctrl+p', event)) {
			event.preventDefault();
			card.focusPrevBlock(range, false);
			change.select(range);
			return false;
		}

		if (isHotkey('down', event) || isHotkey('ctrl+n', event)) {
			event.preventDefault();
			card.focusNextBlock(range, false);
			change.select(range);
			return false;
		}
		// 左侧光标
		const cardLeft = range.commonAncestorNode.closest(CARD_LEFT_SELECTOR);
		if (cardLeft.length > 0) {
			if (
				isHotkey('left', event) ||
				isHotkey('ctrl+a', event) ||
				isHotkey('ctrl+b', event)
			) {
				event.preventDefault();
				card.focusPrevBlock(range, false);
				change.select(range);
				return false;
			}
			if (
				isHotkey('right', event) ||
				isHotkey('ctrl+e', event) ||
				isHotkey('ctrl+f', event)
			) {
				event.preventDefault();
				this.engine.card.select(card);
				return false;
			}
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
			if (
				isHotkey('left', event) ||
				isHotkey('ctrl+a', event) ||
				isHotkey('ctrl+b', event)
			) {
				event.preventDefault();
				this.engine.card.select(card);
				return false;
			}

			if (
				isHotkey('right', event) ||
				isHotkey('ctrl+e', event) ||
				isHotkey('ctrl+f', event)
			) {
				event.preventDefault();
				card.focusNextBlock(range, false);
				change.select(range);
				return false;
			}
			// 其它情况
			if (!event.metaKey && !event.ctrlKey) {
				card.focusNextBlock(range, true);
				change.select(range);
			}
		}
		if (this.engine.card.getSingleSelectedCard(range)) {
			if (
				isHotkey('left', event) ||
				isHotkey('ctrl+a', event) ||
				isHotkey('ctrl+b', event)
			) {
				event.preventDefault();
				card.focus(range, true);
				change.select(range);
				return false;
			}
			if (
				isHotkey('right', event) ||
				isHotkey('ctrl+e', event) ||
				isHotkey('ctrl+f', event)
			) {
				event.preventDefault();
				card.focus(range, false);
				change.select(range);
				return false;
			}
		}
		return true;
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
export default Directional;
