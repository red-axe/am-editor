import {
  CARD_KEY,
  CARD_SELECTOR,
  CARD_TYPE_KEY,
  READY_CARD_KEY,
  READY_CARD_SELECTOR,
} from '../../constants/card';
import { DATA_ELEMENT, ROOT, ROOT_SELECTOR } from '../../constants/root';
import {
  BLOCK_TAG_MAP,
  INLINE_TAG_MAP,
  ROOT_TAG_MAP,
  MARK_TAG_MAP,
  VOID_TAG_MAP,
  SOLID_TAG_MAP,
  HEADING_TAG_MAP,
  TITLE_TAG_MAP,
  TABLE_TAG_MAP,
} from '../../constants/tags';
import DOMEvent from './event';
import DOMParse from './parse';
import {
  toCamelCase,
  getStyleMap,
  getComputedStyle,
  getAttrMap,
  getDocument,
  getWindow,
  generateRandomID,
  needMarkElementID,
  generateRandomIDForDescendant,
} from '../../utils';
import {
  NodeInterface,
  EventInterface,
  Selector,
  Context,
  EventListener,
} from '../../types/node';
import { Path } from 'sharedb';

interface ElementInterface extends Element {
  matchesSelector(selectors: string): boolean;
  mozMatchesSelector(selectors: string): boolean;
  msMatchesSelector(selectors: string): boolean;
  oMatchesSelector(selectors: string): boolean;
}

/**
 * 如果元素被指定的选择器字符串选择，Element.matches()  方法返回true; 否则返回false。
 * @param element 节点
 * @param selector 选择器
 */
const isMatchesSelector = (element: ElementInterface, selector: string) => {
  if (element.nodeType !== getWindow().Node.ELEMENT_NODE) {
    return false;
  }
  const matchesSelector =
    element.matches ||
    element.webkitMatchesSelector ||
    element.mozMatchesSelector ||
    element.msMatchesSelector ||
    element.oMatchesSelector ||
    element.matchesSelector ||
    function(element: Element, selector: string) {
      const domNode = new NodeEntry([element]);
      let matches = domNode.doc?.querySelectorAll(selector),
        i = matches ? matches.length : 0;
      while (--i >= 0 && matches?.item(i) !== domNode.get()) {}
      return i > -1;
    };
  return matchesSelector.call(element, selector);
};

/**
 * 扩展 Node 类
 * @class NodeEntry
 * @constructor
 * @param nodes 需要扩展的 NodeList
 * @param context 节点上下文，或根节点
 */
class NodeEntry implements NodeInterface {
  length: number = 0;
  events: EventInterface[] = [];
  doc: Document | null = null;
  root: Context | undefined;
  name: string | undefined;
  type: number | undefined;
  win: Window | null = null;
  display: string | undefined;
  isFragment: boolean = false;
  [n: number]: Node;

  constructor(nodes: Node | NodeList | Array<Node>, context?: Context) {
    if (isNode(nodes)) {
      if (nodes.nodeType === getWindow().Node.DOCUMENT_FRAGMENT_NODE)
        this.isFragment = true;
      nodes = [nodes];
    }

    for (let i = 0; i < nodes.length; i++) {
      this[i] = nodes[i];
      this.events[i] = new DOMEvent(); // 初始化事件对象
    }

    this.length = nodes.length;

    if (this.length > 0) {
      this.doc = getDocument(context);
      this.root = context;
      this.name = this[0].nodeName ? this[0].nodeName.toLowerCase() : '';
      this.type = this[0].nodeType;
      this.win = getWindow(this[0]);
    }
  }

  /**
   * 遍历
   * @param {Function} callback 回调函数
   * @return 返回当前实例
   */
  each(callback: (node: Node, index: number) => boolean | void): NodeInterface {
    for (let i = 0; i < this.length; i++) {
      if (callback(this[i], i) === false) {
        break;
      }
    }
    return this;
  }

  /**
   * 将 NodeEntry 转换为 Array
   * @return {Array} 返回数组
   */
  toArray(): Array<Node> {
    const nodeArray: Array<Node> = [];
    this.each(node => {
      nodeArray.push(node);
    });
    return nodeArray;
  }

  /**
   * 判断当前节点是否为 Node.ELEMENT_NODE 节点类型
   * @return {boolean}
   */
  isElement(): boolean {
    return this.type === getWindow().Node.ELEMENT_NODE;
  }

  /**
   * 判断当前节点是否为 Node.TEXT_NODE 节点类型
   * @return {boolean}
   */
  isText(): boolean {
    return this.type === getWindow().Node.TEXT_NODE;
  }

  /**
   * 判断当前节点是否为 block 类型
   */
  isBlock() {
    if (this.attr(CARD_TYPE_KEY) === 'inline') {
      return false;
    }
    return this.name ? BLOCK_TAG_MAP[this.name] : false;
  }

  /**
   * 判断当前节点是否为 inline 类型
   */
  isInline() {
    return this.name ? INLINE_TAG_MAP[this.name] : false;
  }

  /**
   * 判断当前节点是否为block类型根节点
   */
  isRootBlock() {
    return this.name ? ROOT_TAG_MAP[this.name] : false;
  }

  /**
   * 判断当前节点是否为block类型的简单节点（子节点不包含blcok标签）
   */
  isSimpleBlock() {
    if (!this.isBlock()) return false;
    let node = this.first();
    while (node) {
      if (node.isBlock()) return false;
      node = node.next();
    }
    return true;
  }

  /**
   * 判断当前节点是否为 mark 类型标签
   */
  isMark() {
    return this.name ? MARK_TAG_MAP[this.name] : false;
  }

  /**
   * 判断当前节点是否为Card组件
   */
  isCard() {
    return !!this.attr(CARD_TYPE_KEY);
  }

  /**
   * 判断当前节点是否为block类型的Card组件
   */
  isBlockCard() {
    return 'block' === this.attr(CARD_TYPE_KEY);
  }

  /**
   * 判断当前节点是否为不需要内容的空节点，如：br
   */
  isVoid() {
    return this.name ? VOID_TAG_MAP[this.name] : false;
  }

  /**
   * 判断当前节点是否为多级标签
   */
  isSolid() {
    return this.name ? SOLID_TAG_MAP[this.name] : false;
  }

  /**
   * 判断当前节点是否为主题节点
   */
  isHeading() {
    return this.name ? HEADING_TAG_MAP[this.name] : false;
  }

  /**
   * 判断当前节点是否为标题节点
   */
  isTitle() {
    return this.name ? TITLE_TAG_MAP[this.name] : false;
  }

  /**
   * 判断当前节点是否为表格
   */
  isTable() {
    return this.name ? TABLE_TAG_MAP[this.name] : false;
  }

  /**
   * 判断当前节点是否为根节点
   */
  isRoot() {
    return this.attr(DATA_ELEMENT) === ROOT;
  }

  /**
   * 判断当前是否在根节点内
   */
  inRoot() {
    if (this.isRoot()) {
      return false;
    }
    return this.closest(ROOT_SELECTOR).length > 0;
  }

  get<E extends Node>(index: number = 0): E | null {
    return this.length === 0 ? null : (this[index] as E);
  }

  /**
   * 获取当前第 index 节点
   * @param {number} index
   * @return {NodeEntry|undefined} NodeEntry 类，或 undefined
   */
  eq(index: number): NodeInterface | undefined {
    return index > -1 && index < this.length
      ? new NodeEntry([this[index]])
      : undefined;
  }

  /**
   * 获取当前节点所在父节点中的索引
   * @return {number} 返回索引
   */
  index(): number {
    let prev = this.get()?.previousSibling;
    let index = 0;

    while (prev && prev.nodeType === getWindow().Node.ELEMENT_NODE) {
      index++;
      prev = prev.previousSibling;
    }
    return index;
  }

  /**
   * 获取当前节点父节点
   * @return 父节点
   */
  parent(): NodeInterface | undefined {
    const node = this.get()?.parentNode;
    return node ? new NodeEntry([node]) : undefined;
  }

  /**
   * 查询当前节点的子节点
   * @param selector 查询器
   * @return 符合条件的子节点
   */
  children(selector?: string): NodeInterface {
    if (0 === this.length) return new NodeEntry([]);
    const childNodes = this.get()!.childNodes;
    if (selector) {
      let nodes = [];
      for (let i = 0; i < childNodes.length; i++) {
        const node = childNodes[i];
        if (isMatchesSelector(<ElementInterface>node, selector)) {
          nodes.push(node);
        }
      }
      return new NodeEntry(nodes);
    }
    return new NodeEntry(childNodes);
  }

  /**
   * 获取当前节点第一个子节点
   * @return NodeEntry 子节点
   */
  first(): NodeInterface | null {
    if (this.isFragment) return this.eq(0) || null;
    const node = this.length === 0 ? null : this.get()?.firstChild;
    return node ? new NodeEntry([node]) : null;
  }

  /**
   * 获取当前节点最后一个子节点
   * @return NodeEntry 子节点
   */
  last(): NodeInterface | null {
    if (this.isFragment) return this.eq(this.length - 1) || null;
    const node = this.length === 0 ? null : this.get()?.lastChild;
    return node ? new NodeEntry([node]) : null;
  }

  /**
   * 返回元素节点之前的兄弟节点（包括文本节点、注释节点）
   * @return NodeEntry 节点
   */
  prev(): NodeInterface | null {
    const node = this.length === 0 ? null : this.get()?.previousSibling;
    return node ? new NodeEntry([node]) : null;
  }

  /**
   * 返回元素节点之后的兄弟节点（包括文本节点、注释节点）
   * @return NodeEntry 节点
   */
  next(): NodeInterface | null {
    const node = this.length === 0 ? null : this.get()?.nextSibling;
    return node ? new NodeEntry([node]) : null;
  }

  /**
   * 返回元素节点之前的兄弟元素节点（不包括文本节点、注释节点）
   * @return NodeEntry 节点
   */
  prevElement(): NodeInterface | null {
    const node =
      this.length === 0 || !this.isElement()
        ? null
        : this.get<Element>()!.previousElementSibling;
    return node ? new NodeEntry([node]) : null;
  }

  /**
   * 返回元素节点之后的兄弟元素节点（不包括文本节点、注释节点）
   * @return NodeEntry 节点
   */
  nextElement(): NodeInterface | null {
    const node =
      this.length === 0 || !this.isElement()
        ? null
        : this.get<Element>()!.nextElementSibling;
    return node ? new NodeEntry([node]) : null;
  }

  /**
   * 返回元素节点所在根节点路径，默认根节点为 document.body
   * @param {Node} context 根节点，默认为 document.body
   * @return {string} 路径
   */
  getPath(context: Node): Array<string> {
    context = context || document.body;
    const path: Array<string> = [];
    if (this.length > 0) {
      path.push(this.name!);
      let parent = this.parent();
      while (parent && !this.equal(context) && !parent.equal(context)) {
        path.push(parent.name!);
        parent = parent.parent();
      }
    }
    return path;
  }

  /**
   * 判断元素节点是否包含要查询的节点
   * @param {NodeInterface | Node} node 要查询的节点
   * @return {boolean} 是否包含
   */
  contains(node: NodeInterface | Node): boolean {
    let domNode: Node | null = isNode(node) ? node : node.get();
    if (this.length === 0) {
      return false;
    }
    if (
      this.get()!.nodeType === getWindow().Node.DOCUMENT_NODE &&
      domNode?.nodeType !== getWindow().Node.DOCUMENT_NODE
    ) {
      return true;
    }

    while ((domNode = domNode?.parentNode || null)) {
      if (domNode === this[0]) {
        return true;
      }
    }
    return false;
  }

  /**
   * 根据查询器查询当前元素节点
   * @param {string} selector 查询器
   * @return 返回一个 NodeEntry 实例
   */
  find(selector: string): NodeInterface {
    if (this.length > 0 && this.isElement()) {
      const nodeList = this.get<Element>()?.querySelectorAll(selector);
      return new NodeEntry(nodeList || []);
    }
    return new NodeEntry([]);
  }

  /**
   * 根据查询器查询符合条件的离当前元素节点最近的父节点
   * @param selector 查询器
   * @return 返回一个 NodeEntry 实例
   */
  closest(
    selector: string,
    callback: (node: Node) => Node | undefined = node => {
      return node.parentNode || undefined;
    },
  ): NodeInterface {
    const nodeList: Array<Node> = [];
    let node: Node | undefined = this.get() || undefined;
    while (node) {
      if (isMatchesSelector(<ElementInterface>node, selector)) {
        nodeList.push(node);
        return new NodeEntry(nodeList);
      }
      node = callback(node);
    }
    return new NodeEntry(nodeList);
  }

  /**
   * 为当前元素节点绑定事件
   * @param {string} eventType 事件类型
   * @param {Function} listener 事件函数
   * @return 返回当前实例
   */
  on(eventType: string, listener: EventListener): NodeInterface {
    this.each((node, i) => {
      node.addEventListener(eventType, listener, false);
      this.events[i].on(eventType, listener);
    });
    return this;
  }

  /**
   * 移除当前元素节点事件
   * @param {string} eventType 事件类型
   * @param {Function} listener 事件函数
   * @return 返回当前实例
   */
  off(eventType: string, listener: EventListener): NodeInterface {
    this.each((node, i) => {
      node.removeEventListener(eventType, listener, false);

      this.events[i].off(eventType, listener);
    });
    return this;
  }

  /**
   * 获取当前元素节点相对于视口的位置
   * @param {Object} defaultValue 默认值
   * @return {Object}
   * {
   *  top,
   *  bottom,
   *  left,
   *  right
   * }
   */
  getBoundingClientRect(defaultValue?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }): { top: number; bottom: number; left: number; right: number } | undefined {
    if (this.length === 0) return undefined;
    try {
      const element = this.get<Element>()!;
      const rect = element.getBoundingClientRect();
      const top = document.documentElement.clientTop;
      const left = document.documentElement.clientLeft;
      return {
        top: rect.top - top,
        bottom: rect.bottom - top,
        left: rect.left - left,
        right: rect.right - left,
      };
    } catch (error) {
      console.error(error);
    }

    return defaultValue;
  }

  /**
   * 移除当前元素所有已绑定的事件
   * @return 当前 NodeEntry 实例
   */
  removeAllEvents(): NodeInterface {
    this.each((node, i) => {
      if (!this.events[i]) {
        return;
      }

      Object.keys(this.events[i].listeners).forEach(eventType => {
        const listeners = this.events[i].listeners[eventType];
        for (let _i = 0; _i < listeners.length; _i++) {
          node.removeEventListener(eventType, listeners[_i], false);
        }
      });
    });
    this.events = [];
    return this;
  }

  /**
   * 获取当前元素节点相对于视口的位置
   * @return {Object}
   * {
   *  top,
   *  left
   * }
   */
  offset(): { [k: string]: number } | undefined {
    if (this.length === 0) return undefined;
    try {
      const element = this.get<Element>()!;
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
      };
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  /**
   * 获取或设置元素节点属性
   * @param {string|undefined} key 属性名称，key为空获取所有属性，返回Map
   * @param {string|undefined} val 属性值，val为空获取当前key的属性，返回string|null
   * @return {NodeEntry|{[k:string]:string}} 返回值或当前实例
   */
  attr(): { [k: string]: string };
  attr(key: { [k: string]: string }): string;
  attr(key: string, val: string | number): NodeEntry;
  attr(key: string): string;
  attr(
    key?: string | { [k: string]: string },
    val?: string | number,
  ): NodeEntry | { [k: string]: string } | string {
    if (key === undefined) {
      const element = this.clone(false).get<Element>();
      return getAttrMap(element?.outerHTML || '');
    }

    if (typeof key === 'object') {
      Object.keys(key).forEach(k => {
        const v = key[k];
        this.attr(k, v);
      });
      return this;
    }

    if (val === undefined) {
      const element = this.get<Element>();
      return this.length > 0 && this.isElement()
        ? element?.getAttribute(key) || ''
        : '';
    }

    this.each(node => {
      const element = node as Element;
      element.setAttribute(key, val.toString());
    });
    return this;
  }

  /**
   * 移除元素节点属性
   * @param {string} key 属性名称
   * @return 返当前实例
   */
  removeAttr(key: string): NodeInterface {
    this.each(node => {
      const element = <Element>node;
      element.removeAttribute(key);
    });
    return this;
  }

  /**
   * 判断元素节点是否包含某个 class
   * @param {string} className 样式名称
   * @return {boolean} 是否包含
   */
  hasClass(className: string): boolean {
    if (this.length === 0) return false;
    const element = this.get<Element>()!;
    if (element.classList) {
      for (let i = 0; i < element.classList.length; i++) {
        if (element.classList[i] === className) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 为元素节点增加一个 class
   * @param {string} className
   * @return 返当前实例
   */
  addClass(className: string): NodeInterface {
    this.each(node => {
      const element = <Element>node;
      element.classList.add(className);
    });
    return this;
  }

  /**
   * 移除元素节点 class
   * @param {string} className
   * @return 返当前实例
   */
  removeClass(className: string): NodeEntry {
    this.each(node => {
      const element = <Element>node;
      element.classList.remove(className);
    });
    return this;
  }

  /**
   * 获取或设置元素节点样式
   * @param {string|undefined} key 样式名称
   * @param {string|undefined} val 样式值
   * @return {NodeEntry|{[k:string]:string}} 返回值或当前实例
   */
  css(): { [k: string]: string };
  css(key: { [k: string]: string | number }): NodeEntry;
  css(key: string): string;
  css(key: string, val: string | number): NodeEntry;
  css(
    key?: string | { [k: string]: string | number },
    val?: string | number,
  ): NodeEntry | { [k: string]: string } | string {
    if (key === undefined) {
      // 没有参数，返回style所有属性
      return getStyleMap(this.attr('style') || '');
    }

    if (typeof key === 'object') {
      Object.keys(key).forEach(attr => {
        const value = key[attr];
        this.css(attr, value);
      });
      return this;
    }

    // 获取style样式值
    if (val === undefined) {
      if (this.length === 0 || this.isText()) {
        return '';
      }
      const element = this.get<HTMLElement>()!;
      return (
        element.style[toCamelCase(key)] ||
        getComputedStyle(<Element>this[0], key) ||
        ''
      );
    }

    this.each(node => {
      const element = <HTMLElement>node;
      element.style[toCamelCase(key)] = val.toString();
    });
    return this;
  }

  /**
   * 获取元素节点宽度
   * @return {number} 宽度
   */
  width(): number {
    let width = this.css('width');
    if (width === 'auto') {
      const element = this.get<HTMLElement>()!;
      width = element.offsetWidth.toString();
    }
    return width ? parseFloat(width) || 0 : 0;
  }

  /**
   * 获取元素节点高度
   * @return {number} 高度
   */
  height(): number {
    let height = this.css('height');
    if (height === 'auto') {
      const element = this.get<HTMLElement>()!;
      height = element.offsetHeight.toString();
    }
    return height ? parseFloat(height) || 0 : 0;
  }

  /**
   * 获取或设置元素节点html文本
   * @param {string|undefined} val html文本
   * @return {NodeEntry|string} 当前实例或html文本
   */
  html(): string;
  html(val: string): NodeEntry;
  html(val?: string): NodeEntry | string {
    if (val === undefined) {
      return this.length > 0 ? this.get<HTMLElement>()?.innerHTML || '' : '';
    }

    this.each(node => {
      const element = <Element>node;
      element.innerHTML = val;
      generateRandomIDForDescendant(element);
    });
    return this;
  }

  htmlKeepID(): string;
  htmlKeepID(html: string): NodeEntry;
  htmlKeepID(html?: string): NodeEntry | string {
    if (html) {
      this.each(node => {
        (node as Element).innerHTML = html;
      });
      return this;
    }
    return this.length > 0 ? (this[0] as Element).innerHTML : '';
  }
  /**
   * 获取元素节点文本
   * @return {string} 文本
   */
  text(): string {
    // 返回的数据包含 HTML 特殊字符，innerHTML 之前需要 escape
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
    if (this.length === 0) return '';
    return this.get()?.textContent || '';
  }

  /**
   * 设置元素节点为显示状态
   * @param {string} display display值
   * @return 当前实例
   */
  show(display: string): NodeInterface {
    if (display === undefined) {
      display = this.display || '';
    }

    if (display === 'none') {
      display = '';
    }

    if (this.css('display') !== 'none') {
      return this;
    }

    return this.css('display', display);
  }

  /**
   * 设置元素节点为隐藏状态
   * @return 当前实例
   */
  hide(): NodeInterface {
    if (this.length === 0) {
      return this;
    }

    this.display = this.get<HTMLElement>()?.style.display;
    return this.css('display', 'none');
  }

  /**
   * 移除当前实例所有元素节点
   * @return 当前实例
   */
  remove(): NodeInterface {
    this.each((node, index) => {
      if (!node.parentNode) {
        return;
      }
      node.parentNode.removeChild(node);
      delete this[index];
    });
    this.length = 0;
    return this;
  }

  /**
   * 清空元素节点下的所有子节点
   * @return 当前实例
   */
  empty(): NodeInterface {
    this.each(node => {
      let child = node.firstChild;
      while (child) {
        if (!node.parentNode) {
          return;
        }

        const next = child.nextSibling;
        child.parentNode?.removeChild(child);
        child = next;
      }
    });
    return this;
  }

  /**
   * 比较两个元素节点是否相同
   * @param {NodeEntry|Node} node 比较的节点
   * @return {boolean} 是否相同
   */
  equal(node: NodeInterface | Node): boolean {
    if (isNode(node)) return this.get() === node;
    if (isNodeEntry(node)) return this.get() === node.get();
    return false;
  }

  /**
   * 复制元素节点
   * @param {boolean} deep 是否深度复制
   * @return 复制后的元素节点
   */
  clone(deep?: boolean): NodeInterface {
    const nodes: Array<Node> = [];
    this.each(node => {
      const cloneNode = node.cloneNode(deep);
      generateRandomIDForDescendant(cloneNode, true);
      if (needMarkElementID(cloneNode.nodeName)) {
        generateRandomID(cloneNode as Element, true);
      }
      nodes.push(cloneNode);
    });
    return new NodeEntry(nodes);
  }

  cloneKeepID(deep?: boolean): NodeInterface {
    const nodes: Array<Node> = [];
    this.each(node => {
      nodes.push(node.cloneNode(deep));
    });
    return new NodeEntry(nodes);
  }
  /**
   * 在元素节点的开头插入指定内容
   * @param selector 选择器或元素节点
   * @return 当前实例
   */
  prepend(selector: Selector): NodeInterface {
    this.each(node => {
      const nodes = DOMParse(selector, this.root);
      if (node.firstChild) {
        node.insertBefore(nodes[0], node.firstChild);
      } else {
        node.appendChild(nodes[0]);
      }
    });
    return this;
  }

  /**
   * 在元素节点的结尾插入指定内容
   * @param selector 选择器或元素节点
   * @return 当前实例
   */
  append(selector: Selector): NodeInterface {
    this.each(node => {
      const nodes = DOMParse(selector, this.root);
      for (let i = 0; i < nodes.length; i++) {
        const child = nodes[i];
        if (typeof selector === 'string') {
          node.appendChild(child.cloneNode(true));
        } else {
          node.appendChild(child);
        }
      }
    });
    return this;
  }

  /**
   * 在元素节点前插入新的节点
   * @param selector 选择器或元素节点
   * @return 当前实例
   */
  before(selector: Selector): NodeInterface {
    this.each(node => {
      const nodes = DOMParse(selector, this.root);
      node.parentNode?.insertBefore(nodes[0], node);
    });
    return this;
  }

  /**
   * 在元素节点后插入内容
   * @param selector 选择器或元素节点
   * @return 当前实例
   */
  after(selector: Selector): NodeInterface {
    this.each(node => {
      const nodes = DOMParse(selector, this.root);
      if (node.nextSibling) {
        node.parentNode?.insertBefore(nodes[0], node.nextSibling);
      } else {
        node.parentNode?.appendChild(nodes[0]);
      }
    });
    return this;
  }

  /**
   * 将元素节点替换为新的内容
   * @param selector 选择器或元素节点
   * @return 当前实例
   */
  replaceWith(selector: Selector): NodeInterface {
    const newNodes: Array<Node> = [];
    this.each(node => {
      const nodes = DOMParse(selector, this.root);
      const newNode = nodes[0];
      node.parentNode?.replaceChild(newNode, node);
      newNodes.push(newNode);
    });
    return new NodeEntry(newNodes);
  }

  getRoot(): NodeInterface {
    return this.closest(ROOT_SELECTOR);
  }

  traverse(
    callback: (node: NodeInterface) => boolean | void,
    order: boolean = true,
  ) {
    const walk = (node: NodeInterface) => {
      let child = order ? node.first() : node.last();
      while (child) {
        const next = order ? child.next() : child.prev();
        const result = callback(child);

        if (result === false) {
          return;
        }

        if (!child.isCard() && result !== true) {
          walk(child);
        }

        child = next;
      }
    };

    callback(this);
    walk(this);
  }

  getChildByPath(path: Path): Node {
    let node = this.get()!;
    for (let i = 0; path[i] !== undefined && node.childNodes[path[i]]; ) {
      node = node.childNodes[path[i]];
      i++;
    }
    return node;
  }

  inside(node: Node | NodeInterface): boolean {
    let parentNode = this.parent();
    while (parentNode) {
      if (parentNode.equal(node)) return true;
      parentNode = parentNode.parent();
    }
    return false;
  }

  getIndex() {
    let index = 0;
    const parent = this[0].parentNode;
    if (!parent) return index;
    Array.from(parent.childNodes).forEach((child, i) => {
      if (child === this.get()) index = i;
    });
    return index;
  }

  getParent(container: Node | NodeInterface): NodeInterface | null {
    if (isNode(container)) container = new NodeEntry(container);
    if (this.length === 0 || !this.parent()) return null;
    let node: NodeInterface = this;
    while (!node.parent()?.equal(container)) {
      if (!node.parent()) return null;
      node = node.parent()!;
    }
    return node;
  }

  allChildren() {
    const childNodes: Array<Node> = [];
    this.traverse(node => {
      childNodes.push(node[0]);
    });
    childNodes.shift();
    return childNodes;
  }

  getViewport(node?: NodeInterface) {
    const { innerHeight, innerWidth } = this.win || {
      innerHeight: 0,
      innerWidth: 0,
    };
    let top, left, bottom, right;
    if (node && node.length > 0) {
      const element = node.get<Element>()!;
      const rect = element.getBoundingClientRect();
      top = rect.top;
      left = rect.left;
      bottom = rect.bottom;
      right = rect.right;
    } else {
      const element = this.get<Element>()!;
      const rect = element.getBoundingClientRect();
      top = rect.top;
      left = rect.left;
      bottom = rect.bottom;
      right = rect.right;
    }
    return {
      top,
      left,
      bottom: Math.min(bottom, innerHeight),
      right: Math.min(right, innerWidth),
    };
  }

  inViewport(node: NodeInterface, view: NodeInterface) {
    let viewNode = null;
    if (view.type !== getWindow().Node.ELEMENT_NODE) {
      if (!view.doc) return false;
      viewNode = view.doc.createElement('span');
      if (view.next()) {
        view[0].parentNode?.insertBefore(viewNode, view[0].nextSibling);
      } else {
        view[0].parentNode?.appendChild(viewNode);
      }
      view = new NodeEntry(viewNode);
    }
    const viewElement = view[0] as Element;
    const { top, left, right, bottom } = viewElement.getBoundingClientRect();
    const vp = this.getViewport(node);
    if (viewNode) viewNode.parentNode?.removeChild(viewNode);
    return !(
      top < vp.top ||
      bottom > vp.bottom ||
      left < vp.left ||
      right > vp.right
    );
  }

  scrollIntoView(
    node: NodeInterface,
    view: NodeInterface,
    align: 'start' | 'center' | 'end' | 'nearest' = 'nearest',
  ) {
    if (typeof view.doc?.body.scrollIntoView === 'function') {
      let viewElement = null;
      if (
        view.type !== getWindow().Node.ELEMENT_NODE ||
        view.name?.toLowerCase() === 'br'
      ) {
        viewElement = view.doc.createElement('span');
        viewElement.innerHTML = '&nbsp;';
        view[0].parentNode?.insertBefore(viewElement, view[0]);
        view = new NodeEntry(viewElement);
      }
      if (!this.inViewport(node, view)) {
        view.get<Element>()?.scrollIntoView({
          block: align,
          inline: align,
        });
      }
      if (viewElement) viewElement.parentNode?.removeChild(viewElement);
    }
  }

  getClosestBlock() {
    let node: NodeInterface = this;
    const originNode = node;
    while (node) {
      if (node.isRoot() || node.isBlock()) {
        return node;
      }
      const parentNode = node.parent();
      if (!parentNode) break;
      node = parentNode;
    }
    return originNode;
  }

  /**
   * 获取最近的 Inline 节点
   */
  getClosestInline() {
    let node: NodeInterface = this;
    while (node && node.parent() && !node.isBlock()) {
      if (node.isRoot()) break;
      if (node.isInline()) return node;
      const parentNode = node.parent();
      if (!parentNode) break;
      node = parentNode;
    }
    return null;
  }

  /**
   * 获取向上第一个非 Mark 节点
   */
  getClosestNotMark() {
    let node: NodeInterface = this;
    while (node && (node.isMark() || node.isText())) {
      if (node.isRoot()) break;
      const parent = node.parent();
      if (!parent) break;
      node = parent;
    }
    return node;
  }

  /**
   * 判断节点下的文本是否为空
   * @param withTrim 是否 trim
   */
  isEmpty(withTrim?: boolean) {
    if (this.isElement()) {
      if (this.attr(CARD_KEY) || this.find(CARD_SELECTOR).length > 0) {
        return false;
      }

      if (
        this.attr(READY_CARD_KEY) ||
        this.find(READY_CARD_SELECTOR).length > 0
      ) {
        return false;
      }

      if (this.name !== 'br' && this.isVoid()) {
        return false;
      }

      if (this.find('hr,img,table').length > 0) {
        return false;
      }

      if (this.find('br').length > 1) {
        return false;
      }
    }

    let value = this.isText() ? this[0].nodeValue || '' : this.text();
    value = value?.replace(/\u200B/g, '');
    value = value?.replace(/\r\n|\n/, '');

    if (value && withTrim) {
      value = value.trim();
    }

    return value === '';
  }

  /**
   * 判断一个节点下的文本是否为空，或者只有空白字符
   */
  isEmptyWithTrim() {
    return this.isEmpty(true);
  }

  isLikeEmpty() {
    if (this.length === 0) return true;
    const { childNodes } = this[0];
    if (childNodes.length === 0) return true;
    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];
      if (child.nodeType === getWindow().Node.TEXT_NODE) {
        if (child['data'].replace(/\u200b/g, '') !== '') return false;
      } else if (child.nodeType === getWindow().Node.ELEMENT_NODE) {
        if ((child as Element).hasAttribute(CARD_KEY)) return false;
        if (!new NodeEntry(child).isLikeEmpty()) {
          return false;
        }
      }
    }
    return true;
  }
}
export default NodeEntry;

export const isNodeEntry = (selector: Selector): selector is NodeInterface => {
  return !!selector && (selector as NodeInterface).get !== undefined;
};

export const isNodeList = (selector: Selector): selector is NodeList => {
  return !!selector && (selector as NodeList).entries !== undefined;
};

export const isNode = (selector: Selector): selector is Node => {
  return !!selector && (selector as Node).nodeType !== undefined;
};
