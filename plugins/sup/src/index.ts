import { MarkPlugin, PluginOptions } from '@aomao/engine';

export interface SupOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: string;
}
export default class<T extends SupOptions = SupOptions> extends MarkPlugin<T> {
	tagName = 'sup';

	static get pluginName() {
		return 'sup';
	}

	markdown =
		this.options.markdown === undefined ? '^' : this.options.markdown;

	hotkey() {
		return this.options.hotkey || 'mod+.';
	}
}
