import { MarkPlugin } from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};
export default class extends MarkPlugin<Options> {
	tagName = 'sub';

	static get pluginName() {
		return 'sub';
	}

	hotkey() {
		return this.options.hotkey || 'mod+,';
	}

	markdown = this.options.markdown !== false ? '~' : '';
}
