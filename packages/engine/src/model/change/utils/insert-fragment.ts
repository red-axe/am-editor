import $ from '../../node';
import {
  removeSideBr,
  mergeNode,
  wrapNode,
  isCustomizeListBlock,
  clearCustomizeList,
  isEmptyListItem,
  isSameList,
  getDocument,
} from '../../../utils';
import deleteContent from './delete-content';
import mergeAdjacentList from './merge-adjacent-list';
import mergeAdjacentBlockquote from './merge-adjacent-blockquote';
import { NodeInterface } from '../../../types/node';
import { RangeInterface } from '../../../types/range';
import { CardModelInterface } from '../../../types/card';

function focusToCard(range: RangeInterface, card: CardModelInterface) {
  const component = card.find(range.startNode);
  if (component) component.focus(range, false);
}

function insertNodeList(
  range: RangeInterface,
  nodes: NodeListOf<Node | ChildNode>,
  card: CardModelInterface,
) {
  if (nodes.length !== 0) {
    const doc = getDocument(range.startContainer);
    let lastNode = $(nodes[nodes.length - 1]);
    if ('br' === lastNode.name) {
      lastNode.remove();
      lastNode = $(nodes[nodes.length - 1]);
    }
    const fragment = doc.createDocumentFragment();
    let node: NodeInterface | null = $(nodes[0]);
    while (node && node.length > 0) {
      removeSideBr(node);
      const next: NodeInterface | null = node.next();
      if (!next) {
        lastNode = node;
      }
      fragment.appendChild(node[0]);
      node = next;
    }
    range.insertNode(fragment);
    range.shrinkToElementNode().collapse(false);
    focusToCard(range, card);
  }
}

function getFirstChild(node: NodeInterface) {
  let child = node.first();
  if (!child || !child.isBlock()) return node;
  while (['blockquote', 'ul', 'ol'].includes(child ? child.name || '' : '')) {
    child = child!.first();
  }
  return child;
}

function getLastChild(node: NodeInterface) {
  let child = node.last();
  if (!child || !child.isBlock()) return node;
  while (['blockquote', 'ul', 'ol'].includes(child ? child.name || '' : '')) {
    child = child!.last();
  }
  return child;
}

function isSameListChild(_lastNode: NodeInterface, _firstNode: NodeInterface) {
  return (
    'p' === _firstNode.name ||
    (_lastNode.name === _firstNode.name &&
      !(
        'li' === _lastNode.name &&
        !isSameList(_lastNode.parent()!, _firstNode.parent()!)
      ))
  );
}

function removeEmptyNode(node: NodeInterface) {
  while (!node.isRoot()) {
    const parent = node.parent();
    node.remove();
    if (!parent?.isEmpty()) break;
    node = parent;
  }
}

function clearList(lastNode: NodeInterface, nextNode: NodeInterface) {
  if (lastNode.name === nextNode.name && 'p' === lastNode.name) {
    const attr = nextNode.attr();
    if (attr['data-id']) delete attr['data-id'];
    lastNode.attr(attr);
  }
  if (lastNode.isLikeEmpty() && !nextNode.isLikeEmpty()) {
    lastNode.get<Element>()!.innerHTML = '';
  }
  if (isCustomizeListBlock(lastNode) === isCustomizeListBlock(nextNode))
    clearCustomizeList(nextNode);
}
export default (
  range: RangeInterface,
  card: CardModelInterface,
  fragment: DocumentFragment,
  callback: (range: RangeInterface) => void,
) => {
  const firstBlock = range.startNode.getClosestBlock();
  const lastBlock = range.endNode.getClosestBlock();
  const onlyOne = lastBlock[0] === firstBlock[0];
  const isBlockLast = range.isBlockLastOffset('end');
  const blockquoteNode = firstBlock.closest('blockquote');
  const isCollapsed = range.collapsed;
  const childNodes = fragment.childNodes;
  const firstNode = $(fragment.firstChild || []);
  if (!isCollapsed) {
    deleteContent(range, onlyOne || !isBlockLast);
  }
  if (!firstNode[0]) return range;
  if (!firstNode.isBlock() && !firstNode.isCard()) {
    range.shrinkToElementNode().insertNode(fragment);
    return range.collapse(false);
  }
  range.deepCut();
  const startNode = range.startContainer.childNodes[range.startOffset - 1];
  const endNode = range.startContainer.childNodes[range.startOffset];

  if (blockquoteNode[0]) {
    childNodes.forEach(node => {
      if ('blockquote' !== $(node).name) {
        wrapNode($(node), blockquoteNode.clone(false));
      }
    });
  }
  insertNodeList(range, childNodes, card);
  if (startNode) {
    const _firstNode = getFirstChild($(startNode.nextSibling || []))!;
    const _lastNode = getLastChild($(startNode))!;
    if (isSameListChild(_lastNode, _firstNode)) {
      clearList(_lastNode, _firstNode);
      mergeNode(_lastNode, _firstNode, false);
      removeEmptyNode(_firstNode);
    } else {
      if (_lastNode.isEmpty() || isEmptyListItem(_lastNode)) {
        removeEmptyNode(_lastNode);
      }
    }
  }

  if (endNode) {
    const prevNode = getLastChild($(endNode.previousSibling || []))!;
    const nextNode = getFirstChild($(endNode))!;
    range
      .select(prevNode, true)
      .shrinkToElementNode()
      .collapse(false);
    if (nextNode?.isEmpty()) {
      removeEmptyNode(nextNode);
    } else if (isSameListChild(prevNode, nextNode)) {
      mergeNode(prevNode, nextNode, false);
      removeEmptyNode(nextNode);
    }
  }
  mergeAdjacentBlockquote(range);
  mergeAdjacentList(range);
  if (callback) callback(range);
  return range;
};
