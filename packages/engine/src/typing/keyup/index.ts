import isHotkey from 'is-hotkey';
import $ from '../../model/node';
import { EngineInterface } from '../../types/engine';

export default (engine: EngineInterface, event: KeyboardEvent) => {
  if (engine.readonly) {
    return;
  }
  const card = engine.card.find($(event.target || []));
  if (card) {
    return;
  }

  const pluginTrigger = (type: 'enter' | 'backspace' | 'space' | 'tab') => {
    return Object.keys(engine.plugin.components).every(name => {
      const plugin = engine.plugin.components[name];
      if (plugin.onCustomizeKeyup) {
        const reuslt = plugin.onCustomizeKeyup(type, event);
        if (reuslt === false) {
          return false;
        }
      }
      return true;
    });
  };

  if (isHotkey('enter', event)) {
    pluginTrigger('enter');
    return;
  }

  if (isHotkey('backspace', event)) {
    pluginTrigger('backspace');
    return;
  }

  if (isHotkey('tab', event)) {
    pluginTrigger('tab');
    return;
  }

  if (isHotkey('space', event)) {
    pluginTrigger('space');
    return;
  }
};
