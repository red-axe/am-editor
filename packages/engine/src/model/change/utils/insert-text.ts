import deleteContent from './delete-content';
import insertNode from './insert-node';
import { getDocument } from '../../../utils';
import { RangeInterface } from '../../../types/range';

export default (range: RangeInterface, text: string): RangeInterface => {
  const doc = getDocument(range.startContainer);
  // 范围为折叠状态时先删除内容
  if (!range.collapsed) {
    deleteContent(range);
  }

  const node = doc.createTextNode(text);
  return insertNode(range, node).addOrRemoveBr();
};
