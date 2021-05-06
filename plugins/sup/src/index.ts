import { MarkPlugin } from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};
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
