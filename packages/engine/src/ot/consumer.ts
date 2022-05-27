import Range from '../range';
import { unescapeDots, unescape } from '../utils/string';
import { JSON0_INDEX } from '../constants/ot';
import { EngineInterface } from '../types/engine';
import { Op, Path, StringInsertOp } from 'sharedb';
import {
	ConsumerInterface,
	RemoteAttr,
	RemotePath,
	TargetOp,
} from '../types/ot';
import { NodeInterface } from '../types/node';
import { getDocument } from '../utils';
import { isTransientElement, toDOM } from './utils';
import { $ } from '../node';
import { CARD_LOADING_KEY, DATA_ID, EDITABLE_SELECTOR } from '../constants';
import { RangePath } from '../types';
import { isNodeEntry } from '../node/utils';

class Consumer implements ConsumerInterface {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	getElementFromPath = (
		node: Node | NodeInterface,
		path: Path,
	): {
		startNode: Node;
		startOffset: number;
		endNode: Node;
		endOffset: number;
	} => {
		if (isNodeEntry(node)) node = node[0];
		const index = path[0] as number;
		if (index === JSON0_INDEX.ATTRIBUTE)
			return {
				startNode: node,
				startOffset: index,
				endNode: node,
				endOffset: index,
			};
		const offset = index - JSON0_INDEX.ELEMENT;
		// 正在加载中的节点，直接渲染
		if (node instanceof Element && node.hasAttribute(CARD_LOADING_KEY)) {
			const { card } = this.engine;
			const cardComponent = card.find(node);
			if (cardComponent) {
				cardComponent.getCenter().empty();
				card.renderComponent(cardComponent);
			}
		}
		const childNodes: Node[] = [];
		node.childNodes.forEach((child) => {
			if (!isTransientElement(child)) {
				childNodes.push(child);
			}
		});
		const childNode = childNodes[offset];
		const pathOffset = path[1];
		if (
			1 === path.length ||
			pathOffset === JSON0_INDEX.TAG_NAME ||
			pathOffset === JSON0_INDEX.ATTRIBUTE ||
			childNode instanceof Text
		) {
			return {
				startNode: childNode,
				startOffset: offset,
				endNode: node,
				endOffset: (pathOffset as number) || 0,
			};
		}
		return this.getElementFromPath(childNode, path.slice(1));
	};

	fromRemoteAttr(attr: RemoteAttr) {
		if (!attr) return;
		const { id, leftText, rightText } = attr;
		const node = this.engine.container
			.get<Element>()
			?.querySelector(`[${DATA_ID}="${id}"]`);
		if (!node) return;
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
			nextChild &&
			(nextChild.nodeType !== 3 ||
				(nextChild.textContent?.length || 0) < offset)
		) {
			if (nextChild.textContent?.length || 0 < offset) {
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

	getSideText(node: NodeInterface, offset: number): RemoteAttr | undefined {
		const idNode = this.engine.block.closest(node);
		if (idNode.length > 0) {
			const id = idNode.attributes(DATA_ID);
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

	setAttribute(
		root: NodeInterface,
		path: Path,
		attr: string,
		value: string,
		isRemote?: boolean,
	) {
		const { card } = this.engine;
		const { startNode } = this.getElementFromPath(root, path);
		const domNode = $(startNode);
		if (domNode && domNode.length > 0 && !domNode.isRoot()) {
			attr = unescapeDots(attr);
			value = unescape(value);
			domNode.get<Element>()?.setAttribute(attr, value);
			if (domNode.isCard()) {
				const component = card.find(domNode);
				if (!component) return;
				if (!component.isEditable) card.reRender(component);
				if (component.isEditable && component.onChange)
					component.onChange(isRemote ? 'remote' : 'local', domNode);
			}
		}
		return domNode;
	}

	removeAttribute(root: NodeInterface, path: Path, attr: string) {
		const { startNode } = this.getElementFromPath(root, path);
		const domNode = $(startNode);
		if (domNode.length > 0 && !domNode.isRoot()) {
			domNode.get<Element>()?.removeAttribute(attr);
		}
		return domNode;
	}

	insertNode(
		root: NodeInterface,
		path: Path,
		value: string | Op[] | Op[][],
		isRemote?: boolean,
	) {
		const { engine } = this;
		const { startNode, endNode } = this.getElementFromPath(root, path);
		const domBegine = $(startNode);
		const domEnd = $(endNode);
		if (
			domEnd.length > 0 &&
			!domBegine.isRoot() &&
			(!root.isCard() ||
				(root.isEditableCard() &&
					(domBegine.length === 0 ||
						domBegine.closest(EDITABLE_SELECTOR).isEditable())))
		) {
			const element =
				typeof value === 'string'
					? document.createTextNode(value)
					: toDOM(value);
			if (domBegine && domBegine.parent()) {
				domEnd.get()?.insertBefore(element, domBegine.get());
			} else {
				domEnd.get()?.insertBefore(element, null);
			}
			const node = $(element);
			if (node.isCard()) {
				node.attributes(CARD_LOADING_KEY, isRemote ? 'remote' : 'true');
			}
			engine.card.render(node);
			return node;
		}
		return;
	}

	deleteNode(root: NodeInterface, path: Path, isRemote?: boolean) {
		const { card } = this.engine;
		const { startNode } = this.getElementFromPath(root, path);
		const domBegine = $(startNode);
		if (domBegine.length > 0 && !domBegine.isRoot()) {
			const parent = domBegine.parent();
			if (domBegine.isCard()) {
				if (isRemote) card.removeRemote(domBegine);
				else {
					card.remove(domBegine, false);
				}
			} else domBegine.remove();
			return parent?.isRoot() ? undefined : parent;
		}
		return;
	}

	insertText(root: NodeInterface, path: Path, offset: number, text: string) {
		const { startNode, endNode } = this.getElementFromPath(root, path);
		const node = $(startNode);
		if (startNode && !node.isText()) return;
		const nodeValue =
			startNode && startNode.nodeValue ? startNode.nodeValue : '';
		const value =
			nodeValue.substring(0, offset) + text + nodeValue.substring(offset);
		if (startNode && startNode.parentNode === endNode)
			startNode.nodeValue = value;
		else if (!!value) {
			const textNode = document.createTextNode(value);
			if (endNode.firstChild?.nodeName === 'BR')
				endNode.firstChild.remove();
			endNode.insertBefore(textNode, endNode.firstChild);
		}
		return node;
	}

	deleteText(root: NodeInterface, path: Path, offset: number, text: string) {
		const { startNode } = this.getElementFromPath(root, path);
		const node = $(startNode);
		if (!node.isText()) return;
		const nodeValue =
			startNode && startNode.nodeValue ? startNode.nodeValue : '';
		const value =
			nodeValue.substring(0, offset) +
			nodeValue.substring(offset + text.length);
		startNode.nodeValue = value;
		return node;
	}

	handleOperation(op: TargetOp, isRemote?: boolean) {
		let path = op.p;
		let attr: string, offset: number;
		if (path.length !== 0) {
			let root = this.engine.container;
			if ('id' in op && op.id && op.bi && op.bi > -1) {
				const target = this.engine.container.find(
					`[${DATA_ID}="${op.id}"]`,
				);
				if (target.length > 0 && target.inEditor()) {
					root = target;
					path = path.slice(op.bi);
				}
			}
			if ('si' in op || 'sd' in op) {
				offset = path[path.length - 1] as number;
				path = path.slice(0, -1);
			}
			if ('oi' in op || 'od' in op) {
				attr = path[path.length - 1].toString();
				path = path.slice(0, -1);
			}
			if ('oi' in op) {
				return this.setAttribute(root, path, attr!, op.oi, isRemote);
			} else if ('od' in op) {
				return this.removeAttribute(root, path, attr!);
			} else if ('sd' in op) {
				return this.deleteText(root, path, offset!, op.sd);
			} else if ('si' in op) {
				return this.insertText(root, path, offset!, op.si);
			} else if ('ld' in op) {
				return this.deleteNode(root, path, isRemote);
			} else if ('li' in op) {
				return this.insertNode(root, path, op.li, isRemote);
			}
			return;
		}
		return;
	}

	handleRemoteOperations(ops: Op[]) {
		try {
			const path = this.getRangeRemotePath();
			const applyNodes: Array<NodeInterface> = [];
			ops.forEach((op) => {
				const applyNode = this.handleOperation(op, true);
				if (applyNode) applyNodes.push(applyNode);
			});
			if (path && this.engine.isFocus()) this.setRangeByRemotePath(path);
			this.engine.change.change(true, applyNodes);
			return applyNodes;
		} catch (error: any) {
			this.engine.messageError('ot', error);
			return [];
		}
	}

	handleSelfOperations(ops: Op[]) {
		const applyNodes: Array<NodeInterface> = [];
		ops.forEach((op) => {
			const applyNode = this.handleOperation(op);
			if (applyNode) applyNodes.push(applyNode);
		});
		this.engine.change.change(false, applyNodes);
		return applyNodes;
	}

	setRangeAfterOp(op: TargetOp) {
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
		let root = this.engine.container;
		if ('id' in op && op.id && op.bi && op.bi > -1) {
			const target = this.engine.container.find(
				`[${DATA_ID}="${op.id}"]`,
			);
			if (target.inEditor()) {
				root = target;
				path = path.slice(op.bi);
			}
		}
		const { startNode, endNode } = this.getElementFromPath(root, path);
		const range = Range.create(this.engine);
		if ('si' in op || 'sd' in op) {
			const node = startNode['data'] === '' ? endNode : startNode;
			const stringInsertOp = op as StringInsertOp;
			const rangeOffset =
				offset! + (stringInsertOp.si ? stringInsertOp.si.length : 0);
			range.setOffset(node, rangeOffset, rangeOffset);
			engine.change.range.select(range);
			return;
		}
		range
			.select(startNode || endNode.lastChild || endNode, true)
			.shrinkToElementNode()
			.collapse(false);
		engine.change.range.select(range);
	}

	getRangeRemotePath(): RemotePath | undefined {
		try {
			if (window.getSelection()?.rangeCount === 0) return;
			const range = Range.from(this.engine);
			if (!range || range.inCard()) return;
			if (range.startNode.isRoot()) range.shrinkToElementNode();
			const { startNode, startOffset, endNode, endOffset } = range;
			return {
				start: this.getSideText(startNode, startOffset),
				end: this.getSideText(endNode, endOffset),
			};
		} catch (error: any) {
			this.engine.messageError('ot', error);
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
				range.setEnd(endInfo.container, endInfo.offset);
			}
			this.engine.change.range.select(range, false);
		} catch (error: any) {
			this.engine.messageError('ot', error);
		}
	}

	setRangeByPath(path: { start: RangePath; end: RangePath }) {
		if (path) {
			let { start, end } = path;
			if (start && end) {
				const beginOffset = start.path[start.path.length - 1] as number;
				const endOffset = end.path[end.path.length - 1] as number;
				const startClone = start.path.slice();
				const endClone = end.path.slice();
				startClone.pop();
				endClone.pop();
				const { container, change } = this.engine;
				const startChild = start.id
					? container.find(`[${DATA_ID}="${start.id}"]`).get<Node>()
					: container.getChildByPath(
							startClone,
							(child) => !isTransientElement($(child)),
					  );
				if (!startChild) return;
				const endChild = end.id
					? container.find(`[${DATA_ID}="${end.id}"]`).get<Node>()
					: container.getChildByPath(
							endClone,
							(child) => !isTransientElement($(child)),
					  );
				if (!endChild) return;
				const getMaxOffset = (node: Node, offset: number) => {
					if (node.nodeType === getDocument().TEXT_NODE) {
						const text = node.textContent || '';
						return text.length < offset ? text.length : offset;
					} else {
						const childNodes = node.childNodes;
						return childNodes.length < offset
							? childNodes.length
							: offset;
					}
				};
				try {
					const range = change.range.get();
					if (
						startChild.nodeName === 'BR' ||
						this.engine.node.isVoid(startChild)
					) {
						range.select(startChild).collapse(false);
					} else {
						range.setStart(
							startChild,
							getMaxOffset(startChild, beginOffset),
						);
						range.setEnd(
							endChild,
							getMaxOffset(endChild, endOffset),
						);
					}
					if (!range.collapsed) {
						const startCard = this.engine.card.find(
							range.startNode,
							true,
						);
						const endCard = this.engine.card.find(
							range.endNode,
							true,
						);
						if (
							startCard &&
							endCard &&
							startCard?.root.equal(endCard.root)
						) {
							let startEditableElement =
								range.startNode.closest(EDITABLE_SELECTOR);
							if (startEditableElement.length === 0)
								startEditableElement =
									range.startNode.find(EDITABLE_SELECTOR);
							let endEditableElement =
								range.endNode.closest(EDITABLE_SELECTOR);
							if (endEditableElement.length === 0)
								endEditableElement =
									range.endNode.find(EDITABLE_SELECTOR);
							if (
								startEditableElement.length > 0 &&
								endEditableElement.length > 0 &&
								!startEditableElement.equal(endEditableElement)
							) {
								range.collapse(true);
							}
						}
					}

					change.range.select(range);
					range.scrollRangeIntoView();
				} catch (error: any) {
					this.engine.messageError('ot', error);
				}
			}
		}
	}
}
export default Consumer;
