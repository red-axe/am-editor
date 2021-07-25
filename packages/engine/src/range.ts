import { isNodeEntry, NodeInterface } from './types/node';
import { isRange, isSelection, RangeInterface } from './types/range';
import { getWindow, isMobile } from './utils';
import { CARD_SELECTOR } from './constants/card';
import { ANCHOR, CURSOR, FOCUS } from './constants/selection';
import {
	DATA_ELEMENT,
	DATA_TRANSIENT_ELEMENT,
	EDITABLE_SELECTOR,
	UI,
} from './constants/root';
import Selection from './selection';
import { SelectionInterface } from './types/selection';
import { EditorInterface } from './types/engine';
import { Path } from 'sharedb';
import { $ } from './node';
import { CardEntry } from './types/card';

class Range implements RangeInterface {
	private editor: EditorInterface;
	static create: (
		editor: EditorInterface,
		doc?: Document,
		point?: { x: number; y: number },
	) => RangeInterface;
	static from: (
		editor: EditorInterface,
		win?: Window | globalThis.Selection | globalThis.Range,
		clone?: boolean,
	) => RangeInterface | null;

	static fromPath: (
		editor: EditorInterface,
		path: Path[],
		context?: NodeInterface,
	) => RangeInterface;

	base: globalThis.Range;

	get collapsed() {
		return this.base.collapsed;
	}

	get endOffset() {
		return this.base.endOffset;
	}

	get startOffset() {
		return this.base.startOffset;
	}

	get startContainer() {
		return this.base.startContainer;
	}

	get endContainer() {
		return this.base.endContainer;
	}

	get commonAncestorContainer() {
		return this.base.commonAncestorContainer;
	}

	constructor(editor: EditorInterface, range: globalThis.Range) {
		this.editor = editor;
		this.base = range;
	}

	cloneContents(): DocumentFragment {
		return this.base.cloneContents();
	}

	deleteContents(): void {
		return this.base.deleteContents();
	}

	extractContents(): DocumentFragment {
		return this.base.extractContents();
	}
	getBoundingClientRect(): DOMRect {
		return this.base.getBoundingClientRect();
	}
	getClientRects(): DOMRectList {
		return this.base.getClientRects();
	}

	insertNode(node: Node | NodeInterface): void {
		if (isNodeEntry(node)) node = node[0];
		const startNode = this.startNode;
		if (
			!$(node).isCursor() &&
			startNode.name === 'p' &&
			startNode.children().length === 1 &&
			startNode.first()?.name === 'br'
		) {
			startNode.first()?.remove();
		} else if (startNode.name === 'br') {
			startNode.remove();
		}
		return this.base.insertNode(node);
	}

	isPointInRange(node: Node | NodeInterface, offset: number): boolean {
		if (isNodeEntry(node)) node = node[0];
		return this.base.isPointInRange(node, offset);
	}

	comparePoint(node: Node | NodeInterface, offset: number): number {
		if (isNodeEntry(node)) node = node[0];
		return this.base.comparePoint(node, offset);
	}

	setEnd(node: Node | NodeInterface, offset: number): void {
		if (isNodeEntry(node)) node = node[0];
		return this.base.setEnd(node, offset);
	}
	setEndAfter(node: Node | NodeInterface): void {
		if (isNodeEntry(node)) node = node[0];
		return this.base.setEndAfter(node);
	}
	setEndBefore(node: Node | NodeInterface): void {
		if (isNodeEntry(node)) node = node[0];
		return this.base.setEndBefore(node);
	}
	setStart(node: Node | NodeInterface, offset: number): void {
		if (isNodeEntry(node)) node = node[0];
		return this.base.setStart(node, offset);
	}
	setStartAfter(node: Node | NodeInterface): void {
		if (isNodeEntry(node)) node = node[0];
		return this.base.setStartAfter(node);
	}
	setStartBefore(node: Node | NodeInterface): void {
		if (isNodeEntry(node)) node = node[0];
		return this.base.setStartBefore(node);
	}

	toString() {
		return this.base.toString();
	}

	get startNode() {
		return $(this.base.startContainer);
	}

	get endNode() {
		return $(this.base.endContainer);
	}

	get commonAncestorNode() {
		return $(this.base.commonAncestorContainer);
	}

	toRange = (): globalThis.Range => {
		return this.base;
	};

	collapse = (toStart?: boolean) => {
		this.base.collapse(toStart);
		return this;
	};

	cloneRange = () => {
		return Range.from(this.editor, this.base.cloneRange())!;
	};
	/**
	 * 选中一个节点
	 * @param node 节点
	 * @param contents 是否只选中内容
	 */
	select = (node: NodeInterface | Node, contents?: boolean) => {
		if (contents) {
			this.base.selectNodeContents(isNodeEntry(node) ? node[0] : node);
		} else {
			this.base.selectNode(isNodeEntry(node) ? node[0] : node);
		}
		return this;
	};

	getText = (): string | null => {
		const contents = this.cloneContents();
		return contents.textContent;
	};

	/**
	 * 获取光标所占的区域
	 */
	getClientRect = (): DOMRect => {
		let item = this.getClientRects().item(0);
		if (!item) {
			item = this.getBoundingClientRect();
		}
		return item;
	};

	/**
	 * 将选择标记从 TextNode 扩大到最近非TextNode节点
	 * range 实质所选择的内容不变
	 */
	enlargeFromTextNode = () => {
		const enlargePosition = (node: Node, offset: number, type: string) => {
			if (node.nodeType !== getWindow().Node.TEXT_NODE) {
				return;
			}
			if (offset === 0) {
				switch (type) {
					case 'start':
						this.setStartBefore(node);
						break;
					case 'end':
						this.setEndBefore(node);
						break;
				}
			} else if (offset === node.nodeValue?.length) {
				switch (type) {
					case 'start':
						this.setStartAfter(node);
						break;
					case 'end':
						this.setEndAfter(node);
						break;
				}
			}
		};
		enlargePosition(this.startContainer, this.startOffset, 'start');
		enlargePosition(this.endContainer, this.endOffset, 'end');
		return this;
	};

	/**
	 * 将选择标记从非 TextNode 缩小到TextNode节点上，与 enlargeFromTextNode 相反
	 * range 实质所选择的内容不变
	 */
	shrinkToTextNode = () => {
		const shrinkPosition = (node: Node, offset: number, type: string) => {
			if (node.nodeType !== getWindow().Node.ELEMENT_NODE) {
				return;
			}

			const childNodes = node.childNodes;
			if (childNodes.length === 0) {
				return;
			}

			let left;
			let right;
			let child;

			if (offset > 0) {
				left = childNodes[offset - 1];
			}

			if (offset < childNodes.length) {
				right = childNodes[offset];
			}

			if (left && left.nodeType === getWindow().Node.TEXT_NODE) {
				child = left;
				offset = child.nodeValue?.length || 0;
			}

			if (right && right.nodeType === getWindow().Node.TEXT_NODE) {
				child = right;
				offset = 0;
			}

			if (!child) {
				return;
			}
			switch (type) {
				case 'start':
					this.setStart(child, offset);
					break;
				case 'end':
					this.setEnd(child, offset);
					break;
			}
		};
		shrinkPosition(this.startContainer, this.startOffset, 'start');
		shrinkPosition(this.endContainer, this.endOffset, 'end');
		return this;
	};

	/**
	 * 扩大边界
	 * <p><strong><span>[123</span>abc]</strong>def</p>
	 * to
	 * <p>[<strong><span>123</span>abc</strong>]def</p>
	 * @param range 选区
	 * @param toBlock 是否扩大到块级节点
	 */
	enlargeToElementNode = (toBlock?: boolean) => {
		const range = this.enlargeFromTextNode();
		const nodeApi = this.editor.node;
		const enlargePosition = (
			node: Node,
			offset: number,
			isStart: boolean,
		) => {
			let domNode = $(node);
			if (
				domNode.type === getWindow().Node.TEXT_NODE ||
				(!toBlock && nodeApi.isBlock(domNode)) ||
				domNode.isEditable()
			) {
				return;
			}
			let parent;
			if (offset === 0) {
				while (!domNode.prev()) {
					parent = domNode.parent();
					if (!parent || (!toBlock && nodeApi.isBlock(parent))) {
						break;
					}
					if (!parent.inEditor() || parent.isEditable()) {
						break;
					}
					domNode = parent;
				}
				if (isStart) {
					range.setStartBefore(domNode[0]);
				} else {
					range.setEndBefore(domNode[0]);
				}
			} else if (offset === domNode.children().length) {
				while (!domNode.next()) {
					parent = domNode.parent();
					if (!parent || (!toBlock && nodeApi.isBlock(parent))) {
						break;
					}
					if (!parent.inEditor() || parent.isEditable()) {
						break;
					}
					domNode = parent;
				}
				if (isStart) {
					range.setStartAfter(domNode[0]);
				} else {
					range.setEndAfter(domNode[0]);
				}
			}
		};
		enlargePosition(range.startContainer, range.startOffset, true);
		enlargePosition(range.endContainer, range.endOffset, false);
		return this;
	};

	/**
	 * 缩小边界
	 * <body>[<p><strong>123</strong></p>]</body>
	 * to
	 * <body><p><strong>[123]</strong></p></body>
	 * @param range 选区
	 */
	shrinkToElementNode = () => {
		const { node } = this.editor;
		let child;
		let childDom;
		while (
			this.startContainer.nodeType === getWindow().Node.ELEMENT_NODE &&
			(child = this.startContainer.childNodes[this.startOffset]) &&
			(childDom = $(child)) &&
			child.nodeType === getWindow().Node.ELEMENT_NODE &&
			!childDom.isCursor() &&
			!node.isVoid(child) &&
			(!childDom.isCard() ||
				childDom.isEditableCard() ||
				childDom.closest(EDITABLE_SELECTOR).length > 0)
		) {
			this.setStart(child, 0);
		}
		while (
			this.endContainer.nodeType === getWindow().Node.ELEMENT_NODE &&
			this.endOffset > 0 &&
			(child = this.endContainer.childNodes[this.endOffset - 1]) &&
			(childDom = $(child)) &&
			child.nodeType === getWindow().Node.ELEMENT_NODE &&
			!node.isVoid(child) &&
			!childDom.isCursor() &&
			(!childDom.isCard() ||
				childDom.isEditableCard() ||
				childDom.closest(EDITABLE_SELECTOR).length > 0)
		) {
			this.setEnd(child, child.childNodes.length);
		}
		return this;
	};

	/**
	 * 创建 selection，通过插入 span 节点标记位置
	 * @param range
	 */
	createSelection = (): SelectionInterface => {
		const selection = new Selection(this.editor, this);
		selection.create();
		return selection;
	};

	/**
	 * 获取子选区集合
	 * @param range
	 */
	getSubRanges = (includeCard: boolean = false) => {
		const ranges: Array<RangeInterface> = [];
		this.commonAncestorNode.traverse((child) => {
			if (child.isText()) {
				let offset = 0;
				const childNode = child.get()!;
				const valueLength = childNode.nodeValue?.length || 0;
				const start = this.comparePoint(childNode, offset);
				const end = this.comparePoint(childNode, valueLength);
				const docRange = Range.create(this.editor);
				if (start < 0) {
					if (end < 0) return;
					if (end === 0) {
						docRange.setOffset(
							childNode,
							this.startOffset,
							valueLength,
						);
					} else {
						docRange.setOffset(
							childNode,
							this.startOffset,
							this.endOffset,
						);
					}
				} else {
					if (start !== 0) return;
					if (end < 0) return;
					if (end === 0) {
						docRange.setOffset(childNode, offset, valueLength);
					} else {
						docRange.setOffset(childNode, offset, this.endOffset);
					}
				}
				ranges.push(docRange);
			} else if (
				includeCard &&
				child.isCard() &&
				!child.isEditableCard()
			) {
				const cardComponent = this.editor.card.find(child);
				if (
					!cardComponent ||
					(cardComponent.constructor as CardEntry)
						.singleSelectable === false
				)
					return;
				const center = cardComponent.getCenter();
				const body = center.get()?.parentNode;
				if (!body) return;
				const offset = center.index();
				const childNode = child.get()!;
				const start = this.comparePoint(body, offset);
				const end = this.comparePoint(body, offset + 1);
				const docRange = Range.create(this.editor);
				if (start < 0) {
					if (end < 0) return;
					if (end === 0) {
						docRange.setOffset(
							childNode,
							this.startOffset,
							offset + 1,
						);
					} else {
						docRange.setOffset(
							childNode,
							this.startOffset,
							this.endOffset,
						);
					}
				} else {
					if (start !== 0) return;
					if (end < 0) return;
					if (end === 0) {
						docRange.setOffset(body, offset, offset + 1);
					} else {
						docRange.setOffset(body, offset, this.endOffset);
					}
				}
				ranges.push(docRange);
			}
		});
		return ranges;
	};

	setOffset = (
		node: Node | NodeInterface,
		start: number,
		end: number,
	): RangeInterface => {
		if (isNodeEntry(node)) node = node[0];
		this.setStart(node, start);
		this.setEnd(node, end);
		return this;
	};

	findElementsInSimpleRange = () => {
		const {
			startContainer,
			endContainer,
			startOffset,
			endOffset,
			collapsed,
		} = this;
		const elements: Array<Node> = [];
		if (
			startContainer !== endContainer ||
			collapsed === true ||
			startContainer.nodeType === getWindow().Node.TEXT_NODE
		) {
			return elements;
		}

		const { childNodes } = startContainer;
		for (let i = startOffset; i < endOffset; i++) {
			elements.push(childNodes[i]);
		}
		return elements;
	};

	inCard = () => {
		const card = this.startNode.closest(CARD_SELECTOR);
		return card && card.length > 0;
	};

	getStartOffsetNode = (): Node => {
		const { startContainer, startOffset } = this;
		if (startContainer.nodeType === getWindow().Node.ELEMENT_NODE) {
			return (
				startContainer.childNodes[startOffset] ||
				startContainer.childNodes[startOffset - 1] ||
				startContainer
			);
		}
		return startContainer;
	};

	getEndOffsetNode = (): Node => {
		const { endContainer, endOffset } = this;
		if (endContainer.nodeType === getWindow().Node.ELEMENT_NODE) {
			return (
				endContainer.childNodes[endOffset] ||
				endContainer.childNodes[endOffset - 1] ||
				endContainer
			);
		}
		return endContainer;
	};

	scrollIntoView = () => {
		const endElement = this.endNode.get<Element>();
		if (isMobile && endElement && endElement.scrollIntoView) {
			endElement.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
				inline: 'center',
			});
		}
	};

	scrollRangeIntoView = () => {
		const node = this.getEndOffsetNode();
		const root =
			node.nodeType === getWindow().Node.TEXT_NODE
				? node.parentNode
				: node;
		const rect = this.collapsed
			? (root as Element).getBoundingClientRect()
			: this.getClientRect();
		const innerHeight = window.innerHeight;
		if (rect.bottom >= innerHeight || rect.bottom <= 0) {
			(root as Element).scrollIntoView({
				block: 'center',
			});
		}
	};

	scrollIntoViewIfNeeded = (node: NodeInterface, view: NodeInterface) => {
		if (this.collapsed) {
			node.scrollIntoView(view, $(this.getEndOffsetNode()));
		} else {
			const startNode = this.getStartOffsetNode();
			const endNode = this.getEndOffsetNode();

			node.scrollIntoView(view, $(startNode));
			if (!node.inViewport(view, $(endNode)))
				node.scrollIntoView(view, $(endNode));
		}
	};

	containsCard = () => {
		const { collapsed, commonAncestorNode } = this;
		return (
			!collapsed &&
			((3 !== commonAncestorNode.type &&
				commonAncestorNode.find(CARD_SELECTOR).length > 0) ||
				commonAncestorNode.closest(CARD_SELECTOR).length > 0)
		);
	};

	/**
	 * 输入内容时，删除浏览器生成的 BR 标签，对空 block 添加 BR
	 * 删除场景
	 * <p><br />foo</p>
	 * <p>foo<br /></p>
	 * 保留场景
	 * <p><br /><br />foo</p>
	 * <p>foo<br /><br /></p>
	 * <p>foo<br />bar</p>
	 * 添加场景
	 * <p></p>
	 * @param isLeft
	 */
	addOrRemoveBr = (isLeft?: boolean) => {
		const block = this.editor.block.closest(this.commonAncestorNode);
		block.find('br').each((br) => {
			const domBr = $(br);
			if (
				((!domBr.prev() ||
					(domBr.parent()?.hasClass('data-list-item') &&
						domBr.parent()?.first()?.equal(domBr.prev()!))) &&
					domBr.next() &&
					domBr.next()!.name !== 'br' &&
					![CURSOR, ANCHOR, FOCUS].includes(
						domBr.next()!.attributes(DATA_ELEMENT),
					)) ||
				(!domBr.next() && domBr.prev() && domBr.prev()?.name !== 'br')
			) {
				if (
					isLeft &&
					domBr.prev() &&
					!(
						domBr.parent()?.hasClass('data-list-item') &&
						domBr.parent()?.first()?.equal(domBr.prev()!)
					)
				)
					return;
				domBr.remove();
			}
		});

		if (
			!block.first() ||
			(block.children().length === 1 &&
				block.hasClass('data-list-item') &&
				block.first()?.isCard())
		) {
			block.append($('<br />'));
			return this;
		}

		if (
			block.children().length === 2 &&
			block.hasClass('data-list-item') &&
			block.first()?.isCard() &&
			['cursor', 'anchor', 'focus'].includes(
				block.last()?.attributes(DATA_ELEMENT) || '',
			)
		) {
			block.first()?.after('<br />');
		}
		return this;
	};

	/**
	 * 获取开始位置前的节点
	 * <strong>foo</strong>|bar
	 */
	getPrevNode = () => {
		this.enlargeFromTextNode();
		const { startNode, startOffset } = this;

		if (startNode.isText()) {
			return;
		}
		const childNodes = startNode.children();
		if (childNodes.length === 0) {
			return;
		}
		return childNodes.eq(startOffset - 1);
	};

	/**
	 * 获取结束位置后的节点
	 * foo|<strong>bar</strong>
	 */
	getNextNode = () => {
		this.enlargeFromTextNode();
		const { endNode, endOffset } = this;

		if (endNode.isText()) {
			return;
		}
		const childNodes = endNode.children();
		if (childNodes.length === 0) {
			return;
		}
		return childNodes.eq(endOffset);
	};

	deepCut() {
		if (!this.collapsed) this.extractContents();
		const { startNode } = this;
		if (!startNode.isEditable()) {
			let node = startNode;
			if (node && !node.isEditable()) {
				let parentNode = node.parent();
				while (parentNode && !parentNode.isEditable()) {
					node = parentNode;
					parentNode = parentNode.parent();
				}
				this.setEndAfter(node[0]);
				const contents = this.extractContents();
				this.insertNode(contents);
				this.collapse(true);
			}
		}
	}

	/**
	 * 对比两个范围是否相等
	 * @param range 范围
	 */
	equal(range: RangeInterface | globalThis.Range) {
		return (
			this.startContainer === range.startContainer &&
			this.startOffset === range.startOffset &&
			this.endContainer === range.endContainer &&
			this.endOffset === range.endOffset
		);
	}

	/**
	 * 获取当前选区最近的根节点
	 */
	getRootBlock() {
		if (this.startNode.isEditable())
			return this.startNode.children().eq(this.startOffset);
		let node: NodeInterface | undefined = this.startNode;
		while (node?.parent() && !node.parent()!.isEditable()) {
			node = node.parent();
		}
		return node;
	}

	toPath() {
		const range = this.cloneRange();
		const node = range.commonAncestorNode;
		if (!node.isRoot() && !node.inEditor()) return [];
		range.shrinkToElementNode().shrinkToTextNode();

		const getPath = (node: NodeInterface, offset: number): Path => {
			let domNode: NodeInterface | undefined = node;
			const path = [];
			while (domNode && domNode.length > 0 && !domNode.isRoot()) {
				let prev = domNode.prev();
				let i = 0;
				while (prev && prev.length > 0) {
					if (
						!prev.attributes(DATA_TRANSIENT_ELEMENT) &&
						prev.attributes(DATA_ELEMENT) !== UI
					)
						i++;
					prev = prev.prev();
				}
				path.unshift(i);
				domNode = domNode.parent();
			}
			path.push(offset);
			return path;
		};
		return [
			getPath(range.startNode, range.startOffset),
			getPath(range.endNode, range.endOffset),
		];
	}
}

Range.create = (
	editor: EditorInterface,
	doc: Document = document,
	point?: { x: number; y: number },
): RangeInterface => {
	let range: globalThis.Range;
	if (point) range = doc.caretRangeFromPoint(point.x, point.y);
	else range = doc.createRange();
	return Range.from(editor, range)!;
};

Range.from = (
	editor: EditorInterface,
	win: Window | globalThis.Selection | globalThis.Range = window,
): RangeInterface | null => {
	if (!isRange(win)) {
		const selection = isSelection(win) ? win : win.getSelection();
		if (selection && selection.rangeCount > 0) {
			win = selection.getRangeAt(0);
		} else return null;
	}
	return new Range(editor, win);
};

Range.fromPath = (
	editor: EditorInterface,
	path: Path[],
	context: NodeInterface = editor.container,
) => {
	const startPath = path.length === 0 ? [] : path[0].slice();
	const endPath = path.length < 2 ? [] : path[1].slice();
	const startOffset = startPath.pop();
	const endOffset = endPath.pop();

	const getNode = (path: Path) => {
		let domNode = context;
		for (let i = 0; i < path.length; i++) {
			let p = path[i];
			if (p < 0) {
				p = 0;
			}
			let needNode = undefined;
			let domChild = domNode.first();
			let offset = 0;
			while (domChild && domChild.length > 0) {
				if (
					!!domChild.attributes(DATA_TRANSIENT_ELEMENT) ||
					domChild.attributes(DATA_ELEMENT) === UI
				) {
					domChild = domChild.next();
				} else {
					if (offset === p || !domChild.next()) {
						needNode = domChild;
						break;
					}
					offset++;
					domChild = domChild.next();
				}
			}
			if (!needNode) break;
			domNode = needNode;
		}
		return domNode;
	};

	const setRange = (
		method: string,
		range: RangeInterface,
		node: Node | null,
		offset: number,
	) => {
		if (node !== null) {
			if (offset < 0) {
				offset = 0;
			}
			if (
				node.nodeType === getWindow().Node.ELEMENT_NODE &&
				offset > node.childNodes.length
			) {
				offset = node.childNodes.length;
			}
			if (
				node.nodeType === getWindow().Node.TEXT_NODE &&
				offset > (node.nodeValue?.length || 0)
			) {
				offset = node.nodeValue?.length || 0;
			}
			range[method](node, offset);
		}
	};
	const startNode = getNode(startPath);
	const endNode = getNode(endPath);
	const range = Range.create(editor, document);
	setRange(
		'setStart',
		range,
		startNode.get(),
		startOffset ? parseInt(startOffset.toString()) : 0,
	);
	setRange(
		'setEnd',
		range,
		endNode.get(),
		endOffset ? parseInt(endOffset.toString()) : 0,
	);
	return range;
};

export default Range;
