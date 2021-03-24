import { EditorInterface, isEngine } from '../types/engine';
import {
	PluginEntry,
	PluginInterface,
	PluginModelInterface,
	PluginOptions,
} from '../types/plugin';

class Plugin implements PluginModelInterface {
	protected data: { [k: string]: PluginEntry } = {};
	components: { [k: string]: PluginInterface } = {};
	protected editor: EditorInterface;
	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	init(plugins: Array<PluginEntry>, config: { [k: string]: PluginOptions }) {
		plugins.forEach(pluginClazz => {
			this.data[pluginClazz.pluginName] = pluginClazz;
			const plugin = new pluginClazz(
				this.editor,
				config[pluginClazz.pluginName],
			);
			this.components[pluginClazz.pluginName] = plugin;
			plugin.init();
		});
	}

	add(clazz: PluginEntry, options?: PluginOptions) {
		this.data[clazz.pluginName] = clazz;
		options = { ...options, editor: this.editor };
		if (isEngine(this.editor)) {
			const plugin = new clazz(this.editor, options);
			plugin.init();
			this.components[clazz.pluginName] = plugin;
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
}
export default Plugin;
