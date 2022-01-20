import { MarkPlugin, PluginOptions } from '@aomao/engine';

export interface SubOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: string;
}
export default class<T extends SubOptions = SubOptions> extends MarkPlugin<T> {
	tagName = 'sub';

	static get pluginName() {
		return 'sub';
	}

	hotkey() {
		return this.options.hotkey || 'mod+,';
	}

	markdown =
		this.options.markdown === undefined ? '~' : this.options.markdown;
}
