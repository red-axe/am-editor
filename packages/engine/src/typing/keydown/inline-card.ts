import isHotkey from 'is-hotkey';
import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants/card';
import { CardEntry, CardInterface } from '../../types/card';
import { EngineInterface } from '../../types/engine';

export default (
  engine: EngineInterface,
  card: CardInterface,
  event: KeyboardEvent,
) => {
  const { change } = engine;
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
        change.selectCard(card);
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
    return;
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
        change.selectCard(card);
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
        change.selectCard(engine.card.find(cardNext)!);
        return false;
      } else {
        range.setEndAfter(card.root[0]);
        range.collapse(false);
        change.select(range);
      }
    }
  }
  return;
};
