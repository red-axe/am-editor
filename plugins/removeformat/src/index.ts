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
		const { change, block, mark, inline } = this.editor;
		const blockApi = block;
		const range = change.getRange();
		const blocks = blockApi.getBlocks(range);
		// 没有mark和inline节点的时候才对block节点移除格式
		if (change.marks.length > 0) {
			mark.unwrap();
		} else if (change.inlines.length > 0) {
			inline.unwrap();
		} else {
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
		}
	}

	hotkey() {
		return this.options.hotkey || 'mod+\\';
	}
}
