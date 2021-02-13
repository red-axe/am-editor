import { Plugin } from '@aomao/engine';
import './index.css';

const TAG_NAME = 'mark';
export type Options = {
	hotkey?: string | Array<string>;
};
export default class extends Plugin<Options> {
	execute() {
		if (!this.engine) return;
		const mark = `<${TAG_NAME} />`;
		const { change } = this.engine;
		if (!this.queryState()) {
			change.addMark(mark);
		} else {
			change.removeMark(mark);
		}
	}

	queryState() {
		if (!this.engine) return;
		const { change } = this.engine;
		return change.marks.some(node => node.name === TAG_NAME);
	}
	schema() {
		return TAG_NAME;
	}
}
