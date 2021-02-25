import $, { Event } from '../node';
import language from '../locales';
import Change from '../change';
import { ROOT, DATA_ELEMENT } from '../constants/root';
import schemaDefaultData from '../constants/schema';
import Schema from '../parser/schema';
import OT from '../ot';
import {
	Selector,
	NodeInterface,
	EventInterface,
	EventListener,
} from '../types/node';
import { ChangeInterface } from '../types/change';
import { EngineEntry, EngineInterface, EngineOptions } from '../types/engine';
import { OTInterface } from '../types/ot';
import { SchemaInterface } from '../types/schema';
import { ConversionInterface } from '../types/conversion';
import Conversion from '../parser/conversion';
import { HistoryInterface } from '../types/history';
import History from '../history';
import { CARD_SELECTOR } from '../constants/card';
import Command from '../command';
import { CommandInterface } from '../types/command';
import typingKeydown from '../typing/keydown';
import typingKeyup from '../typing/keyup';
import { PluginModelInterface } from '../types/plugin';
import { HotkeyInterface } from '../types/hotkey';
import Hotkey from '../hotkey';
import Plugin from '../plugin';
import CardModel from '../card';
import { CardModelInterface } from '../types/card';
import { removeBookmarkTags, removeMinusStyle } from '../utils';
import { ANCHOR, CURSOR, FOCUS } from '../constants/selection';
import { toDOM } from '../ot/jsonml';
import { ClipboardInterface } from '../types/clipboard';
import Clipboard from '../clipboard';
import Parser from '../parser';
import { LanguageInterface } from '../types/language';
import Language from '../language';
import './index.css';

class EngineModel implements EngineInterface {
	private _readonly: boolean = false;
	private options: EngineOptions = {
		lang: 'zh-cn',
		plugin: {},
	};
	language: LanguageInterface;
	container: NodeInterface;
	root: NodeInterface;
	change: ChangeInterface;
	card: CardModelInterface;
	plugin: PluginModelInterface;
	event: EventInterface;
	ot: OTInterface;
	schema: SchemaInterface;
	conversion: ConversionInterface;
	history: HistoryInterface;
	scrollNode: NodeInterface | null;
	private _focused: boolean = false;
	private _userChanged: boolean = false;
	command: CommandInterface;
	hotkey: HotkeyInterface;
	clipboard: ClipboardInterface;
	static plugin: PluginModelInterface;
	static card: CardModelInterface;

	get readonly(): boolean {
		return this._readonly;
	}

	set readonly(readonly: boolean) {
		if (this.readonly === readonly) return;
		if (readonly) {
			this.hotkey.disable();
			this.container.attr('contenteditable', 'false');
		} else {
			this.hotkey.enable();
			this.container.attr('contenteditable', 'true');
		}
		this._readonly = readonly;
		//广播readonly事件
		this.event.trigger('readonly', readonly);
	}

	constructor(selector: Selector, options?: EngineOptions) {
		this.options = { ...this.options, ...options };
		this.language = new Language(this.options.lang || 'zh-cn', language);
		this.container = this.initContainer(selector);
		this.root = $(
			this.options.root || this.container.parent() || document.body,
		);
		this.change = new Change(this, {
			onChange: value => this.event.trigger('change', value),
			onSelect: () => this.event.trigger('select'),
			onSetValue: () => this.event.trigger('setvalue'),
		});
		this.event = new Event();
		this.command = new Command(this);
		this.ot = new OT(this);
		this.schema = new Schema();
		this.schema.add(schemaDefaultData);
		this.conversion = new Conversion();
		this.history = new History(this);
		this.hotkey = new Hotkey(this);
		const EngineClass = this.constructor as EngineEntry;
		this.card = EngineClass.card || new CardModel();
		this.card.setEngine(this);
		this.clipboard = new Clipboard(this);
		this.plugin = EngineClass.plugin || new Plugin();
		this.plugin.setEngine(this);
		this.plugin.each((name, clazz) => {
			const config = (this.options.plugin || {})[name];
			const plugin = new clazz(name, {
				engine: this,
				...config,
			});
			this.plugin.components[name] = plugin;
			if (plugin.schema) this.schema.add(plugin.schema());
			if (plugin.locales) this.language.add(plugin.locales());
		});
		this._focused =
			document.activeElement !== null &&
			this.container.equal(document.activeElement);
		this.scrollNode = this.options.scrollNode
			? $(this.options.scrollNode)
			: null;
		this.initEvents();
	}

	hasUserChanged() {
		return this._userChanged;
	}

	resetUserChange() {
		this._userChanged = false;
	}

	setUserChanged() {
		this._userChanged = true;
		this.event.trigger('userchanged');
	}

	isSub() {
		return this.container.closest(CARD_SELECTOR).length > 0;
	}

	isFocus() {
		return this._focused;
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
		return ignoreCursor ? removeBookmarkTags(value) : value;
	}

	getHtml(): string {
		const node = $(this.container[0].cloneNode(true));
		node.removeAttr('contenteditable');
		node.removeAttr('tabindex');
		node.removeAttr('autocorrect');
		node.removeAttr('autocomplete');
		node.removeAttr('spellcheck');
		node.removeAttr('data-gramm');
		node.removeAttr('role');
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
		const dom = $(toDOM(value));
		const attributes = dom.get<Element>()?.attributes;
		for (let i = 0; attributes && i < attributes.length; i++) {
			const { nodeName, nodeValue } = attributes.item(i) || {};
			if (
				/^data-selection-/.test(nodeName || '') &&
				nodeValue !== 'null'
			) {
				this.container.attr(nodeName, nodeValue!);
			}
		}
		const html = dom.html();
		this.change.setValue(html);
		const range = this.change.getRange();
		range.shrinkToElementNode();
		this.change.select(range);
		this.normalizeTree();
		return this;
	}

	destroy() {
		this.container.removeAttr(DATA_ELEMENT);
		this.container.removeAttr('contenteditable');
		this.container.removeAttr('role');
		this.container.removeAttr('autocorrect');
		this.container.removeAttr('autocomplete');
		this.container.removeAttr('spellcheck');
		this.container.removeAttr('data-gramm');
		this.container.removeAttr('tabindex');
		if (this.options.className)
			this.container.removeClass(this.options.className);
		if (this.card.closest(this.container))
			this.container.removeClass('am-engine');
		this.container.removeAllEvents();
		this.change.destroy();
		this.hotkey.destroy();
		this.card.gc();
		if (this.ot) {
			this.ot.destroy();
		}
	}

	private initContainer(selector: Selector) {
		const { lang, tabIndex, className } = this.options;
		const container = $(selector);
		container.attr(DATA_ELEMENT, ROOT);
		container.attr({
			contenteditable: 'true',
			role: 'textbox',
			autocorrect: lang === 'en' ? 'on' : 'off',
			autocomplete: 'off',
			spellcheck: lang === 'en' ? 'true' : 'false',
			'data-gramm': 'false',
		});

		if (!container.hasClass('am-engine')) {
			container.addClass('am-engine');
		}

		if (tabIndex !== undefined) {
			container.attr('tabindex', tabIndex);
		}

		if (className !== undefined) {
			container.addClass(className);
		}

		return container;
	}

	private autoAddLineToEnd(event: MouseEvent) {
		if (event.target && $(event.target).isRoot()) {
			const lastBlock = this.container.last();
			if (lastBlock) {
				if (!lastBlock.isCard() && 'blockquote' !== lastBlock.name)
					return;
				if (
					(lastBlock.get<HTMLElement>()?.offsetTop || 0) +
						(lastBlock.get<Element>()?.clientHeight || 0) >
					event.offsetY
				)
					return;
			}
			const node = $('<p><br /></p>');
			this.container.append(node);
			const range = this.change.getRange();
			range.select(node, true).collapse(false);
			this.change.select(range);
		}
	}

	private initEvents() {
		// fix：输入文字时，前面存在 BR 标签，导致多一个换行
		// 不能用 this.domEvent.onInput，因为输入中文时不会被触发
		this.container.on('input', e => {
			if (this.readonly) {
				return;
			}

			if (this.card.find(e.target)) {
				return;
			}
			const range = this.change.getRange();
			range.addOrRemoveBr(true);
			this.setUserChanged();
		});
		// 文档尾部始终保持一行
		this.container.on('click', e => {
			return this.autoAddLineToEnd(e);
		});
		this.container.on('keydown', (event: KeyboardEvent) => {
			return typingKeydown(this, event);
		});

		this.container.on('keyup', (event: KeyboardEvent) => {
			return typingKeyup(this, event);
		});
		this.container.on('focus', () => {
			this._focused = true;
			return this.event.trigger('focus');
		});
		this.container.on('blur', () => {
			this._focused = false;
			return this.event.trigger('blur');
		});
	}

	private normalizeTree() {
		let block = $('<p />');
		const range = this.change.getRange();
		const bookmark = range.createBookmark();
		let anchorNext, focusPrev, anchorParent, focusParent;
		if (bookmark) {
			anchorNext = $(bookmark.anchor).next();
			focusPrev = $(bookmark.focus).prev();
			anchorParent = $(bookmark.anchor).parent();
			focusParent = $(bookmark.focus).parent();
		}
		if (anchorNext) bookmark?.anchor.remove();
		if (focusPrev) bookmark?.focus.remove();
		// 保证所有行内元素都在段落内
		this.container.children().each(child => {
			const node = $(child);
			if (node.isBlock()) {
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
		if (anchorNext) anchorNext.before(bookmark!.anchor);
		if (focusPrev) focusPrev.after(bookmark!.focus);
		if (bookmark && anchorNext && focusPrev) {
			if (anchorParent?.isRoot()) {
				block.append(bookmark.anchor);
			}
			if (focusParent?.isRoot()) {
				block.append(bookmark.focus);
			}
			if (block.children().length > 0) this.container.append(block);
		}
		// 处理空段落
		this.container.children().each(child => {
			const node = $(child);
			removeMinusStyle(node, 'text-indent');
			if (node.isHeading()) {
				const childrenLength = node.children().length;
				if (childrenLength === 0) {
					node.remove();
				} else {
					const child = node.first();
					if (
						childrenLength === 1 &&
						child?.name === 'span' &&
						[CURSOR, ANCHOR, FOCUS].indexOf(
							child.attr(DATA_ELEMENT),
						) >= 0
					) {
						node.prepend($('<br />'));
					}
				}
			}
		});
		if (bookmark) range.moveToBookmark(bookmark);
	}

	messageSuccess(message: string) {
		console.log(`success:${message}`);
	}

	messageError(error: string) {
		console.log(`error:${error}`);
	}
}

EngineModel.plugin = new Plugin();
EngineModel.card = new CardModel();
export default EngineModel;
