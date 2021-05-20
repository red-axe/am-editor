import isHotkey from 'is-hotkey';
import {
	EngineInterface,
	EventListener,
	TypingHandleInterface,
} from '../../types';

class Right implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey = (event: KeyboardEvent) =>
		isHotkey('right', event) ||
		isHotkey('shift+right', event) ||
		isHotkey('ctrl+e', event) ||
		isHotkey('ctrl+f', event);

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
		for (let i = 0; i < this.listeners.length; i++) {
			const listener = this.listeners[i];
			const result = listener(event);
			if (result === false) break;
		}
	}

	destroy() {
		this.listeners = [];
	}
}
export default Right;
