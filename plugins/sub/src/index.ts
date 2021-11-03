import { MarkPlugin, PluginOptions } from '@aomao/engine';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: string;
}
export default class extends MarkPlugin<Options> {
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
