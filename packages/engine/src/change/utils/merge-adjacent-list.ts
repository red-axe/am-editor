import { isSameList, mergeNode, addListStartNumber } from '../../utils';
import { RangeInterface } from '../../types/range';

export default (range: RangeInterface) => {
	const blocks = range.getBlocks();
	if (blocks.length === 0) {
		return range;
	}

	blocks.forEach(block => {
		block = block.closest('ul,ol');
		if (block.name !== 'ol' && block.name !== 'ul') {
			return;
		}

		const prevBlock = block.prev();
		const nextBlock = block.next();

		if (prevBlock && isSameList(prevBlock, block)) {
			const bookmark = range.createBookmark();
			mergeNode(prevBlock, block);
			if (bookmark) range.moveToBookmark(bookmark);
			// 原来 block 已经被移除，重新指向
			block = prevBlock;
		}

		if (nextBlock && isSameList(nextBlock, block)) {
			const bookmark = range.createBookmark();
			mergeNode(block, nextBlock);
			if (bookmark) range.moveToBookmark(bookmark);
		}
	});
	addListStartNumber(range);
	return range;
};
