import {
	EngineInterface,
	EventListener,
	TypingHandleInterface,
} from '../../types';
import { $ } from '../../node';

class ShitEnter implements TypingHandleInterface {
	private engine: EngineInterface;
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey: string | string[] | ((event: KeyboardEvent) => boolean) =
		'shift+enter';
	listeners: Array<EventListener> = [];

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
		const { change, inline, block } = this.engine;
		event.preventDefault();
		change.cacheRangeBeforeCommand();
		const range = change.range.get();
		const br = $('<br />');
		inline.insert(br, range);
		// Chrome 问题：<h1>foo<br /><cursor /></h1> 时候需要再插入一个 br，否则没有换行效果
		if (block.isLastOffset(range, 'end')) {
			if (!br.next() || br.next()?.name !== 'br') {
				const cloneBr = br.clone();
				br.after(cloneBr);
				range.select(cloneBr).collapse(false);
			}
		}
		for (let i = 0; i < this.listeners.length; i++) {
			const listener = this.listeners[i];
			const result = listener(event);
			if (result === false) break;
		}
		change.apply(range);
		if (this.engine.scrollNode)
			this.engine.change.range
				.get()
				.scrollIntoViewIfNeeded(
					this.engine.container,
					this.engine.scrollNode,
				);
	}
	destroy(): void {
		this.listeners = [];
	}
}

export default ShitEnter;
