import cloneDeep from 'lodash/cloneDeep';
import Change from '../change';
import { DATA_ELEMENT } from '../constants/root';
import { Selector, NodeInterface } from '../types/node';
import { ChangeInterface } from '../types/change';
import {
	ContainerInterface,
	EngineInterface,
	EngineOptions,
} from '../types/engine';
import { HistoryInterface } from '../types/history';
import { HotkeyInterface } from '../types/hotkey';
import { CardInterface } from '../types/card';
import History from '../history';
import Hotkey from '../hotkey';
import { getDocument } from '../utils';
import { ANCHOR, CURSOR, FOCUS } from '../constants/selection';
import Parser from '../parser';
import { TypingInterface } from '../types';
import Typing from '../typing';
import Container, {
	DATA_PLACEHOLDER,
	DATA_PLACEHOLDER_CLASS,
} from './container';
import Selection from '../selection';
import Editor from '../editor';
import { $ } from '../node';
import { DATA_CONTENTEDITABLE_KEY } from '../constants';
import { Model, Element } from '../model';
import './index.css';

class Engine<T extends EngineOptions = EngineOptions>
	extends Editor<T>
	implements EngineInterface<T>
{
	private _readonly: boolean = false;
	private _container: ContainerInterface;
	readonly kind = 'engine';

	typing: TypingInterface;
	model: Model;
	change: ChangeInterface;
	history: HistoryInterface;
	hotkey: HotkeyInterface;

	get readonly(): boolean {
		return this._readonly;
	}

	set readonly(readonly: boolean) {
		if (this.readonly === readonly) return;
		if (readonly) {
			this.hotkey.disable();
			this._container.setReadonly(true);
			this.model.mutation.stop();
		} else {
			this.hotkey.enable();
			this._container.setReadonly(false);
			this.model.mutation.start();
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
		this._container = new Container(this.container, {
			engine: this,
			lang: this.options.lang,
			className: this.options.className,
			tabIndex: this.options.tabIndex,
			placeholder: this.options.placeholder,
			autoPrepend: this.options.autoPrepend,
			autoAppend: this.options.autoAppend,
		});
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
			onSelectStart: () => this.trigger('selectStart'),
			onSelectEnd: () => this.trigger('selectEnd'),
			onRealtimeChange: (trigger) => {
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

		if (this.isEmpty()) {
			this._container.showPlaceholder();
		}
		this.model = Model.from(this);
		this.model.resetRoot();
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

	/**
	 * @deprecated 请使用 model.toValue 性能更好
	 */
	getValue(ignoreCursor: boolean = false) {
		const value = this.change.getValue({ ignoreCursor });
		return ignoreCursor ? Selection.removeTags(value) : value;
	}

	/**
	 * @deprecated 请使用 model.toValueAsync 性能更好
	 * @param ignoreCursor
	 * @param callback
	 * @returns
	 */
	async getValueAsync(
		ignoreCursor: boolean = false,
		callback?: (
			name: string,
			card?: CardInterface,
			...args: any
		) => boolean | number | void,
	): Promise<string> {
		return new Promise(async (resolve, reject) => {
			for (const pluginName in this.plugin.components) {
				const plugin = this.plugin.components[pluginName];
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

	/**
	 * @deprecated 请使用 model.toHTML 性能更好
	 */
	getHtml(): string {
		const node = $(this.container[0].cloneNode(true));
		node.removeAttributes(DATA_CONTENTEDITABLE_KEY);
		node.removeAttributes('tabindex');
		node.removeAttributes('autocorrect');
		node.removeAttributes('autocomplete');
		node.removeAttributes('spellcheck');
		node.removeAttributes('data-gramm');
		node.removeAttributes(DATA_PLACEHOLDER);
		node.removeClass(DATA_PLACEHOLDER_CLASS);
		node.removeAttributes('role');
		return new Parser(node, this).toHTML();
	}

	initDocOnReadonly() {
		if (this.readonly) {
			this.model.resetRoot();
		}
	}

	setValue(value: string, callback?: (count: number) => void) {
		value = this.trigger('beforeSetValue', value) || value;
		this.change.setValue(value, undefined, callback);
		this.normalize();
		this.nodeId.generateAll(this.container);
		this.initDocOnReadonly();
		return this;
	}

	setHtml(html: string, callback?: (count: number) => void) {
		this.change.setHtml(html, (count) => {
			this.normalize();
			this.container.allChildren('editable').forEach((child) => {
				if (this.node.isInline(child)) {
					this.inline.repairCursor(child);
				} else if (this.node.isMark(child)) {
					this.mark.repairCursor(child);
				}
			});
			if (callback) callback(count);
		});
		this.nodeId.generateAll(this.container);
		this.initDocOnReadonly();
		return this;
	}

	setMarkdown(text: string, callback?: (count: number) => void) {
		this.change.setMarkdown(text, (count) => {
			this.normalize();
			this.container.allChildren('editable').forEach((child) => {
				if (this.node.isInline(child)) {
					this.inline.repairCursor(child);
				} else if (this.node.isMark(child)) {
					this.mark.repairCursor(child);
				}
			});
			if (callback) callback(count);
		});
		this.nodeId.generateAll(this.container);
		this.initDocOnReadonly();
		return this;
	}

	setJsonValue(value: Element, callback?: (count: number) => void) {
		const modelValue = this.model.toValue(value);
		this.change.setValue(modelValue, undefined, callback);
		this.normalize();
		this.nodeId.generateAll(this.container);
		this.initDocOnReadonly();
		return this;
	}

	getJsonValue() {
		return cloneDeep(this.model.root);
	}

	/**
	 * @deprecated 请使用 model.toText 性能更好
	 */
	getText(includeCard?: boolean) {
		return new Parser(this.container, this).toText(
			this.schema,
			includeCard,
		);
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
		this.typing.destroy();
		this.model.destroy();
		this.history.reset();
		super.destroy();
	}
}

export default Engine;
