import NodeModel, { Event } from '../node';
import domQuery from '../node/query';
import language from '../locales';
import Change from '../change';
import { DATA_ELEMENT } from '../constants/root';
import schemaDefaultData from '../constants/schema';
import Schema from '../schema';
import OT from '../ot';
import {
	Selector,
	NodeInterface,
	EventInterface,
	EventListener,
	NodeModelInterface,
	Context,
	NodeEntry as NodeEntryType,
} from '../types/node';
import { ChangeInterface } from '../types/change';
import {
	ContainerInterface,
	EngineInterface,
	EngineOptions,
} from '../types/engine';
import { OTInterface } from '../types/ot';
import { SchemaInterface } from '../types/schema';
import { ConversionInterface } from '../types/conversion';
import Conversion from '../parser/conversion';
import { HistoryInterface } from '../types/history';
import History from '../history';
import { CARD_SELECTOR } from '../constants/card';
import Command from '../command';
import { CommandInterface } from '../types/command';
import { PluginModelInterface } from '../types/plugin';
import { HotkeyInterface } from '../types/hotkey';
import Hotkey from '../hotkey';
import Plugin from '../plugin';
import CardModel from '../card';
import { CardModelInterface } from '../types/card';
import { getDocument } from '../utils';
import { ANCHOR, CURSOR, FOCUS } from '../constants/selection';
import { toDOM } from '../ot/jsonml';
import { ClipboardInterface } from '../types/clipboard';
import Clipboard from '../clipboard';
import Parser from '../parser';
import { LanguageInterface } from '../types/language';
import Language from '../language';
import { MarkModelInterface } from '../types/mark';
import Mark from '../mark';
import { ListModelInterface } from '../types/list';
import List from '../list';
import { TypingInterface } from '../types';
import Typing from '../typing';
import Container from './container';
import { InlineModelInterface } from '../types/inline';
import { BlockModelInterface } from '../types/block';
import Inline from '../inline';
import Block from '../block';
import './index.css';
import Selection from '../selection';

class EngineModel implements EngineInterface {
	private _readonly: boolean = false;
	private _container: ContainerInterface;
	readonly kind = 'engine';
	options: EngineOptions = {
		lang: 'zh-cn',
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
		this.event.trigger('readonly', readonly);
	}

	constructor(selector: Selector, options?: EngineOptions) {
		this.options = { ...this.options, ...options };
		this.language = new Language(this.options.lang || 'zh-cn', language);
		this.event = new Event();
		this.command = new Command(this);
		this.schema = new Schema();
		this.schema.add(schemaDefaultData);
		this.conversion = new Conversion();
		this.history = new History(this);
		this.card = new CardModel(this);
		this.clipboard = new Clipboard(this);
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
		this.root = this.$(
			this.options.root || this.container.parent() || getDocument().body,
		);
		this._container.init();
		this.change = new Change(this, {
			onChange: value => this.event.trigger('change', value),
			onSelect: () => this.event.trigger('select'),
			onSetValue: () => this.event.trigger('setvalue'),
		});
		this.typing = new Typing(this);
		this.list.init();
		this.block.init();
		this.mark.init();
		this.inline.init();
		this.hotkey = new Hotkey(this);
		this.scrollNode = this.options.scrollNode
			? this.$(this.options.scrollNode)
			: null;
		this.card.init(this.options.cards || []);
		this.plugin.init(this.options.plugins || [], this.options.config || {});
		this.ot = new OT(this);
	}

	$ = (
		selector: Selector,
		context?: Context | null | false,
		clazz?: NodeEntryType,
	): NodeInterface => {
		return domQuery(this, selector, context, clazz);
	};

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

	getValue(ignoreCursor: boolean = false) {
		const value = this.change.getValue({});
		return ignoreCursor ? Selection.removeTags(value) : value;
	}

	getHtml(): string {
		const node = this.$(this.container[0].cloneNode(true));
		node.removeAttributes('contenteditable');
		node.removeAttributes('tabindex');
		node.removeAttributes('autocorrect');
		node.removeAttributes('autocomplete');
		node.removeAttributes('spellcheck');
		node.removeAttributes('data-gramm');
		node.removeAttributes('role');
		return new Parser(node, this).toHTML().html;
	}

	setValue(value: string) {
		this.readonly = false;
		this.event.trigger('beforesetvalue');
		this.change.setValue(value);
		this.normalizeTree();
		return this;
	}

	setJsonValue(value: Array<any>) {
		const dom = this.$(toDOM(value));
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
		this.change.setValue(html);
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
		let block = this.$('<p />');
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
		this.container.children().each(child => {
			const node = this.$(child);
			if (this.node.isBlock(node)) {
				if (block.children().length > 0) {
					node.before(block);
				}
				block = this.$('<p />');
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
			if (anchorParent?.isRoot()) {
				block.append(selection.anchor!);
			}
			if (focusParent?.isRoot()) {
				block.append(selection.focus!);
			}
			if (block.children().length > 0) this.container.append(block);
		}
		// 处理空段落
		this.container.children().each(child => {
			const node = this.$(child);
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
						node.prepend(this.$('<br />'));
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
}

export default EngineModel;
