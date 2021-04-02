import { Mark } from '@aomao/engine';
import './index.css';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};
export default class extends Mark<Options> {
	tagName = 'mark';

	static get pluginName() {
		return 'mark';
	}

	hotkey() {
		return this.options.hotkey || '';
	}

	markdown = this.options.markdown !== false ? '==' : '';
}
