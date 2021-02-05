import isHotkey from 'is-hotkey';
import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants/card';
import { CardInterface } from '../../types/card';
import { EngineInterface } from '../../types/engine';
// Card 里的输入操作
export default (
  engine: EngineInterface,
  card: CardInterface,
  event: KeyboardEvent,
) => {
  const { change } = engine;
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
      change.selectCard(card);
      return false;
    }
    // 其它情况
    if (!event.metaKey && !event.ctrlKey) {
      card.focusPrevBlock(range, true);
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
      change.selectCard(card);
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
  if (engine.card.getSingleSelectedCard(range)) {
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
  return;
};
