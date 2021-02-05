import { EngineInterface } from '../../types/engine';

// shift + Tab 键
const shiftTab = (engine: EngineInterface, e: Event) => {
  e.preventDefault();
  engine.command.execute('outdent');
  return false;
};
export default shiftTab;
