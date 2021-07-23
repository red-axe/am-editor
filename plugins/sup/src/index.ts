import { MarkPlugin, PluginOptions } from '@aomao/engine';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}
export default class extends MarkPlugin<Options> {
	tagName = 'sup';

	static get pluginName() {
		return 'sup';
	}

	markdown = this.options.markdown !== false ? '^' : '';

	hotkey() {
		return this.options.hotkey || 'mod+.';
	}
}
