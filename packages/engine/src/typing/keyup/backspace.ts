import { TypingHandleInterface } from '../../types';
import DefaultKeyup from './default';

class Backspace extends DefaultKeyup implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keyup';
	hotkey: Array<string> | string = 'backspace';

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
}

export default Backspace;
