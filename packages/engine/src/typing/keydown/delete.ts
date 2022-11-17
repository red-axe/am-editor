import { RangeInterface, TypingHandleInterface } from '../../types';
import { CARD_KEY } from '../../constants';
import Range from '../../range';
import { $ } from '../../node';
import DefaultKeydown from './default';

class Delete extends DefaultKeydown implements TypingHandleInterface {
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey: string | string[] | ((event: KeyboardEvent) => boolean) = 'delete';

	getNext(node: Node): Node | null {
		const parent = node.parentElement ?? node.parentNode;
		return $(node).isEditable()
			? null
			: node.nextSibling
			? node.nextSibling
			: parent === null
			? null
			: this.getNext(parent);
	}

	getRange(node: Node, hasNext: boolean = false): RangeInterface | null {
		if ($(node).isEditable()) return null;
		if (!hasNext) {
			const next = this.getNext(node);
			if (!next) return null;
			node = next;
		}
		while (node) {
			const nodeDom = $(node);
			if (nodeDom.attributes(CARD_KEY)) {
				if (!node.ownerDocument) return null;
				const range = Range.create(this.engine, node.ownerDocument);
				range.setStartAfter(node);
				range.collapse(true);
				return range;
			}
			if (this.engine.node.isBlock(nodeDom)) {
				if (!node.ownerDocument) return null;
				const range = Range.create(this.engine, node.ownerDocument);
				range.select(nodeDom, true).collapse(true);
				return range;
			}
			if (nodeDom.name === 'br') {
				if (
					(node.parentElement ?? node.parentNode)?.childNodes
						.length === 1
				)
					return null;
				if (!node.ownerDocument) return null;
				const range = Range.create(this.engine, node.ownerDocument);
				range.setStartAfter(node);
				range.collapse(true);
				return range;
			}
			if (node.nodeType === Node.TEXT_NODE) {
				if (node['data'].length === 0) return this.getRange(node);
				if (!node.ownerDocument) return null;
				const range = Range.create(this.engine, node.ownerDocument);
				range.setStart(node, 1);
				range.collapse(true);
				return range;
			}
			if (node.childNodes.length === 0) return this.getRange(node);
			node = node.childNodes[0];
		}
		return null;
	}

	trigger(event: KeyboardEvent) {
		const { change } = this.engine;
		change.cacheRangeBeforeCommand();
		const range = change.range.get();
		if (!range.collapsed) {
			event.preventDefault();
			change.delete();
			return;
		}
		const card = this.engine.card.find(range.startNode);
		let hasNext = false;
		let nextNode: Node;
		if (card) {
			if (card.isLeftCursor(range.startNode)) {
				event.preventDefault();
				this.engine.card.select(card);
				change.delete();
				return;
			}
			if (!card.isRightCursor(range.startNode)) return;
			nextNode = card.root[0];
		} else if (range.endContainer.nodeType === Node.TEXT_NODE) {
			if (range.endContainer['data'].length > range.endOffset) {
				event.preventDefault();
				const cloneRange = range.cloneRange();
				cloneRange.setEnd(range.endContainer, range.endOffset + 1);
				change.range.select(cloneRange);
				change.delete();
				change.range.select(change.range.get().shrinkToTextNode());
				return;
			}
			nextNode = range.endContainer;
		} else {
			if (range.endContainer.nodeType !== Node.ELEMENT_NODE) return;
			if (range.endContainer.childNodes.length === 0) {
				nextNode = range.endContainer;
			} else if (range.endOffset === 0) {
				if (
					range.endContainer.childNodes.length !== 1 ||
					range.endContainer.firstChild?.nodeName !== 'BR'
				) {
					hasNext = true;
				}
				nextNode = range.endContainer.childNodes[range.endOffset];
			} else {
				nextNode = range.endContainer.childNodes[range.endOffset - 1];
			}
		}
		const nodeRange = this.getRange(nextNode, hasNext);
		if (nodeRange) {
			event.preventDefault();
			let { startOffset } = range;
			if (
				startOffset === 1 &&
				range.startContainer.childNodes.length === 1 &&
				range.startContainer.childNodes[0].nodeName === 'BR'
			)
				startOffset = 0;
			nodeRange.setStart(range.startContainer, startOffset);
			change.range.select(nodeRange);
			change.delete();
		}
		for (let i = 0; i < this.listeners.length; i++) {
			const listener = this.listeners[i];
			const result = listener(event);
			if (result === false) break;
		}
	}
}
export default Delete;
