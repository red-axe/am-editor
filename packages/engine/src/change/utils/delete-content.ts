import $ from '../../node';
import { getBatchAppendHTML, getWindow, mergeNode } from '../../utils';
import { NodeInterface } from '../../types/node';
import { RangeInterface } from '../../types/range';

// 深度合并
const deepMergeNode = (
	range: RangeInterface,
	prevNode: NodeInterface,
	nextNode: NodeInterface,
	marks: Array<NodeInterface>,
) => {
	if (prevNode.isBlock() && !prevNode.isVoid() && !prevNode.isCard()) {
		range.select(prevNode, true);
		range.collapse(false);
		const bookmark = range.createBookmark();
		mergeNode(prevNode, nextNode);
		if (bookmark) range.moveToBookmark(bookmark);
		const prev = range.getPrevNode();
		const next = range.getNextNode();
		// 合并之后变成空 Block
		const { startNode } = range;
		if (!prev && !next && startNode.isBlock()) {
			startNode.append($(getBatchAppendHTML(marks, '<br />')));
			range.select(startNode.find('br'), true);
			range.collapse(false);
		}

		if (prev && next && !prev.isCard() && !next.isCard()) {
			deepMergeNode(range, prev, next, marks);
		}
	}
};

/**
 * 删除内容
 */
export default (range: RangeInterface, isDeepMerge: boolean = true) => {
	if (range.collapsed) {
		return range;
	}
	const cloneRange = range.cloneRange();
	cloneRange.collapse(true);
	const activeMarks = cloneRange.getActiveMarks();
	range.enlargeToElementNode();
	// 获取上面第一个 Block
	const block = range.startNode.getClosestBlock();
	// 获取的 block 超出编辑范围
	if (!block.isRoot() && !block.inRoot()) {
		return range;
	}
	// 先删除范围内的所有内容
	range.extractContents();
	range.collapse(true);
	// 后续处理
	const { startNode, startOffset } = range;
	// 只删除了文本，不做处理
	if (startNode.isText()) {
		return range;
	}

	const prevNode = startNode[0].childNodes[startOffset - 1];
	const nextNode = startNode[0].childNodes[startOffset];
	let isEmptyNode = startNode[0].childNodes.length === 0;
	if (!isEmptyNode) {
		const firstChild = startNode[0].firstChild!;
		if (
			startNode[0].childNodes.length === 1 &&
			firstChild.nodeType === getWindow().Node.ELEMENT_NODE &&
			startNode[0].nodeName === 'LI' &&
			startNode.hasClass('data-list-node') &&
			startNode.first()?.isCard()
		)
			isEmptyNode = true;
	}
	if (isEmptyNode && startNode.isBlock()) {
		let html = getBatchAppendHTML(activeMarks, '<br />');
		if (startNode.isRoot()) {
			html = '<p>'.concat(html, '</p>');
		}
		startNode.append($(html));
		range.select(startNode.find('br'));
		range.collapse(false);
		return range;
	}
	if (
		prevNode &&
		nextNode &&
		$(prevNode).isBlock() &&
		$(nextNode).isBlock() &&
		isDeepMerge
	) {
		deepMergeNode(range, $(prevNode), $(nextNode), activeMarks);
	}
	startNode.children().each(node => {
		const domNode = $(node);
		if (!domNode.isVoid() && domNode.isElement() && '' === domNode.html())
			domNode.remove();
	});
	return range;
};
