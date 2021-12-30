import { TypingHandleInterface } from '../../types';
import DefaultKeydown from './default';

class Enter extends DefaultKeydown implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey: Array<string> | string = 'enter';

	trigger(event: KeyboardEvent) {
		const { change } = this.engine;
		change.cacheRangeBeforeCommand();
		const range = change.range.get();
		// 选区选中最后的节点
		const block = this.engine.block.closest(range.endNode);
		// 无段落
		if (block.isEditable()) {
			this.engine.block.wrap('<p />');
		}
		for (let i = 0; i < this.listeners.length; i++) {
			const listener = this.listeners[i];
			const result = listener(event);
			if (result === false) break;
		}
		if (this.engine.scrollNode)
			this.engine.change.range
				.get()
				.scrollIntoViewIfNeeded(
					this.engine.container,
					this.engine.scrollNode,
				);
		this.engine.trigger('select');
	}
}

export default Enter;
