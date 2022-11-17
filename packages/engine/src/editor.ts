import merge from 'lodash/merge';
import Language from './language';
import {
	BlockModelInterface,
	CardEntry,
	CardModelInterface,
	ClipboardInterface,
	CommandInterface,
	ConversionInterface,
	EditorInterface,
	EditorOptions,
	EventInterface,
	EventListener,
	InlineModelInterface,
	LanguageInterface,
	MarkModelInterface,
	NodeIdInterface,
	NodeInterface,
	NodeModelInterface,
	PluginEntry,
	PluginModelInterface,
	RangeInterface,
	RequestInterface,
	SchemaInterface,
	Selector,
} from './types';
import { ListModelInterface } from './types/list';
import language from './locales';
import NodeModel, { $, Event } from './node';
import Command from './command';
import Plugin from './plugin';
import Schema from './schema';
import schemaDefaultData from './constants/schema';
import Conversion from './parser/conversion';
import conversionDefault from './constants/conversion';
import CardModel from './card';
import NodeId from './node/id';
import Clipboard from './clipboard';
import Request from './request';
import List from './list';
import Mark from './mark';
import Inline from './inline';
import Block from './block';
import Range from './range';
import {
	CARD_ELEMENT_KEY,
	CARD_KEY,
	DATA_ELEMENT,
	DATA_ID,
	ROOT,
} from './constants';
import { isEngine } from './utils';
import Parser from './parser';

class Editor<T extends EditorOptions = EditorOptions>
	implements EditorInterface<T>
{
	readonly kind: 'editor' | 'engine' | 'view' = 'editor';
	options: T = {
		lang: 'zh-CN',
		locale: {},
		plugins: [] as PluginEntry[],
		cards: [] as CardEntry[],
		config: {},
		iconFonts:
			"url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.woff2?t=1638071536645') format('woff2'), url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.woff?t=1638071536645') format('woff'), url('//at.alicdn.com/t/font_1456030_lnqmc6a6ca.ttf?t=1638071536645') format('truetype')",
	} as T;
	readonly container: NodeInterface;

	language: LanguageInterface;
	root: NodeInterface;
	card: CardModelInterface;
	plugin: PluginModelInterface;
	node: NodeModelInterface;
	nodeId: NodeIdInterface;
	list: ListModelInterface;
	mark: MarkModelInterface;
	inline: InlineModelInterface;
	block: BlockModelInterface;
	event: EventInterface;
	schema: SchemaInterface;
	conversion: ConversionInterface;
	command: CommandInterface;
	clipboard: ClipboardInterface;
	request: RequestInterface;
	#_scrollNode: NodeInterface | null = null;

	get scrollNode(): NodeInterface | null {
		if (this.#_scrollNode) return this.#_scrollNode;
		const { scrollNode } = this.options;
		let sn = scrollNode
			? typeof scrollNode === 'function'
				? scrollNode()
				: scrollNode
			: null;
		// 查找父级样式 overflow 或者 overflow-y 为 auto 或者 scroll 的节点
		const targetValues = ['auto', 'scroll'];
		let parent = this.container.parent();
		while (!sn && parent && parent.length > 0 && parent.name !== 'body') {
			if (
				targetValues.includes(parent.css('overflow')) ||
				targetValues.includes(parent.css('overflow-y'))
			) {
				sn = parent.get<HTMLElement>();
				break;
			} else {
				parent = parent.parent();
			}
		}
		if (sn === null) sn = document.documentElement;
		this.#_scrollNode = sn ? $(sn) : null;
		return this.#_scrollNode;
	}

	constructor(selector: Selector, options?: EditorOptions) {
		this.options = { ...this.options, ...options };
		let { iconFonts } = this.options;
		let fontElement = document.querySelector('#am-iconfont');
		if (!fontElement && iconFonts !== false) {
			fontElement = document.createElement('style');
			fontElement.setAttribute('type', 'text/css');
			fontElement.setAttribute('id', 'am-iconfont');
			let fontsStyle = '@font-face { font-family: "data-icon";';
			if (Array.isArray(iconFonts)) {
				iconFonts = iconFonts
					.map(
						(font) => `url('${font.url}') format('${font.format}')`,
					)
					.join(',');
			}
			fontsStyle += `src: ${iconFonts};}`;
			fontElement.innerHTML = fontsStyle;
			document.head.appendChild(fontElement);
		}

		this.container = $(selector);
		this.container.attributes(DATA_ELEMENT, ROOT);
		// 多语言
		this.language = new Language(
			this.options.lang || 'zh-CN',
			merge(language, options?.locale),
		);
		// 事件管理
		this.event = new Event();
		// 命令
		this.command = new Command(this);
		// 节点规则
		this.schema = new Schema();
		this.schema.add(schemaDefaultData);
		// 节点转换规则
		this.conversion = new Conversion(this);
		conversionDefault.forEach((rule) =>
			this.conversion.add(rule.from, rule.to),
		);
		// 卡片
		this.card = new CardModel(this, this.options.lazyRender);
		// 剪贴板
		this.clipboard = new Clipboard(this);
		// http请求
		this.request = new Request();
		// 插件
		this.plugin = new Plugin(this);
		// 节点管理
		this.node = new NodeModel(this);
		this.nodeId = new NodeId(this.schema);
		// 列表
		this.list = new List(this);
		// 样式标记
		this.mark = new Mark(this);
		// 行内样式
		this.inline = new Inline(this);
		// 块级节点
		this.block = new Block(this);
		// 编辑器父节点
		this.root = $(
			this.options.root || this.container.parent() || document.body,
		);
		const rootPosition = this.root.css('position');
		if (!rootPosition || rootPosition === 'static')
			this.root.css('position', 'relative');
	}

	init() {
		// 实例化插件
		this.mark.init();
		this.inline.init();
		this.block.init();
		this.list.init();
		const { plugins, cards, config } = this.options;
		this.card.init(cards ?? []);
		const configData =
			typeof config === 'function' ? config(this) : config ?? {};
		this.plugin.init(plugins ?? [], configData);
		this.nodeId.init();
	}

	setScrollNode(node?: HTMLElement) {
		this.#_scrollNode = node ? $(node) : null;
	}

	on<R = any, F extends EventListener<R> = EventListener<R>>(
		eventType: string,
		listener: F,
		options?: boolean | AddEventListenerOptions,
	) {
		this.event.on(eventType, listener, options);
		return this;
	}

	off(eventType: string, listener: EventListener) {
		this.event.off(eventType, listener);
		return this;
	}

	trigger<R = any>(eventType: string, ...args: any): R {
		return this.event.trigger<R>(eventType, ...args);
	}

	messageSuccess(type: string, message: string, ...args: any[]) {
		console.log(type, `success:${message}`, ...args);
	}

	messageError(type: string, error: string, ...args: any[]) {
		console.error(type, `error:${error}`, ...args);
	}

	messageConfirm(
		type: string,
		message: string,
		...args: any[]
	): Promise<boolean> {
		console.log(type, `confirm:${message}`, ...args);
		return Promise.reject(false);
	}

	getSelectionData(
		range?: RangeInterface,
	): Record<'html' | 'text', string> | undefined {
		if (!range) range = Range.from(this) ?? undefined;
		if (!range) return;
		range = range.cloneRange(); //.shrinkToElementNode();
		let card = range.startNode.closest(`[${CARD_KEY}]`, (node) => {
			return $(node).isEditable()
				? undefined
				: (node.parentElement ?? node.parentNode) || undefined;
		});
		if (card.length > 0 && !range.collapsed && range.endOffset === 0) {
			if (range.endContainer.previousSibling) {
				range.setEndAfter(range.endContainer.previousSibling);
			}
			if (
				!range.collapsed &&
				range.endOffset > 0 &&
				range.endContainer.childNodes[range.endOffset - 1] === card[0]
			) {
				const cardCenter = range.startNode.closest(
					`[${CARD_ELEMENT_KEY}="center"]`,
					(node) => {
						return $(node).isEditable()
							? undefined
							: (node.parentElement ?? node.parentNode) ||
									undefined;
					},
				);
				if (cardCenter.length > 0) {
					range.setEnd(
						cardCenter[0],
						cardCenter[0].childNodes.length,
					);
				} else {
					range.setEnd(card[0], card[0].childNodes.length);
				}
			}
		}
		let root = range.commonAncestorNode;
		card = root.closest(`[${CARD_KEY}]`, (node) => {
			return $(node).isEditable()
				? undefined
				: (node.parentElement ?? node.parentNode) || undefined;
		});
		if (card.length > 0) {
			const cardCenter = root.closest(
				`[${CARD_ELEMENT_KEY}="center"]`,
				(node) => {
					return $(node).isEditable()
						? undefined
						: (node.parentElement ?? node.parentNode) || undefined;
				},
			);
			if (cardCenter.length === 0) {
				range.select(card);
				root = range.commonAncestorNode;
			}
		}
		if (!root.inEditor() && !root.isRoot()) return;
		if (range.collapsed) {
			return;
		}

		const setNodes = (nodes: Node[]) => {
			if (0 === nodes.length) return {};
			for (let i = nodes.length - 1; i > 0; i--) {
				const node = nodes[i];
				node.appendChild(nodes[i - 1]);
			}
			return {
				inner: nodes[0],
				outter: nodes[nodes.length - 1],
			};
		};

		card = root.closest(`[${CARD_KEY}]`, (node) => {
			return (node.parentElement ?? node.parentNode) || undefined;
		});
		if (card.length > 0) {
			const compnoent = this.card.find(card);
			if (compnoent && compnoent.getSelectionNodes) {
				const nodes = compnoent.getSelectionNodes();
				if (nodes.length > 0) {
					const { inner, outter } = setNodes(
						nodes.map((node) => node[0]),
					);
					let html = nodes.map((node) => node.html()).join('');
					const parser = new Parser(`<div>${html}</div>`, this);
					html = parser.toHTML(inner, outter);
					const text = new Parser(html, this).toText(
						this.schema,
						true,
					);
					return { html, text };
				}
			} else if (!compnoent?.isEditable) return;
		}
		const { node, list } = this;
		// 修复自定义列表选择范围
		let customizeStartItem: NodeInterface | undefined;
		const li = range.startNode.closest('li');

		if (li && node.isCustomize(li)) {
			const endLi = range.endNode.closest('li');
			if (
				!li.equal(endLi) ||
				(list.isLast(range) && list.isFirst(range))
			) {
				if (list.isFirst(range)) {
					const ul = li.parent();
					const index = li.getIndex();
					if (ul) range.setStart(ul, index < 0 ? 0 : index);
				} else {
					const ul = li.parent();
					// 选在列表项靠后的节点，把剩余节点拼接成完成的列表项
					const selection = range.createSelection();
					const rightNode = selection.getNode(li, 'center', true);
					selection.anchor?.remove();
					selection.focus?.remove();
					if (isEngine(this)) this.change.combinText();
					if (rightNode.length > 0) {
						let isRemove = false;
						rightNode.each((_, index) => {
							const item = rightNode.eq(index);
							if (!isRemove && item?.name === 'li') {
								isRemove = true;
								return;
							}
							if (isRemove) item?.remove();
						});
						const card = li.first();
						const component = card
							? this.card.find(card)
							: undefined;
						if (component) {
							customizeStartItem = rightNode;
							this.list.addCardToCustomize(
								customizeStartItem,
								component.name,
								component.getValue(),
							);
							if (ul) node.wrap(customizeStartItem, ul?.clone());
						}
					}
				}
			}
		}
		const contents = range.enlargeToElementNode(true).cloneContents();

		// 复制纯文本，获取外层的样式包裹层
		const nodes: Node[] = [];
		if (
			root.isText() &&
			contents.childNodes.length === 1 &&
			contents.firstChild?.nodeType === Node.TEXT_NODE
		) {
			let parent = root.parent();
			while (parent && (node.isMark(parent) || node.isInline(parent))) {
				nodes.push(parent.clone(false).get<Node>()!);
				parent = parent.parent();
			}
		}
		// if (customizeStartItem) {
		// 	contents.removeChild(contents.childNodes[0]);
		// 	contents.prepend(customizeStartItem[0]);
		// }
		const listMergeBlocks: NodeInterface[] = [];
		contents.querySelectorAll('li').forEach((child) => {
			const childElement = $(child);
			const dataId = childElement.attributes(DATA_ID);
			if (!dataId) return;
			const curentElement = this.container
				.get<HTMLElement>()
				?.querySelector(`[${DATA_ID}=${dataId}]`);
			// 补充自定义列表丢失的卡片
			if (
				node.isCustomize(childElement) &&
				!childElement.first()?.isCard() &&
				curentElement?.firstChild
			) {
				childElement.prepend(
					node.clone($(curentElement.firstChild), true, false),
				);
			}
			let parent: NodeInterface | Node | null | undefined =
				curentElement?.parentElement;
			parent = parent ? $(parent.cloneNode(false)) : null;
			const childParent = child.parentElement;
			if (
				curentElement &&
				parent &&
				node.isList(parent) &&
				(!childParent || !node.isList(childParent))
			) {
				if (parent.name === 'ol') {
					// 设置复制位置的 start 属性，默认不设置
					// let start = parseInt(parent.attributes('start') || '0', 10)
					// start = $(curentElement).index() + start
					// if(start === 0) start = 1
					// parent.attributes('start', start);
					parent.removeAttributes('start');
				}
				node.wrap(child, parent);
				listMergeBlocks.push(parent);
			}
		});
		const { inner, outter } = setNodes(nodes);
		const listNodes: NodeInterface[] = [];
		contents.childNodes.forEach((child) => {
			const childNode = $(child);
			if (node.isList(childNode) || childNode.name === 'li') {
				listNodes.push(childNode);
			}
		});
		this.nodeId.generateAll($(contents), true);
		// 合并列表
		this.list.merge(listNodes);
		const parser = new Parser(contents, this);
		let html = parser.toHTML(inner, outter);
		const text = new Parser(html, this).toText(this.schema, true);
		return { html, text };
	}

	destroy() {
		this.container.removeAttributes(DATA_ELEMENT);
		this.event.destroy();
		this.plugin.destroy();
		this.card.destroy();
		this.container.empty();
	}
}

export default Editor;
