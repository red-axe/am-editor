import { RangeInterface } from '../../types/range';
import { mergeNode, comparisonNode } from '../../utils';

export default (range: RangeInterface) => {
	const marks = range.getActiveMarks();

	if (marks.length === 0) {
		return range;
	}

	const targetMarks = [marks[0]];
	if (marks.length > 1) {
		targetMarks.push(marks.pop()!);
	}

	targetMarks.forEach(mark => {
		const prevMark = mark.prev();
		const nextMark = mark.next();

		if (prevMark && comparisonNode(prevMark, mark, true)) {
			const bookmark = range.shrinkToElementNode().createBookmark();
			mergeNode(prevMark, mark);
			if (bookmark) range.moveToBookmark(bookmark);
			// 原来 mark 已经被移除，重新指向
			mark = prevMark;
		}

		if (nextMark && comparisonNode(nextMark, mark, true)) {
			const bookmark = range.shrinkToElementNode().createBookmark();
			mergeNode(mark, nextMark);
			if (bookmark) range.moveToBookmark(bookmark);
		}
	});
	return range.addOrRemoveBr();
};
