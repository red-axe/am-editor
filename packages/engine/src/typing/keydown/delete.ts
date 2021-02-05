import { CARD_KEY } from '../../constants/card';
import $ from '../../model/node';
import Range from '../../model/range';
import { EngineInterface } from '../../types/engine';
import { RangeInterface } from '../../types/range';
import { getWindow } from '../../utils';

const getNext = (node: Node): Node | null => {
  return $(node).isRoot()
    ? null
    : node.nextSibling
    ? node.nextSibling
    : node.parentNode === null
    ? null
    : getNext(node.parentNode);
};

const getRange = (
  node: Node,
  hasNext: boolean = false,
): RangeInterface | null => {
  if ($(node).isRoot()) return null;
  if (!hasNext) {
    const next = getNext(node);
    if (!next) return null;
    node = next;
  }
  while (node) {
    const nodeDom = $(node);
    if (nodeDom.attr(CARD_KEY)) {
      if (!node.ownerDocument) return null;
      const range = Range.create(node.ownerDocument);
      range.setStartAfter(node);
      range.collapse(true);
      return range;
    }
    if (nodeDom.isBlock()) {
      if (!node.ownerDocument) return null;
      const range = Range.create(node.ownerDocument);
      range.select(nodeDom, true).collapse(true);
      return range;
    }
    if (nodeDom.name === 'br') {
      if (node.parentNode?.childNodes.length === 1) return null;
      if (!node.ownerDocument) return null;
      const range = Range.create(node.ownerDocument);
      range.setStartAfter(node);
      range.collapse(true);
      return range;
    }
    if (node.nodeType === getWindow().Node.TEXT_NODE) {
      if (node['data'].length === 0) return getRange(node);
      if (!node.ownerDocument) return null;
      const range = Range.create(node.ownerDocument);
      range.setStart(node, 1);
      range.collapse(true);
      return range;
    }
    if (node.childNodes.length === 0) return getRange(node);
    node = node.childNodes[0];
  }
  return null;
};

export default (engine: EngineInterface, e: Event) => {
  const { change } = engine;
  const range = change.getRange();
  if (!range.collapsed) {
    e.preventDefault();
    change.deleteContent();
    return;
  }

  const card = engine.card.find(range.startNode);
  let hasNext = false;
  let nextNode: Node;
  if (card) {
    if (card.isLeftCursor(range.startNode)) {
      e.preventDefault();
      change.selectCard(card);
      change.deleteContent();
      return;
    }
    if (!card.isRightCursor(range.startNode)) return;
    nextNode = card.root[0];
  } else if (range.endContainer.nodeType === getWindow().Node.TEXT_NODE) {
    if (range.endContainer['data'].length > range.endOffset) {
      e.preventDefault();
      const cloneRange = range.cloneRange();
      cloneRange.setEnd(range.endContainer, range.endOffset + 1);
      change.select(cloneRange);
      change.deleteContent();
      return;
    }
    nextNode = range.endContainer;
  } else {
    if (range.endContainer.nodeType !== getWindow().Node.ELEMENT_NODE) return;
    if (range.endContainer.childNodes.length === 0) {
      nextNode = range.endContainer;
    } else if (range.endOffset === 0) {
      if (
        range.endContainer.childNodes.length !== 1 ||
        range.endContainer.firstChild?.nodeName !== 'BR'
      ) {
        hasNext = true;
      }
      nextNode = range.endContainer.childNodes[range.endOffset];
    } else {
      nextNode = range.endContainer.childNodes[range.endOffset - 1];
    }
  }
  const nodeRange = getRange(nextNode, hasNext);
  if (nodeRange) {
    e.preventDefault();
    let { startOffset } = range;
    if (
      startOffset === 1 &&
      range.startContainer.childNodes.length === 1 &&
      range.startContainer.childNodes[0].nodeName === 'BR'
    )
      startOffset = 0;
    nodeRange.setStart(range.startContainer, startOffset);
    change.select(nodeRange);
    change.deleteContent();
  }
};
