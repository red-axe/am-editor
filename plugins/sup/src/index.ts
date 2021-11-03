import { MarkPlugin, PluginOptions } from '@aomao/engine';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: string;
}
export default class extends MarkPlugin<Options> {
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
