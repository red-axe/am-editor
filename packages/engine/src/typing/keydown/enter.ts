import {
	EngineInterface,
	EventListener,
	TypingHandleInterface,
} from '../../types';

class Enter implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey: Array<string> | string = 'enter';
	private engine: EngineInterface;
	private listeners: Array<EventListener> = [];
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	on(listener: EventListener) {
		this.listeners.push(listener);
	}

	off(listener: EventListener) {
		for (let i = 0; i < this.listeners.length; i++) {
			if (this.listeners[i] === listener) {
				this.listeners.splice(i, 1);
				break;
			}
		}
	}

	trigger(event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.getRange();
		// 选区选中最后的节点
		const block = this.engine.block.closest(range.endNode);
		// 无段落
		if (block.isRoot()) {
			this.engine.block.wrap('<p />');
		}
		for (let i = 0; i < this.listeners.length; i++) {
			const listener = this.listeners[i];
			const result = listener(event);
			if (result === false) break;
		}
		if (this.engine.scrollNode)
			this.engine.change
				.getRange()
				.scrollIntoViewIfNeeded(
					this.engine.container,
					this.engine.scrollNode,
				);
	}

	destroy() {
		this.listeners = [];
	}
}

export default Enter;
