import { isEngine, Plugin, PluginOptions } from '@aomao/engine';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
}
export default class extends Plugin<Options> {
	static get pluginName() {
		return 'removeformat';
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { change, block, mark } = this.editor;
		const blockApi = block;
		const range = change.getRange();
		const blocks = blockApi.getBlocks(range);
		const selection = range.createSelection('removeformat');
		blocks.forEach((block) => {
			const plugin = blockApi.findPlugin(
				block.name === 'li' ? block.parent()! : block,
			);
			if (plugin) {
				range.select(block).shrinkToElementNode();
				plugin.execute();
			}
			block.removeAttributes('style');
		});
		selection.move();
		mark.unwrap();
	}

	hotkey() {
		return this.options.hotkey || 'mod+\\';
	}
}
