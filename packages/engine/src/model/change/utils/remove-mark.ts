import $, { isNode } from '../../node';
import splitMark from './split-mark';
import mergeMark from './merge-mark';
import {
  canRemoveMark,
  unwrapNode,
  getDocument,
  getWindow,
} from '../../../utils';
import { NodeInterface } from '../../../types/node';
import { RangeInterface } from '../../../types/range';

export default (range: RangeInterface, mark: NodeInterface | Node | string) => {
  const doc = getDocument(range.startContainer) || document;
  if (typeof mark === 'string' || isNode(mark)) {
    mark = $(mark, doc);
  }

  splitMark(range, mark);
  if (range.collapsed) {
    return range;
  }

  let ancestor = range.commonAncestorNode;
  if (ancestor.type === getWindow().Node.TEXT_NODE) {
    ancestor = ancestor.parent()!;
  }

  // 插入范围的开始和结束标记
  const bookmark = range.createBookmark();
  if (!bookmark) {
    return range;
  }
  // 遍历范围内的节点，获取目标 Mark
  const markNodes: Array<NodeInterface> = [];
  let started = false;
  ancestor.traverse(node => {
    const domNode = $(node);
    if (domNode[0] !== bookmark.anchor) {
      if (started) {
        if (domNode[0] !== bookmark.focus) {
          if (
            domNode.isMark() &&
            !domNode.isCard() &&
            range.isPointInRange(domNode[0], 0)
          ) {
            markNodes.push(domNode);
          }
        }
      }
    } else {
      started = true;
    }
  });
  // 清除 Mark
  markNodes.forEach(node => {
    let nodeChild: NodeInterface;
    let className: string[] = [];
    mark = <NodeInterface>mark;
    if (canRemoveMark(node, mark)) {
      unwrapNode(node);
    } else if (mark) {
      const styleMap = mark.css();
      Object.keys(styleMap).forEach(key => {
        node.css(key, '');
      });
      if (mark.get<Element>()?.className.indexOf('data-fontsize') !== -1) {
        nodeChild = node;
        className =
          nodeChild
            .get<Element>()
            ?.className.split(/\s+/)
            .filter(name => name.indexOf('data-fontsize') === -1) || [];
        nodeChild.get<Element>()!.className = className.join(' ');
      }
    } else {
      node.removeAttr('class');
      node.removeAttr('style');
    }
  });
  range.moveToBookmark(bookmark);
  mergeMark(range);
  return range;
};
