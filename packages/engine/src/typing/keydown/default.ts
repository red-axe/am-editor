import {
	EngineInterface,
	TypingEventListener,
	TypingHandleInterface,
} from '../../types';

class DefaultKeydown implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey: string | string[] | ((event: KeyboardEvent) => boolean) = '';
	listeners: Array<TypingEventListener> = [];
	engine: EngineInterface;

	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	on(listener: TypingEventListener) {
		this.listeners.push(listener);
	}

	unshiftOn(listener: TypingEventListener) {
		this.listeners.unshift(listener);
	}

	off(listener: TypingEventListener) {
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

export default DefaultKeydown;
