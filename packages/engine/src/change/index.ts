import $ from '../node';
import { EventListener, NodeInterface } from '../types/node';
import {
	ActiveTrigger,
	CardEntry,
	CardInterface,
	CardType,
} from '../types/card';
import { ChangeInterface, ChangeOptions } from '../types/change';
import { EngineInterface } from '../types/engine';
import { Bookmark, RangeInterface } from '../types/range';
import Range from '../range';
import ChangeEvent from './event';
import Parser, { TextParser } from '../parser';
import { ANCHOR_SELECTOR, CURSOR_SELECTOR, FOCUS_SELECTOR } from '../constants';
import {
	combinTextNode,
	formatEngineValue,
	generateElementIDForDescendant,
	mergeNode,
	removeEmptyMarksAndAddBr,
	repairCustomzieList,
	unwrapNode,
} from '../utils';
import { getRangePath } from '../ot/utils';
import {
	addMark,
	deleteContent,
	insertBlock,
	insertFragment,
	insertInline,
	insertMark,
	insertText,
	mergeAdjacentBlockquote,
	mergeAdjacentList,
	mergeMark,
	removeMark,
	separateBlocks,
	setBlocks,
	splitBlock,
	splitMark,
	unwrapBlock,
	unwrapInline,
	wrapBlock,
	wrapInline,
} from './utils';
import { Path } from 'sharedb';
import {
	CARD_ELEMENT_KEY,
	CARD_LEFT_SELECTOR,
	CARD_RIGHT_SELECTOR,
	CARD_SELECTOR,
} from '../constants/card';
import { DATA_ELEMENT, ROOT } from '../constants/root';
import Paste from './paste';

class ChangeModel implements ChangeInterface {
	private engine: EngineInterface;
	private options: ChangeOptions;
	private changeTimer: NodeJS.Timeout | null = null;
	event: ChangeEvent;
	valueCached: string | null = null;
	onChange: (value: string) => void;
	onSelect: () => void;
	onSetValue: () => void;
	rangePathBeforeCommand: Path[] | null = null;
	marks: Array<NodeInterface> = [];
	blocks: Array<NodeInterface> = [];

	constructor(engine: EngineInterface, options: ChangeOptions = {}) {
		this.options = options;
		this.engine = engine;
		this.event = new ChangeEvent(engine, {
			bindDrop: () => !engine.isSub(),
			bindContainer: (eventType: string, listener: EventListener) =>
				engine.container.on(eventType, listener),
			unbindContainer: (eventType: string, listener: EventListener) =>
				engine.container.off(eventType, listener),
		});

		this.onChange = this.options.onChange || function() {};
		this.onSelect = this.options.onSelect || function() {};
		this.onSetValue = this.options.onSetValue || function() {};

		this.initNativeEvents();
	}

	private _change() {
		if (!this.isComposing()) {
			this.engine.card.gc();
			let value = this.getValue({
				ignoreCursor: true,
			});
			if (!this.valueCached || value !== this.valueCached) {
				this.onChange(value);
				if (this.engine) this.engine.setUserChanged();
				this.valueCached = value;
			}
		}
	}

	change() {
		this.clearChangeTimer();
		this.changeTimer = setTimeout(() => {
			this._change();
		}, 200);
	}

	private clearChangeTimer() {
		if (this.changeTimer) clearTimeout(this.changeTimer);
	}

	getSelectionRange() {
		const { container } = this.engine;
		const { win } = container;
		let range = Range.from(win!, false);
		if (!range) {
			range = Range.create(win!.document)
				.select(container, true)
				.shrinkToElementNode()
				.collapse(false);
		}
		return range;
	}

	getRange() {
		return this.getSelectionRange();
	}

	select(range: RangeInterface) {
		const { container } = this.engine;
		const { win } = container;
		const selection = win?.getSelection();
		if (selection) {
			selection.removeAllRanges();
			selection.addRange(range.toRange());
		}
		this.marks = range.getActiveMarks();
		this.blocks = range.getActiveBlocks();
		return this;
	}

	focus() {
		const range = this.getRange();
		this.select(range);
		this.engine.container.get<HTMLElement>()?.focus();
		return this;
	}

	focusToStart() {
		const range = this.getRange();
		range
			.select(this.engine.container, true)
			.shrinkToElementNode()
			.collapse(true);
		this.select(range);
		this.engine.container.get<HTMLElement>()?.focus();
		return this;
	}

	focusToEnd() {
		const range = this.getRange();
		range
			.select(this.engine.container, true)
			.shrinkToElementNode()
			.collapse(false);
		this.select(range);
		this.engine.container.get<HTMLElement>()?.focus();
		return this;
	}

	blur() {
		this.engine.container.get<HTMLElement>()?.blur();
		return this;
	}

	isComposing() {
		return this.event.isComposing;
	}

	isSelecting() {
		return this.event.isSelecting;
	}

	setValue(value: string, onParse?: (node: Node) => void) {
		const range = this.getRange();
		if (value === '') {
			range.setStart(this.engine.container[0], 0);
			range.collapse(true);
			this.select(range);
		} else {
			const { schema, conversion } = this.engine;
			const parser = new Parser(value, this.engine, undefined, node => {
				node.allChildren().forEach(child => {
					removeEmptyMarksAndAddBr($(node));
					if (onParse) {
						onParse(child);
					}
				});
			});
			const { container, history } = this.engine;
			container.htmlKeepID(
				parser.toValue(
					schema.getValue(),
					conversion.getValue(),
					false,
					true,
				),
			);
			generateElementIDForDescendant(container.get<Element>()!);
			this.engine.card.render();
			const cursor = container.find(CURSOR_SELECTOR);
			let bookmark: Bookmark | null = null;

			if (cursor.length > 0) {
				bookmark = {
					anchor: cursor[0] as HTMLSpanElement,
					focus: cursor[0] as HTMLSpanElement,
				};
			}

			const anchor = container.find(ANCHOR_SELECTOR);
			const focus = container.find(FOCUS_SELECTOR);

			if (anchor.length > 0 && focus.length > 0) {
				bookmark = {
					anchor: anchor[0] as HTMLSpanElement,
					focus: focus[0] as HTMLSpanElement,
				};
			}

			if (bookmark) {
				range.moveToBookmark(bookmark);
				this.select(range);
				this.onSelect();
			}
			this.onSetValue();
			if (history) {
				history.clear();
			}
		}
	}

	getOriginValue() {
		return new Parser(this.engine.container, this.engine).toValue(
			this.engine.schema.getValue(),
		);
	}

	getValue(
		options: {
			ignoreCursor?: boolean;
		} = {},
	) {
		let value;
		if (options.ignoreCursor || this.isComposing()) {
			value = this.getOriginValue();
		} else {
			const range = this.getRange();
			let bookmark;
			if (!range.inCard()) {
				bookmark = range.createBookmark();
			}
			value = this.getOriginValue();
			if (bookmark) {
				range.moveToBookmark(bookmark);
			}
		}
		return formatEngineValue(value);
	}

	cacheRangeBeforeCommand() {
		this.rangePathBeforeCommand = getRangePath(this.getSelectionRange());
	}

	getRangePathBeforeCommand() {
		const rangePath = this.rangePathBeforeCommand;
		this.rangePathBeforeCommand = null;
		return rangePath;
	}

	isEmpty() {
		return this.engine.container.isEmptyWithTrim();
	}

	private repairInput(range: RangeInterface) {
		const { commonAncestorNode } = range;
		const card = this.engine.card.find(commonAncestorNode);
		if (card && card.type === CardType.INLINE) {
			if (card.isLeftCursor(commonAncestorNode)) {
				const cardLeft = commonAncestorNode.closest(CARD_LEFT_SELECTOR);
				let cardLeftText = cardLeft.text().replace(/\u200B/g, '');
				if (cardLeftText) {
					cardLeftText = escape(cardLeftText);
					range.setStartBefore(card.root);
					range.collapse(true);
					this.select(range);
					cardLeft.html('&#8203;');
					this.insertMark('<span>'.concat(cardLeftText, '</span>'));
					this.mergeMark();
				}
			} else if (card.isRightCursor(commonAncestorNode)) {
				const cardRight = commonAncestorNode.closest(
					CARD_RIGHT_SELECTOR,
				);
				let cardRightText = cardRight.text().replace(/\u200B/g, '');
				if (cardRightText) {
					cardRightText = escape(cardRightText);
					range.setEndAfter(card.root);
					range.collapse(false);
					this.select(range);
					cardRight.html('&#8203;');
					this.insertMark('<span>'.concat(cardRightText, '</span>'));
					this.mergeMark();
				}
			} else this.repairRange(range);
		}
	}

	private repairRange(range: RangeInterface) {
		// 判断 Range 是否可编辑，不可编辑时焦点自动移到编辑区域内
		const { commonAncestorNode } = range;
		if (!commonAncestorNode.isRoot() && !commonAncestorNode.inRoot()) {
			range
				.select(this.engine.container, true)
				.shrinkToElementNode()
				.collapse(false);
		}

		let rangeClone = range.cloneRange();
		rangeClone.collapse(true);
		this.focusRang(rangeClone);
		range.setStart(rangeClone.startContainer, rangeClone.startOffset);

		rangeClone = range.cloneRange();
		rangeClone.collapse(false);
		this.focusRang(rangeClone);
		range.setEnd(rangeClone.endContainer, rangeClone.endOffset);

		if (range.collapsed) {
			rangeClone = range.cloneRange();
			rangeClone.enlargeFromTextNode();

			const startNode = $(rangeClone.startContainer);
			const startOffset = rangeClone.startOffset;

			if (startNode.name === 'a' && startOffset === 0) {
				range.setStartBefore(startNode[0]);
			}
			if (
				startNode.name === 'a' &&
				startOffset === startNode[0].childNodes.length
			) {
				range.setStartAfter(startNode[0]);
			}
			range.collapse(true);
		}
	}

	private focusRang(range: RangeInterface) {
		const { startNode, startOffset } = range;
		const card = this.engine.card.find(startNode);
		if (card) {
			const cardCenter = card.getCenter().get();
			if (
				cardCenter &&
				(!startNode.isElement() ||
					startNode[0].parentNode !== card.root[0] ||
					startNode.attr(CARD_ELEMENT_KEY))
			) {
				const comparePoint = () => {
					const doc_rang = Range.create();
					doc_rang.select(cardCenter, true);
					return doc_rang.comparePoint(startNode, startOffset) < 0;
				};

				if ('inline' === card.type) {
					range.select(card.root);
					range.collapse(comparePoint());
					return;
				}

				if (comparePoint()) {
					card.focusPrevBlock(range, true);
				} else {
					card.focusNextBlock(range, true);
				}
			}
		}
	}

	private initNativeEvents() {
		// 输入文字达到一定数量时候保存历史记录
		const { container } = this.engine;

		this.event.onInput(() => {
			const range = this.getRange();
			this.repairInput(range);
			this.select(range);
			this.onSelect();
			this.change();
		});

		this.event.onDocument('selectionchange', () => {
			const { win } = container;
			const selection = win?.getSelection();
			if (selection && selection.anchorNode) {
				const rang = Range.from(selection)!;
				this.engine.card.each(card => {
					const center = card.getCenter();
					if (center && center.length > 0) {
						card.select(selection.containsNode(center[0]));
					}
				});
				const card = this.engine.card.getSingleSelectedCard(rang);
				if (card) {
					card.select(true);
				}
			} else {
				this.engine.card.each(card => card.select(false));
			}
		});
		this.event.onSelect(() => {
			const range = this.getRange();
			if (range.containsCard()) {
				this.repairRange(range);
			}
			this.select(range);
			this.activateCard(
				range.commonAncestorNode,
				ActiveTrigger.CUSTOM_SELECT,
			);
			this.onSelect();
		});

		if (container.closest(CARD_SELECTOR).length === 0) {
			this.event.onWindow('beforeunload', () => {
				if (this.engine) {
					this.engine.event.trigger('save:before');
				}
			});
		}

		this.event.onDocument('click', (e: MouseEvent) => {
			if (!e.target) return;
			const card = this.engine.card.find($(e.target));
			if (card) {
				if (card.type === CardType.INLINE) {
					this.activateCard(card.root, ActiveTrigger.CLICK, e);
				}
			}
		});

		this.event.onDocument('mousedown', (e: MouseEvent) => {
			if (!e.target) return;
			const targetNode = $(e.target);
			const card = this.engine.card.find(targetNode);
			if (card && card.type === CardType.INLINE) {
				return;
			}
			// 点击元素已被移除
			if (targetNode.closest('body').length === 0) {
				return;
			}
			// 阅读模式节点
			if (targetNode.closest('.am-view').length > 0) {
				return;
			}
			// 工具栏、侧边栏、内嵌工具栏的点击
			let node: NodeInterface | undefined = targetNode;
			while (node) {
				const attrValue = node.attr(DATA_ELEMENT);
				if (attrValue && attrValue !== ROOT) {
					return;
				}
				node = node.parent();
			}
			this.activateCard(targetNode, ActiveTrigger.MOUSE_DOWN);
		});

		this.event.onDocument('copy', event => {
			this.engine.clipboard.write(event);
		});

		this.event.onContainer('cut', event => {
			event.stopPropagation();
			const { clipboard } = this.engine;
			clipboard.write(event, undefined, () => {
				clipboard.cut();
				this.change();
			});
		});

		this.event.onPaste(data => {
			const { html, text, files, isPasteText } = data;
			let source = '';
			if (files.length === 0) {
				// 纯文本粘贴
				if (isPasteText) {
					let value = '';
					if (text) value = text;
					else if (html)
						value = new Parser(html, this.engine).toText();
					source = new TextParser(value).toHTML();
				} else {
					// 富文本粘贴
					if (
						html &&
						html.indexOf('<meta name="source" content="aomao" />') >
							-1
					) {
						source = html;
					} else if (text && /^((http|https):\/\/)?\S+$/.test(text)) {
						const value = escape(text);
						source = `<a href="${value}" target="_blank">${value}</a>`;
					} else if (html) {
						source = html;
					} else if (text) {
						source = new TextParser(text).toHTML();
					}
				}
			}
			const value = this.getValue();
			let isStop = false;
			Object.keys(this.engine.plugin.components).every(name => {
				const plugin = this.engine.plugin.components[name];
				if (plugin.pasteEvent) {
					const result = plugin.pasteEvent(data, value);
					if (result === false) {
						isStop = true;
						return false;
					}
				}
				return true;
			});
			if (files.length === 0 && !isStop) {
				const fragment = new Paste(source, this.engine).normalize();
				Object.keys(this.engine.plugin.components).forEach(name => {
					const plugin = this.engine.plugin.components[name];
					if (plugin.pasteBefore) plugin.pasteBefore(fragment);
				});
				this.insertFragment(fragment, range => {
					Object.keys(this.engine.plugin.components).forEach(name => {
						const plugin = this.engine.plugin.components[name];
						if (plugin.pasteInsert) plugin.pasteInsert(range);
					});
					const bookmark = range.createBookmark();
					this.engine.card.render();
					if (bookmark) range.moveToBookmark(bookmark);
					range.scrollRangeIntoView();
				});
				Object.keys(this.engine.plugin.components).forEach(name => {
					const plugin = this.engine.plugin.components[name];
					if (plugin.pasteAfter) plugin.pasteAfter();
				});
			}
		});

		const insertCardAble = (range?: RangeInterface) => {
			// 找不到目标位置
			// TODO: 临时解决，如果 drop Range 在Card里则不触发
			return (
				!range ||
				this.engine.card.closest(range.commonAncestorContainer)
			);
		};

		this.event.onDrop(({ event, range, card, files }) => {
			if (card) {
				event.preventDefault();
				if (insertCardAble(range)) return;
				const cardName = card.name;
				this.removeCard(card.root);
				this.select(range!);
				this.insertCard(cardName, card.type);
			}
			if (files.length > 0) {
				event.preventDefault();
				if (insertCardAble(range)) return;
				this.select(range!);
				Object.keys(this.engine.plugin.components).forEach(name => {
					const plugin = this.engine.plugin.components[name];
					if (plugin.dropFiles) plugin.dropFiles(files);
				});
			}
		});
	}

	combinTextNode() {
		combinTextNode(this.engine.container);
	}

	destroy() {
		this.event.destroy();
		this.clearChangeTimer();
	}

	activateCard(
		node: NodeInterface,
		trigger: ActiveTrigger = ActiveTrigger.MANUAL,
		event?: MouseEvent,
	) {
		//获取当前卡片所在编辑器的根节点
		const container = node.getRoot();
		//如果当前编辑器根节点和引擎的根节点不匹配就不执行，主要是子父编辑器的情况
		if (!container.get() || this.engine.container.equal(container)) {
			let card = this.engine.card.find(node);
			const blockCard = card
				? this.engine.card.findBlock(card.root)
				: undefined;
			if (blockCard) {
				card = blockCard;
			}
			if (card && card.isCursor(node)) card = undefined;
			const activeCard = this.engine.card.active;
			let isCurrentActiveCard =
				card && activeCard && activeCard.root.equal(card.root);
			if (trigger === ActiveTrigger.UPDATE_CARD) {
				isCurrentActiveCard = false;
			}
			if (activeCard && !isCurrentActiveCard) {
				activeCard.toolbar?.hide();
				activeCard.activate(false);
				if (activeCard.type === CardType.BLOCK) {
					this.engine.readonly = false;
				}
			}
			if (card) {
				if (card.activatedByOther) return;
				if (!isCurrentActiveCard) {
					card.toolbar?.show(event);
					if (
						card.type === CardType.INLINE &&
						(card.constructor as CardEntry).autoSelected !==
							false &&
						(trigger !== ActiveTrigger.CLICK || !card.readonly)
					) {
						this.selectCard(card);
					}
					card.activate(true);
				}
				if (card.type === CardType.BLOCK) {
					card.select(false);
					this.engine.readonly = true;
				}
				if (
					!isCurrentActiveCard &&
					trigger === ActiveTrigger.MOUSE_DOWN
				) {
					this.engine.event.trigger('focus');
				}
				this.onSelect();
			}
		}
	}

	selectCard(card: CardInterface) {
		if (
			(card.constructor as CardEntry).singleSelectable !== false &&
			(card.type !== CardType.BLOCK || !card.activated)
		) {
			const range = this.getRange();
			const parentNode = card.root[0].parentNode!;
			const index = Array.prototype.slice
				.call(parentNode.childNodes)
				.indexOf(card.root.get());
			range.setStart(parentNode, index);
			range.setEnd(parentNode, index + 1);
			this.select(range);
		}
	}

	focusCard(card: CardInterface, toStart: boolean = false) {
		const range = this.getRange();
		card.focus(range, toStart);
		this.select(range);
		this.engine.readonly = false;
		this.activateCard(range.startNode, ActiveTrigger.MOUSE_DOWN);
		this.onSelect();
		if (this.engine.scrollNode)
			range.scrollIntoViewIfNeeded(
				this.engine.container,
				this.engine.scrollNode,
			);
	}

	// 插入并渲染Card
	insertCard(name: string, type: CardType = CardType.BLOCK, value?: any) {
		const component = this.engine.card.create(name, type, {
			value,
		});

		const range = this.getRange();
		this.repairRange(range);
		const card = this.engine.card.insertNode(range, component);

		if (type === 'inline') {
			card.focus(range, false);
		}
		this.select(range);
		if (
			type === 'block' &&
			(component.constructor as CardEntry).autoActivate !== false
		) {
			this.activateCard(card.root, ActiveTrigger.INSERT_CARD);
		}
		this.change();
		return card;
	}
	// 更新Card
	updateCard(component: NodeInterface | Node | string, value: any) {
		const card = this.engine.card.find(component);
		if (card) {
			this.engine.card.updateNode(card, value);
			const range = this.getRange();
			card.focus(range, false);
			this.change();
		}
	}
	// 删除Card
	removeCard(component: NodeInterface | Node | string) {
		const range = this.getRange();
		const card = this.engine.card.find(component);
		if (!card) return;
		if (card.type === CardType.INLINE) {
			range.setEndAfter(card.root[0]);
			range.collapse(false);
		} else {
			card.focusPrevBlock(range, true);
		}
		const parent = card.root.parent();
		this.engine.card.removeNode(card);
		repairCustomzieList(range);
		if (parent?.isEmpty()) {
			if (parent.isRoot()) {
				parent.html('<p><br /></p>');
				range.select(parent, true);
				range.shrinkToElementNode();
				range.collapse(false);
			} else {
				parent.html('<br />');
				range.select(parent, true);
				range.collapse(false);
			}
		}
		this.select(range);
		this.change();
	}
	/**
	 * 增加mark节点
	 * @param mark mark节点
	 * @param supplement mark两侧节点
	 */
	addMark(
		mark: NodeInterface | Node | string,
		supplement?: NodeInterface,
	): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = addMark(range, mark);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 插入文本
	 * @param text 文本
	 */
	insertText(text: string): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = insertText(range, text);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 插入mark节点
	 * @param mark mark 节点或选择器
	 */
	insertMark(mark: NodeInterface | Node | string): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = insertMark(range, mark);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 插入inline节点
	 * @param inline inline节点或选择器
	 */
	insertInline(inline: NodeInterface | Node | string): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = insertInline(range, inline);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 插入block节点
	 * @param block block节点或选择器
	 */
	insertBlock(
		block: NodeInterface | Node | string,
		keepOld: boolean,
	): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = insertBlock(range, block, keepOld);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 插入片段
	 * @param fragment 片段
	 * @param callback 插入后的回调函数
	 */
	insertFragment(
		fragment: DocumentFragment,
		callback: (range: RangeInterface) => void = () => {},
	): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = insertFragment(range, this.engine.card, fragment, callback);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 分割mark
	 * @param mark 需要删除的标签
	 */
	splitMark(mark?: NodeInterface | Node | string): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = splitMark(range, mark);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 分割block
	 */
	splitBlock(): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = splitBlock(range);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 移除mark标签
	 * @param mark mark 标签或选择器
	 */
	removeMark(mark?: NodeInterface | Node | string): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = removeMark(range, mark);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 合并mark标签
	 */
	mergeMark(): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = mergeMark(range);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 合并相邻的List
	 */
	mergeAdjacentList(): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = mergeAdjacentList(range);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 合并相邻的Blockquote
	 */
	mergeAdjacentBlockquote(): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = mergeAdjacentBlockquote(range);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 包裹inline标签
	 * @param inline inline节点或选择器
	 */
	wrapInline(inline: NodeInterface | Node | string): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = wrapInline(range, inline);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 包裹block标签
	 * @param block block节点或选择器
	 */
	wrapBlock(block: NodeInterface | Node | string): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = wrapBlock(range, block);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 清除inline包裹标签
	 */
	unwrapInline(): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = unwrapInline(range);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 清除block包裹标签
	 * @param block block节点或选择器
	 */
	unwrapBlock(block: NodeInterface | Node | string): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = unwrapBlock(range, block);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 设置标签属性
	 * @param block 标签或者属性对象集合
	 */
	setBlocks(block: string | { [k: string]: any }): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = setBlocks(range, block);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 删除内容
	 * @param isDeepMerge 删除后是否合并
	 */
	deleteContent(isDeepMerge?: boolean): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = deleteContent(range, isDeepMerge);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}
	/**
	 * 将选区的列表扣出来，并将切断的列表修复
	 */
	separateBlocks(): ChangeInterface {
		let range = this.getRange();
		this.repairRange(range);
		range = separateBlocks(range);
		this.combinTextNode();
		this.select(range);
		this.change();
		return this;
	}

	/**
	 * 删除节点，删除后如果是空段落，自动添加 BR
	 * @param node 要删除的节点
	 */
	addBrAfterDelete(node: NodeInterface) {
		const range = this.getRange();
		const parent = node.parent();
		node.remove();
		if (parent && parent.isEmpty()) {
			if (parent.isRoot()) {
				parent.html('<p><br /></p>');
				range
					.select(parent, true)
					.shrinkToElementNode()
					.collapse(false);
			} else {
				parent.html('<br />');
				range.select(parent, true).collapse(false);
			}
			this.select(range);
		}
	}

	/**
	 * 去除当前光标最接近的block节点或传入的节点外层包裹
	 * @param node 节点
	 */
	unwrapNode(node?: NodeInterface) {
		const range = this.getRange();
		node = node || range.startNode.getClosestBlock();
		if (!node.inRoot() || node.isTable()) {
			return;
		}

		const bookmark = range.createBookmark();
		unwrapNode(node);
		if (bookmark) range.moveToBookmark(bookmark);
		this.select(range);
	}

	/**
	 * 删除当前光标最接近的block节点或传入的节点的前面一个节点后合并
	 * @param node 节点
	 */
	mergeAfterDeletePrevNode(node?: NodeInterface) {
		const range = this.getRange();
		node = node || range.startNode.getClosestBlock();
		// <p><br />foo</p>，先删除 BR
		if (node.children().length > 1 && node.first()?.name === 'br') {
			node.first()?.remove();
			return;
		}
		let prevBlock = node.prev();
		// 前面没有 DOM 节点
		if (!prevBlock) {
			if (
				node.parent()?.isTable() &&
				/^<p(\s[^>]*?)?><br><\/p>$/i.test(
					node
						.parent()
						?.html()
						?.trim() || '',
				)
			) {
				return;
			}

			if (node.parent()?.inRoot()) {
				this.unwrapNode(node);
			}
			return;
		}
		// 前面是Card
		if (prevBlock.isCard()) {
			const card = this.engine.card.find(prevBlock);
			if (card) {
				card.focus(range);
				this.select(range);
				return;
			}
		}
		// 前面是 void 节点
		if (prevBlock.isVoid()) {
			prevBlock.remove();
			return;
		}
		// 前面是空段落
		if (prevBlock.isHeading() && prevBlock.isEmpty()) {
			prevBlock.remove();
			return;
		}

		// 前面是文本节点
		if (prevBlock.isText()) {
			const paragraph = $('<p />');
			prevBlock.before(paragraph);
			paragraph.append(prevBlock);
			prevBlock = paragraph;
		}
		if (['ol', 'ul'].indexOf(prevBlock.name || '') >= 0) {
			prevBlock = prevBlock.last();
		}
		// 只有一个 <br /> 时先删除
		if (node.children().length === 1 && node.first()?.name === 'br') {
			node.first()?.remove();
		} else if (
			prevBlock &&
			prevBlock.children().length === 1 &&
			prevBlock.first()?.name === 'br'
		) {
			prevBlock.first()?.remove();
		}

		if (!prevBlock || prevBlock.isText()) {
			this.unwrapNode(node);
		} else {
			const bookmark = range.createBookmark();
			mergeNode(prevBlock, node);
			if (bookmark) range.moveToBookmark(bookmark);
			this.select(range);
			this.mergeMark();
			this.mergeAdjacentList();
		}
	}

	/**
	 * 焦点移动到当前光标最接近的block节点或传入的节点前一个 Block
	 * @param block 节点
	 * @param isRemoveEmptyBlock 如果前一个block为空是否删除，默认为否
	 */
	focusPrevBlock(block?: NodeInterface, isRemoveEmptyBlock: boolean = false) {
		const range = this.getRange();
		block = block || range.startNode.getClosestBlock();
		let prevBlock = block.prev();
		if (!prevBlock) {
			return;
		}
		// 前面是Card
		if (prevBlock.isCard()) {
			const card = this.engine.card.find(prevBlock);
			if (card) card.focus(range);
			return;
		}
		// 前面是列表
		if (['ol', 'ul'].indexOf(prevBlock.name || '') >= 0) {
			prevBlock = prevBlock.last();
		}

		if (!prevBlock) {
			return;
		}

		if (isRemoveEmptyBlock && prevBlock.isEmptyWithTrim()) {
			prevBlock.remove();
			return;
		}

		range.select(prevBlock, true);
		range.collapse(false);
		this.select(range);
	}
}

export default ChangeModel;
