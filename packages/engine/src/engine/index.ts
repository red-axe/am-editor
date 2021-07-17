import { merge } from 'lodash-es';
import NodeModel, { Event, $ } from '../node';
import language from '../locales';
import Change from '../change';
import { DATA_ELEMENT } from '../constants/root';
import schemaDefaultData from '../constants/schema';
import conversionDefault from '../constants/conversion';
import Schema from '../schema';
import OT from '../ot';
import {
	Selector,
	NodeInterface,
	EventInterface,
	EventListener,
	NodeModelInterface,
} from '../types/node';
import { ChangeInterface } from '../types/change';
import {
	ContainerInterface,
	EngineInterface,
	EngineOptions,
} from '../types/engine';
import { HistoryInterface } from '../types/history';
import { OTInterface } from '../types/ot';
import { SchemaInterface } from '../types/schema';
import { ConversionInterface } from '../types/conversion';
import { CommandInterface } from '../types/command';
import { PluginModelInterface } from '../types/plugin';
import { HotkeyInterface } from '../types/hotkey';
import { CardModelInterface } from '../types/card';
import { ClipboardInterface } from '../types/clipboard';
import { LanguageInterface } from '../types/language';
import { MarkModelInterface } from '../types/mark';
import { ListModelInterface } from '../types/list';
import { InlineModelInterface } from '../types/inline';
import { BlockModelInterface } from '../types/block';
import { RequestInterface } from '../types/request';
import Conversion from '../parser/conversion';
import History from '../history';
import { CARD_SELECTOR } from '../constants/card';
import Command from '../command';
import Hotkey from '../hotkey';
import Plugin from '../plugin';
import CardModel from '../card';
import { getDocument } from '../utils';
import { ANCHOR, CURSOR, FOCUS } from '../constants/selection';
import { toDOM } from '../ot/jsonml';
import Clipboard from '../clipboard';
import Parser from '../parser';
import Language from '../language';
import Mark from '../mark';
import List from '../list';
import { TypingInterface } from '../types';
import Typing from '../typing';
import Container from './container';
import Inline from '../inline';
import Block from '../block';
import Selection from '../selection';
import Request from '../request';
import './index.css';

class Engine implements EngineInterface {
	private _readonly: boolean = false;
	private _container: ContainerInterface;
	readonly kind = 'engine';
	options: EngineOptions = {
		lang: 'zh-CN',
		locale: {},
		plugins: [],
		cards: [],
		config: {},
	};
	language: LanguageInterface;
	root: NodeInterface;
	change: ChangeInterface;
	card: CardModelInterface;
	plugin: PluginModelInterface;
	node: NodeModelInterface;
	list: ListModelInterface;
	mark: MarkModelInterface;
	inline: InlineModelInterface;
	block: BlockModelInterface;
	event: EventInterface;
	typing: TypingInterface;
	ot: OTInterface;
	schema: SchemaInterface;
	conversion: ConversionInterface;
	history: HistoryInterface;
	scrollNode: NodeInterface | null;
	command: CommandInterface;
	hotkey: HotkeyInterface;
	clipboard: ClipboardInterface;
	request: RequestInterface;

	get container(): NodeInterface {
		return this._container.getNode();
	}

	get readonly(): boolean {
		return this._readonly;
	}

	set readonly(readonly: boolean) {
		if (this.readonly === readonly) return;
		if (readonly) {
			this.hotkey.disable();
			this._container.setReadonly(true);
		} else {
			this.hotkey.enable();
			this._container.setReadonly(false);
		}
		this._readonly = readonly;
		//广播readonly事件
		this.trigger('readonly', readonly);
	}

	constructor(selector: Selector, options?: EngineOptions) {
		this.options = { ...this.options, ...options };
		this.language = new Language(
			this.options.lang || 'zh-CN',
			merge(language, options?.locale),
		);
		this.event = new Event();
		this.command = new Command(this);
		this.schema = new Schema();
		this.schema.add(schemaDefaultData);
		this.conversion = new Conversion(this);
		conversionDefault.forEach((rule) =>
			this.conversion.add(rule.from, rule.to),
		);
		this.history = new History(this);
		this.card = new CardModel(this);
		this.clipboard = new Clipboard(this);
		this.request = new Request();
		this.plugin = new Plugin(this);
		this.node = new NodeModel(this);
		this.list = new List(this);
		this.mark = new Mark(this);
		this.inline = new Inline(this);
		this.block = new Block(this);
		this._container = new Container(selector, {
			engine: this,
			lang: this.options.lang,
			className: this.options.className,
			tabIndex: this.options.tabIndex,
		});
		this.root = $(
			this.options.root || this.container.parent() || getDocument().body,
		);
		this._container.init();
		this.change = new Change(this, {
			onChange: (value, trigger) =>
				this.trigger('change', value, trigger),
			onSelect: () => this.trigger('select'),
			onSetValue: () => this.trigger('afterSetValue'),
		});
		this.typing = new Typing(this);
		this.mark.init();
		this.inline.init();
		this.block.init();
		this.list.init();

		this.hotkey = new Hotkey(this);
		this.scrollNode = this.options.scrollNode
			? $(this.options.scrollNode)
			: null;
		this.card.init(this.options.cards || []);
		this.plugin.init(this.options.plugins || [], this.options.config || {});
		this.ot = new OT(this);
	}

	isSub() {
		return this.container.closest(CARD_SELECTOR).length > 0;
	}

	isFocus() {
		return this._container.isFocus();
	}

	focus() {
		this.change.focus();
	}

	on(eventType: string, listener: EventListener, rewrite?: boolean) {
		this.event.on(eventType, listener, rewrite);
		return this;
	}

	off(eventType: string, listener: EventListener) {
		this.event.off(eventType, listener);
		return this;
	}

	trigger(eventType: string, ...args: any) {
		return this.event.trigger(eventType, ...args);
	}

	getValue(ignoreCursor: boolean = false) {
		const value = this.change.getValue({});
		return ignoreCursor ? Selection.removeTags(value) : value;
	}

	async getValueAsync(ignoreCursor: boolean = false): Promise<string> {
		return new Promise((resolve) => {
			Object.keys(this.plugin.components).forEach(async (pluginName) => {
				const plugin = this.plugin.components[pluginName];
				if (plugin.waiting) await plugin.waiting();
			});
			resolve(this.getValue(ignoreCursor));
		});
	}

	getHtml(): string {
		const node = $(this.container[0].cloneNode(true));
		node.removeAttributes('contenteditable');
		node.removeAttributes('tabindex');
		node.removeAttributes('autocorrect');
		node.removeAttributes('autocomplete');
		node.removeAttributes('spellcheck');
		node.removeAttributes('data-gramm');
		node.removeAttributes('role');
		return new Parser(node, this).toHTML().html;
	}

	setValue(
		value: string,
		options?: {
			enableAsync?: boolean;
			triggerOT?: boolean;
			callback?: (count: number) => void;
		},
	) {
		this.readonly = false;
		value = this.trigger('beforeSetValue', value) || value;
		this.change.setValue(value, undefined, options);
		this.normalizeTree();
		return this;
	}

	setHtml(
		html: string,
		options?: {
			enableAsync?: boolean;
			triggerOT?: boolean;
			callback?: (count: number) => void;
		},
	) {
		this.change.setHtml(html, options);
		return this;
	}

	setJsonValue(
		value: Array<any>,
		options?: {
			enableAsync?: boolean;
			triggerOT?: boolean;
			callback?: (count: number) => void;
		},
	) {
		const dom = $(toDOM(value));
		const attributes = dom.get<Element>()?.attributes;
		for (let i = 0; attributes && i < attributes.length; i++) {
			const { nodeName, nodeValue } = attributes.item(i) || {};
			if (
				/^data-selection-/.test(nodeName || '') &&
				nodeValue !== 'null'
			) {
				this.container.attributes(nodeName, nodeValue!);
			}
		}
		const html = this.node.html(dom);
		this.change.setValue(html, undefined, options);
		const range = this.change.getRange();
		range.shrinkToElementNode();
		this.change.select(range);
		this.normalizeTree();
		return this;
	}

	destroy() {
		this._container.destroy();
		this.change.destroy();
		this.hotkey.destroy();
		this.card.gc();
		if (this.ot) {
			this.ot.destroy();
		}
	}

	private normalizeTree() {
		let block = $('<p />');
		const range = this.change.getRange();
		const selection = range.createSelection();
		let anchorNext, focusPrev, anchorParent, focusParent;
		if (selection.anchor && selection.focus) {
			anchorNext = selection.anchor.next();
			focusPrev = selection.focus.prev();
			anchorParent = selection.anchor.parent();
			focusParent = selection.focus.parent();
		}
		if (anchorNext) selection.anchor?.remove();
		if (focusPrev) selection.focus?.remove();
		// 保证所有行内元素都在段落内
		this.container.children().each((child) => {
			const node = $(child);
			if (this.node.isBlock(node)) {
				if (block.children().length > 0) {
					node.before(block);
				}
				block = $('<p />');
			} else {
				block.append(node);
			}
		});

		if (block.children().length > 0) {
			this.container.append(block);
		}
		if (anchorNext && selection.anchor && selection.anchor.length > 0)
			anchorNext.before(selection.anchor);
		if (focusPrev && selection.focus && selection.focus.length > 0)
			focusPrev.after(selection.focus);
		if (selection.has() && anchorNext && focusPrev) {
			if (anchorParent?.isEditable()) {
				block.append(selection.anchor!);
			}
			if (focusParent?.isEditable()) {
				block.append(selection.focus!);
			}
			if (block.children().length > 0) this.container.append(block);
		}
		// 处理空段落
		this.container.children().each((child) => {
			const node = $(child);
			this.node.removeMinusStyle(node, 'text-indent');
			if (this.node.isRootBlock(node)) {
				const childrenLength = node.children().length;
				if (childrenLength === 0) {
					node.remove();
				} else {
					const child = node.first();
					if (
						childrenLength === 1 &&
						child?.name === 'span' &&
						[CURSOR, ANCHOR, FOCUS].indexOf(
							child.attributes(DATA_ELEMENT),
						) >= 0
					) {
						node.prepend($('<br />'));
					}
				}
			}
		});
		selection.move();
	}

	messageSuccess(message: string) {
		console.log(`success:${message}`);
	}

	messageError(error: string) {
		console.log(`error:${error}`);
	}

	messageConfirm(message: string): Promise<boolean> {
		console.log(`confirm:${message}`);
		return Promise.reject(false);
	}
}

export default Engine;
