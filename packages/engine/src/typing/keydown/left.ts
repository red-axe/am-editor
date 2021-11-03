import isHotkey from 'is-hotkey';
import { EventListener, TypingHandleInterface } from '../../types';

class Left implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey = (event: KeyboardEvent) =>
		isHotkey('left', event) ||
		isHotkey('shift+left', event) ||
		isHotkey('ctrl+a', event) ||
		isHotkey('ctrl+b', event);

	listeners: Array<EventListener> = [];

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
export default Left;
