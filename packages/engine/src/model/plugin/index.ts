import { ContentViewInterface } from '../../types/content-view';
import { EngineInterface } from '../../types/engine';
import {
  PluginEntry,
  PluginInterface,
  PluginModelInterface,
} from '../../types/plugin';

class Plugin implements PluginModelInterface {
  protected data: { [k: string]: PluginEntry } = {};
  components: { [k: string]: PluginInterface } = {};
  protected engine?: EngineInterface;
  protected contentView?: ContentViewInterface;
  constructor(engine?: EngineInterface, contentView?: ContentViewInterface) {
    this.engine = engine;
    this.contentView = contentView;
  }

  add(name: string, clazz: PluginEntry) {
    this.data[name] = clazz;
    if (this.engine) {
      const plugin = new clazz(name, {
        engine: this.engine,
        contentView: this.contentView,
      });
      this.components[name] = plugin;
    }
  }

  each(
    callback: (
      name: string,
      clazz: PluginEntry,
      index?: number,
    ) => boolean | void,
  ): void {
    Object.keys(this.data).forEach((name, index) => {
      if (callback && callback(name, this.data[name], index) === false) return;
    });
  }

  setEngine(engine: EngineInterface) {
    this.engine = engine;
  }

  setContentView(contentView: ContentViewInterface) {
    this.contentView = contentView;
  }
}
export default Plugin;
