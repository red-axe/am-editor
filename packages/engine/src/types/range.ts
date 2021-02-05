import { NodeInterface } from './node';

export interface Range {
  prototype: RangeInterface;
  new (): RangeInterface;
  create: (doc?: Document, point?: { x: number; y: number }) => RangeInterface;
  from: (win?: Window | Selection | globalThis.Range) => RangeInterface | null;
}

export interface RangeInterface {
  readonly base: globalThis.Range;
  readonly startNode: NodeInterface;
  readonly endNode: NodeInterface;
  readonly commonAncestorNode: NodeInterface;
  readonly startContainer: Node;
  readonly endContainer: Node;
  readonly commonAncestorContainer: Node;
  readonly collapsed: boolean;
  readonly endOffset: number;
  readonly startOffset: number;
  cloneContents(): DocumentFragment;
  deleteContents(): void;
  extractContents(): DocumentFragment;
  getBoundingClientRect(): DOMRect;
  getClientRects(): DOMRectList;
  insertNode(node: Node | NodeInterface): void;
  isPointInRange(node: Node | NodeInterface, offset: number): boolean;
  comparePoint(node: Node | NodeInterface, offset: number): number;
  setEnd(node: Node | NodeInterface, offset: number): void;
  setEndAfter(node: Node | NodeInterface): void;
  setEndBefore(node: Node | NodeInterface): void;
  setStart(node: Node | NodeInterface, offset: number): void;
  setStartAfter(node: Node | NodeInterface): void;
  setStartBefore(node: Node | NodeInterface): void;
  toString(): string;
  toRange(): globalThis.Range;
  collapse(toStart?: boolean): RangeInterface;
  cloneRange(): RangeInterface;
  /**
   * 选中一个节点
   * @param node 节点
   * @param contents 是否只选中内容
   */
  select(node: NodeInterface | Node, contents?: boolean): RangeInterface;
  /**
   * 获取光标选中的文本
   */
  getText(): string | null;
  /**
   * 获取光标所占的区域
   */
  getClientRect(): DOMRect;
  /**
   * 将选择标记从 TextNode 扩大到最近非TextNode节点
   * range 实质所选择的内容不变
   */
  enlargeFromTextNode(): RangeInterface;
  /**
   * 将选择标记从非 TextNode 缩小到TextNode节点上，与 enlargeFromTextNodeOutside 相反
   * range 实质所选择的内容不变
   */
  shrinkToTextNode(): RangeInterface;
  /**
   * 扩大边界
   * <p><strong><span>[123</span>abc]</strong>def</p>
   * to
   * <p>[<strong><span>123</span>abc</strong>]def</p>
   * @param range 选区
   * @param toBlock 是否扩大到块级节点
   */
  enlargeToElementNode(toBlock?: boolean): RangeInterface;
  /**
   * 缩小边界
   * <body>[<p><strong>123</strong></p>]</body>
   * to
   * <body><p><strong>[123]</strong></p></body>
   * @param range 选区
   */
  shrinkToElementNode(): RangeInterface;
  /**
   * 创建 bookmark，通过插入 span 节点标记位置
   * @param range
   */
  createBookmark(): Bookmark | undefined;
  /**
   * 根据 bookmark 重新设置 range，并移除 span 节点
   * @param range 选区
   * @param bookmark 标记
   */
  moveToBookmark(bookmark: Bookmark): void;
  /**
   * 获取子选区集合
   */
  getSubRanges(): Array<RangeInterface>;

  setOffset(node: Node, start: number, end: number): RangeInterface;

  findElementsInSimpleRange(): Array<Node>;

  inCard(): boolean;

  getStartOffsetNode(): Node;

  getEndOffsetNode(): Node;

  scrollIntoView(): void;

  scrollRangeIntoView(): void;

  scrollIntoViewIfNeeded(node: NodeInterface, view: NodeInterface): void;
  /**
   * 是否包含卡片
   */
  containsCard(): boolean;
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
  addOrRemoveBr(isLeft?: boolean): RangeInterface;

  /**
   * 获取开始位置前的节点
   * <strong>foo</strong>|bar
   */
  getPrevNode(): NodeInterface | undefined;

  /**
   * 获取结束位置后的节点
   * foo|<strong>bar</strong>
   */
  getNextNode(): NodeInterface | undefined;

  /**
   * 判断范围的 EdgeOffset 是否在 Block 的开始位置
   * @param edge
   */
  isBlockFirstOffset(edge: 'start' | 'end'): boolean;

  /**
   * 判断范围的 EdgeOffset 是否在 Block 的最后位置
   * @param edge
   */
  isBlockLastOffset(edge: 'start' | 'end'): boolean;

  /**
   * 获取范围内的所有 Block
   */
  getBlocks(): Array<NodeInterface>;

  /**
   * 获取对范围有效果的所有 Block
   */
  getActiveBlocks(): Array<NodeInterface>;

  /**
   * 获取范围内的所有 Inline
   */
  getActiveInlines(): Array<NodeInterface>;

  /**
   * 获取对范围有效果的所有 Mark
   * @param range 范围
   */
  getActiveMarks(): Array<NodeInterface>;

  /**
   * 深度剪切
   */
  deepCut(): void;

  /**
   * 获取 Block 左侧文本
   * @param block 节点
   */
  getBlockLeftText(block: Node): string;

  /**
   * 删除 Block 左侧文本
   * @param block 节点
   */
  removeBlockLeftText(block: Node): void;

  /**
   * 判断选中的区域是否在列表的开始
   * @param range 选中的区域
   */
  isListFirst(): boolean;

  /**
   * 判断选中的区域是否在列表的末尾
   */
  isListLast(): boolean;

  /**
   * 对比两个范围是否相等
   * @param range 范围
   */
  equal(range: RangeInterface | globalThis.Range): boolean;
  /**
   * 获取当前选区最近的根节点
   */
  getRootBlock(): NodeInterface | undefined;
}

export const isRange = (
  selector: NodeInterface | RangeInterface,
): selector is RangeInterface => {
  return !!selector && (<RangeInterface>selector).cloneRange !== undefined;
};

export type Bookmark = {
  anchor: HTMLSpanElement;
  focus: HTMLSpanElement;
};
