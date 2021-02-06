import { Plugin } from '@aomao/engine';
import { addPadding } from '@aomao/plugin-indent';

export type Options = {
	hotkey?: string | Array<string>;
	maxPadding?: number;
};

export default class extends Plugin<Options> {
	execute() {
		if (!this.engine) return;
		const { change } = this.engine;
		change.separateBlocks();
		const range = change.getRange();
		const blocks = range.getActiveBlocks();
		// 没找到目标 block
		if (!blocks) {
			return;
		}
		const maxPadding = this.options.maxPadding || 50;
		// 其它情况
		blocks.forEach(block => {
			addPadding(block, -2, false, maxPadding);
		});
		change.mergeAdjacentList();
	}

	hotkey() {
		return this.options.hotkey || 'mod+[';
	}
}
