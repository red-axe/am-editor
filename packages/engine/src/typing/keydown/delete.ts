import {
	EngineInterface,
	EventListener,
	RangeInterface,
	TypingHandleInterface,
} from '../../types';
import { getWindow } from '../../utils';
import { CARD_KEY } from '../../constants';
import Range from '../../range';

class Delete implements TypingHandleInterface {
	private engine: EngineInterface;
	type: 'keydown' | 'keyup' = 'keydown';
	hotkey: string | string[] | ((event: KeyboardEvent) => boolean) = 'delete';
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

	getNext(node: Node): Node | null {
		return this.engine.$(node).isRoot()
			? null
			: node.nextSibling
			? node.nextSibling
			: node.parentNode === null
			? null
			: this.getNext(node.parentNode);
	}

	getRange(node: Node, hasNext: boolean = false): RangeInterface | null {
		const { $ } = this.engine;
		if ($(node).isRoot()) return null;
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
				if (node.parentNode?.childNodes.length === 1) return null;
				if (!node.ownerDocument) return null;
				const range = Range.create(this.engine, node.ownerDocument);
				range.setStartAfter(node);
				range.collapse(true);
				return range;
			}
			if (node.nodeType === getWindow().Node.TEXT_NODE) {
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
		const range = change.getRange();
		if (!range.collapsed) {
			event.preventDefault();
			change.deleteContent();
			return;
		}
		const card = this.engine.card.find(range.startNode);
		let hasNext = false;
		let nextNode: Node;
		if (card) {
			if (card.isLeftCursor(range.startNode)) {
				event.preventDefault();
				this.engine.card.select(card);
				change.deleteContent();
				return;
			}
			if (!card.isRightCursor(range.startNode)) return;
			nextNode = card.root[0];
		} else if (range.endContainer.nodeType === getWindow().Node.TEXT_NODE) {
			if (range.endContainer['data'].length > range.endOffset) {
				event.preventDefault();
				const cloneRange = range.cloneRange();
				cloneRange.setEnd(range.endContainer, range.endOffset + 1);
				change.select(cloneRange);
				change.deleteContent();
				return;
			}
			nextNode = range.endContainer;
		} else {
			if (range.endContainer.nodeType !== getWindow().Node.ELEMENT_NODE)
				return;
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
			change.select(nodeRange);
			change.deleteContent();
		}
		for (let i = 0; i < this.listeners.length; i++) {
			const listener = this.listeners[i];
			const result = listener(event);
			if (result === false) break;
		}
	}
	destroy(): void {
		this.listeners = [];
	}
}
export default Delete;
