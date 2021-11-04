import { EditorInterface } from '../types/engine';
import {
	PluginEntry,
	PluginInterface,
	PluginModelInterface,
	PluginOptions,
} from '../types/plugin';
import Plugin from './base';
import ElementPlugin from './element';
import BlockPlugin, { isBlockPlugin } from './block';
import InlinePlugin, { isInlinePlugin } from './inline';
import ListPlugin from './list';
import MarkPlugin, { isMarkPlugin } from './mark';
import { isEngine } from '../utils';

class PluginModel implements PluginModelInterface {
	protected data: { [k: string]: PluginEntry } = {};
	components: { [k: string]: PluginInterface } = {};
	protected editor: EditorInterface;
	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	init(plugins: Array<PluginEntry>, config: { [k: string]: PluginOptions }) {
		plugins.forEach((pluginClazz) => {
			this.data[pluginClazz.pluginName] = pluginClazz;
			const plugin = new pluginClazz(
				this.editor,
				config[pluginClazz.pluginName],
			);
			this.components[pluginClazz.pluginName] = plugin;
			if (plugin.init) plugin.init();
		});
	}

	add(clazz: PluginEntry, options?: PluginOptions) {
		this.data[clazz.pluginName] = clazz;
		options = { ...options };
		if (isEngine(this.editor)) {
			const plugin = new clazz(this.editor, options);
			if (plugin.init) plugin.init();
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
export default PluginModel;

export {
	Plugin,
	ElementPlugin,
	MarkPlugin,
	InlinePlugin,
	BlockPlugin,
	ListPlugin,
	isBlockPlugin,
	isInlinePlugin,
	isMarkPlugin,
};
