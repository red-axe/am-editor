import $ from '../../node';
import { CARD_KEY } from '../../constants/card';
import { setNodeProps, setNode, getDocument } from '../../utils';
import { NodeInterface } from '../../types/node';
import { RangeInterface } from '../../types/range';

export default (
	range: RangeInterface,
	block: string | { [k: string]: any },
) => {
	const doc = getDocument(range.startContainer);
	let props: { [k: string]: any } = {};
	let domNode: NodeInterface | null = null;

	if (typeof block === 'string') {
		domNode = $(block, doc);
		props = domNode.attr();
		props.style = domNode.css();
	} else {
		props = block;
	}

	const blocks = range.getBlocks();
	// 无段落
	const sc = $(range.startContainer);
	if (sc.isRoot() && blocks.length === 0) {
		const newBlock = domNode || $('<p></p>');
		setNodeProps(newBlock, props);

		const bookmark = range.createBookmark();

		sc.children().each(node => {
			newBlock.append(node);
		});

		sc.append(newBlock);
		if (bookmark) range.moveToBookmark(bookmark);
		return range;
	}

	const bookmark = range.createBookmark();
	blocks.forEach(node => {
		// Card 不做处理
		if (node.attr(CARD_KEY)) {
			return;
		}
		// 相同标签，或者传入属性
		if (!domNode || node.name === domNode.name) {
			setNodeProps(node, props);
			return;
		}
		setNode(node, domNode);
	});
	if (bookmark) range.moveToBookmark(bookmark);
	return range;
};
