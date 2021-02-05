import { EngineInterface } from '../../types/engine';

export default (engine: EngineInterface, e: Event) => {
  const { change } = engine;
  const range = change.getRange();
  // <p><cursor />foo</p>
  if (!range.collapsed || range.isBlockFirstOffset('start')) {
    e.preventDefault();
    engine.command.execute('indent', true);
    return false;
  }
  e.preventDefault();
  change.insertText('    ');
  return false;
};
