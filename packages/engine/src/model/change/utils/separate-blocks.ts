import { repairListblocks } from '../../../utils';
import { NodeInterface } from '../../../types/node';
import { RangeInterface } from '../../../types/range';

/**
 * 将选区的列表扣出来，并将切断的列表修复
 * ---
 * <ul>
 *   <li>x</li>
 *   <li><cursor>x</li>
 * </ul>
 * <ol>
 *   <li>x</li>
 *   <li>x<focus></li>
 *   <li>x</li>
 * </ol>
 * ---
 * to
 * ---
 * <ul>
 *   <li>x</li>
 * </ul>
 * <ul>
 *   <li><cursor>x</li>
 * </ul>
 * <ol>
 *   <li>x</li>
 *   <li>x<focus></li>
 * </ol>
 * <ol>
 *   <li>x</li>
 * </ol>
 * ---
 * @param range range对象
 * @return range对象
 */
export default (range: RangeInterface) => {
  let blocks = range.getBlocks();
  // 没找到目标 block

  if (blocks.length === 0) {
    return range;
  }
  const bookmark = range.createBookmark();
  blocks = repairListblocks(blocks, range);
  const firstBlock = blocks[0];
  const lastBlock = blocks[blocks.length - 1];
  const middleList = [];
  const rightList = [];
  let beforeParent: NodeInterface | undefined;
  let afterParent: NodeInterface | undefined;
  // 修复 range 起始位置切断的 list

  if (firstBlock.name === 'li' && firstBlock.prev()) {
    beforeParent = firstBlock.parent();
    let indexInRange = 0;

    while (blocks[indexInRange] && blocks[indexInRange].name === 'li') {
      middleList.push(blocks[indexInRange]);
      indexInRange += 1;
    }
  }

  if (lastBlock.name === 'li' && lastBlock.next()) {
    afterParent = lastBlock.parent();
    let nextBlock = lastBlock.next();

    while (nextBlock && nextBlock.name === 'li') {
      rightList.push(nextBlock);
      nextBlock = nextBlock.next();
    }
  }

  let afterParentClone: NodeInterface | undefined;

  if (rightList.length > 0) {
    afterParentClone = afterParent?.clone(false);
    rightList.forEach(li => {
      afterParentClone?.append(li[0]);
    });
    afterParent?.after(afterParentClone!);
  }

  let beforeParentClone: NodeInterface | undefined;

  if (middleList.length > 0) {
    beforeParentClone = beforeParent?.clone(false);
    middleList.forEach(li => {
      beforeParentClone?.append(li[0]);
    });
    beforeParent?.after(beforeParentClone!);
  }

  if (
    beforeParent &&
    afterParent &&
    afterParent[0] === beforeParent[0] &&
    beforeParent.name === 'ol'
  ) {
    const newStart =
      (parseInt(beforeParent.attr('start'), 10) || 1) +
      beforeParent.find('li').length;
    afterParentClone?.attr('start', newStart);
  }

  if (bookmark) range.moveToBookmark(bookmark);
  return range;
};
