import {
	DATA_ELEMENT,
	ROOT,
	ROOT_SELECTOR,
	ANCHOR,
	CURSOR,
	FOCUS,
	CARD_TAG,
	CARD_TYPE_KEY,
	EDITABLE,
	EDITABLE_SELECTOR,
} from '../constants';
import DOMEvent from './event';
import domParse from './parse';
import {
	toCamelCase,
	getStyleMap,
	getComputedStyle,
	getAttrMap,
	getDocument,
	getWindow,
} from '../utils';
import { Path } from 'sharedb';
import {
	EditorInterface,
	NodeInterface,
	EventInterface,
	Selector,
	Context,
	EventListener,
	isNode,
	isNodeEntry,
	ElementInterface,
} from '../types';

/**
 * 扩展 Node 类
 * @class NodeEntry
 * @constructor
 * @param nodes 需要扩展的 NodeList
 * @param context 节点上下文，或根节点
 */
class NodeEntry implements NodeInterface {
	private editor: EditorInterface;
	length: number = 0;
	events: EventInterface[] = [];
	document: Document | null = null;
	context: Context | undefined;
	name: string = '';
	type: number | undefined;
	window: Window | null = null;
	display: string | undefined;
	isFragment: boolean = false;
	[n: number]: Node;

	constructor(
		editor: EditorInterface,
		nodes: Node | NodeList | Array<Node>,
		context?: Context,
	) {
		this.editor = editor;
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
			this.document = getDocument(context);
			this.context = context;
			this.name = this[0].nodeName ? this[0].nodeName.toLowerCase() : '';
			this.type = this[0].nodeType;
			this.window = getWindow(this[0]);
		}
	}

	/**
	 * 如果元素被指定的选择器字符串选择，Element.matches()  方法返回true; 否则返回false。
	 * @param element 节点
	 * @param selector 选择器
	 */
	isMatchesSelector(element: ElementInterface, selector: string) {
		if (element.nodeType !== getWindow().Node.ELEMENT_NODE) {
			return false;
		}
		const defaultMatches = (element: Element, selector: string) => {
			const domNode = new NodeEntry(this.editor, element);
			let matches = domNode.document?.querySelectorAll(selector),
				i = matches ? matches.length : 0;
			while (--i >= 0 && matches?.item(i) !== domNode.get()) {}
			return i > -1;
		};
		const matchesSelector =
			element.matches ||
			element.webkitMatchesSelector ||
			element.mozMatchesSelector ||
			element.msMatchesSelector ||
			element.oMatchesSelector ||
			element.matchesSelector ||
			defaultMatches;

		return matchesSelector.call(element, selector);
	}

	/**
	 * 遍历
	 * @param {Function} callback 回调函数
	 * @return 返回当前实例
	 */
	each(
		callback: (node: Node, index: number) => boolean | void,
	): NodeInterface {
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
	toArray(): Array<NodeInterface> {
		const nodeArray: Array<NodeInterface> = [];
		this.each(node => {
			nodeArray.push(new NodeEntry(this.editor, node));
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
	 * 判断当前节点是否为Card组件
	 */
	isCard() {
		return this.name === CARD_TAG || !!this.attributes(CARD_TYPE_KEY);
	}
	/**
	 * 判断当前节点是否为block类型的Card组件
	 */
	isBlockCard() {
		return 'block' === this.attributes(CARD_TYPE_KEY);
	}
	/**
	 * 判断当前节点是否为inline类型的Card组件
	 * @returns
	 */
	isInlineCard() {
		return 'inline' === this.attributes(CARD_TYPE_KEY);
	}
	/**
	 * 是否是可编辑器卡片
	 * @returns
	 */
	isEditableCard() {
		return this.find(EDITABLE_SELECTOR).length > 0;
	}
	/**
	 * 具有 display:block css 属性的inline card
	 */
	isPseudoBlockCard() {
		return (
			this.attributes(CARD_TYPE_KEY) === 'inline' &&
			this.css('display') === 'block'
		);
	}

	/**
	 * 判断当前节点是否为根节点
	 */
	isRoot() {
		return this.attributes(DATA_ELEMENT) === ROOT;
	}

	isEditable() {
		return this.isRoot() || this.attributes(DATA_ELEMENT) === EDITABLE;
	}

	/**
	 * 判断当前是否在根节点内
	 */
	inEditor() {
		if (this.isRoot()) {
			return false;
		}
		return this.closest(ROOT_SELECTOR).length > 0;
	}

	/**
	 * 是否是光标标记节点
	 * @returns
	 */
	isCursor() {
		return (
			[ANCHOR, FOCUS, CURSOR].indexOf(this.attributes(DATA_ELEMENT)) > -1
		);
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
			? new NodeEntry(this.editor, this[index])
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
		return node ? new NodeEntry(this.editor, node) : undefined;
	}

	/**
	 * 查询当前节点的子节点
	 * @param selector 查询器
	 * @return 符合条件的子节点
	 */
	children(selector?: string): NodeInterface {
		if (0 === this.length) return new NodeEntry(this.editor, []);
		const childNodes = this.get()!.childNodes;
		if (selector) {
			let nodes = [];
			for (let i = 0; i < childNodes.length; i++) {
				const node = childNodes[i];
				if (this.isMatchesSelector(<ElementInterface>node, selector)) {
					nodes.push(node);
				}
			}
			return new NodeEntry(this.editor, nodes);
		}
		return new NodeEntry(this.editor, childNodes);
	}

	/**
	 * 获取当前节点第一个子节点
	 * @return NodeEntry 子节点
	 */
	first(): NodeInterface | null {
		if (this.isFragment) return this.eq(0) || null;
		const node = this.length === 0 ? null : this.get()?.firstChild;
		return node ? new NodeEntry(this.editor, node) : null;
	}

	/**
	 * 获取当前节点最后一个子节点
	 * @return NodeEntry 子节点
	 */
	last(): NodeInterface | null {
		if (this.isFragment) return this.eq(this.length - 1) || null;
		const node = this.length === 0 ? null : this.get()?.lastChild;
		return node ? new NodeEntry(this.editor, node) : null;
	}

	/**
	 * 返回元素节点之前的兄弟节点（包括文本节点、注释节点）
	 * @return NodeEntry 节点
	 */
	prev(): NodeInterface | null {
		const node = this.length === 0 ? null : this.get()?.previousSibling;
		return node ? new NodeEntry(this.editor, node) : null;
	}

	/**
	 * 返回元素节点之后的兄弟节点（包括文本节点、注释节点）
	 * @return NodeEntry 节点
	 */
	next(): NodeInterface | null {
		const node = this.length === 0 ? null : this.get()?.nextSibling;
		return node ? new NodeEntry(this.editor, node) : null;
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
		return node ? new NodeEntry(this.editor, node) : null;
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
		return node ? new NodeEntry(this.editor, node) : null;
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
			return new NodeEntry(this.editor, nodeList || []);
		}
		return new NodeEntry(this.editor, []);
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
			if (this.isMatchesSelector(<ElementInterface>node, selector)) {
				nodeList.push(node);
				return new NodeEntry(this.editor, nodeList);
			}
			node = callback(node);
		}
		return new NodeEntry(this.editor, nodeList);
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
	}):
		| { top: number; bottom: number; left: number; right: number }
		| undefined {
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
	attributes(): { [k: string]: string };
	attributes(key: { [k: string]: string }): string;
	attributes(key: string, val: string | number): NodeEntry;
	attributes(key: string): string;
	attributes(
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
				this.attributes(k, v);
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
	removeAttributes(key: string): NodeInterface {
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
			return getStyleMap(this.attributes('style') || '');
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

	html(): string;
	html(html: string): NodeEntry;
	html(html?: string): NodeEntry | string {
		if (html) {
			this.each(node => {
				(node as Element).innerHTML = html;
			});
			return this;
		}
		return this.length > 0 ? (this[0] as Element).innerHTML : '';
	}
	/**
	 * 获取或设置元素节点文本
	 */
	text(): string;
	text(text: string): NodeEntry;
	text(text?: string): string | NodeEntry {
		// 返回的数据包含 HTML 特殊字符，innerHTML 之前需要 escape
		// https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
		if (text) {
			this.each(node => {
				node.textContent = text;
			});
			return this;
		}
		if (this.length === 0) return '';
		return this.get()?.textContent || '';
	}

	/**
	 * 设置元素节点为显示状态
	 * @param {string} display display值
	 * @return 当前实例
	 */
	show(display?: string): NodeInterface {
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

	clone(deep?: boolean): NodeInterface {
		const nodes: Array<Node> = [];
		this.each(node => {
			nodes.push(node.cloneNode(deep));
		});
		return new NodeEntry(this.editor, nodes);
	}
	/**
	 * 在元素节点的开头插入指定内容
	 * @param selector 选择器或元素节点
	 * @return 当前实例
	 */
	prepend(selector: Selector): NodeInterface {
		this.each(node => {
			const nodes = domParse(this.editor, selector, this.context);
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
			const nodes = domParse(this.editor, selector, this.context);
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
			const nodes = domParse(this.editor, selector, this.context);
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
			const nodes = domParse(this.editor, selector, this.context);
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
			const nodes = domParse(this.editor, selector, this.context);
			const newNode = nodes[0];
			node.parentNode?.replaceChild(newNode, node);
			newNodes.push(newNode);
		});
		return new NodeEntry(this.editor, newNodes);
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

	getChildByPath(path: Path, filter?: (node: Node) => boolean): Node {
		let node = this.get()!;
		const getChildNodes = () => {
			return filter
				? Array.from(node.childNodes).filter(filter)
				: Array.from(node.childNodes);
		};
		let childNodes = getChildNodes();
		for (let i = 0; path[i] !== undefined && childNodes[path[i]]; ) {
			node = childNodes[path[i]];
			childNodes = getChildNodes();
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

	getIndex(filter?: (node: Node) => boolean) {
		let index = 0;
		const parent = this[0].parentNode;
		if (!parent) return index;
		Array.from(parent.childNodes)
			.filter(filter || (() => true))
			.forEach((child, i) => {
				if (child === this.get()) index = i;
			});
		return index;
	}

	findParent(
		container: Node | NodeInterface = this.closest(ROOT_SELECTOR),
	): NodeInterface | null {
		if (isNode(container))
			container = new NodeEntry(this.editor, container);
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
		const { innerHeight, innerWidth } = this.window || {
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
			if (!view.document) return false;
			viewNode = view.document.createElement('span');
			if (view.next()) {
				view[0].parentNode?.insertBefore(viewNode, view[0].nextSibling);
			} else {
				view[0].parentNode?.appendChild(viewNode);
			}
			view = new NodeEntry(this.editor, viewNode);
		}
		const viewElement = view[0] as Element;
		const {
			top,
			left,
			right,
			bottom,
		} = viewElement.getBoundingClientRect();
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
		if (typeof view.document?.body.scrollIntoView === 'function') {
			let viewElement = null;
			if (
				view.type !== getWindow().Node.ELEMENT_NODE ||
				view.name.toLowerCase() === 'br'
			) {
				viewElement = view.document.createElement('span');
				viewElement.innerHTML = '&nbsp;';
				view[0].parentNode?.insertBefore(viewElement, view[0]);
				view = new NodeEntry(this.editor, viewElement);
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
}
export default NodeEntry;
