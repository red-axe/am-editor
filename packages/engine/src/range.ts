import { NodeInterface } from './types/node';
import { RangeInterface, RangePath } from './types/range';
import { isMobile } from './utils';
import {
	CARD_ELEMENT_KEY,
	CARD_SELECTOR,
	CARD_LEFT_SELECTOR,
	CARD_RIGHT_SELECTOR,
} from './constants/card';
import {
	DATA_ELEMENT,
	DATA_ID,
	DATA_TRANSIENT_ELEMENT,
	UI,
} from './constants/root';
import Selection from './selection';
import { SelectionInterface } from './types/selection';
import { EditorInterface } from './types/editor';
import { Path } from './model';
import { $ } from './node';
import { CardEntry } from './types/card';
import { isTransientElementCache } from './model/utils';
import { isNodeEntry } from './node/utils';

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
		path: {
			start: RangePath;
			end: RangePath;
		},
		includeCardCursor?: boolean,
		root?: NodeInterface,
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
			startNode.get<Node>()?.childNodes.length === 1 &&
			startNode.first()?.name === 'br'
		) {
			startNode.first()?.remove();
		} else if (startNode.name === 'br') {
			startNode.remove();
		}
		// 防止文本节点被插入到根节点上
		if (
			(node.nodeType === Node.TEXT_NODE || node.nodeName === 'BR') &&
			startNode.isEditable()
		) {
			this.shrinkToElementNode().shrinkToTextNode();
		}
		if (node instanceof Element || node instanceof DocumentFragment)
			this.editor.nodeId.generate(node);
		this.base.insertNode(node);
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
		if (!node.parentNode) return;
		return this.base.setEndAfter(node);
	}
	setEndBefore(node: Node | NodeInterface): void {
		if (isNodeEntry(node)) node = node[0];
		if (!node.parentNode) return;
		return this.base.setEndBefore(node);
	}
	setStart(node: Node | NodeInterface, offset: number): void {
		if (isNodeEntry(node)) node = node[0];
		return this.base.setStart(node, offset);
	}
	setStartAfter(node: Node | NodeInterface): void {
		if (isNodeEntry(node)) node = node[0];
		if (!node.parentNode) return;
		return this.base.setStartAfter(node);
	}
	setStartBefore(node: Node | NodeInterface): void {
		if (isNodeEntry(node)) node = node[0];
		if (!node.parentNode) return;
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
			if (node.nodeType !== Node.TEXT_NODE) {
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
			if (node.nodeType !== Node.ELEMENT_NODE) {
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

			if (left && left.nodeType === Node.TEXT_NODE) {
				child = left;
				offset = child.nodeValue?.length || 0;
			}

			if (right && right.nodeType === Node.TEXT_NODE) {
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
	 * @param toTop 是否尽可能扩大的可编辑节点下
	 */
	enlargeToElementNode = (
		toBlock: boolean = false,
		toTop: boolean = true,
	) => {
		const range = this.enlargeFromTextNode();
		const nodeApi = this.editor.node;
		const enlargePosition = (
			node: Node,
			offset: number,
			isStart: boolean,
		) => {
			let domNode = $(node);
			if (
				domNode.type === Node.TEXT_NODE ||
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
					if (!toTop) {
						if (!toBlock && parent.isElement()) break;
						if (toBlock && nodeApi.isBlock(parent)) break;
					}
					domNode = parent;
				}
				if (isStart) {
					range.setStartBefore(domNode[0]);
				} else {
					range.setEndBefore(domNode[0]);
				}
			} else if (offset === domNode.get<Node>()?.childNodes.length) {
				while (!domNode.next()) {
					parent = domNode.parent();
					if (!parent || (!toBlock && nodeApi.isBlock(parent))) {
						break;
					}
					if (!parent.inEditor() || parent.isEditable()) {
						break;
					}
					if (!toTop) {
						if (!toBlock && parent.isElement()) break;
						if (toBlock && nodeApi.isBlock(parent)) break;
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
			this.startContainer.nodeType === Node.ELEMENT_NODE &&
			(child = this.startContainer.childNodes[this.startOffset]) &&
			(childDom = $(child)) &&
			child.nodeType === Node.ELEMENT_NODE &&
			!childDom.isCursor() &&
			!node.isVoid(child) &&
			(!childDom.isCard() ||
				childDom.isEditableCard() ||
				childDom.find(CARD_LEFT_SELECTOR).length > 0)
		) {
			this.setStart(child, 0);
		}
		while (
			this.endContainer.nodeType === Node.ELEMENT_NODE &&
			this.endOffset > 0 &&
			(child = this.endContainer.childNodes[this.endOffset - 1]) &&
			(childDom = $(child)) &&
			child.nodeType === Node.ELEMENT_NODE &&
			!node.isVoid(child) &&
			!childDom.isCursor() &&
			(!childDom.isCard() ||
				childDom.isEditableCard() ||
				childDom.find(CARD_RIGHT_SELECTOR).length > 0)
		) {
			this.setEnd(child, child.childNodes.length);
		}
		return this;
	};

	/**
	 * 创建 selection，通过插入 span 节点标记位置
	 * @param key 唯一标识
	 */
	createSelection = (key: string = ''): SelectionInterface => {
		const selection = new Selection(this.editor, this, key);
		selection.create();
		return selection;
	};

	/**
	 * 获取子选区集合
	 * @param includeCard 是否包含卡片
	 * @param filterSingleSelectableCard 是否过滤掉 singleSelectable = false 的卡片（不能单独选中）
	 */
	getSubRanges = (
		includeCard: boolean = false,
		filterSingleSelectableCard = true,
	) => {
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
					(filterSingleSelectableCard &&
						(cardComponent.constructor as CardEntry)
							.singleSelectable === false)
				)
					return;
				const center = cardComponent.getCenter();
				const centerEl = center.get();
				const body = centerEl?.parentElement ?? centerEl?.parentNode;
				if (!body || !center.inEditor()) return;
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
		if (ranges.length === 0) ranges.push(this);
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

	findElements = () => {
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
			startContainer.nodeType === Node.TEXT_NODE
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
		if (
			startContainer.nodeType === Node.ELEMENT_NODE ||
			startContainer.nodeType === Node.DOCUMENT_FRAGMENT_NODE
		) {
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
		if (
			endContainer.nodeType === Node.ELEMENT_NODE ||
			endContainer.nodeType === Node.DOCUMENT_FRAGMENT_NODE
		) {
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
			node.nodeType === Node.TEXT_NODE
				? node.parentElement ?? node.parentNode
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

	scrollIntoViewIfNeeded = (
		container = this.editor.container,
		view: NodeInterface,
	) => {
		if (this.collapsed) {
			container.scrollIntoView($(this.getEndOffsetNode()));
		} else {
			const startNode = this.getStartOffsetNode();
			const endNode = this.getEndOffsetNode();

			$(startNode).scrollIntoView(view);
			$(endNode).scrollIntoView(view);
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
	 * 在光标位置对blcok添加或者删除br标签
	 * @param isLeft
	 */
	handleBr = (isLeft?: boolean) => {
		const editor = this.editor;
		const { list } = editor;
		const block = editor.block.closest(this.commonAncestorNode);
		block.find('br').each((br) => {
			const domBr = $(br);
			const prev = domBr.prev();
			const next = domBr.next();
			const parent = domBr.parent();
			if (
				((!prev ||
					(parent?.hasClass(list.CUSTOMZIE_LI_CLASS) &&
						parent?.first()?.equal(prev))) &&
					next &&
					next.name !== 'br' &&
					!next.isCursor()) ||
				(!next && prev && prev.name !== 'br')
			) {
				if (
					isLeft &&
					prev &&
					!(
						parent?.hasClass(list.CUSTOMZIE_LI_CLASS) &&
						parent?.first()?.equal(domBr.prev()!)
					)
				)
					return;
				domBr.remove();
			}
		});
		const first = block.first();
		const children = block.children();
		if (
			!first ||
			(children.length === 1 &&
				block.hasClass(list.CUSTOMZIE_LI_CLASS) &&
				first?.isCard())
		) {
			block.append($('<br />'));
			return this;
		}

		if (
			children.length === 1 &&
			first.isText() &&
			first.text().replace(/\r\n|\n|\t|\u200b/g, '').length === 0
		) {
			block.html('<br />');
			return this;
		}

		if (
			children.length === 2 &&
			block.hasClass(list.CUSTOMZIE_LI_CLASS) &&
			first?.isCard() &&
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

	filterPath(includeCardCursor: boolean = false) {
		const cardCaches: NodeInterface[] = [];
		return (node: Node) => {
			const element = $(node);
			if (
				includeCardCursor &&
				node instanceof HTMLElement &&
				~['left', 'right', 'center', 'body'].indexOf(
					node.getAttribute(CARD_ELEMENT_KEY) || '',
				)
			) {
				const cardElement = this.editor.card.closest(element);
				if (cardElement && cardElement.length > 0)
					cardCaches.push(cardElement);
				return true;
			}
			if (
				includeCardCursor &&
				element.isCard() &&
				cardCaches.includes(element)
			)
				return true;
			return !isTransientElementCache(element);
		};
	}

	toPath(
		includeCardCursor: boolean = false,
		root: NodeInterface = this.editor.container,
	) {
		const range = this.cloneRange();
		const node = range.commonAncestorNode;
		if (!node.isRoot() && !node.inEditor()) return;
		range.shrinkToElementNode().shrinkToTextNode();

		const getPath = (node: NodeInterface, offset: number): RangePath => {
			let rootBeginId: string = node.attributes(DATA_ID);
			let rootBeginIndex: number = rootBeginId ? 0 : -1;
			const path = node.getPath(
				root,
				node.parent()?.isRoot()
					? undefined
					: this.filterPath(includeCardCursor),
				(index, path, node) => {
					// 找不到索引，就重置之前的位置
					if (index === -1) {
						rootBeginId = '';
						rootBeginIndex = -1;
						return [];
					}
					if (!rootBeginId) {
						rootBeginId = node.attributes(DATA_ID);
						rootBeginIndex = path.length;
					}
					path.unshift(index);
					return;
				},
			);
			rootBeginIndex = path.length - rootBeginIndex;
			path.push(offset);
			return { path, id: rootBeginId, bi: rootBeginIndex };
		};
		return {
			start: getPath(range.startNode, range.startOffset),
			end: getPath(range.endNode, range.endOffset),
		};
	}
}

Range.create = (
	editor: EditorInterface,
	doc: Document = document,
	point?: { x: number; y: number },
): RangeInterface => {
	let range: globalThis.Range;
	if (point) range = doc.caretRangeFromPoint(point.x, point.y)!;
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
	path: {
		start: RangePath;
		end: RangePath;
	},
	includeCardCursor: boolean = false,
	root: NodeInterface = editor.container,
) => {
	const startPath = path.start.path.slice();
	const endPath = path.end.path.slice();
	const startOffset = startPath.pop();
	const endOffset = endPath.pop();

	const getNode = (path: Path, context: Element = root.get<Element>()!) => {
		let domNode: Node = context;
		for (let i = 0; i < path.length; i++) {
			let p = path[i];
			if (p < 0) {
				p = 0;
			}
			let needNode = undefined;
			let domChild = domNode.firstChild;
			let offset = 0;
			while (domChild) {
				if (
					!(domChild instanceof Element) ||
					(!domChild.getAttribute(DATA_TRANSIENT_ELEMENT) &&
						domChild.getAttribute(DATA_ELEMENT) !== UI) ||
					(includeCardCursor &&
						['left', 'right'].includes(
							domChild.getAttribute(CARD_ELEMENT_KEY) || '',
						))
				) {
					if (offset === p || !domChild.nextSibling) {
						needNode = domChild;
						break;
					}
					offset++;
					domChild = domChild.nextSibling;
				} else {
					domChild = domChild.nextSibling;
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
				node.nodeType === Node.ELEMENT_NODE &&
				offset > node.childNodes.length
			) {
				offset = node.childNodes.length;
			}
			if (
				node.nodeType === Node.TEXT_NODE &&
				offset > (node.nodeValue?.length || 0)
			) {
				offset = node.nodeValue?.length || 0;
			}
			range[method](node, offset);
		}
	};
	const beginContext = path.start.id
		? root.get<Element>()?.querySelector(`[${DATA_ID}="${path.start.id}"]`)
		: root.get<Element>();
	const startNode = getNode(
		path.start.bi > -1 && beginContext instanceof Element
			? startPath.slice(path.start.bi)
			: startPath,
		beginContext instanceof Element ? beginContext : undefined,
	);
	const endContext = path.end.id
		? root.get<Element>()?.querySelector(`[${DATA_ID}="${path.end.id}"]`)
		: root;
	const endNode = getNode(
		path.end.bi > -1 && endContext instanceof Element
			? endPath.slice(path.end.bi)
			: endPath,
		endContext instanceof Element ? endContext : undefined,
	);
	const range = Range.create(editor, document);
	setRange(
		'setStart',
		range,
		startNode,
		startOffset === undefined ? 0 : startOffset,
	);
	setRange('setEnd', range, endNode, endOffset === undefined ? 0 : endOffset);
	return range;
};

export default Range;

export const isSelection = (
	param: Window | globalThis.Selection | globalThis.Range,
): param is globalThis.Selection => {
	return (param as globalThis.Selection).getRangeAt !== undefined;
};
export const isRange = (
	param: Window | globalThis.Selection | globalThis.Range,
): param is globalThis.Range => {
	return (param as globalThis.Range).collapsed !== undefined;
};
export const isRangeInterface = (
	selector: NodeInterface | RangeInterface,
): selector is RangeInterface => {
	return !!selector && (<RangeInterface>selector).base !== undefined;
};
