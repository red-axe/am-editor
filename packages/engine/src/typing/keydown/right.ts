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
		const { change } = this.engine;
		const range = change
			.getRange()
			.cloneRange()
			.shrinkToTextNode();
		const { startNode, startOffset, endNode, endOffset } = range;
		const card = this.engine.card.getSingleCard(range);
		if (!card && range.collapsed && startNode.type === Node.TEXT_NODE) {
			const text = startNode.text();
			const rightText = text.substr(startOffset);
			const next = startNode.next();
			if (/^\u200B/g.test(rightText)) {
				range.setStart(startNode, startOffset + 1);
				range.setEnd(endNode, endOffset + 1);
				change.select(range);
			} else if (
				next &&
				next.type === Node.TEXT_NODE &&
				startOffset === text.length &&
				/^\u200B/g.test(next.text())
			) {
				range.setStart(next, 1);
				range.setEnd(next, 1);
				change.select(range);
			}
		}
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
