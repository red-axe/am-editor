import $ from '../../model/node';
import {
  CARD_KEY,
  CARD_LEFT_SELECTOR,
  CARD_RIGHT_SELECTOR,
} from '../../constants/card';
import { EngineInterface } from '../../types/engine';
import { RangeInterface } from '../../types/range';
import { CardInterface, CardType } from '../../types/card';
import { NodeInterface } from '../../types/node';
import { getWindow, mergeNode, unwrapNode } from '../../utils';
import { ChangeInterface } from '../../types/change';
import { deleteContent } from '../../model/change/utils';
import engine from 'docs/demo/engine';
// 删除节点，删除后如果是空段落，自动添加 BR
const removeNode = (
  change: ChangeInterface,
  range: RangeInterface,
  node: NodeInterface,
) => {
  const parent = node.parent();
  node.remove();
  if (parent && parent.isEmpty()) {
    if (parent.isRoot()) {
      parent.html('<p><br /></p>');
      range
        .select(parent, true)
        .shrinkToElementNode()
        .collapse(false);
    } else {
      parent.html('<br />');
      range.select(parent, true).collapse(false);
    }
    change.select(range);
  }
};

const unwrapBlockNode = (
  engine: EngineInterface,
  range: RangeInterface,
  cardNode: NodeInterface,
) => {
  if (!cardNode.inRoot() || cardNode.isTable()) {
    return;
  }

  const bookmark = range.createBookmark();
  unwrapNode(cardNode);
  if (bookmark) range.moveToBookmark(bookmark);
  engine.change.select(range);
};

const mergeBlockNode = (
  engine: EngineInterface,
  range: RangeInterface,
  block: NodeInterface,
) => {
  // <p><br />foo</p>，先删除 BR
  if (block.children().length > 1 && block.first()?.name === 'br') {
    block.first()?.remove();
    return false;
  }
  const { change } = engine;
  let prevBlock = block.prev();
  // 前面没有 DOM 节点
  if (!prevBlock) {
    if (
      block.parent()?.isTable() &&
      /^<p(\s[^>]*?)?><br><\/p>$/i.test(
        block
          .parent()
          ?.html()
          ?.trim() || '',
      )
    ) {
      return false;
    }

    if (block.parent()?.inRoot()) {
      unwrapBlockNode(engine, range, block);
    }
    return false;
  }
  // 前面是Card
  if (prevBlock.attr(CARD_KEY)) {
    const card = engine.card.find(prevBlock);
    if (card) {
      card.focus(range);
      change.select(range);
      return false;
    }
  }
  // 前面是 void 节点
  if (prevBlock.isVoid()) {
    prevBlock.remove();
    return false;
  }
  // 前面是空段落
  if (prevBlock.isHeading() && prevBlock.isEmpty()) {
    prevBlock.remove();
    return false;
  }

  // 前面是文本节点
  if (prevBlock.isText()) {
    const paragraph = $('<p />');
    prevBlock.before(paragraph);
    paragraph.append(prevBlock);
    prevBlock = paragraph;
  }
  if (['ol', 'ul'].indexOf(prevBlock.name || '') >= 0) {
    prevBlock = prevBlock.last();
  }
  // 只有一个 <br /> 时先删除
  if (block.children().length === 1 && block.first()?.name === 'br') {
    block.first()?.remove();
  } else if (
    prevBlock &&
    prevBlock.children().length === 1 &&
    prevBlock.first()?.name === 'br'
  ) {
    prevBlock.first()?.remove();
  }

  if (!prevBlock || prevBlock.isText()) {
    unwrapBlockNode(engine, range, block);
  } else {
    const bookmark = range.createBookmark();
    mergeNode(prevBlock, block);
    if (bookmark) range.moveToBookmark(bookmark);
    change.select(range);
    change.mergeMark();
    change.mergeAdjacentList();
  }
  return false;
};

// 焦点移动到前一个 Block
const focusPrevBlock = (
  engine: EngineInterface,
  range: RangeInterface,
  block: NodeInterface,
  removeEmpty: boolean,
) => {
  let prevBlock = block.prev();
  if (!prevBlock) {
    return;
  }
  // 前面是Card
  if (prevBlock.attr(CARD_KEY)) {
    const card = engine.card.find(prevBlock);
    if (card) card.focus(range);
    return;
  }
  // 前面是列表
  if (['ol', 'ul'].indexOf(prevBlock.name || '') >= 0) {
    prevBlock = prevBlock.last();
  }

  if (!prevBlock) {
    return;
  }

  if (removeEmpty && prevBlock.isEmptyWithTrim()) {
    prevBlock.remove();
    return;
  }

  range.select(prevBlock, true);
  range.collapse(false);
  engine.change.select(range);
};
// Card
export const backspaceCard = (
  engine: EngineInterface,
  range: RangeInterface,
  card: CardInterface,
  e: Event,
) => {
  const { change } = engine;
  if (card.type === CardType.INLINE) {
    // 左侧光标
    const cardLeft = range.startNode.closest(CARD_LEFT_SELECTOR);

    if (cardLeft.length > 0) {
      range.select(card.root).collapse(true);
      change.select(range);
    }
    // 右侧光标
    const cardRight = range.startNode.closest(CARD_RIGHT_SELECTOR);

    if (cardRight.length > 0) {
      e.preventDefault();
      change.removeCard(card.id);
      range.addOrRemoveBr();
      return false;
    }
  } else {
    // 左侧光标
    const cardLeft = range.startNode.closest(CARD_LEFT_SELECTOR);
    if (cardLeft.length > 0) {
      e.preventDefault();
      if (card.root.parent()?.inRoot()) {
        unwrapBlockNode(engine, range, card.root.parent()!);
      } else {
        focusPrevBlock(engine, range, card.root, true);
      }
      return false;
    }
    // 右侧光标
    const cardRight = range.startNode.closest(CARD_RIGHT_SELECTOR);

    if (cardRight.length > 0) {
      e.preventDefault();
      focusPrevBlock(engine, range, card.root, false);
      change.removeCard(card.id);
      return false;
    }
  }
  return true;
};
// 后退键
export default (engine: EngineInterface, e: Event) => {
  const { change } = engine;
  const range = change.getRange();
  // 在Card里
  const card = engine.card.find(range.startNode);

  if (card) {
    if (backspaceCard(engine, range, card, e) === false) {
      return false;
    }
    if (engine.event.trigger('keydown:backspace', e) === false) return;
  }
  // 没有可编辑的文本
  if (change.isEmpty()) {
    e.preventDefault();
    change.setValue('<p><br /><cursor /></p>');
    return false;
  }

  let block = range.startNode.getClosestBlock();
  // 表格
  if (block.isTable() && block.isEmptyWithTrim()) {
    e.preventDefault();
    block.html('<p><br /></p>');
    range
      .select(block)
      .shrinkToElementNode()
      .collapse(false);
    change.select(range);
    return false;
  }
  // 范围为展开状态
  if (!range.collapsed) {
    e.preventDefault();
    change.deleteContent();
    return false;
  }
  // 光标前面有Card时
  const prevNode = range.getPrevNode();

  if (
    prevNode &&
    prevNode.attr(CARD_KEY) &&
    prevNode.attr(CARD_KEY) !== 'checkbox'
  ) {
    e.preventDefault();
    change.removeCard(prevNode);
    return false;
  }
  // 光标前面有空 block，<h1><li><br /></li><cursor /></h1>
  if (prevNode && prevNode.isBlock() && prevNode.isEmptyWithTrim()) {
    e.preventDefault();
    removeNode(change, range, prevNode);
    return false;
  }
  // 光标不在段落开始位置时
  if (!range.isBlockFirstOffset('start')) {
    let cloneRange = range
      .cloneRange()
      .shrinkToElementNode()
      .shrinkToTextNode();
    if (
      cloneRange.startContainer.nodeType === getWindow().Node.TEXT_NODE &&
      (function(range: RangeInterface) {
        const { commonAncestorContainer } = range;
        if (
          range.collapsed &&
          1 === range.startOffset &&
          range.startContainer === commonAncestorContainer &&
          commonAncestorContainer.nodeType === getWindow().Node.TEXT_NODE
        ) {
          range = range.cloneRange();
          if (
            (commonAncestorContainer.parentNode?.childNodes?.length || 0) <=
              1 &&
            1 === commonAncestorContainer.textContent?.length
          ) {
            range.select(commonAncestorContainer, true);
            deleteContent(range, true);
            return true;
          }
        }
        return false;
      })(cloneRange)
    ) {
      e.preventDefault();
      change.change();
    }
    return;
  }
  // 处理 BR
  const { startNode, startOffset } = range;
  if (startNode.isRoot()) {
    const lastChild = startNode[0].childNodes[startOffset - 1];
    if (lastChild && $(lastChild).name === 'br') {
      e.preventDefault();
      $(lastChild).remove();
      return false;
    }
  }
  // 改变对齐
  const align = engine.command.queryState('alignment');
  if (align === 'center') {
    e.preventDefault();
    engine.command.execute('alignment', 'left');
    return false;
  }

  if (align === 'right') {
    e.preventDefault();
    engine.command.execute('alignment', 'center');
    return false;
  }
  // 减少缩进
  if (engine.command.queryState('indent')) {
    e.preventDefault();
    engine.command.execute('outdent');
    return false;
  }
  // 在列表里
  if (['ol', 'ul'].indexOf(block.name || '') >= 0) {
    // 矫正这种情况，<ol><cursor /><li>foo</li></ol>
    const li = block.first();

    if (!li || li.isText()) {
      // <ol><cursor />foo</ol>
      e.preventDefault();
      return mergeBlockNode(engine, range, block);
    } else {
      block = li;
      range.setStart(block[0], 0);
      range.collapse(true);
      change.select(range);
    }
  }

  if (block.name === 'li') {
    if (block.find('[data-card-key=checkbox]').length > 0) {
      return;
    }

    e.preventDefault();
    const listRoot = block.closest('ul,ol');

    if (block.parent()?.isRoot()) {
      // <p>foo</p><li><cursor />bar</li>
      return mergeBlockNode(engine, range, block);
    }

    if (listRoot.length > 0) {
      engine.command.execute(
        'list',
        listRoot.name === 'ol' ? 'orderedlist' : 'unorderedlist',
      );
    } else {
      // <p><li><cursor />foo</li></p>
      unwrapBlockNode(engine, range, block);
    }

    return false;
  }
  // 引用
  const parentBlock = block.parent();

  if (parentBlock && parentBlock.name === 'blockquote' && block.isHeading()) {
    e.preventDefault();
    if (block.prevElement()) {
      return mergeBlockNode(engine, range, block);
    } else {
      change.unwrapBlock('<blockquote />');
      return false;
    }
  }
  if (parentBlock?.isTitle() && block.isEmptyWithTrim()) {
    e.preventDefault();
    change.setBlocks('<p />');
    return false;
  }

  // 在标题、正文里
  if (block.isHeading()) {
    e.preventDefault();
    return mergeBlockNode(engine, range, block);
  }
  // 其它段落
  if (['li', 'td', 'th'].indexOf(block.name || '') < 0) {
    e.preventDefault();
    change.setBlocks('<p />');
    return false;
  }
  return;
};
