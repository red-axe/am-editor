import {
	EngineInterface,
	EventListener,
	TypingHandleInterface,
} from '../../types';
import { $ } from '../../node';

class Backspace implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey: Array<string> | string = 'backspace';
	private engine: EngineInterface;
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

	trigger(event: KeyboardEvent) {
		const { change } = this.engine;
		const range = change.getRange();
		change.cacheRangeBeforeCommand();
		// 编辑器没有内容
		if (change.isEmpty()) {
			event.preventDefault();
			change.initValue();
			return;
		}
		// 可编辑卡片多选时清空内容
		const { commonAncestorNode } = range;
		const cardComponent = this.engine.card.find(commonAncestorNode, true);
		const selectionNodes = cardComponent?.isEditable
			? cardComponent?.getSelectionNodes
				? cardComponent.getSelectionNodes()
				: []
			: [];
		if (selectionNodes.length > 0) {
			selectionNodes.forEach((selectionNode) => {
				selectionNode.html('<p></br ></p>');
			});
			change.apply(
				range
					.cloneRange()
					.select(selectionNodes[0], true)
					.collapse(true),
			);
			return;
		}
		// 处理 BR
		const { startNode, startOffset } = range;
		if (startNode.isEditable()) {
			const child = startNode[0].childNodes[startOffset - 1];
			const lastNode = $(child);
			if (lastNode.name === 'br') {
				event.preventDefault();
				lastNode.remove();
				change.apply(range);
				return;
			}
		}
		let result: boolean | void = true;
		for (let i = 0; i < this.listeners.length; i++) {
			const listener = this.listeners[i];
			result = listener(event);
			if (result === false) break;
		}
		if (result === false) return;
		// 范围为展开状态
		if (!range.collapsed) {
			event.preventDefault();
			change.deleteContent(range);
			change.apply(range);
			return;
		}
	}

	destroy() {
		this.listeners = [];
	}
}

export default Backspace;
