import $, { isNode } from '../../node';
import { getDocument, getWindow, wrapNode } from '../../../utils';
import splitMark from './split-mark';
import insertNode from './insert-node';
import { RangeInterface } from '../../../types/range';
import { NodeInterface } from '../../../types/node';

/**
 * 在mark节点两侧添加节点
 * @param mark mark 节点
 * @param node 需要在两侧添加的节点
 */
const addToBoth = (mark: NodeInterface, node?: NodeInterface) => {
  if (node && node.length > 0 && mark.parent()) {
    mark.before(node.clone(true)).after(node.clone(true));
  }
};

export default (
  range: RangeInterface,
  mark: NodeInterface | Node | string,
  supplement?: NodeInterface,
) => {
  const doc = getDocument(range.startContainer);
  let domMark: NodeInterface;
  if (typeof mark === 'string' || isNode(mark)) {
    domMark = $(mark, doc);
  } else domMark = mark;

  if (range.collapsed) {
    const emptyNode = doc.createTextNode('\u200b');
    domMark.append(emptyNode);
    insertNode(range, domMark);
    addToBoth(domMark, supplement);
    return range.addOrRemoveBr();
  }

  splitMark(range);
  let ancestor = range.commonAncestorNode;

  if (ancestor.type === getWindow().Node.TEXT_NODE) {
    ancestor = ancestor.parent()!;
  }
  // 插入范围的开始和结束标记
  const bookmark = range.createBookmark();

  if (!bookmark) {
    return range;
  }
  // 遍历范围内的节点，添加 Mark
  let started = false;
  ancestor.traverse(node => {
    const domNode = $(node);
    if (domNode[0] !== bookmark.anchor) {
      if (started) {
        if (domNode[0] === bookmark.focus) {
          started = false;
          return false;
        }
        if (domNode.isMark() && !domNode.isCard()) {
          if (!domNode.isEmpty()) {
            addToBoth(wrapNode(domNode, domMark), supplement);
            return true;
          }
          if (domNode.name !== domMark.name) {
            domNode.remove();
          }
        }

        if (domNode.isText() && !domNode.isEmpty()) {
          addToBoth(wrapNode(domNode, domMark), supplement);
          if (domNode.isBlock() && !domNode.isTable() && domNode.isEmpty()) {
            domNode.find('br').remove();
            const cloneMark = domMark.clone();
            const textNode = doc.createTextNode('\u200b');
            cloneMark.prepend(textNode);
            domNode.append(cloneMark);
            addToBoth(cloneMark, supplement);
          }
        }
      }
    } else {
      started = true;
    }
    return;
  });
  range.moveToBookmark(bookmark);
  return range;
};
