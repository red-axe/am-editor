import { MarkPlugin } from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};
export default class extends MarkPlugin<Options> {
	static get pluginName() {
		return 'bold';
	}

	tagName = 'strong';

	markdown = this.options.markdown !== false ? '**' : '';

	hotkey() {
		return this.options.hotkey || 'mod+b';
	}
}
