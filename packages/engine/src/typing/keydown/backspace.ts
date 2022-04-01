import { NodeInterface, TypingHandleInterface } from '../../types';
import { $ } from '../../node';
import DefaultKeydown from './default';
import { CARD_CENTER_SELECTOR } from '../../constants';

class Backspace extends DefaultKeydown implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey: Array<string> | string = 'backspace';

	trigger(event: KeyboardEvent) {
		const { change, container } = this.engine;
		const range = change.range.get();
		change.cacheRangeBeforeCommand();
		// 编辑器没有内容
		if (change.isEmpty()) {
			event.preventDefault();
			container.empty();
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
		if (result === false) {
			if (this.engine.scrollNode)
				range.scrollIntoViewIfNeeded(
					this.engine.container,
					this.engine.scrollNode,
				);
			return;
		}
		// 范围为展开状态
		if (!range.collapsed) {
			event.preventDefault();
			const prev = startNode.prev();
			if (prev?.name === 'br') {
				prev.remove();
			}
			change.delete(range);
			const afterPrev = range.startNode.prev();
			if (
				afterPrev?.isCard() &&
				afterPrev.find(CARD_CENTER_SELECTOR).length === 0
			) {
				afterPrev.remove();
			}
			change.apply(range);
			if (this.engine.scrollNode)
				range.scrollIntoViewIfNeeded(
					this.engine.container,
					this.engine.scrollNode,
				);
			return;
		} else {
			let brNode: NodeInterface | undefined = undefined;
			if (this.engine.node.isBlock(startNode)) {
				const child = startNode[0].childNodes[startOffset - 1];
				brNode = $(child);
			} else if (startNode.name === 'br') {
				brNode = startNode;
			}
			if (brNode?.name === 'br') {
				const prev = brNode.prev();
				const next = brNode.next();
				const n = next?.next();
				const p = prev?.prev();
				// abc<br /><cursor /><br />
				if (
					prev?.name !== 'br' &&
					next?.name === 'br' &&
					n?.name !== 'br'
				) {
					event.preventDefault();
					brNode.remove();
					next.remove();
					change.apply(range.shrinkToTextNode());
				} else if (
					next?.name !== 'br' &&
					prev?.name === 'br' &&
					p?.name !== 'br'
				) {
					event.preventDefault();
					brNode.remove();
					prev.remove();
					change.apply(range.shrinkToTextNode());
				}
			}
		}
	}
}

export default Backspace;
