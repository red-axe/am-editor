import { MarkPlugin, PluginOptions } from '@aomao/engine';
import './index.css';

export interface MarkOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: string;
}
export default class<
	T extends MarkOptions = MarkOptions,
> extends MarkPlugin<T> {
	tagName = 'mark';

	static get pluginName() {
		return 'mark';
	}

	hotkey() {
		return this.options.hotkey || '';
	}

	markdown =
		this.options.markdown === undefined ? '==' : this.options.markdown;
}
