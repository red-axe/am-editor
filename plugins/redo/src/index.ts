import { Plugin } from '@aomao/engine';

export type Options = {
  hotkey?: string | Array<string>;
};
export default class extends Plugin<Options> {
  execute() {
    if (!this.engine) return;
    this.engine.readonly = false;
    this.engine.history.redo();
  }

  queryState() {
    return this.engine?.history.hasRedo();
  }

  hotkey() {
    return this.options.hotkey || ['mod+y', 'shift+mod+z'];
  }
}
