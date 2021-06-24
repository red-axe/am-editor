import { toDOM } from './jsonml';
import Range from '../range';
import { unescapeDots, unescape } from '../utils/string';
import { JSONML } from '../constants/ot';
import { EngineInterface } from '../types/engine';
import { Op, Path, StringInsertOp } from 'sharedb';
import { ApplierInterface, RemoteAttr, RemotePath } from '../types/ot';
import { isNodeEntry, NodeInterface } from '../types/node';
import { getWindow } from '../utils';
import { isTransientElement } from './utils';
import { $ } from '../node';

class Applier implements ApplierInterface {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	elementAtPath = (
		node: Node | NodeInterface,
		path: Path,
	): [Node, undefined | number, Node, number] => {
		if (isNodeEntry(node)) node = node[0];
		const index = path[0] as number;
		if (index === JSONML.ATTRIBUTE_INDEX)
			return [node, undefined, node, index];
		const offset = index - JSONML.ELEMENT_LIST_OFFSET;
		const childNode = Array.from(node.childNodes).filter((node) => {
			const childNode = $(node);
			return !isTransientElement(childNode);
		})[offset];
		const pathOffset = path[1];
		if (
			1 === path.length ||
			pathOffset === JSONML.TAG_NAME_INDEX ||
			pathOffset === JSONML.ATTRIBUTE_INDEX ||
			childNode.nodeType === getWindow().Node.TEXT_NODE
		) {
			return [childNode, offset, node, pathOffset as number];
		}
		return this.elementAtPath(childNode, path.slice(1));
	};

	fromRemoteAttr(attr: RemoteAttr) {
		if (!attr) return;
		const { id, leftText, rightText } = attr;
		const idNode = $(`[data-id="${id}"]`);
		if (idNode.length === 0) return;
		const node = idNode.get()!;
		const text = node.textContent || '';
		if (text === '')
			return {
				container: node,
				offset: 0,
			};
		if (text?.startsWith(leftText)) {
			let nextChild: Node | null | undefined = node.firstChild;
			let offset = leftText.length;
			while (
				nextChild &&
				(nextChild.nodeType !== 3 ||
					(nextChild.textContent?.length || 0) < offset)
			) {
				if ((nextChild.textContent?.length || 0) < offset) {
					offset -= nextChild.textContent?.length || 0;
					nextChild = nextChild.nextSibling;
				} else {
					nextChild = nextChild.firstChild;
				}
			}
			return {
				container: nextChild,
				offset,
			};
		}
		if (text?.endsWith(rightText)) {
			let offset = rightText.length;
			let prevChild: Node | null | undefined = node.lastChild;
			while (
				prevChild &&
				(prevChild.nodeType !== 3 ||
					(prevChild.textContent?.length || 0) < offset)
			) {
				if (prevChild.textContent?.length || 0 < offset) {
					offset -= prevChild?.textContent?.length || 0;
					prevChild = prevChild.previousSibling;
				} else {
					prevChild = prevChild.lastChild;
				}
			}
			return {
				container: prevChild,
				offset: prevChild?.textContent?.length || 0 - offset,
			};
		}
		let offset = 0;
		while (text[offset] === leftText[offset]) {
			offset++;
		}
		let nextChild: Node | null | undefined = node.firstChild;
		while (
			nextChild?.nodeType !== 3 ||
			(nextChild.textContent?.length || 0) < offset
		) {
			if (nextChild?.textContent?.length || 0 < offset) {
				offset -= nextChild?.textContent?.length || 0;
				nextChild = nextChild?.nextSibling;
			} else {
				nextChild = nextChild?.firstChild;
			}
		}
		return {
			container: nextChild,
			offset,
		};
	}

	getSideText(node: NodeInterface, offset: number): RemoteAttr | undefined {
		const idNode = node.closest('[data-id]');
		if (idNode.length > 0) {
			const id = idNode.attributes('data-id');
			const leftRange = Range.create(this.engine);
			const rightRange = Range.create(this.engine);
			leftRange.setStart(idNode[0], 0);
			leftRange.setEnd(node[0], offset);
			rightRange.setStart(node[0], offset);
			rightRange.setEnd(idNode[0], idNode[0].childNodes.length);
			return {
				id,
				leftText: leftRange.toString(),
				rightText: rightRange.toString(),
			};
		}
		return;
	}

	setAttribute(path: Path, attr: string, value: string) {
		const { engine } = this;
		const { card } = this.engine;
		const [node] = this.elementAtPath(engine.container[0], path);
		const domNode = $(node);
		if (
			(domNode && domNode.length > 0 && !domNode.isRoot()) ||
			/^data-selection-/.test(attr)
		) {
			attr = unescapeDots(attr);
			value = unescape(value);
			domNode.get<Element>()?.setAttribute(attr, value);
			if (domNode.isCard()) {
				const component = card.find(domNode);
				if (!component?.isEditable) card.render($(node));
			}
		}
	}

	removeAttribute(path: Path, attr: string) {
		const { engine } = this;
		const [node] = this.elementAtPath(engine.container[0], path);
		const domNode = $(node);
		if (
			(domNode.length > 0 && !domNode.isRoot()) ||
			/^data-selection-/.test(attr)
		) {
			domNode.get<Element>()?.removeAttribute(attr);
		}
	}

	insertNode(path: Path, value: string | Op[] | Op[][]) {
		const { engine } = this;
		const [begine, beginOffset, end] = this.elementAtPath(
			engine.container[0],
			path,
		);
		const domBegine = $(begine);
		const domEnd = $(end);
		if (domEnd.length > 0 && !domBegine.isRoot()) {
			const element =
				typeof value === 'string'
					? document.createTextNode(value)
					: toDOM(value);
			if (domBegine && domBegine.parent()) {
				domEnd.get()?.insertBefore(element, domBegine.get());
			} else {
				domEnd.get()?.insertBefore(element, null);
			}
			engine.card.render($(element));
		}
	}

	deleteNode(path: Path, isRemote?: boolean) {
		const { engine } = this;
		const [begine] = this.elementAtPath(engine.container[0], path);
		const domBegine = $(begine);
		if (domBegine.length > 0 && !domBegine.isRoot()) {
			if (domBegine.isCard()) {
				engine.readonly = false;
				if (isRemote) engine.card.removeRemote(domBegine);
				else {
					engine.card.remove(domBegine);
					const card = engine.card.find(domBegine);
					if (card && card.activated && engine.readonly) {
						engine.readonly = false;
						if (!engine.isFocus()) engine.focus();
					}
				}
			} else domBegine.remove();
		}
	}

	insertInText(path: Path, offset: number, text: string) {
		const { engine } = this;
		let [begine, beginOffset, end, endOffset] = this.elementAtPath(
			engine.container[0],
			path,
		);

		switch (endOffset) {
			case JSONML.TAG_NAME_INDEX:
				throw Error('Unsupported indexType JSONML.TAG_NAME_INDEX (0)');
			case JSONML.ATTRIBUTE_INDEX:
				throw Error('Unsupported indexType JSONML.ATTRIBUTE_INDEX (1)');
			default:
				if (begine && !$(begine).isText()) return;
				const nodeValue =
					begine && begine.nodeValue ? begine.nodeValue : '';
				const value =
					nodeValue.substring(0, offset) +
					text +
					nodeValue.substring(offset);
				if (begine && begine.parentNode === end)
					begine.nodeValue = value;
				else {
					const textNode = document.createTextNode(value);
					end.insertBefore(textNode, end.firstChild);
				}
		}
	}

	deleteInText(path: Path, offset: number, text: string) {
		const { engine } = this;
		let [begine, beginOffset, end, endOffset] = this.elementAtPath(
			engine.container[0],
			path,
		);
		switch (endOffset) {
			case JSONML.TAG_NAME_INDEX:
				throw Error('Unsupported indexType JSONML.TAG_NAME_INDEX (0)');
			case JSONML.ATTRIBUTE_INDEX:
				throw Error('Unsupported indexType JSONML.ATTRIBUTE_INDEX (1)');
			default:
				end = begine;
				if (!$(end).isText()) return;
				const nodeValue = end && end.nodeValue ? end.nodeValue : '';
				const value =
					nodeValue.substring(0, offset) +
					nodeValue.substring(offset + text.length);
				end.nodeValue = value;
		}
	}

	applyOperation(op: Op, isRemote?: boolean) {
		let path = op.p;
		let attr: string, offset: number;

		if (path.length !== 0) {
			if ('si' in op || 'sd' in op) {
				offset = path[path.length - 1] as number;
				path = path.slice(0, -1);
			}
			if ('oi' in op || 'od' in op) {
				attr = path[path.length - 1].toString();
				path = path.slice(0, -1);
			}
			if ('oi' in op) {
				return this.setAttribute(path, attr!, op.oi);
			} else if ('od' in op) {
				return this.removeAttribute(path, attr!);
			} else if ('sd' in op) {
				return this.deleteInText(path, offset!, op.sd);
			} else if ('si' in op) {
				return this.insertInText(path, offset!, op.si);
			} else if ('ld' in op) {
				return this.deleteNode(path, isRemote);
			} else if ('li' in op) {
				return this.insertNode(path, op.li);
			}
			return;
		}
	}

	applyRemoteOperations(ops: Op[]) {
		try {
			const path = this.getRangeRemotePath();
			ops.forEach((op) => this.applyOperation(op, true));
			if (path) this.setRangeByRemotePath(path);
			this.engine.change.change(true);
		} catch (error) {
			console.log(error);
		}
	}

	applySelfOperations(ops: Op[]) {
		ops.forEach((op) => this.applyOperation(op));
		this.engine.change.change();
	}

	setRangeAfterOp(op: Op) {
		const { engine } = this;
		let offset: number;
		let path = op.p;
		if ('si' in op || 'sd' in op) {
			offset = path[path.length - 1] as number;
			path = path.slice(0, -1);
		}
		if ('oi' in op || 'od' in op) {
			path = path.slice(0, -1);
		}
		const [begine, beginOffset, end] = this.elementAtPath(
			engine.container[0],
			path,
		);
		const range = Range.create(this.engine);
		if ('si' in op || 'sd' in op) {
			const node = begine['data'] === '' ? end : begine;
			const stringInsertOp = op as StringInsertOp;
			const rangeOffset =
				offset! + (stringInsertOp.si ? stringInsertOp.si.length : 0);
			range.setOffset(node, rangeOffset, rangeOffset);
			engine.change.select(range);
			return;
		}
		range
			.select(begine || end.lastChild || end, true)
			.shrinkToElementNode()
			.collapse(false);
		engine.change.select(range);
	}

	getRangeRemotePath(): RemotePath | undefined {
		try {
			if (window.getSelection()?.rangeCount === 0) return;
			const range = Range.from(this.engine);
			if (!range || range.inCard()) return;
			const { startNode, startOffset, endNode, endOffset } = range;
			return {
				start: this.getSideText(startNode, startOffset),
				end: this.getSideText(endNode, endOffset),
			};
		} catch (error) {
			console.log(error);
			return;
		}
	}

	setRangeByRemotePath(path: RemotePath) {
		try {
			const selection = window.getSelection();
			const range = selection
				? Range.from(this.engine, selection)?.cloneRange()
				: undefined;
			if (!range) return;
			const { start, end } = path;

			let startInfo;
			let endInfo;
			if (start) startInfo = this.fromRemoteAttr(start);
			if (end) endInfo = this.fromRemoteAttr(end);

			if (startInfo && startInfo.container) {
				range.setStart(startInfo.container, startInfo.offset);
			}
			if (endInfo && endInfo.container) {
				range.setStart(endInfo.container, endInfo.offset);
			}
			selection!.removeAllRanges();
			this.engine.change.select(range);
		} catch (error) {
			console.log(error);
		}
	}

	setRangeByPath(path: Path[]) {
		if (path) {
			let [start, end] = path;
			if (start && end) {
				const beginOffset = start[start.length - 1] as number;
				const endOffset = end[end.length - 1] as number;
				const startClone = start.slice();
				const endClone = end.slice();
				startClone.pop();
				endClone.pop();
				const { container, change } = this.engine;
				const startChild = container.getChildByPath(
					startClone,
					(child) => !isTransientElement($(child)),
				);
				const endChild = container.getChildByPath(
					endClone,
					(child) => !isTransientElement($(child)),
				);
				try {
					const range = change.getRange();
					range.setStart(startChild, beginOffset);
					range.setEnd(endChild, endOffset);
					change.select(range);
					range.scrollRangeIntoView();
				} catch (error) {
					console.log(error);
				}
			}
		}
	}
}
export default Applier;
