import isHotkey from 'is-hotkey';
import { EngineInterface } from '../types/engine';
import { HotkeyInterface } from '../types/hotkey';

class Hotkey implements HotkeyInterface {
  private engine: EngineInterface;
  private disabled: boolean = false;
  private data: { [k: string]: () => void } = {};
  constructor(engine: EngineInterface) {
    this.engine = engine;
    engine.container.on('keydown', this.handleKeydown);
  }

  handleKeydown = (e: KeyboardEvent) => {
    if (this.disabled) {
      return;
    }
    Object.keys(this.engine.plugin.components).every(name => {
      const plugin = this.engine.plugin.components[name];
      if (plugin.hotkey) {
        const result = plugin.hotkey(e);
        let isCommand = false;
        let commandArgs: any = [];
        if (typeof result === 'boolean' && result === true) {
          isCommand = true;
        } else if (typeof result === 'string' && isHotkey(result, e)) {
          isCommand = true;
        } else if (Array.isArray(result)) {
          result.forEach((item: { key: string; args: any } | string) => {
            if (isCommand) return;
            if (typeof item === 'string') {
              if (isHotkey(item, e)) {
                isCommand = true;
                commandArgs = [];
                return false;
              }
            } else {
              const { key, args } = item;
              if (isHotkey(key, e)) {
                isCommand = true;
                commandArgs = args;
                return false;
              }
            }

            return;
          });
        } else if (typeof result === 'object' && isHotkey(result.key, e)) {
          isCommand = true;
          commandArgs = result.args;
        }
        if (isCommand) {
          e.preventDefault();
          this.engine.command.execute(name, ...commandArgs);
          return false;
        }
      }
      return true;
    });
    Object.keys(this.data).every(hotkey => {
      const callback = this.data[hotkey];
      if (isHotkey(hotkey, e)) {
        e.preventDefault();
        callback();
        return false;
      }
      return true;
    });
  };

  set(key: string, name: string, ...args: any) {
    if (!key || key === '') return;
    this.data[key] = () => {
      this.engine.command.execute(name, ...args);
    };
  }

  enable() {
    this.disabled = false;
  }

  disable() {
    this.disabled = true;
  }

  destroy() {
    this.engine.container.off('keydown', this.handleKeydown);
  }
}
export default Hotkey;
