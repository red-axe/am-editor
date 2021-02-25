import $, { isNode } from '../../node';
import { NodeInterface } from '../../types/node';
import { RangeInterface } from '../../types/range';
import { getDocument } from '../../utils';

const contains = (blocks: Array<NodeInterface>, node: NodeInterface) => {
	for (let i = 0; i < blocks.length; i++) {
		if (blocks[i][0] === node[0]) {
			return true;
		}
	}
	return false;
};

export default (
	range: RangeInterface,
	block: NodeInterface | Node | string,
) => {
	const doc = getDocument(range.startContainer);
	let domNode: NodeInterface;
	if (typeof block === 'string' || isNode(block)) {
		domNode = $(block, doc);
	} else {
		domNode = block;
	}

	let blocks: Array<NodeInterface | null> = range.getBlocks();
	// li 节点改成 ul 或 ol
	const parentBlocks: Array<NodeInterface> = [];
	blocks = blocks
		.map(node => {
			const parent = node?.parent();
			if (
				node?.name === 'li' &&
				parent &&
				['ol', 'ul'].indexOf(parent.name || '') >= 0
			) {
				if (!contains(parentBlocks, parent)) {
					parentBlocks.push(parent);
					return parent;
				}
				return null;
			}
			return node;
		})
		.filter(node => {
			return node;
		});
	// 不在段落内
	if (blocks.length === 0 || blocks[0]?.isTable()) {
		const root = range.startNode.getClosestBlock();
		const bookmark = range.createBookmark();
		root.children().each(node => {
			domNode.append(node);
		});
		root.append(domNode);
		if (bookmark) range.moveToBookmark(bookmark);
		return range;
	}

	const bookmark = range.createBookmark();
	blocks[0]?.before(domNode);
	blocks.forEach(node => {
		if (node) domNode.append(node);
	});
	if (bookmark) range.moveToBookmark(bookmark);
	return range;
};
