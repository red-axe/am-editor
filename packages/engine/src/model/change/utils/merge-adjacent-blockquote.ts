import { mergeNode } from '../../../utils';
import { RangeInterface } from '../../../types/range';

export default (range: RangeInterface) => {
  const blocks = range.getBlocks();
  if (0 === blocks.length) return range;
  const engine = blocks[0].closest('.am-engine');
  const blockquote = engine.find('blockquote');
  if (blockquote.length > 0) {
    const bookmark = range.createBookmark();
    let nextNode = blockquote.next();
    while (nextNode) {
      const prevNode = nextNode.prev();
      if (
        'blockquote' === nextNode.name &&
        nextNode.name === prevNode?.name &&
        nextNode.attr('class') === prevNode.attr('class')
      ) {
        mergeNode(prevNode, nextNode);
      }
      nextNode = nextNode.next();
    }
    if (bookmark) range.moveToBookmark(bookmark);
    return range;
  }
  return range;
};
