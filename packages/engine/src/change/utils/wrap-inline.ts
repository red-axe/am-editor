import $, { isNode } from '../../node';
import { getDocument, getWindow } from '../../utils';
import splitMark from './split-mark';
import { NodeInterface } from '../../types/node';
import { RangeInterface } from '../../types/range';

export default (
	range: RangeInterface,
	inline: NodeInterface | Node | string,
) => {
	const doc = getDocument(range.startContainer);
	let domNode: NodeInterface;
	if (typeof inline === 'string' || isNode(inline)) {
		domNode = $(inline, doc);
	} else {
		domNode = inline;
	}

	if (range.collapsed) {
		return range;
	}

	splitMark(range);
	let ancestor = range.commonAncestorNode;
	if (ancestor.type === getWindow().Node.TEXT_NODE) {
		ancestor = ancestor.parent()!;
	}

	// 插入范围的开始和结束标记
	const bookmark = range.createBookmark();
	if (!bookmark) {
		return range;
	}
	// 遍历范围内的节点，添加 Inline
	let started = false;
	let nodeClone = domNode.clone(false);
	ancestor.traverse(domChild => {
		if (domChild[0] !== bookmark.anchor) {
			if (started) {
				if (domChild[0] === bookmark.focus) {
					started = false;
					return false;
				}
				if (
					(domChild.isMark() && !domChild.isCard()) ||
					domChild.isText()
				) {
					if (domChild.isEmpty()) {
						domChild.remove();
						return true;
					}
					if (!nodeClone.parent()) {
						domChild.before(nodeClone);
					}
					nodeClone.append(domChild);
					return true;
				}
				if (nodeClone[0].childNodes.length !== 0) {
					nodeClone = nodeClone.clone(false);
				}
				return;
			}
			return;
		} else {
			started = true;
			return;
		}
	});
	const anchor = $(bookmark.anchor);
	if (anchor.parent()?.isHeading() && !anchor.prev() && !anchor.next()) {
		anchor.after('<br />');
	}
	const focus = $(bookmark.focus);

	if (anchor[0] !== focus[0]) {
		if (focus.parent()?.isHeading() && !focus.prev() && !focus.next()) {
			focus.before('<br />');
		}
	}

	range.moveToBookmark(bookmark);
	return range;
};
