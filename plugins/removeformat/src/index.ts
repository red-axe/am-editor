import { Plugin } from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
};
export default class extends Plugin<Options> {
	execute() {
		if (!this.engine) return;
		const { change } = this.engine;
		const range = change.getRange();
		const blocks = range.getBlocks();
		blocks.forEach(block => {
			block.removeAttr('style');
		});
		change.removeMark();
	}

	hotkey() {
		return this.options.hotkey || 'mod+\\';
	}
}
