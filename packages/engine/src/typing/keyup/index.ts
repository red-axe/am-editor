import isHotkey from 'is-hotkey';
import $ from '../../model/node';
import { EngineInterface } from '../../types/engine';
import { pluginKeyupTrigger } from '../utils';

export default (engine: EngineInterface, event: KeyboardEvent) => {
  if (engine.readonly) {
    return;
  }
  const card = engine.card.find($(event.target || []));
  if (card) {
    return;
  }

  if (isHotkey('enter', event)) {
    pluginKeyupTrigger(engine, 'enter', event);
    return;
  }

  if (isHotkey('backspace', event)) {
    pluginKeyupTrigger(engine, 'backspace', event);
    return;
  }

  if (isHotkey('tab', event)) {
    pluginKeyupTrigger(engine, 'tab', event);
    return;
  }

  if (isHotkey('space', event)) {
    pluginKeyupTrigger(engine, 'space', event);
    return;
  }
};
