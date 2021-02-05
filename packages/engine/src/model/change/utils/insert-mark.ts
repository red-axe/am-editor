import $, { isNode } from '../../node';
import deleteContent from './delete-content';
import insertNode from './insert-node';
import { RangeInterface } from '../../../types/range';
import { NodeInterface } from '../../../types/node';
import { getDocument } from '../../../utils';

export default (range: RangeInterface, mark: NodeInterface | Node | string) => {
  if (typeof mark === 'string' || isNode(mark)) {
    const doc = getDocument(range.startContainer);
    mark = $(mark, doc);
  }
  // 范围为折叠状态时先删除内容
  if (!range.collapsed) {
    deleteContent(range);
  }
  // 插入新 Mark
  range = insertNode(range, mark);
  return range
    .addOrRemoveBr()
    .select(mark)
    .collapse(false);
};
