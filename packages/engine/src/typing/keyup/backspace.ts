import {
	EngineInterface,
	EventListener,
	TypingHandleInterface,
} from '../../types';

class Backspace implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keyup';
	hotkey: Array<string> | string = 'backspace';
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
		// 编辑器没有内容
		if (change.isEmpty()) {
			event.preventDefault();
			return;
		}

		let result: boolean | void = true;
		for (let i = 0; i < this.listeners.length; i++) {
			const listener = this.listeners[i];
			result = listener(event);
			if (result === false) break;
		}
	}

	destroy() {
		this.listeners = [];
	}
}

export default Backspace;
