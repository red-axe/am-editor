import { NodeInterface, Mark } from '@aomao/engine';
import './index.css';

const TAG_NAME = 'mark';
export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};
export default class extends Mark<Options> {
	tagName = 'mark';

	static get pluginName() {
		return 'mark';
	}

	markdown = this.options.markdown !== false ? '==' : '';
}
