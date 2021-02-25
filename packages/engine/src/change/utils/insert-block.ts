import $, { isNode } from '../../node';
import deleteContent from './delete-content';
import insertNode from './insert-node';
import { NodeInterface } from '../../types/node';
import { RangeInterface } from '../../types/range';
import { getDocument } from '../../utils';

export default (
	range: RangeInterface,
	node: NodeInterface | Node | string,
	keepOld: boolean,
) => {
	const doc = getDocument(range.startContainer);
	let domNode: NodeInterface;
	if (typeof node === 'string' || isNode(node)) {
		domNode = $(node, doc);
	} else {
		domNode = node;
	}

	// 范围为折叠状态时先删除内容
	if (!range.collapsed) {
		deleteContent(range);
	}

	// 获取上面第一个 Block
	const container = range.startNode.getClosestBlock();
	// 超出编辑范围
	if (!container.isRoot() && !container.inRoot()) {
		return range;
	}
	// 当前选择范围在段落外面
	if (container.isRoot()) {
		range = insertNode(range, domNode);
		range.collapse(false);
		return range;
	}
	// <p><cursor /><br /></p>
	// to
	// <p><br /><cursor /></p>
	if (container.children().length === 1 && container.first()?.name === 'br') {
		range.select(container, true).collapse(false);
	}
	// 插入范围的开始和结束标记
	const bookmark = range.enlargeToElementNode().createBookmark();
	if (!bookmark) {
		return range;
	}

	const block = container.clone(false);
	// 切割 Block
	let child = container.first();
	let isLeft = true;

	while (child) {
		const next = child.next();
		if (child[0] === bookmark.anchor) {
			isLeft = false;
			child = next;
			continue;
		}

		if (!isLeft) {
			block.append(child);
		}
		child = next;
	}

	if (!block.isEmpty()) {
		container.after(block);
	}

	// 移除范围的开始和结束标记
	range.moveToBookmark(bookmark);
	// 移除原 Block
	range.setStartAfter(container[0]);
	range.collapse(true);
	if (container.isEmpty() && !container.isTitle() && !keepOld)
		container.remove();
	// 插入新 Block
	insertNode(range, domNode);
	return range;
};
