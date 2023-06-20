import { EditorInterface } from '../types/editor';
import {
	ElementPluginInterface,
	PluginEntry,
	PluginInterface,
	PluginModelInterface,
	PluginOptions,
} from '../types/plugin';
import Plugin from './base';
import ElementPlugin, { isElementPlugin } from './element';
import BlockPlugin, { isBlockPlugin } from './block';
import InlinePlugin, { isInlinePlugin } from './inline';
import ListPlugin from './list';
import MarkPlugin, { isMarkPlugin } from './mark';
import { isEngine } from '../utils';
import { BlockInterface } from '../types/block';
import { InlineInterface } from '../types/inline';
import { MarkInterface } from '../types/mark';

class PluginModel implements PluginModelInterface {
	protected data: Record<string, PluginEntry> = {};
	components: Record<string, PluginInterface<PluginOptions>> = {};
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
		const editor = this.editor;
		if (isEngine(editor)) {
			const plugin = new clazz(editor, options);
			if (plugin.init) plugin.init();
			this.components[clazz.pluginName] = plugin;
		}
	}

	findPlugin<T extends PluginOptions = PluginOptions>(
		pluginName: string,
	): PluginInterface<T> | undefined {
		const plugin = this.components[pluginName];
		if (!plugin) return;
		return plugin as PluginInterface<T>;
	}

	findElementPlugin<T extends PluginOptions = PluginOptions>(
		pluginName: string,
	): ElementPluginInterface<T> | undefined {
		const plugin = this.findPlugin<T>(pluginName);
		if (!plugin) return;
		if (isElementPlugin(plugin)) {
			return plugin as ElementPluginInterface<T>;
		}
		return;
	}
	findMarkPlugin<T extends PluginOptions = PluginOptions>(
		pluginName: string,
	): MarkInterface<T> | undefined {
		const plugin = this.findPlugin(pluginName);
		if (!plugin) return;
		if (isMarkPlugin(plugin)) {
			return plugin as MarkInterface<T>;
		}
		return;
	}
	findInlinePlugin<T extends PluginOptions = PluginOptions>(
		pluginName: string,
	): InlineInterface<T> | undefined {
		const plugin = this.findPlugin(pluginName);
		if (!plugin) return;
		if (isInlinePlugin(plugin)) {
			return plugin as InlineInterface<T>;
		}
		return;
	}

	findBlockPlugin<T extends PluginOptions = PluginOptions>(
		pluginName: string,
	): BlockInterface<T> | undefined {
		const plugin = this.findPlugin(pluginName);
		if (!plugin) return;
		if (isBlockPlugin(plugin)) {
			return plugin as BlockInterface<T>;
		}
		return;
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

	destroy() {
		Object.keys(this.components).forEach((pluginName) => {
			const plugin = this.components[pluginName];
			if (plugin.destroy) plugin.destroy();
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
