import { EngineInterface, TypingHandleInterface } from '../../types';

class Tab implements TypingHandleInterface {
	private engine: EngineInterface;
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey: string | string[] | ((event: KeyboardEvent) => boolean) = 'tab';
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

	trigger(event: KeyboardEvent): void {
		const { node } = this.engine;
		event.preventDefault();
		node.insertText('    ');
	}

	destroy(): void {
		this.listeners = [];
	}
}
export default Tab;
