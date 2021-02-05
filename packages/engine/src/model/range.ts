import { NodeInterface } from '../types/node';
import $, { isNodeEntry } from './node';
import { Bookmark, RangeInterface } from '../types/range';
import {
  createSideBlock,
  getWindow,
  inlineCardHasBlockStyle,
  isEdge,
  isMobile,
  isSafari,
  removeZeroWidthSpace,
} from '../utils';
import {
  CARD_ELEMENT_KEY,
  CARD_KEY,
  CARD_LEFT_SELECTOR,
  CARD_RIGHT_SELECTOR,
  CARD_SELECTOR,
} from '../constants/card';
import {
  ANCHOR,
  ANCHOR_SELECTOR,
  CURSOR,
  CURSOR_SELECTOR,
  FOCUS,
  FOCUS_SELECTOR,
} from '../constants/bookmark';
import { ROOT, DATA_ELEMENT, ROOT_SELECTOR } from '../constants/root';

class Range implements RangeInterface {
  static create: (
    doc?: Document,
    point?: { x: number; y: number },
  ) => RangeInterface;
  static from: (
    win?: Window | Selection | globalThis.Range,
    clone?: boolean,
  ) => RangeInterface | null;
  base: globalThis.Range;

  get collapsed() {
    return this.base.collapsed;
  }

  get endOffset() {
    return this.base.endOffset;
  }

  get startOffset() {
    return this.base.startOffset;
  }

  get startContainer() {
    return this.base.startContainer;
  }

  get endContainer() {
    return this.base.endContainer;
  }

  get commonAncestorContainer() {
    return this.base.commonAncestorContainer;
  }

  constructor(range: globalThis.Range) {
    this.base = range;
  }

  cloneContents(): DocumentFragment {
    return this.base.cloneContents();
  }

  deleteContents(): void {
    return this.base.deleteContents();
  }

  extractContents(): DocumentFragment {
    return this.base.extractContents();
  }
  getBoundingClientRect(): DOMRect {
    return this.base.getBoundingClientRect();
  }
  getClientRects(): DOMRectList {
    return this.base.getClientRects();
  }

  insertNode(node: Node | NodeInterface): void {
    if (isNodeEntry(node)) node = node[0];
    return this.base.insertNode(node);
  }

  isPointInRange(node: Node | NodeInterface, offset: number): boolean {
    if (isNodeEntry(node)) node = node[0];
    return this.base.isPointInRange(node, offset);
  }

  comparePoint(node: Node | NodeInterface, offset: number): number {
    if (isNodeEntry(node)) node = node[0];
    return this.base.comparePoint(node, offset);
  }

  setEnd(node: Node | NodeInterface, offset: number): void {
    if (isNodeEntry(node)) node = node[0];
    return this.base.setEnd(node, offset);
  }
  setEndAfter(node: Node | NodeInterface): void {
    if (isNodeEntry(node)) node = node[0];
    return this.base.setEndAfter(node);
  }
  setEndBefore(node: Node | NodeInterface): void {
    if (isNodeEntry(node)) node = node[0];
    return this.base.setEndBefore(node);
  }
  setStart(node: Node | NodeInterface, offset: number): void {
    if (isNodeEntry(node)) node = node[0];
    return this.base.setStart(node, offset);
  }
  setStartAfter(node: Node | NodeInterface): void {
    if (isNodeEntry(node)) node = node[0];
    return this.base.setStartAfter(node);
  }
  setStartBefore(node: Node | NodeInterface): void {
    if (isNodeEntry(node)) node = node[0];
    return this.base.setStartBefore(node);
  }

  toString() {
    return this.base.toString();
  }

  get startNode() {
    return $(this.base.startContainer);
  }

  get endNode() {
    return $(this.base.endContainer);
  }

  get commonAncestorNode() {
    return $(this.base.commonAncestorContainer);
  }

  toRange = (): globalThis.Range => {
    return this.base;
  };

  collapse = (toStart?: boolean) => {
    this.base.collapse(toStart);
    return this;
  };

  cloneRange = () => {
    return Range.from(this.base.cloneRange())!;
  };
  /**
   * 选中一个节点
   * @param node 节点
   * @param contents 是否只选中内容
   */
  select = (node: NodeInterface | Node, contents?: boolean) => {
    if (contents) {
      this.base.selectNodeContents(isNodeEntry(node) ? node[0] : node);
    } else {
      this.base.selectNode(isNodeEntry(node) ? node[0] : node);
    }
    return this;
  };

  getText = (): string | null => {
    const contents = this.cloneContents();
    return contents.textContent;
  };

  /**
   * 获取光标所占的区域
   */
  getClientRect = (): DOMRect => {
    let item = this.getClientRects().item(0);
    if (!item) {
      item = this.getBoundingClientRect();
    }
    return item;
  };

  /**
   * 将选择标记从 TextNode 扩大到最近非TextNode节点
   * range 实质所选择的内容不变
   */
  enlargeFromTextNode = () => {
    const enlargePosition = (node: Node, offset: number, type: string) => {
      if (node.nodeType !== getWindow().Node.TEXT_NODE) {
        return;
      }
      if (offset === 0) {
        switch (type) {
          case 'start':
            this.setStartBefore(node);
            break;
          case 'end':
            this.setEndBefore(node);
            break;
        }
      } else if (offset === node.nodeValue?.length) {
        switch (type) {
          case 'start':
            this.setStartAfter(node);
            break;
          case 'end':
            this.setEndAfter(node);
            break;
        }
      }
    };
    enlargePosition(this.startContainer, this.startOffset, 'start');
    enlargePosition(this.endContainer, this.endOffset, 'end');
    return this;
  };

  /**
   * 将选择标记从非 TextNode 缩小到TextNode节点上，与 enlargeFromTextNode 相反
   * range 实质所选择的内容不变
   */
  shrinkToTextNode = () => {
    const shrinkPosition = (node: Node, offset: number, type: string) => {
      if (node.nodeType !== getWindow().Node.ELEMENT_NODE) {
        return;
      }

      const childNodes = node.childNodes;
      if (childNodes.length === 0) {
        return;
      }

      let left;
      let right;
      let child;

      if (offset > 0) {
        left = childNodes[offset - 1];
      }

      if (offset < childNodes.length) {
        right = childNodes[offset];
      }

      if (left && left.nodeType === getWindow().Node.TEXT_NODE) {
        child = left;
        offset = child.nodeValue?.length || 0;
      }

      if (right && right.nodeType === getWindow().Node.TEXT_NODE) {
        child = right;
        offset = 0;
      }

      if (!child) {
        return;
      }
      switch (type) {
        case 'start':
          this.setStart(child, offset);
          break;
        case 'end':
          this.setEnd(child, offset);
          break;
      }
    };
    shrinkPosition(this.startContainer, this.startOffset, 'start');
    shrinkPosition(this.endContainer, this.endOffset, 'end');
    return this;
  };

  /**
   * 扩大边界
   * <p><strong><span>[123</span>abc]</strong>def</p>
   * to
   * <p>[<strong><span>123</span>abc</strong>]def</p>
   * @param range 选区
   * @param toBlock 是否扩大到块级节点
   */
  enlargeToElementNode = (toBlock?: boolean) => {
    const range = this.enlargeFromTextNode();
    const enlargePosition = (node: Node, offset: number, isStart: boolean) => {
      let domNode = $(node);
      if (
        domNode.type === getWindow().Node.TEXT_NODE ||
        domNode.isSolid() ||
        (!toBlock && domNode.isBlock()) ||
        domNode.isRoot()
      ) {
        return;
      }
      let parent;
      if (offset === 0) {
        while (!domNode.prev()) {
          parent = domNode.parent();
          if (!parent || parent.isSolid() || (!toBlock && parent.isBlock())) {
            break;
          }
          if (!parent.inRoot()) {
            break;
          }
          domNode = parent;
        }
        if (isStart) {
          range.setStartBefore(domNode[0]);
        } else {
          range.setEndBefore(domNode[0]);
        }
      } else if (offset === domNode.children().length) {
        while (!domNode.next()) {
          parent = domNode.parent();
          if (!parent || parent.isSolid() || (!toBlock && parent.isBlock())) {
            break;
          }
          if (!parent.inRoot()) {
            break;
          }
          domNode = parent;
        }
        if (isStart) {
          range.setStartAfter(domNode[0]);
        } else {
          range.setEndAfter(domNode[0]);
        }
      }
    };
    enlargePosition(range.startContainer, range.startOffset, true);
    enlargePosition(range.endContainer, range.endOffset, false);
    return this;
  };

  /**
   * 缩小边界
   * <body>[<p><strong>123</strong></p>]</body>
   * to
   * <body><p><strong>[123]</strong></p></body>
   * @param range 选区
   */
  shrinkToElementNode = () => {
    let child;
    while (
      this.startContainer.nodeType === getWindow().Node.ELEMENT_NODE &&
      (child = this.startContainer.childNodes[this.startOffset]) &&
      child.nodeType === getWindow().Node.ELEMENT_NODE &&
      !$(child).isVoid() &&
      !$(child).isCard()
    ) {
      this.setStart(child, 0);
    }
    while (
      this.endContainer.nodeType === getWindow().Node.ELEMENT_NODE &&
      this.endOffset > 0 &&
      (child = this.endContainer.childNodes[this.endOffset - 1]) &&
      child.nodeType === getWindow().Node.ELEMENT_NODE &&
      !$(child).isVoid() &&
      !$(child).isCard()
    ) {
      this.setEnd(child, child.childNodes.length);
    }
    return this;
  };

  /**
   * 创建 bookmark，通过插入 span 节点标记位置
   * @param range
   */
  createBookmark = (): Bookmark | undefined => {
    const ancestor = this.commonAncestorNode;
    // 超出编辑区域
    if (!ancestor.isRoot() && !ancestor.inRoot()) {
      return;
    }

    const doc = ancestor.doc;
    // 为了增加容错性，删除已有的标记
    const root = ancestor.closest(ROOT_SELECTOR);
    root.find(ANCHOR_SELECTOR).remove();
    root.find(FOCUS_SELECTOR).remove();
    root.find(CURSOR_SELECTOR).remove();
    // card 组件
    const startCardRoot = this.startNode.closest(CARD_SELECTOR);
    if (startCardRoot.length > 0 && !inlineCardHasBlockStyle(startCardRoot)) {
      const cardLeft = this.startNode.closest(CARD_LEFT_SELECTOR);
      if (cardLeft.length > 0) {
        this.setStartBefore(startCardRoot[0]);
      }
      const cardRight = this.startNode.closest(CARD_RIGHT_SELECTOR);
      if (cardRight.length > 0) {
        this.setStartAfter(startCardRoot[0]);
      }
    }

    if (this.startContainer !== this.endContainer) {
      const endCardRoot = this.endNode.closest(CARD_SELECTOR);
      // 具有 block css 属性的行内Card，不调整光标位置
      if (endCardRoot.length > 0 && !inlineCardHasBlockStyle(endCardRoot)) {
        const _cardLeft = this.endNode.closest(CARD_LEFT_SELECTOR);
        if (_cardLeft.length > 0) {
          this.setEndBefore(endCardRoot[0]);
        }
        const _cardRight = this.endNode.closest(CARD_RIGHT_SELECTOR);
        if (_cardRight.length > 0) {
          this.setEndAfter(endCardRoot[0]);
        }
      }
    }
    // cursor
    if (this.collapsed) {
      const cursor = doc!.createElement('span');
      $(cursor).attr(DATA_ELEMENT, CURSOR);
      this.insertNode(cursor);
      return {
        anchor: cursor,
        focus: cursor,
      };
    }
    // anchor
    const startRange = this.cloneRange();
    startRange.collapse(true);
    const anchor = doc!.createElement('span');
    $(anchor).attr(DATA_ELEMENT, ANCHOR);
    startRange.insertNode(anchor);
    this.setStartAfter(anchor);
    // focus
    const endRange = this.cloneRange();
    endRange.collapse(false);
    const focus = doc!.createElement('span');
    $(focus).attr(DATA_ELEMENT, FOCUS);
    endRange.insertNode(focus);
    return {
      anchor,
      focus,
    };
  };

  /**
   * 根据 bookmark 重新设置 range，并移除 span 节点
   * @param range 选区
   * @param bookmark 标记
   */
  moveToBookmark = (bookmark: Bookmark) => {
    if (!bookmark) {
      return;
    }
    if (bookmark.anchor === bookmark.focus) {
      const cursor = $(bookmark.anchor);
      const _parent = cursor.parent();
      if (!_parent) return;
      removeZeroWidthSpace(_parent);
      _parent[0].normalize();

      let isCardCursor = false;
      const prevNode = cursor.prev();
      const nextNode = cursor.next();
      // 具有 block css 属性的行内Card，不调整光标位置
      if (prevNode && prevNode.isCard() && !inlineCardHasBlockStyle(prevNode)) {
        const cardRight = prevNode.find(CARD_RIGHT_SELECTOR);
        if (cardRight.length > 0) {
          this.select(cardRight, true);
          this.collapse(false);
          isCardCursor = true;
        }
      } else if (
        nextNode &&
        nextNode.isCard() &&
        !inlineCardHasBlockStyle(nextNode)
      ) {
        const cardLeft = nextNode.find(CARD_LEFT_SELECTOR);
        if (cardLeft.length > 0) {
          this.select(cardLeft, true);
          this.collapse(false);
          isCardCursor = true;
        }
      }

      if (!isCardCursor) {
        this.setStartBefore(cursor[0]);
        this.collapse(true);
      }

      if (isEdge) {
        _parent![0].normalize();
        cursor.remove();
      } else {
        cursor.remove();
        _parent![0].normalize();
      }
      return;
    }
    // collapsed = false
    // range start
    const anchorNode = $(bookmark.anchor);
    let parent = anchorNode.parent();
    removeZeroWidthSpace(parent!);
    this.setStartBefore(anchorNode[0]);
    anchorNode.remove();
    parent![0].normalize();
    // range end
    const focusNode = $(bookmark.focus);
    parent = focusNode.parent();
    removeZeroWidthSpace(parent!);
    this.setEndBefore(focusNode[0]);
    focusNode.remove();
    parent![0].normalize();
    if (isSafari) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(this.base);
    }
  };

  /**
   * 获取子选区集合
   * @param range
   */
  getSubRanges = () => {
    const ranges: Array<RangeInterface> = [];
    this.commonAncestorNode.traverse(child => {
      if (child.isText()) {
        let offset = 0;
        const childNode = child.get()!;
        const valueLength = childNode.nodeValue?.length || 0;
        const start = this.comparePoint(childNode, offset);
        const end = this.comparePoint(childNode, valueLength);
        const docRange = Range.create();
        if (start < 0) {
          if (end < 0) return;
          if (end === 0) {
            docRange.setOffset(childNode, this.startOffset, valueLength);
          } else {
            docRange.setOffset(childNode, this.startOffset, this.endOffset);
          }
        } else {
          if (start !== 0) return;
          if (end < 0) return;
          if (end === 0) {
            docRange.setOffset(childNode, offset, valueLength);
          } else {
            docRange.setOffset(childNode, offset, this.endOffset);
          }
        }
        ranges.push(docRange);
      }
    });
    return ranges;
  };

  setOffset = (node: Node, start: number, end: number): RangeInterface => {
    this.setStart(node, start);
    this.setEnd(node, end);
    return this;
  };

  findElementsInSimpleRange = () => {
    const {
      startContainer,
      endContainer,
      startOffset,
      endOffset,
      collapsed,
    } = this;
    const elements: Array<Node> = [];
    if (
      startContainer !== endContainer ||
      collapsed === true ||
      startContainer.nodeType === getWindow().Node.TEXT_NODE
    ) {
      return elements;
    }

    const { childNodes } = startContainer;
    for (let i = startOffset; i < endOffset; i++) {
      elements.push(childNodes[i]);
    }
    return elements;
  };

  inCard = () => {
    const card = this.startNode.closest(CARD_SELECTOR);
    return card && card.length > 0;
  };

  getStartOffsetNode = (): Node => {
    const { startContainer, startOffset } = this;
    if (startContainer.nodeType === getWindow().Node.ELEMENT_NODE) {
      return (
        startContainer.childNodes[startOffset] ||
        startContainer.childNodes[startOffset - 1] ||
        startContainer
      );
    }
    return startContainer;
  };

  getEndOffsetNode = (): Node => {
    const { endContainer, endOffset } = this;
    if (endContainer.nodeType === getWindow().Node.ELEMENT_NODE) {
      return (
        endContainer.childNodes[endOffset] ||
        endContainer.childNodes[endOffset - 1] ||
        endContainer
      );
    }
    return endContainer;
  };

  scrollIntoView = () => {
    const endElement = this.endNode.get<Element>();
    if (isMobile && endElement && endElement.scrollIntoView) {
      endElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  };

  scrollRangeIntoView = () => {
    const node = this.getEndOffsetNode();
    const root =
      node.nodeType === getWindow().Node.TEXT_NODE ? node.parentNode : node;
    const rect = this.collapsed
      ? (root as Element).getBoundingClientRect()
      : this.getClientRect();
    const innerHeight = window.innerHeight;
    if (rect.bottom >= innerHeight || rect.bottom <= 0) {
      (root as Element).scrollIntoView({
        block: 'center',
      });
    }
  };

  scrollIntoViewIfNeeded = (node: NodeInterface, view: NodeInterface) => {
    if (this.collapsed) {
      node.scrollIntoView(view, $(this.getEndOffsetNode()));
    } else {
      const startNode = this.getStartOffsetNode();
      const endNode = this.getEndOffsetNode();

      node.scrollIntoView(view, $(startNode));
      if (!node.inViewport(view, $(endNode)))
        node.scrollIntoView(view, $(endNode));
    }
  };

  containsCard = () => {
    const { collapsed, commonAncestorNode } = this;
    return (
      !collapsed &&
      ((3 !== commonAncestorNode.type &&
        commonAncestorNode.find(CARD_SELECTOR).length > 0) ||
        commonAncestorNode.closest(CARD_SELECTOR).length > 0)
    );
  };

  /**
   * 输入内容时，删除浏览器生成的 BR 标签，对空 block 添加 BR
   * 删除场景
   * <p><br />foo</p>
   * <p>foo<br /></p>
   * 保留场景
   * <p><br /><br />foo</p>
   * <p>foo<br /><br /></p>
   * <p>foo<br />bar</p>
   * 添加场景
   * <p></p>
   * @param isLeft
   */
  addOrRemoveBr = (isLeft?: boolean) => {
    const block = this.commonAncestorNode.getClosestBlock();
    block.find('br').each(br => {
      const domBr = $(br);
      if (
        ((!domBr.prev() || domBr.prev()?.attr(CARD_KEY) === 'checkbox') &&
          domBr.next() &&
          domBr.next()!.name !== 'br' &&
          ![CURSOR, ANCHOR, FOCUS].includes(
            domBr.next()!.attr(DATA_ELEMENT),
          )) ||
        (!domBr.next() && domBr.prev() && domBr.prev()?.name !== 'br')
      ) {
        if (
          isLeft &&
          domBr.prev() &&
          'checkbox' !== domBr.prev()!.attr(CARD_KEY)
        )
          return;
        domBr.remove();
      }
    });

    if (
      !block.first() ||
      (block.children().length === 1 &&
        block.first()?.attr(CARD_KEY) === 'checkbox')
    ) {
      block.append('<br />');
      return this;
    }

    if (
      block.children().length === 2 &&
      block.first()?.attr(CARD_KEY) === 'checkbox' &&
      ['cursor', 'anchor', 'focus'].includes(
        block.last()?.attr(DATA_ELEMENT) || '',
      )
    ) {
      block.first()?.after('<br />');
    }
    return this;
  };

  /**
   * 获取开始位置前的节点
   * <strong>foo</strong>|bar
   */
  getPrevNode = () => {
    this.enlargeFromTextNode();
    const { startNode, startOffset } = this;

    if (startNode.isText()) {
      return;
    }
    const childNodes = startNode.children();
    if (childNodes.length === 0) {
      return;
    }
    return childNodes.eq(startOffset - 1);
  };

  /**
   * 获取结束位置后的节点
   * foo|<strong>bar</strong>
   */
  getNextNode = () => {
    this.enlargeFromTextNode();
    const { endNode, endOffset } = this;

    if (endNode.isText()) {
      return;
    }
    const childNodes = endNode.children();
    if (childNodes.length === 0) {
      return;
    }
    return childNodes.eq(endOffset);
  };

  /**
   * 判断范围的 EdgeOffset 是否在 Block 的开始位置
   * @param edge
   */
  isBlockFirstOffset = (edge: 'start' | 'end') => {
    const container = edge === 'start' ? this.startNode : this.endNode;
    const offset = edge === 'start' ? this.startOffset : this.endOffset;
    const newRange = this.cloneRange();
    const block = container.getClosestBlock();
    newRange.select(block, true);
    newRange.setEnd(container[0], offset);
    const fragment = newRange.cloneContents();

    if (!fragment.firstChild) {
      return true;
    }

    if (
      fragment.childNodes.length === 1 &&
      $(fragment.firstChild).name === 'br'
    ) {
      return true;
    }

    const node = $('<div />');
    node.append(fragment);
    return node.isEmpty();
  };

  /**
   * 判断范围的 EdgeOffset 是否在 Block 的最后位置
   * @param edge
   */
  isBlockLastOffset = (edge: 'start' | 'end') => {
    const container = edge === 'start' ? this.startNode : this.endNode;
    const offset = edge === 'start' ? this.startOffset : this.endOffset;
    const newRange = this.cloneRange();
    const block = container.getClosestBlock();
    newRange.select(block, true);
    newRange.setStart(container, offset);
    const fragment = newRange.cloneContents();

    if (!fragment.firstChild) {
      return true;
    }

    const node = $('<div />');
    node.append(fragment);

    return 0 >= node.find('br').length && node.isEmpty();
  };

  /**
   * 获取范围内的所有 Block
   */
  getBlocks = () => {
    const dupRange = this.cloneRange();
    dupRange.shrinkToElementNode();
    dupRange.shrinkToTextNode();
    const startBlock = dupRange.startNode.getClosestBlock();
    const endBlock = dupRange.endNode.getClosestBlock();
    const closestBlock = dupRange.commonAncestorNode.getClosestBlock();
    const blocks: Array<NodeInterface> = [];
    let started = false;
    closestBlock.traverse(node => {
      const domNode = $(node);
      if (domNode[0] === startBlock[0]) {
        started = true;
      }
      if (
        started &&
        domNode.isBlock() &&
        !domNode.isCard() &&
        domNode.inRoot()
      ) {
        blocks.push(domNode);
      }
      if (domNode[0] === endBlock[0]) {
        started = false;
        return false;
      }
      return;
    });
    // 未选中文本时忽略该 Block
    // 示例：<h3><anchor />word</h3><p><focus />another</p>
    if (blocks.length > 1 && dupRange.isBlockFirstOffset('end')) {
      blocks.pop();
    }
    return blocks;
  };

  /**
   * 获取对范围有效果的所有 Block
   */
  getActiveBlocks = () => {
    const range = this.cloneRange();
    range.shrinkToElementNode();
    const sc = range.startContainer;
    const so = range.startOffset;
    const ec = range.endContainer;
    const eo = range.endOffset;
    let startNode = sc;
    let endNode = ec;

    if (sc.nodeType === getWindow().Node.ELEMENT_NODE) {
      if (sc.childNodes[so]) {
        startNode = sc.childNodes[so] || sc;
      }
    }

    if (ec.nodeType === getWindow().Node.ELEMENT_NODE) {
      if (eo > 0 && ec.childNodes[eo - 1]) {
        endNode = ec.childNodes[eo - 1] || sc;
      }
    }
    // 折叠状态时，按右侧位置的方式处理
    if (range.collapsed) {
      startNode = endNode;
    }
    // 不存在时添加
    const addNode = (
      nodes: Array<NodeInterface>,
      nodeB: NodeInterface,
      preppend?: boolean,
    ) => {
      if (
        !nodes.some(nodeA => {
          return nodeA[0] === nodeB[0];
        })
      ) {
        if (preppend) {
          nodes.unshift(nodeB);
        } else {
          nodes.push(nodeB);
        }
      }
    };
    // 向上寻找
    const findNodes = (node: NodeInterface) => {
      const nodes = [];
      while (node) {
        if (node.isRoot()) {
          break;
        }
        if (node.isBlock()) {
          nodes.push(node);
        }
        const parent = node.parent();
        if (!parent) break;
        node = parent;
      }
      return nodes;
    };

    const nodes = range.getBlocks();
    // rang头部应该往数组头部插入节点
    findNodes($(startNode)).forEach(node => {
      return addNode(nodes, node, true);
    });

    if (!range.collapsed) {
      findNodes($(endNode)).forEach(node => {
        return addNode(nodes, node);
      });
    }
    return nodes;
  };

  /**
   * 获取范围内的所有 Inline
   */
  getActiveInlines = () => {
    const dupRange = this.cloneRange();
    // 左侧不动，只缩小右侧边界
    // <anchor /><a>foo</a><focus />bar
    // 改成s
    // <anchor /><a>foo<focus /></a>bar
    if (!this.collapsed) {
      const rightRange = this.cloneRange();
      rightRange.shrinkToElementNode();
      dupRange.setEnd(rightRange.endContainer, rightRange.endOffset);
    }

    const sc = dupRange.startContainer;
    const so = dupRange.startOffset;
    const ec = dupRange.endContainer;
    const eo = dupRange.endOffset;
    let startNode = sc;
    let endNode = ec;

    if (sc.nodeType === getWindow().Node.ELEMENT_NODE) {
      if (sc.childNodes[so]) {
        startNode = sc.childNodes[so] || sc;
      }
    }

    if (ec.nodeType === getWindow().Node.ELEMENT_NODE) {
      if (eo > 0 && ec.childNodes[eo - 1]) {
        endNode = ec.childNodes[eo - 1] || sc;
      }
    }
    // 折叠状态时，按右侧位置的方式处理
    if (this.collapsed) {
      startNode = endNode;
    }
    // 不存在时添加
    const addNode = (nodes: Array<NodeInterface>, nodeB: NodeInterface) => {
      if (!nodes.some(nodeA => nodeA[0] === nodeB[0])) {
        nodes.push(nodeB);
      }
    };
    // 向上寻找
    const findNodes = (node: NodeInterface) => {
      const nodes = [];
      while (node) {
        if (node.isRoot()) break;
        if (node.isInline()) nodes.push(node);
        const parent = node.parent();
        if (!parent) break;
        node = parent;
      }
      return nodes;
    };

    const nodes = findNodes($(startNode));
    if (!this.collapsed) {
      findNodes($(endNode)).forEach(nodeB => {
        return addNode(nodes, nodeB);
      });
    }
    return nodes;
  };

  /**
   * 获取对范围有效果的所有 Mark
   * @param range 范围
   */
  getActiveMarks = () => {
    const dupRange = this.cloneRange();
    // 左侧不动，只缩小右侧边界
    // <anchor /><strong>foo</strong><focus />bar
    // 改成
    // <anchor /><strong>foo<focus /></strong>bar
    if (!this.collapsed) {
      const rightRange = this.cloneRange();
      rightRange.shrinkToElementNode();
      dupRange.setEnd(rightRange.endContainer, rightRange.endOffset);
    }
    const sc = dupRange.startContainer;
    const so = dupRange.startOffset;
    const ec = dupRange.endContainer;
    const eo = dupRange.endOffset;
    let startNode = sc;
    let endNode = ec;
    if (sc.nodeType === getWindow().Node.ELEMENT_NODE) {
      if (sc.childNodes[so]) {
        startNode = sc.childNodes[so] || sc;
      }
    }
    if (ec.nodeType === getWindow().Node.ELEMENT_NODE) {
      if (eo > 0 && ec.childNodes[eo - 1]) {
        endNode = ec.childNodes[eo - 1] || sc;
      }
    }
    // 折叠状态时，按右侧位置的方式处理
    if (this.collapsed) {
      startNode = endNode;
    }
    // 不存在时添加
    const addNode = (nodes: Array<NodeInterface>, nodeB: NodeInterface) => {
      if (!nodes.some(nodeA => nodeA[0] === nodeB[0])) {
        nodes.push(nodeB);
      }
    };
    // 向上寻找
    const findNodes = (node: NodeInterface) => {
      let nodes: Array<NodeInterface> = [];
      while (node) {
        if (
          node.type === getWindow().Node.ELEMENT_NODE &&
          node.attr(DATA_ELEMENT) === ROOT
        ) {
          break;
        }
        if (
          node.isMark() &&
          !node.attr(CARD_KEY) &&
          !node.attr(CARD_ELEMENT_KEY)
        ) {
          nodes.push(node);
        }
        const parent = node.parent();
        if (!parent) break;
        node = parent;
      }
      return nodes;
    };

    const nodes = findNodes($(startNode));
    if (!this.collapsed) {
      findNodes($(endNode)).forEach(nodeB => {
        return addNode(nodes, nodeB);
      });
    }
    return nodes;
  };

  deepCut = () => {
    if (!this.collapsed) this.extractContents();
    const { startNode } = this;
    if (!startNode.isRoot()) {
      let node = startNode;
      if (node && !node.isRoot()) {
        let parentNode = node.parent();
        while (parentNode && !parentNode.isRoot()) {
          node = parentNode;
          parentNode = parentNode.parent();
        }
        this.setEndAfter(node[0]);
        const contents = this.extractContents();
        this.insertNode(contents);
        this.collapse(true);
      }
    }
  };

  /**
   * 获取 Block 左侧文本
   * @param block 节点
   */
  getBlockLeftText = (block: Node) => {
    const range = this;
    const leftBlock = createSideBlock({
      block,
      range,
      isLeft: true,
      clone: true,
    });
    return leftBlock.text().trim();
  };

  /**
   * 删除 Block 左侧文本
   * @param block 节点
   */
  removeBlockLeftText = (block: Node) => {
    const domBlock = $(block);
    this.createBookmark();
    const cursor = domBlock.find(CURSOR_SELECTOR);
    let isRemove = false;
    // 删除左侧文本节点
    domBlock.traverse(node => {
      const domNode = $(node);
      if (domNode[0] === cursor[0]) {
        cursor.remove();
        isRemove = true;
        return;
      }
      if (isRemove && domNode.isText()) {
        domNode.remove();
      }
    }, false);
  };

  /**
   * 判断选中的区域是否在List列表的开始
   */
  isListFirst = () => {
    //获取选区开始节点和位置偏移值
    const { startNode, startOffset } = this;
    //复制选区
    const cloneRange = this.cloneRange();
    //找到li节点
    const node = 'li' === startNode.name ? startNode : startNode.closest('li');
    //如果没有li节点
    if (!node[0]) return false;
    //让选区选择li节点
    cloneRange.select(node, true);
    //设置选区结束位置偏移值
    cloneRange.setEnd(startNode[0], startOffset);
    //复制选区内容
    const contents = cloneRange.cloneContents();
    //如果选区中没有节点
    if (!contents.firstChild) return true;
    //如果选区中只有一个节点，并且是br标签
    if (
      1 === contents.childNodes.length &&
      'br' === $(contents.firstChild).name
    )
      return true;
    //如果选区中只有一个节点，并且是自定义列表并且第一个是Card
    if (
      1 === contents.childNodes.length &&
      node.hasClass('data-list-node') &&
      $(contents.firstChild).isCard()
    )
      return true;
    //如果选区中只有两个节点，并且是自定义列表并且第一个是Card，最后一个为空节点
    if (
      2 === contents.childNodes.length &&
      node.hasClass('data-list-node') &&
      $(contents.firstChild).isCard() &&
      $(contents.lastChild || []).isEmpty()
    )
      return true;
    //判断选区内容是否是空节点
    const block = $('<div />');
    block.append(contents);
    return block.isEmpty();
  };

  /**
   * 判断选中的区域是否在List列表的末尾
   */
  isListLast = () => {
    //获取选区范围结束节点和结束位置偏移值
    const { endNode, endOffset } = this;
    //复制选区
    const cloneRange = this.cloneRange();
    //找到li节点
    const node = 'li' === endNode.name ? endNode : endNode.closest('li');
    //如果没有li节点
    if (!node[0]) return false;
    //让选区选择li节点
    cloneRange.select(node, true);
    //设置选区开始位置偏移值
    cloneRange.setStart(endNode, endOffset);
    //复制选区内容
    const contents = cloneRange.cloneContents();
    //如果选区中没有节点
    if (!contents.firstChild) return true;
    //如果选区中只有一个节点，并且是br标签
    if (
      1 === contents.childNodes.length &&
      'br' === $(contents.firstChild).name
    )
      return true;
    //判断选区内容是否是空节点
    const block = $('<div />');
    block.append(contents);
    return block.isEmpty();
  };

  /**
   * 对比两个范围是否相等
   * @param range 范围
   */
  equal(range: RangeInterface | globalThis.Range) {
    return (
      this.startContainer === range.startContainer &&
      this.startOffset === range.startOffset &&
      this.endContainer === range.endContainer &&
      this.endOffset === range.endOffset
    );
  }

  /**
   * 获取当前选区最近的根节点
   */
  getRootBlock() {
    if (this.startNode.isRoot())
      return this.startNode.children().eq(this.startOffset);
    let node: NodeInterface | undefined = this.startNode;
    while (node?.parent() && !node.parent()!.isRoot()) {
      node = node.parent();
    }
    return node;
  }
}

Range.create = (
  doc: Document = document,
  point?: { x: number; y: number },
): RangeInterface => {
  let range: globalThis.Range;
  if (point) range = doc.caretRangeFromPoint(point.x, point.y);
  else range = doc.createRange();
  return Range.from(range)!;
};

Range.from = (
  win: Window | Selection | globalThis.Range = window,
): RangeInterface | null => {
  if (!isRange(win)) {
    const selection = isSelection(win) ? win : win.getSelection();
    if (selection && selection.rangeCount > 0) {
      win = selection.getRangeAt(0);
    } else return null;
  }
  return new Range(win);
};

const isSelection = (
  param: Window | Selection | globalThis.Range,
): param is Selection => {
  return (param as Selection).getRangeAt !== undefined;
};
const isRange = (
  param: Window | Selection | globalThis.Range,
): param is globalThis.Range => {
  return (param as globalThis.Range).collapsed !== undefined;
};
export default Range;
