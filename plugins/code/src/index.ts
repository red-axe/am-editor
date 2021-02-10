import { $, Plugin } from '@aomao/engine';
import './index.css';

const TAG_NAME = 'code';
export type Options = {
	hotkey?: string | Array<string>;
};
export default class extends Plugin<Options> {
	execute() {
		if (!this.engine) return;
		const mark = `<${TAG_NAME} />`;
		const { change } = this.engine;
		if (!this.queryState()) {
			change.addMark(mark, $(document.createTextNode('\u200b')));
		} else {
			change.removeMark(mark);
		}
	}

	queryState() {
		if (!this.engine) return;
		const { change } = this.engine;
		return change.marks.some(node => node.name === TAG_NAME);
	}

	hotkey() {
		return this.options.hotkey || 'mod+e';
	}

	schema() {
		return TAG_NAME;
	}
}
