import $, { isNode } from '../../node';
import {
	removeEmptyMarks,
	canRemoveMark,
	getDocument,
	getWindow,
} from '../../utils';
import { ANCHOR_SELECTOR, FOCUS_SELECTOR } from '../../constants/selection';
import { CARD_SELECTOR, CARD_TYPE_KEY } from '../../constants/card';
import { NodeInterface } from '../../types/node';
import { RangeInterface } from '../../types/range';
import { DATA_ELEMENT } from '../../constants/root';

// 添加子节点，同时移除空 mark 标签
const appendChildNodes = (node: NodeInterface, otherNode: NodeInterface) => {
	const children = [];
	let child = otherNode.first();

	while (child) {
		const next = child.next();
		children.push(child);
		node.append(child);
		child = next;
	}
	return children;
};

// 生成 cursor 左侧或右侧的节点，放在一个和父节点一样的容器里
const createSideNodes = (
	parent: NodeInterface,
	cursorName: string,
	scanOrder: boolean,
) => {
	const container = parent.clone(true);
	const cursor = $(
		'['.concat(DATA_ELEMENT, '=').concat(cursorName, ']'),
		<Element>container[0],
	);
	let isRemove = false;
	// 删除一边的节点
	container.traverse(domNode => {
		if (domNode[0] === cursor[0]) {
			cursor.remove();
			isRemove = true;
			return;
		}
		if (isRemove) domNode.remove();
	}, scanOrder);
	return container;
};

// 生成 anchor 和 focus 中间的节点，放在一个和父节点一样的容器里
const createCenterNodes = (parent: NodeInterface) => {
	const container = parent.clone(true);
	const anchor = $(ANCHOR_SELECTOR, <Element>container[0]);
	const focus = $(FOCUS_SELECTOR, <Element>container[0]);
	// 删除右侧
	let isRemove = false;
	container.traverse(domNode => {
		if (domNode[0] === focus[0]) {
			focus.remove();
			isRemove = true;
			return;
		}
		if (isRemove) domNode.remove();
	}, true);

	// 删除左侧
	isRemove = false;
	container.traverse(domNode => {
		if (domNode[0] === anchor[0]) {
			anchor.remove();
			isRemove = true;
			return;
		}
		if (isRemove) domNode.remove();
	}, false);
	return container;
};

// <p>foo<strong><em>wo<cursor />rd</em></strong>bar</p>
// to
// <p>foo<strong><em>wo</em></strong><cursor /><strong><em>rd</em></strong>bar</p>
const splitMarkAtCollapsedRange = (
	range: RangeInterface,
	mark?: NodeInterface,
) => {
	range.enlargeFromTextNode();
	const startContainer = $(range.startContainer);
	const card = startContainer.isCard()
		? startContainer
		: startContainer.closest(CARD_SELECTOR);
	if (
		!(card.length > 0 && card.attr(CARD_TYPE_KEY) === 'inline') &&
		(startContainer.isMark() || startContainer.parent()?.isMark())
	) {
		// 获取上面第一个非样式标签
		const parent = startContainer.getClosestNotMark();
		// 插入范围的开始和结束标记
		range.createBookmark();
		// 子节点分别保存在两个变量
		const left = createSideNodes(parent.clone(true), 'cursor', true);
		const right = createSideNodes(parent.clone(true), 'cursor', false);
		// 删除空标签
		removeEmptyMarks(left);
		removeEmptyMarks(right, node => {
			return !mark || canRemoveMark(node, mark);
		});
		// 清空原父容器，用新的内容代替
		parent.empty();
		const leftNodes = appendChildNodes(parent, left);
		const rightNodes = appendChildNodes(parent, right);
		const atNode = $('\u200b', null);

		// 重新设置范围
		if (leftNodes.length === 1 && leftNodes[0].name === 'br') {
			leftNodes[0].remove();
			leftNodes.splice(0, 1);
		}
		if (rightNodes.length === 1 && rightNodes[0].name === 'br') {
			rightNodes[0].remove();
			rightNodes.splice(0, 1);
		}
		if (rightNodes.length > 0) {
			let rightContainer = rightNodes[0];
			// 右侧没文本
			if (rightContainer.isEmpty()) {
				let firstChild: NodeInterface | null = rightContainer.first();
				while (firstChild && !firstChild.isText()) {
					rightContainer = firstChild;
					firstChild = firstChild.first();
				}

				if (rightContainer.isText()) {
					rightContainer.before(atNode);
				} else {
					rightContainer.prepend(atNode);
				}
			} else {
				// 右侧有文本
				rightContainer.before(atNode);
			}
			range.select(atNode).collapse(false);
		} else if (leftNodes.length > 0) {
			const leftContainer = leftNodes[leftNodes.length - 1];
			leftContainer.after(atNode);
			range.select(atNode).collapse(false);
		} else {
			range.select(parent, true).collapse(true);
		}
		let textWithEmpty = false;
		parent.children().each(child => {
			const childNode = $(child);
			if (childNode.isText()) {
				const { textContent } = child;
				let text = textContent?.replace(/\u200b+/g, '\u200b') || '';
				if (textContent !== text) {
					child.textContent = text;
				}
				if (textWithEmpty) {
					if (text.startsWith('\u200b')) {
						text = text.substring(1);
						if (text) child.textContent = text;
						else childNode.remove();
					} else textWithEmpty = false;
				}
				if (text.endsWith('\u200b')) textWithEmpty = true;
			} else textWithEmpty = false;
		});
		if (atNode[0].parentNode) {
			const at = atNode[0];
			let atText: string | null = null;
			let atTextLen: number = 0;
			const handleAt = (node: Node | null, align: boolean) => {
				const getAlignNode = (node: Node) => {
					return align ? node.previousSibling : node.nextSibling;
				};
				while (node) {
					if (node.nodeType !== at.nodeType) return;
					if (node.textContent === atText) {
						const alignNode = getAlignNode(node);
						node.parentNode?.removeChild(node);
						node = alignNode;
					} else {
						if (align) {
							while (
								atText &&
								node.textContent?.endsWith(atText)
							) {
								node.textContent = node.textContent.substring(
									0,
									node.textContent.length - atTextLen,
								);
							}
						} else {
							while (
								atText &&
								node.textContent?.startsWith(atText)
							) {
								node.textContent = node.textContent.substring(
									atText.length,
								);
							}
						}
						if (node.textContent?.length !== 0) return;
						const alignNode = getAlignNode(node);
						node.parentNode?.removeChild(node);
						node = alignNode;
					}
				}
			};
			if (at.nodeType === getWindow().Node.TEXT_NODE) {
				const { textContent } = at;
				atText = textContent!;
				atTextLen = atText.length;
				handleAt(at.previousSibling, true);
				handleAt(at.nextSibling, false);
			}
		}
	}
};

// <p>foo<strong><em>w<anchor />or<focus />d</em></strong>bar</p>
// to
// <p>foo<strong><em>w</em></strong><anchor /><strong><em>or</em></strong><focus /><strong><em>d</em></strong>bar</p>
const splitMarkAtExpandedRange = (
	range: RangeInterface,
	mark?: NodeInterface,
) => {
	range.enlargeToElementNode();
	const startContainer = $(range.startContainer);
	const endContainer = $(range.endContainer);
	const cardStart = startContainer.isCard()
		? startContainer
		: startContainer.closest(CARD_SELECTOR);
	const cardEnd = endContainer.isCard()
		? endContainer
		: endContainer.closest(CARD_SELECTOR);
	if (
		!(
			(cardStart.length > 0 &&
				'inline' === cardStart.attr(CARD_TYPE_KEY)) ||
			(cardEnd.length > 0 && 'inline' === cardEnd.attr(CARD_TYPE_KEY))
		)
	) {
		if (
			startContainer.getClosestNotMark()[0] !==
			endContainer.getClosestNotMark()[0]
		) {
			const startRange = range.cloneRange();
			startRange.collapse(true);
			splitMarkAtCollapsedRange(startRange, mark);
			range.setStart(startRange.startContainer, startRange.startOffset);
			const endRange = range.cloneRange();
			endRange.collapse(false);
			splitMarkAtCollapsedRange(endRange, mark);
			range.setEnd(endRange.startContainer, endRange.startOffset);
			return;
		}
		// 节点不是样式标签，文本节点时判断父节点
		const startIsMark =
			startContainer.isMark() || startContainer.parent()?.isMark();
		const endIsMark =
			endContainer.isMark() || endContainer.parent()?.isMark();
		// 不是样式标签，无需分割
		if (!startIsMark && !endIsMark) {
			return;
		}
		// 获取上面第一个非样式标签
		let ancestor = $(range.commonAncestorContainer);
		if (ancestor.isText()) {
			ancestor = ancestor.parent()!;
		}

		const parent = ancestor.getClosestNotMark();
		// 插入范围的开始和结束标记
		range.createBookmark();
		// 子节点分别保存在两个变量
		const left = createSideNodes(parent.clone(true), 'anchor', true);
		const center = createCenterNodes(parent.clone(true));
		const right = createSideNodes(parent.clone(true), 'focus', false);
		// 删除空标签
		removeEmptyMarks(left);
		removeEmptyMarks(right);
		// 清空原父容器，用新的内容代替
		parent.empty();
		appendChildNodes(parent, left);
		const centerNodes = appendChildNodes(parent, center);
		appendChildNodes(parent, right);
		// 重新设置范围
		range.setStartBefore(centerNodes[0][0]);
		range.setEndAfter(centerNodes[centerNodes.length - 1][0]);
	}
};
// <p><anchor /><em>wo<focus />rd</em></p>
// to
// <p><anchor /><em>wo</em><focus /><em>rd</em></p>
/**
 * 切割mark标签
 */
export default (
	range: RangeInterface,
	mark?: NodeInterface | Node | string,
) => {
	const doc = getDocument(range.startContainer);
	if (typeof mark === 'string' || (mark && isNode(mark))) {
		mark = $(mark, doc);
	}
	// 折叠状态
	if (range.collapsed) {
		splitMarkAtCollapsedRange(range, mark);
		return range;
	}
	// 展开状态
	splitMarkAtExpandedRange(range, mark);
	return range;
};
