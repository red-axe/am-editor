import { ViewInterface } from '../types/view';
import { EngineInterface } from '../types/engine';
import {
	PluginEntry,
	PluginInterface,
	PluginModelInterface,
} from '../types/plugin';

class Plugin implements PluginModelInterface {
	protected data: { [k: string]: PluginEntry } = {};
	components: { [k: string]: PluginInterface } = {};
	protected engine?: EngineInterface;
	protected view?: ViewInterface;
	constructor(engine?: EngineInterface, view?: ViewInterface) {
		this.engine = engine;
		this.view = view;
	}

	add(name: string, clazz: PluginEntry) {
		this.data[name] = clazz;
		if (this.engine) {
			const plugin = new clazz(name, {
				engine: this.engine,
				view: this.view,
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
			if (callback && callback(name, this.data[name], index) === false)
				return;
		});
	}

	setEngine(engine: EngineInterface) {
		this.engine = engine;
	}

	setContentView(view: ViewInterface) {
		this.view = view;
	}
}
export default Plugin;
