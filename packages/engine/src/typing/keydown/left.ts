import isHotkey from 'is-hotkey';
import {
	EngineInterface,
	EventListener,
	TypingHandleInterface,
} from '../../types';

class Left implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey = (event: KeyboardEvent) =>
		isHotkey('left', event) ||
		isHotkey('ctrl+a', event) ||
		isHotkey('ctrl+b', event);

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
		const { startNode, startOffset } = range;
		const card = this.engine.card.getSingleCard(range);
		if (!card && range.collapsed && startNode.type === Node.TEXT_NODE) {
			const text = startNode.text();
			let prev = startNode.prev();
			let node = startNode;
			let offset = startOffset - 1;
			const prevText = prev?.text() || '';
			const leftText = text.substr(0, startOffset);
			if (/\u200B$/g.test(leftText)) {
				let parent = startNode.parent();
				if (!prev && parent) {
					while (
						!prev &&
						parent &&
						(this.engine.node.isInline(parent) ||
							this.engine.node.isMark(parent))
					) {
						prev = parent.prev();
						parent = parent?.parent();
					}

					const prevP = prev?.prev();
					if (
						prevP &&
						/^\u200B$/g.test(prev!.text()) &&
						(this.engine.node.isInline(prevP) ||
							this.engine.node.isMark(prevP))
					)
						return;

					if (prev) {
						node = prev;
						offset = prev.text().length;
					}
				}
				if (
					!prev ||
					(!this.engine.node.isInline(prev) &&
						!this.engine.node.isMark(prev))
				) {
					range.setStart(node, offset);
					range.setEnd(node, offset);
					change.select(range);
				}
			} else if (
				prev &&
				prev.type === Node.TEXT_NODE &&
				startOffset === 0 &&
				/\u200B$/g.test(prevText)
			) {
				let length = prevText.length - 1;
				if (length < 0) length = 0;
				range.setStart(prev, length);
				range.setEnd(prev, length);
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
export default Left;
