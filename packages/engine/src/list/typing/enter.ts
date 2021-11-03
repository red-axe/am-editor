import { EngineInterface, PluginEntry } from '../../types';
import Backspace from './backspace';

class Enter {
	private engine: EngineInterface;
	private backspace: Backspace;
	constructor(engine: EngineInterface) {
		this.engine = engine;
		this.backspace = new Backspace(engine);
	}

	trigger(event: KeyboardEvent) {
		const { change, command, list } = this.engine;
		let range = change.range.get();
		range.shrinkToElementNode();
		const startBlock = this.engine.block.closest(range.startNode);
		const endBlock = this.engine.block.closest(range.endNode);
		//选区开始或结束位置为li
		if ('li' === startBlock.name || 'li' === endBlock.name) {
			//选区为展开状态，先删除
			if (!range.collapsed) {
				this.backspace.trigger(
					event,
					startBlock.name !== endBlock.name,
				);
				range = change.range.get();
			}
			event.preventDefault();
			//如果光标在列表结尾或者开始位置
			const pluginName = list.getPluginNameByNode(startBlock);
			if (list.isLast(range) && list.isFirst(range)) {
				command.execute(pluginName);
			} else {
				this.engine.block.split();
				range = change.range.get();
				//const selection = range.createSelection();
				const block = this.engine.block.closest(range.endNode);
				const plugin = list
					.getPlugins()
					.find(
						(plugin) =>
							pluginName ===
							(plugin.constructor as PluginEntry).pluginName,
					);
				if (!plugin) return;
				if (plugin.cardName) {
					const prev = block.prev();
					if (prev) {
						list.addCardToCustomize(prev, plugin.cardName);
						list.addBr(prev);
					}
					list.addCardToCustomize(block, plugin.cardName);
					list.addBr(block);
					const next = block.next();
					if (next) {
						list.addCardToCustomize(next, plugin.cardName);
						list.addBr(next);
					}
				}
				list.merge(undefined, range);
				list.addBr(range.startNode.closest('ul'));
				range.setStart(
					block,
					this.engine.node.isCustomize(block) ? 1 : 0,
				);
				range.collapse(true).shrinkToTextNode();
				change.apply(range);
			}
			range.scrollIntoView();
			return false;
		}
		return true;
	}
}

export default Enter;
