import deleteContent from './delete-content';
import {
	createSideBlock,
	generateRandomID,
	getBatchAppendHTML,
} from '../../utils';
import { RangeInterface } from '../../types/range';
import { MARK_ELEMENTID_MAP } from '../../constants/tags';

const isEmptyElement = (node: Node) => {
	return (
		!!MARK_ELEMENTID_MAP[node.nodeName] &&
		(node.childNodes.length === 0 || (node as HTMLElement).innerText === '')
	);
};

export default (range: RangeInterface) => {
	// 范围为展开状态时先删除内容
	if (!range.collapsed) {
		deleteContent(range);
	}
	// 获取上面第一个 Block
	const block = range.startNode.getClosestBlock();
	// 获取的 block 超出编辑范围
	if (!block.isRoot() && !block.inRoot()) {
		return range;
	}

	if (block.isRoot()) {
		// <p>wo</p><cursor /><p>other</p>
		// to
		// <p>wo</p><p><cursor />other</p>
		const sc = range.startContainer.childNodes[range.startOffset];
		if (sc) {
			range
				.select(sc, true)
				.shrinkToElementNode()
				.collapse(true);
		}
		return range;
	}
	const cloneRange = range.cloneRange();
	cloneRange
		.shrinkToElementNode()
		.shrinkToTextNode()
		.collapse(true);
	const activeMarks = cloneRange.getActiveMarks();

	const sideBlock = createSideBlock({
		block: block[0],
		range: range,
		isLeft: false,
		keepID: true,
	});
	sideBlock.traverse(node => {
		if (
			!node.isVoid() &&
			(node.isInline() || node.isMark()) &&
			node.isEmpty()
		) {
			node.remove();
		}
	}, true);
	if (isEmptyElement(block[0]) && !isEmptyElement(sideBlock[0])) {
		generateRandomID(block[0] as Element, true);
	} else {
		generateRandomID(sideBlock[0] as Element, true);
	}
	block.after(sideBlock);
	// Chrome 不能选中 <p></p>，里面必须要有节点，插入 BR 之后输入文字自动消失
	if (block.isEmpty()) {
		block.html(getBatchAppendHTML(activeMarks, '<br />'));
	}

	if (sideBlock.isEmpty()) {
		sideBlock.html(getBatchAppendHTML(activeMarks, '<br />'));
	}
	// 重新设置当前选中范围
	range.select(sideBlock, true).shrinkToElementNode();

	if (sideBlock.children().length === 1 && sideBlock.first()?.name === 'br') {
		range.collapse(false);
	} else {
		range.collapse(true);
	}
	return range;
};
