import Change from '../change';
import { DATA_ELEMENT } from '../constants/root';
import OT from '../ot';
import { Selector, NodeInterface } from '../types/node';
import { ChangeInterface } from '../types/change';
import {
	ContainerInterface,
	EngineInterface,
	EngineOptions,
} from '../types/engine';
import { HistoryInterface } from '../types/history';
import { OTInterface } from '../types/ot';
import { HotkeyInterface } from '../types/hotkey';
import { CardInterface } from '../types/card';
import History from '../history';
import Hotkey from '../hotkey';
import { getDocument } from '../utils';
import { ANCHOR, CURSOR, FOCUS } from '../constants/selection';
import { toJSON0, toDOM } from '../ot/utils';
import Parser from '../parser';
import { TypingInterface } from '../types';
import Typing from '../typing';
import Container from './container';
import Selection from '../selection';
import Editor from '../editor';
import { $ } from '../node';
import './index.css';

class Engine<T extends EngineOptions = EngineOptions>
	extends Editor<T>
	implements EngineInterface<T>
{
	private _readonly: boolean = false;
	private _container: ContainerInterface;
	readonly kind = 'engine';

	typing: TypingInterface;
	ot: OTInterface;
	change: ChangeInterface;
	history: HistoryInterface;
	hotkey: HotkeyInterface;

	readonly container: NodeInterface;

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
		this.card.reRender();
		//广播readonly事件
		this.trigger('readonly', readonly);
	}

	constructor(selector: Selector, options?: EngineOptions) {
		super(selector, options);
		this.options = { ...this.options, ...options };
		// 历史
		this.history = new History(this);
		// 编辑器容器
		this._container = new Container(selector, {
			engine: this,
			lang: this.options.lang,
			className: this.options.className,
			tabIndex: this.options.tabIndex,
			placeholder: this.options.placeholder,
		});
		this.container = this._container.getNode();
		// 编辑器父节点
		this.root = $(
			this.options.root || this.container.parent() || getDocument().body,
		);
		const rootPosition = this.root.css('position');
		if (!rootPosition || rootPosition === 'static')
			this.root.css('position', 'relative');
		// 实例化容器
		this._container.init();
		// 编辑器改变时
		this.change = new Change(this, {
			onChange: (trigger) => this.trigger('change', trigger),
			onSelect: () => this.trigger('select'),
			onRealtimeChange: (trigger) => {
				if (this.isEmpty()) {
					this._container.showPlaceholder();
				} else {
					this._container.hidePlaceholder();
				}
				this.trigger('realtimeChange', trigger);
			},
			onSetValue: () => this.trigger('afterSetValue'),
		});
		this.change.init();
		// 事件处理
		this.typing = new Typing(this);
		// 只读
		this._readonly =
			this.options.readonly === undefined ? false : this.options.readonly;
		this._container.setReadonly(this._readonly);
		// 快捷键
		this.hotkey = new Hotkey(this);
		this.init();
		// 协同
		this.ot = new OT(this);

		if (this.isEmpty()) {
			this._container.showPlaceholder();
		}
		this.ot.initLocal();
	}

	isFocus() {
		return this._container.isFocus();
	}

	isEmpty() {
		return this.change.isEmpty();
	}

	focus(toStart?: boolean) {
		this.change.range.focus(toStart);
	}

	blur() {
		this.change.range.blur();
	}

	getValue(ignoreCursor: boolean = false) {
		const value = this.change.getValue({ ignoreCursor });
		return ignoreCursor ? Selection.removeTags(value) : value;
	}

	async getValueAsync(
		ignoreCursor: boolean = false,
		callback?: (
			name: string,
			card?: CardInterface,
			...args: any
		) => boolean | number | void,
	): Promise<string> {
		return new Promise(async (resolve, reject) => {
			const pluginNames = Object.keys(this.plugin.components);
			for (let i = 0; i < pluginNames.length; i++) {
				const plugin = this.plugin.components[pluginNames[i]];
				const result = await new Promise((resolve) => {
					if (plugin.waiting) {
						plugin
							.waiting(callback)
							.then(() => resolve(true))
							.catch(resolve);
					} else resolve(true);
				});
				if (typeof result === 'object') {
					reject(result);
					return;
				}
			}
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
		return new Parser(node, this).toHTML();
	}

	setValue(value: string, callback?: (count: number) => void) {
		value = this.trigger('beforeSetValue', value) || value;
		this.change.setValue(value, undefined, callback);
		this.normalize();
		this.nodeId.generateAll(this.container);
		return this;
	}

	setHtml(html: string, callback?: (count: number) => void) {
		this.change.setHtml(html, (count) => {
			this.normalize();
			this.container.allChildren(true).forEach((child) => {
				if (this.node.isInline(child)) {
					this.inline.repairCursor(child);
				} else if (this.node.isMark(child)) {
					this.mark.repairCursor(child);
				}
			});
			if (callback) callback(count);
		});
		this.nodeId.generateAll(this.container);
		return this;
	}

	setMarkdown(text: string, callback?: (count: number) => void) {
		this.change.setMarkdown(text, (count) => {
			this.normalize();
			this.container.allChildren(true).forEach((child) => {
				if (this.node.isInline(child)) {
					this.inline.repairCursor(child);
				} else if (this.node.isMark(child)) {
					this.mark.repairCursor(child);
				}
			});
			if (callback) callback(count);
		});
		this.nodeId.generateAll(this.container);
		return this;
	}

	setJsonValue(value: Array<any>, callback?: (count: number) => void) {
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
		this.change.setValue(html, undefined, callback);
		this.normalize();
		this.nodeId.generateAll(this.container);
		return this;
	}

	getJsonValue() {
		return toJSON0(this.container);
	}

	normalize(container: NodeInterface = this.container) {
		let block = $('<p />');
		// 保证所有行内元素都在段落内
		let childNodes = container.children();
		childNodes.each((_, index) => {
			const node = childNodes.eq(index);
			if (!node) return;
			if (this.node.isBlock(node)) {
				if (block.get<HTMLElement>()!.childNodes.length > 0) {
					node.before(block);
				}
				block = $('<p />');
			} else if (!node.isCursor()) {
				block.append(node);
			}
		});

		if (block.get<HTMLElement>()!.childNodes.length > 0) {
			container.append(block);
		}
		// 处理空段落
		childNodes = container.children();
		childNodes.each((_, index) => {
			const node = childNodes.eq(index);
			if (!node) return;
			this.node.removeMinusStyle(node, 'text-indent');
			if (this.node.isRootBlock(node)) {
				const childrenLength =
					node.get<HTMLElement>()!.childNodes.length;
				if (childrenLength === 0) {
					node.append($('<br />'));
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
	}

	showPlaceholder() {
		this._container.showPlaceholder();
	}

	hidePlaceholder() {
		this._container.hidePlaceholder();
	}

	destroy() {
		this._container.destroy();
		this.change.destroy();
		this.hotkey.destroy();
		if (this.ot) {
			this.ot.destroy();
		}
		super.destroy();
	}
}

export default Engine;
