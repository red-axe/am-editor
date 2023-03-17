import { ROOT_SELECTOR, EDITABLE_SELECTOR } from '../constants/root';
import DOMEvent from './event';
import $ from './parse';
import {
	toCamelCase,
	getStyleMap,
	getComputedStyle,
	getDocument,
	removeUnit,
} from '../utils';
import { Path } from '../model';
import {
	NodeInterface,
	EventInterface,
	Selector,
	Context,
	EventListener,
	ElementInterface,
} from '../types';
import {
	inEditor,
	isBlockCard,
	isCard,
	isCursor,
	isEditable,
	isEditableCard,
	isInlineCard,
	isMatchesSelector,
	isNode,
	isNodeEntry,
	isRoot,
} from './utils';

/**
 * 扩展 Node 类
 * @class NodeEntry
 * @constructor
 * @param nodes 需要扩展的 NodeList
 * @param context 节点上下文，或根节点
 */
class NodeEntry implements NodeInterface {
	events: EventInterface[] = [];
	document: Document | null = null;
	context: Context | undefined;
	name: string = '';
	type: number | undefined;
	window: Window | null = null;
	display: string | undefined;
	fragment?: DocumentFragment;
	[n: number]: Node;

	get length() {
		let len = 0,
			node;
		while ((node = this[len])) {
			len++;
		}
		return len;
	}

	constructor(nodes: Node | NodeList | Array<Node>, context?: Context) {
		if (isNode(nodes)) {
			if (nodes.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
				this.fragment = nodes as DocumentFragment;
			}
			nodes = [nodes];
		}
		nodes.forEach((node, index) => {
			this[index] = node;
			this.events[index] = new DOMEvent(); // 初始化事件对象
		});

		const baseNode = this[0];
		if (baseNode) {
			this.document = getDocument(context);
			this.context = context;
			const { nodeName, nodeType } = baseNode;
			this.name = nodeName.toLowerCase();
			this.type = nodeType;
			this.window = this.document.defaultView || window;
		}
	}

	/**
	 * 遍历
	 * @param {Function} callback 回调函数
	 * @return 返回当前实例
	 */
	each(
		callback: (node: Node, index: number) => boolean | void,
	): NodeInterface {
		let i = 0,
			node;
		while ((node = this[i])) {
			if (callback(node, i) === false) {
				break;
			}
			i++;
		}
		return this;
	}

	/**
	 * 将 NodeEntry 转换为 Array
	 * @return {Array} 返回数组
	 */
	toArray(): Array<NodeInterface> {
		const nodeArray: Array<NodeInterface> = [];
		this.each((node) => {
			nodeArray.push(new NodeEntry(node));
		});
		return nodeArray;
	}

	/**
	 * 判断当前节点是否为 Node.ELEMENT_NODE 节点类型
	 * @return {boolean}
	 */
	isElement(): boolean {
		return this.type === Node.ELEMENT_NODE;
	}

	/**
	 * 判断当前节点是否为 Node.TEXT_NODE 节点类型
	 * @return {boolean}
	 */
	isText(): boolean {
		return this.type === Node.TEXT_NODE;
	}

	/**
	 * 判断当前节点是否为Card组件
	 */
	isCard() {
		const element = this.get<HTMLElement>();
		return element?.nodeType === Node.ELEMENT_NODE && isCard(element);
	}
	/**
	 * 判断当前节点是否为block类型的Card组件
	 */
	isBlockCard() {
		const element = this.get<HTMLElement>();
		return element?.nodeType === Node.ELEMENT_NODE && isBlockCard(element);
	}
	/**
	 * 判断当前节点是否为inline类型的Card组件
	 * @returns
	 */
	isInlineCard() {
		const element = this.get<HTMLElement>();
		return element?.nodeType === Node.ELEMENT_NODE && isInlineCard(element);
	}
	/**
	 * 是否是可编辑器卡片
	 * @returns
	 */
	isEditableCard() {
		const element = this.get<HTMLElement>();
		return (
			element?.nodeType === Node.ELEMENT_NODE && isEditableCard(element)
		);
	}

	/**
	 * 判断当前节点是否为根节点
	 */
	isRoot(root?: Node | NodeInterface) {
		const element = this.get<HTMLElement>();
		return (
			element?.nodeType === Node.ELEMENT_NODE &&
			isRoot(element, root ? root[0] ?? root : undefined)
		);
	}

	isEditable() {
		const element = this.get<HTMLElement>();
		return element?.nodeType === Node.ELEMENT_NODE && isEditable(element);
	}

	/**
	 * 判断当前是否在根节点内
	 */
	inEditor(root?: Node | NodeInterface) {
		const element = this.get();
		return (
			!!element && inEditor(element, root ? root[0] ?? root : undefined)
		);
	}

	/**
	 * 是否是光标标记节点
	 * @returns
	 */
	isCursor() {
		const element = this.get<HTMLElement>();
		return element?.nodeType === Node.ELEMENT_NODE && isCursor(element);
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
			? new NodeEntry(this[index])
			: undefined;
	}

	/**
	 * 获取当前节点所在父节点中的索引
	 * @return {number} 返回索引
	 */
	index(): number {
		let prev = this.get()?.previousSibling;
		let index = 0;

		while (prev && prev.nodeType === Node.ELEMENT_NODE) {
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
		const thisEl = this.get();
		const node = thisEl?.parentElement ?? thisEl?.parentNode;
		return node ? new NodeEntry(node) : undefined;
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
		if (this.fragment) return this.eq(0) || null;
		const node = this.length === 0 ? null : this.get()?.firstChild;
		return node ? new NodeEntry(node) : null;
	}

	/**
	 * 获取当前节点最后一个子节点
	 * @return NodeEntry 子节点
	 */
	last(): NodeInterface | null {
		if (this.fragment) return this.eq(this.length - 1) || null;
		const node = this.length === 0 ? null : this.get()?.lastChild;
		return node ? new NodeEntry(node) : null;
	}

	/**
	 * 返回元素节点之前的兄弟节点（包括文本节点、注释节点）
	 * @return NodeEntry 节点
	 */
	prev(): NodeInterface | null {
		const node = this.length === 0 ? null : this.get()?.previousSibling;
		return node ? new NodeEntry(node) : null;
	}

	/**
	 * 返回元素节点之后的兄弟节点（包括文本节点、注释节点）
	 * @return NodeEntry 节点
	 */
	next(): NodeInterface | null {
		const node = this.length === 0 ? null : this.get()?.nextSibling;
		return node ? new NodeEntry(node) : null;
	}

	/**
	 * 返回元素节点之前的兄弟元素节点（不包括文本节点、注释节点）
	 * @return NodeEntry 节点
	 */
	prevElement(): NodeInterface | null {
		const node =
			this.length === 0
				? null
				: this.get<Element>()!.previousElementSibling;
		return node ? new NodeEntry(node) : null;
	}

	/**
	 * 返回元素节点之后的兄弟元素节点（不包括文本节点、注释节点）
	 * @return NodeEntry 节点
	 */
	nextElement(): NodeInterface | null {
		const node =
			this.length === 0 ? null : this.get<Element>()!.nextElementSibling;
		return node ? new NodeEntry(node) : null;
	}

	/**
	 * 返回元素节点所在根节点路径，默认根节点为 document.body
	 * @param context 根节点，默认为 document.body
	 * @param filter 获取index的时候过滤
	 * @param callback 获取index的时候回调
	 * @return 路径
	 */
	getPath(
		context?: Node | NodeInterface,
		filter?: (node: Node) => boolean,
		callback?: (
			index: number,
			path: number[],
			node: NodeInterface,
		) => number[] | undefined,
	): Array<number> {
		context = context || document.body;
		let path: Array<number> = [];
		if (this.length > 0) {
			const index = this.getIndex(filter);
			if (callback) {
				const value = callback(index, path, this);
				if (value) path = value;
			} else path.unshift(index);
		}
		if (this.equal(context)) return path;
		let parent = this.parent();
		while (parent && !parent.equal(context)) {
			const index = parent.getIndex(filter);
			if (callback) {
				const value = callback(index, path, parent);
				if (value) path = value;
			} else path.unshift(index);
			parent = parent.parent();
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
			this.get()!.nodeType === Node.DOCUMENT_NODE &&
			domNode?.nodeType !== Node.DOCUMENT_NODE
		) {
			return true;
		}

		if (domNode === this[0]) return true;

		while (
			(domNode = (domNode?.parentElement ?? domNode?.parentNode) || null)
		) {
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
		if (this.length > 0 && (this.isElement() || this.fragment)) {
			const nodeList = (
				this.fragment ? this.fragment : this.get<Element>()
			)?.querySelectorAll(selector);
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
		callback: (node: Node) => Node | undefined = (node) => {
			return node.parentElement ?? (node.parentNode || undefined);
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
	on<R = any, F extends EventListener<R> = EventListener<R>>(
		eventType: string,
		listener: F,
		options?: boolean | AddEventListenerOptions,
	): NodeInterface {
		this.each((node, i) => {
			node.addEventListener(eventType, listener, options);
			if (this.events[i]) this.events[i].on(eventType, listener, options);
		});
		return this;
	}

	/**
	 * 移除当前元素节点事件
	 * @param {string} eventType 事件类型
	 * @param {Function} listener 事件函数
	 * @return 返回当前实例
	 */
	off(
		eventType: string,
		listener: EventListener,
		options?: boolean | EventListenerOptions,
	): NodeInterface {
		this.each((node, i) => {
			node.removeEventListener(eventType, listener, options);
			if (this.events[i])
				this.events[i].off(eventType, listener, options);
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

			Object.keys(this.events[i].listeners).forEach((eventType) => {
				const listeners = this.events[i].listeners[eventType];
				for (let _i = 0; _i < listeners.length; _i++) {
					this.off(eventType, listeners[_i]);
					this.events[i].off(eventType, listeners[_i]);
					node.removeEventListener(eventType, listeners[_i], false);
				}
			});
		});
		return this;
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
			const element = this.get<Element>();
			if (!element) return {};
			const attrs = {};
			const attributes = element.attributes;
			for (let i = attributes.length; i--; ) {
				const item = attributes[i];
				attrs[item.name] = item.value;
			}
			return attrs;
		}

		if (typeof key === 'object') {
			for (const k in key) {
				const v = key[k];
				this.attributes(k, v);
			}
			return this;
		}

		if (val === undefined) {
			const element = this.get<Element>();
			return this.length > 0 && this.isElement()
				? element?.getAttribute(key) || ''
				: '';
		}
		const isRemoveStyle = key === 'style' && val === '';
		this.each((node) => {
			if (!(node instanceof Element)) return;
			if (isRemoveStyle) node.removeAttribute('style');
			else node.setAttribute(key, val.toString());
		});
		return this;
	}

	/**
	 * 移除元素节点属性
	 * @param {string} key 属性名称
	 * @return 返当前实例
	 */
	removeAttributes(key: string): NodeInterface {
		this.each((node) => {
			if (!(node instanceof Element)) return;
			node.removeAttribute(key);
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
		const element = this.get<Element>();
		if (!element) return false;
		let i = 0,
			name = null;
		const classList = element.classList || {};
		while ((name = classList[i])) {
			if (name === className) return true;
			i++;
		}
		return false;
	}

	/**
	 * 为元素节点增加一个 class
	 * @param {string} className
	 * @return 返当前实例
	 */
	addClass(className: string): NodeInterface {
		this.each((node) => {
			if (!(node instanceof Element)) return;
			node.classList.add(className);
		});
		return this;
	}

	/**
	 * 移除元素节点 class
	 * @param {string} className
	 * @return 返当前实例
	 */
	removeClass(className: string): NodeEntry {
		this.each((node) => {
			if (!(node instanceof Element)) return;
			node.classList.remove(className);
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
			for (const attr in key) {
				const value = key[attr];
				this.css(attr, value);
			}
			return this;
		}

		// 获取style样式值
		if (val === undefined) {
			if (this.length === 0 || this.isText()) {
				return '';
			}
			const element = this.get<HTMLElement>();
			if (!element) return '';
			return (
				element.style[toCamelCase(key)] ||
				getComputedStyle(<Element>this[0], key) ||
				''
			);
		}

		this.each((node) => {
			const element = <HTMLElement>node;
			element.style[toCamelCase(key)] = val.toString();
			if (element.style.length === 0) element.removeAttribute('style');
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
		return width ? removeUnit(width) || 0 : 0;
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
		if (html !== undefined) {
			const children = $(html);
			this.each((node) => {
				if (node.nodeType !== Node.ELEMENT_NODE) return;
				let child = node.firstChild;
				while (child) {
					const next = child.nextSibling;
					node.removeChild(child);
					child = next;
				}
				children.forEach((child) => {
					(node as Element).appendChild(child.cloneNode(true));
				});
			});
			return this;
		}
		return this.length > 0 && this[0] instanceof Element
			? this[0].innerHTML
			: '';
	}
	/**
	 * 获取或设置元素节点文本
	 */
	text(): string;
	text(text: string): NodeEntry;
	text(text?: string): string | NodeEntry {
		// 返回的数据包含 HTML 特殊字符，innerHTML 之前需要 escape
		// https://developer.mozilla.org/en-US-US/docs/Web/API/Node/textContent
		if (text !== undefined) {
			this.each((node) => {
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
			const parent = node.parentElement ?? node.parentNode;
			if (!parent) {
				return;
			}
			parent.removeChild(node);
			delete this[index];
		});
		return this;
	}

	/**
	 * 清空元素节点下的所有子节点
	 * @return 当前实例
	 */
	empty(): NodeInterface {
		this.each((node) => {
			let child = node.firstChild;
			while (child) {
				const next = child.nextSibling;
				node.removeChild(child);
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
		this.each((node) => {
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
		const nodes = $(selector, this.context);
		const isClone = typeof selector === 'string' && /<.+>/.test(selector);
		this.each((node) => {
			for (let i = nodes.length - 1; i >= 0; i--) {
				const child = isClone ? nodes[i].cloneNode(true) : nodes[i];
				if (node.firstChild) {
					node.insertBefore(child, node.firstChild);
				} else {
					node.appendChild(child);
				}
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
		const nodes = $(selector, this.context);
		const isClone = typeof selector === 'string' && /<.+>/.test(selector);
		this.each((node) => {
			for (let i = 0; i < nodes.length; i++) {
				const child = isClone ? nodes[i].cloneNode(true) : nodes[i];
				if (typeof selector === 'string') {
					if (node instanceof Element) node.append(child);
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
		const nodes = $(selector, this.context);
		const isClone = typeof selector === 'string' && /<.+>/.test(selector);
		this.each((node) => {
			const parentNode = node.parentElement ?? node.parentNode;
			if (!parentNode) return;
			nodes.forEach((child) => {
				if (isClone) child = child.cloneNode(true);
				parentNode.insertBefore(child, node);
				node = child;
			});
		});
		return this;
	}

	/**
	 * 在元素节点后插入内容
	 * @param selector 选择器或元素节点
	 * @return 当前实例
	 */
	after(selector: Selector): NodeInterface {
		const nodes = $(selector, this.context);
		const isClone = typeof selector === 'string' && /<.+>/.test(selector);
		this.each((node) => {
			const parentNode = node.parentElement ?? node.parentNode;
			if (!parentNode) return;
			nodes.forEach((child) => {
				if (isClone) child = child.cloneNode(true);
				if (node.nextSibling) {
					parentNode.insertBefore(child, node.nextSibling);
					node = child;
				} else {
					parentNode.appendChild(child);
				}
			});
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
		const nodes = $(selector, this.context);
		const isClone = typeof selector === 'string' && /<.+>/.test(selector);
		this.each((node) => {
			const parentNode = node.parentElement ?? node.parentNode;
			if (!parentNode) return;
			const newNode = isClone ? nodes[0].cloneNode(true) : nodes[0];
			try {
				parentNode.replaceChild(newNode, node);
				newNodes.push(newNode);
			} catch (error) {}
		});
		return new NodeEntry(newNodes);
	}

	getRoot(): NodeInterface {
		return this.closest(ROOT_SELECTOR);
	}

	traverse(
		callback: (
			node: NodeInterface,
		) => boolean | void | null | NodeInterface,
		order: boolean = true,
		includeCard: boolean | 'editable' = false,
		onStart?: (node: NodeInterface) => void,
		onEnd?: (node: NodeInterface, next: NodeInterface | null) => void,
	) {
		const walk = (node: NodeInterface) => {
			let isCard = node.isCard();
			if (
				// 不能是 fragment 或者 fragment 只有一个子节点，且子节点是 card
				isCard &&
				(!node.fragment || node.fragment.childNodes.length === 1) &&
				(!includeCard ||
					(includeCard === 'editable' && !node.isEditableCard()))
			) {
				return;
			}
			let child = order ? node.first() : node.last();
			while (child) {
				const next = order ? child.next() : child.prev();
				if (onStart) onStart(child);
				const result = callback(child);

				if (result === false) {
					if (onEnd) onEnd(child, next);
					return;
				}
				if (result !== true) {
					const isResultChild = result && typeof result !== 'boolean';
					if (isResultChild) {
						if (onEnd) onEnd(child, result);
						child = result;
					}
					isCard = child.isCard();
					if (isCard) {
						// 遍历任意卡片
						if (includeCard === true) {
							if (isResultChild) callback(child);
							walk(child);
						} else if (
							includeCard === 'editable' &&
							child.isEditableCard()
						) {
							const editableElements =
								child.find(EDITABLE_SELECTOR);
							editableElements.each((_, index) => {
								const editableElement =
									editableElements.eq(index);
								if (editableElement) walk(editableElement);
							});
						}
					} else {
						if (isResultChild) callback(child);
						walk(child);
					}
				}
				if (onEnd) onEnd(child, next);
				child = next;
			}
		};

		callback(this);
		walk(this);
	}

	getChildByPath(path: Path, filter?: (node: Node) => boolean): Node {
		let node = this.get()!;
		if (path.length === 0) return node;
		const getChildNode = (index: number | string) => {
			let i = 0;
			for (const child of node.childNodes) {
				if (filter && !filter(child)) continue;
				if (i == index) return child;
				i++;
			}
			return;
		};
		for (let i = 0; path[i] !== undefined; ) {
			const childNode = getChildNode(path[i]);
			if (!childNode) break;
			node = childNode;
			i++;
		}
		return node;
	}

	getIndex(filter?: (node: Node) => boolean) {
		const el = this[0];
		const parent = el.parentElement ?? el.parentNode;
		if (!parent) return 0;
		let i = 0;
		for (const child of parent.childNodes) {
			if (filter && !filter(child)) continue;
			if (child === this[0]) return i;
			i++;
		}
		return -1;
	}

	findParent(
		container: Node | NodeInterface = this.closest(ROOT_SELECTOR),
	): NodeInterface | null {
		const element = (container[0] ?? container) as Node;
		let parent = element.parentElement ?? element.parentNode;
		if (this.length === 0 || !parent) return null;
		let node: Node = this[0];
		while (
			(parent = node.parentElement ?? node.parentNode) &&
			parent !== element
		) {
			node = parent;
		}

		if (!parent) return null;
		return new NodeEntry(node);
	}

	allChildren(includeCard: boolean | 'editable' = false) {
		const childNodes: Array<NodeInterface> = [];
		this.traverse(
			(node) => {
				childNodes.push(node);
			},
			undefined,
			includeCard,
		);
		childNodes.shift();
		return childNodes;
	}

	getViewport() {
		const { innerHeight, innerWidth } = this.window || {
			innerHeight: 0,
			innerWidth: 0,
		};

		const element = this.isText()
			? this.parent()?.get<Element>()
			: this.get<Element>();
		if (!element)
			return {
				top: 0,
				left: 0,
				bottom: 0,
				right: 0,
			};
		const rect = element.getBoundingClientRect();
		const { top, left, bottom, right } = rect;

		return {
			top,
			left,
			bottom: Math.min(bottom, innerHeight),
			right: Math.min(right, innerWidth),
		};
	}

	inViewport(view: NodeInterface, simpleMode: boolean = false) {
		let viewNode = null;
		if (view.type !== Node.ELEMENT_NODE) {
			if (!view.document) return false;
			viewNode = view.document.createElement('span');
			const parent = view[0].parentElement ?? view[0].parentNode;
			if (view.next()) {
				parent?.insertBefore(viewNode, view[0].nextSibling);
			} else {
				parent?.appendChild(viewNode);
			}
			view = new NodeEntry(viewNode);
		}
		const viewElement = view.get<Element>();
		if (!viewElement) return true;
		const { top, left, right, bottom } =
			viewElement.getBoundingClientRect();
		const vp = this.getViewport();
		if (viewNode)
			(viewNode.parentElement ?? viewNode.parentNode)?.removeChild(
				viewNode,
			);
		// 简单模式，只判断任一方向是否在视口内
		if (simpleMode) {
			return (
				(top > 0 && top <= vp.bottom) ||
				(bottom > 0 && bottom <= vp.bottom)
			);
		}
		return (
			top > 0 &&
			top >= vp.top &&
			left > 0 &&
			left >= vp.left &&
			bottom <= vp.bottom &&
			right <= vp.right
		);
	}

	scrollIntoView(
		view: NodeInterface,
		align: 'start' | 'center' | 'end' | 'nearest' = 'nearest',
	) {
		if (typeof view.document?.body.scrollIntoView === 'function') {
			let viewElement = null;
			if (
				view.type !== Node.ELEMENT_NODE ||
				view.name.toLowerCase() === 'br'
			) {
				viewElement = view.document.createElement('span');
				viewElement.innerHTML = '&nbsp;';
				(view[0].parentElement ?? view[0].parentNode)?.insertBefore(
					viewElement,
					view[0],
				);
				view = new NodeEntry(viewElement);
			}
			if (!this.inViewport(view)) {
				view.get<Element>()?.scrollIntoView({
					block: align,
					inline: align,
				});
			}
			if (viewElement)
				(
					viewElement.parentElement ?? viewElement.parentNode
				)?.removeChild(viewElement);
		}
	}
}
export default NodeEntry;
