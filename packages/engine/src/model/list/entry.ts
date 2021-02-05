import $ from '../node';
import { CardType, NodeInterface } from '../../types';
import {
  clearCustomizeList,
  getListType,
  isCustomizeListBlock,
  removeUnit,
  repairCustomzieList,
  setNode,
  unwrapNode,
  wrapNode,
} from '../../utils';
import PluginEntry from '../plugin/entry';
import Range from '../range';
import { INDENT_KEY } from '../../constants/indent';
import { CARD_KEY, READY_CARD_KEY } from '../../constants';
import { ListInterface } from '../../types/list';
import './index.css';

abstract class ListEntry<T extends {} = {}> extends PluginEntry<T>
  implements ListInterface {
  private inlineCard?: string;
  private isPasteList: boolean = false;

  schema() {
    return [
      {
        ul: {
          class: ['data-list'],
          'data-id': '*',
        },
      },
      {
        li: {
          class: ['data-list-node'],
          'data-id': '*',
        },
      },
    ];
  }

  queryState() {
    return (
      getListType(this.engine?.change.blocks || [], node => {
        return this.isCurentList(node) ? this.name : '';
      }) === this.name
    );
  }

  /**
   * 列表删除事件
   * @param e 事件
   * @param isDeepMerge 是否深度合并
   */
  protected backspace(e: KeyboardEvent, isDeepMerge?: boolean) {
    if (!this.engine) return;
    const { change, command } = this.engine;
    let range = change.getRange();
    if (range.collapsed) {
      const block = range.startNode.getClosestBlock();
      if ('li' === block.name && range.isListFirst()) {
        e.preventDefault();
        if (command.queryState('indent')) {
          command.execute('outdent');
          return false;
        }
        command.execute(this.name);
        return false;
      }
    } else {
      const startBlock = range.startNode.getClosestBlock();
      const endBlock = range.startNode.getClosestBlock();
      if ('li' === startBlock.name || 'li' === endBlock.name) {
        e.preventDefault();
        const cloneRange = range.cloneRange();
        change.deleteContent(isDeepMerge);
        this.repairListblock(startBlock);
        this.repairListblock(endBlock);
        range.setStart(cloneRange.startContainer, cloneRange.startOffset);
        range.collapse(true);
        change.mergeAdjacentList();
        change.select(range);
        return false;
      }
    }
    return;
  }

  /**
   * 列表回车事件
   * @param e 事件
   */
  protected enter(e: KeyboardEvent) {
    if (!this.engine) return;
    const { change, command, card } = this.engine;
    let range = change.getRange();
    range.shrinkToElementNode();
    const startBlock = range.startNode.getClosestBlock();
    const endBlock = range.endNode.getClosestBlock();

    if ('li' === startBlock.name || 'li' === endBlock.name) {
      if (!range.collapsed) {
        this.backspace(e, startBlock.name !== endBlock.name);
        range = change.getRange();
      }
      e.preventDefault();
      if (range.isListLast() && range.isListFirst()) {
        command.execute(this.name);
      } else {
        change.splitBlock();
        range = change.getRange();
        const bookmark = range.createBookmark();
        const block = range.endNode.getClosestBlock();
        this.repairListblock(block.prev()!, this.inlineCard);
        this.repairListblock(block, this.inlineCard);
        this.repairListblock(block.next()!, this.inlineCard);
        if (bookmark) range.moveToBookmark(bookmark);
        range.collapse(false);
        change.select(range);
        change.mergeAdjacentList();
        repairCustomzieList(range);
      }
      range.scrollIntoView();
      return false;
    }
    return;
  }

  /**
   * 列表tab事件
   * @param e 事件
   */
  protected tab(e: KeyboardEvent) {
    const range = this.engine?.change.getRange();
    if (range && range.collapsed && range.isListFirst()) {
      e.preventDefault();
      this.engine?.command.execute('indent');
      return false;
    }
    return;
  }

  /**
   * 判断节点是否是当前列表所需要的节点
   * @param node 节点
   */
  abstract isCurentList(node: NodeInterface): boolean;

  onCustomizeKeydown(
    type:
      | 'enter'
      | 'backspace'
      | 'space'
      | 'tab'
      | 'at'
      | 'slash'
      | 'selectall',
    event: KeyboardEvent,
  ) {
    if (!this.engine) return;
    const { change } = this.engine;
    const range = change.getRange();
    const activeBlocks = range.getActiveBlocks();
    const listType = getListType(activeBlocks, node => {
      return this.isCurentList(node) ? this.name : 'unknow';
    });
    if (listType !== this.name) return;
    const customizeItem = activeBlocks.find(
      block => block.name === 'li' && block.hasClass('data-list-node'),
    );
    if (customizeItem) {
      this.inlineCard = customizeItem.first()?.attr(CARD_KEY);
    }
    if (type === 'enter') {
      return this.enter(event);
    } else if (type === 'backspace') {
      return this.backspace(event);
    } else if (type === 'tab') {
      return this.tab(event);
    }
    return;
  }

  /**
   * 给列表项前置inline 卡片
   * @param node 节点
   * @param inlineCard inline 卡片名称
   * @param value 卡片值
   */
  protected prependInlineCard(
    node: NodeInterface | Node,
    inlineCard: string,
    value?: any,
  ) {
    if (!this.engine) return;
    const domnNode = $(node);
    const firstNode = domnNode.first();
    if (firstNode?.hasClass('data-list-node')) return;

    if (firstNode && firstNode.isCard()) return;

    const { card } = this.engine;
    const component = card.create(inlineCard, CardType.INLINE, {
      value,
    });
    const nodeRange = Range.create();
    nodeRange.select(domnNode, true);
    nodeRange.collapse(true);
    card.insertNode(nodeRange, component);
  }

  /**
   * 给列表项前置待渲染的inline 卡片
   * @param node 节点
   * @param inlineCard inline 卡片名称
   * @param value 卡片值
   */
  protected prependInlineReadyCard(
    node: NodeInterface | Node,
    inlineCard: string,
    value?: any,
  ) {
    node = $(node);
    const root = $('<span />');
    node.prepend(root);
    this.engine?.card.replaceNode(root, inlineCard, CardType.INLINE, value);
  }

  /**
   * 修复列表
   * @param node 节点
   * @param inlineCard inline 卡片
   */
  private repairListblock(node: NodeInterface, inlineCard?: string) {
    if (node && node.name === 'li') {
      if (inlineCard) this.prependInlineCard(node, inlineCard);
      if (node.first()) {
        const firstNode = node.first();
        if (node.hasClass('data-list-node') && firstNode?.isCard()) {
          const nextNode = firstNode?.next();
          if (!nextNode || nextNode[0].nodeValue === '') node.append('<br />');
        }
      } else node.append('<br />');
    }
  }

  toNormal(
    blocks: Array<NodeInterface>,
    tagName: 'ul' | 'ol' = 'ul',
    start?: number,
  ) {
    const nodes: Array<NodeInterface> = [];
    blocks.forEach(block => {
      const node = this.toNormalBlock(block, tagName, start);
      if (node) nodes.push(node);
    });
    return nodes;
  }

  toCustomize(blocks: Array<NodeInterface>, inlineCard: string, value?: any) {
    this.inlineCard = inlineCard;
    const nodes: Array<NodeInterface> = [];
    blocks.forEach(block => {
      if (!isCustomizeListBlock(block)) {
        const node = this.toCustomizeBlock(block, inlineCard, value);
        if (node) nodes.push(node);
      }
    });
    return nodes;
  }

  private toNormalBlock = (
    listBlock: NodeInterface,
    tagName: 'ul' | 'ol' = 'ul',
    start?: number,
  ) => {
    clearCustomizeList(listBlock);
    let indent;
    const targetList = $('<'.concat(tagName, ' />'));
    const listNode = $('<li />');

    switch (listBlock.name) {
      case 'li':
      case tagName:
        return listBlock;

      case 'ol':
      case 'ul':
        targetList.attr(listBlock.attr());
        listBlock = setNode(listBlock, targetList);
        return listBlock;

      case 'p':
        if (listBlock.parent()?.name === 'li') {
          unwrapNode(listBlock);
          return;
        }

        indent = removeUnit(listBlock.css('padding-left')) / 2;
        listBlock = setNode(listBlock, listNode);

        if (indent) {
          targetList.attr(INDENT_KEY, indent);
        }

        if (start) {
          targetList.attr('start', start);
        }

        listBlock = wrapNode(listBlock, targetList);
        return listBlock;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        listBlock = setNode(listBlock, listNode);
        listBlock = wrapNode(listBlock, targetList);
        return listBlock;
      default:
        return listBlock;
    }
  };

  protected toCustomizeBlock(
    listBlock: NodeInterface,
    inlineCard: string,
    value?: any,
  ) {
    let indent;
    const customizeRoot = $('<ul class="data-list"/>');
    const customizeItem = $('<li class="data-list-node"/>');

    switch (listBlock.name) {
      case 'li':
        listBlock.addClass('data-list-node');
        this.prependInlineCard(listBlock, inlineCard, value);
        return listBlock;

      case 'ul':
        listBlock.addClass('data-list');
        return listBlock;

      case 'ol':
        customizeRoot.attr(listBlock.attr());
        listBlock = setNode(listBlock, customizeRoot);
        return listBlock;

      case 'p':
        indent = removeUnit(listBlock.css('padding-left')) / 2;
        listBlock = setNode(listBlock, customizeItem);
        this.prependInlineCard(listBlock, inlineCard, value);

        if (indent) {
          customizeRoot.attr(INDENT_KEY, indent);
        }

        listBlock = wrapNode(listBlock, customizeRoot);
        return listBlock;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        listBlock = setNode(listBlock, customizeItem);
        this.prependInlineCard(listBlock, inlineCard, value);
        listBlock = wrapNode(listBlock, customizeRoot);
        return listBlock;
      default:
        return listBlock;
    }
  }

  pasteBefore(documentFragment: DocumentFragment) {
    if (!this.inlineCard) return;
    const node = $(documentFragment);
    const children = node.allChildren();
    children.forEach(child => {
      const domChild = $(child);
      if (domChild.name === 'li' && domChild.hasClass('data-list-node')) {
        domChild.closest('ul').addClass('data-list');
        if (
          domChild.find(`[${READY_CARD_KEY}=${this.inlineCard}]`).length === 0
        )
          this.prependInlineReadyCard(domChild, this.inlineCard!);
      }
    });
    this.isPasteList = children.some(
      child => child.nodeName.toLowerCase() === 'li',
    );
  }

  pasteInsert() {
    if (!this.inlineCard || !this.engine) return;
    const { change } = this.engine;
    const range = change.getRange();
    const rootBlock = range.getRootBlock();
    const nextBlock = rootBlock?.next();
    if (nextBlock && nextBlock.find('li.data-list-node').length > 0) {
      nextBlock.find('li.data-list-node').each(node => {
        const domNode = $(node);
        if (
          0 ===
          domNode.find(
            `[${CARD_KEY}=${this.inlineCard}],[${READY_CARD_KEY}=${this.inlineCard}]`,
          ).length
        )
          this.prependInlineReadyCard(domNode, this.inlineCard!);
      });
    }
  }

  pasteAfter() {
    if (this.isPasteList) {
      this.engine?.change.mergeAdjacentList();
    }
  }
}

export default ListEntry;
