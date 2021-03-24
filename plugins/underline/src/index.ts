import { Mark } from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
};
export default class extends Mark<Options> {
	tagName = 'u';

	static get pluginName() {
		return 'underline';
	}

	hotkey() {
		return this.options.hotkey || 'mod+u';
	}
}
