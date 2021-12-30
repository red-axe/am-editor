import { TypingHandleInterface } from '../../types';
import { $ } from '../../node';
import DefaultKeydown from './default';

class ShitEnter extends DefaultKeydown implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey: string | string[] | ((event: KeyboardEvent) => boolean) =
		'shift+enter';

	trigger(event: KeyboardEvent): void {
		const { change, inline, block } = this.engine;
		event.preventDefault();
		change.cacheRangeBeforeCommand();
		const range = change.range.get();
		if (range.startNode.closest('li').length === 0) {
			this.engine.typing
				.getHandleListener('enter', 'keydown')
				?.trigger(event);
			return;
		} else {
			const br = $('<br />');
			inline.insert(br, range);
			if (block.isLastOffset(range, 'end')) {
				if (
					(!br.next() || br.next()?.name !== 'br') &&
					(!br.prev() || br.prev()?.name !== 'br')
				) {
					const cloneBr = br.clone();
					br.after(cloneBr);
					range.select(cloneBr).collapse(false);
				}
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
}

export default ShitEnter;
