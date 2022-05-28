import { isEngine, Plugin, PluginOptions } from '@aomao/engine';

export interface RemoveformatOptions extends PluginOptions {
	hotkey?: string | Array<string>;
}
export default class<
	T extends RemoveformatOptions = RemoveformatOptions,
> extends Plugin<T> {
	static get pluginName() {
		return 'removeformat';
	}

	execute() {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, block, mark, inline } = editor;
		const blockApi = block;
		const range = change.range.get();
		const blocks = blockApi.getBlocks(range);
		// 没有mark和inline节点的时候才对block节点移除格式
		const marks = mark.findMarks(range);
		const inlines = inline.findInlines(range);
		if (marks.length > 0) {
			mark.unwrap();
		} else if (inlines.length > 0) {
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
