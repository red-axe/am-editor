import splitMark from './split-mark';
import { unwrapNode } from '../../../utils';
import mergeMark from './merge-mark';
import { RangeInterface } from '../../../types/range';

export default (range: RangeInterface) => {
  splitMark(range);
  const inlineNodes = range.getActiveInlines();
  // 清除 Inline
  const bookmark = range.createBookmark();
  inlineNodes.forEach(node => {
    unwrapNode(node);
  });
  if (bookmark) range.moveToBookmark(bookmark);
  mergeMark(range);
  return range;
};
