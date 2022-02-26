import { NodeInterface } from '../types/node';
import {
	ChangeInterface,
	ChangeOptions,
	ChangeRangeInterface,
} from '../types/change';
import { EngineInterface } from '../types/engine';
import { RangeInterface, RangePath } from '../types/range';
import ChangeEvent from './event';
import Parser from '../parser';
import { ANCHOR_SELECTOR, CURSOR_SELECTOR, FOCUS_SELECTOR } from '../constants';
import { combinText } from '../utils';
import { TRIGGER_CARD_ID } from '../constants/card';
import { DATA_ID, EDITABLE_SELECTOR, UI_SELECTOR } from '../constants/root';
import { SelectionInterface } from '../types/selection';
import Selection from '../selection';
import { $ } from '../node';
import NativeEvent from './native-event';
import ChangeRange from './range';
import Range from '../range';

class ChangeModel implements ChangeInterface {
	private engine: EngineInterface;
	private options: ChangeOptions;
	private changeTimer: NodeJS.Timeout | null = null;
	event: ChangeEvent;
	valueCached: string | null = null;
	onChange: (trigger: 'remote' | 'local' | 'both') => void;
	onRealtimeChange: (trigger: 'remote' | 'local') => void;
	onSelect: (range?: RangeInterface) => void;
	onSetValue: () => void;
	rangePathBeforeCommand?: { start: RangePath; end: RangePath };
	marks: Array<NodeInterface> = [];
	blocks: Array<NodeInterface> = [];
	inlines: Array<NodeInterface> = [];
	changeTrigger: Array<string> = [];
	range: ChangeRangeInterface;
	#nativeEvent: NativeEvent;

	constructor(engine: EngineInterface, options: ChangeOptions = {}) {
		this.options = options;
		this.engine = engine;
		this.event = new ChangeEvent(engine, {});

		this.onChange = this.options.onChange || function () {};
		this.onRealtimeChange = this.options.onRealtimeChange || function () {};

		this.onSelect = (range?: RangeInterface) => {
			if (selectTimeout) clearTimeout(selectTimeout);
			selectTimeout = setTimeout(() => {
				const { mark, block, inline } = engine;
				range = range || this.range.get();
				this.marks = mark.findMarks(range);
				this.blocks = block.findBlocks(range);
				this.inlines = inline.findInlines(range);
				if (this.options.onSelect) this.options.onSelect();
			}, 50);
		};
		this.onSetValue = this.options.onSetValue || function () {};
		let selectTimeout: null | NodeJS.Timeout = null;
		this.range = new ChangeRange(engine, {
			onSelect: (range) => {
				this.onSelect(range);
			},
		});
		this.#nativeEvent = new NativeEvent(engine);
	}

	init() {
		this.#nativeEvent.init();
	}

	private _change() {
		if (!this.isComposing()) {
			this.engine.card.gc();
			const trigger =
				this.changeTrigger.length === 2
					? 'both'
					: this.changeTrigger[0] === 'remote'
					? 'remote'
					: 'local';
			this.onChange(trigger);
			this.changeTrigger = [];
		}
	}

	change(isRemote?: boolean, applyNodes?: Array<NodeInterface>) {
		const trigger = isRemote ? 'remote' : 'local';
		//动态触发可编辑卡片的onChange事件
		let editableElement: NodeInterface | undefined = undefined;
		if (isRemote) {
			applyNodes?.forEach((node) => {
				editableElement = node.closest(EDITABLE_SELECTOR);
				if (editableElement && editableElement.length > 0) {
					const card = this.engine.card.find(editableElement, true);
					if (card?.onChange)
						card?.onChange(trigger, editableElement);
				}
			});
		} else {
			const range = this.range.get();
			const { startNode } = range;
			//如果开始节点在编辑器中就查找可编辑器卡片节点。如果是UI节点，就找到 trigger-card-id 属性，再找到card
			if (startNode.inEditor()) {
				editableElement = startNode.closest(EDITABLE_SELECTOR);
			} else {
				const uiElement = startNode.closest(UI_SELECTOR);
				const cardId = uiElement.attributes(TRIGGER_CARD_ID);
				if (cardId) {
					editableElement = this.engine.card
						.find(cardId)
						?.root.closest(EDITABLE_SELECTOR);
				}
			}
			if (editableElement && editableElement.length > 0) {
				const card = this.engine.card.find(editableElement, true);
				if (card?.onChange) card?.onChange(trigger, editableElement);
			} else {
				applyNodes?.forEach((node) => {
					editableElement = node.closest(EDITABLE_SELECTOR);
					if (editableElement && editableElement.length > 0) {
						const card = this.engine.card.find(
							editableElement,
							true,
						);
						if (card?.onChange)
							card?.onChange(trigger, editableElement);
					}
				});
			}
		}

		this.onRealtimeChange(trigger);
		if (this.changeTrigger.indexOf(trigger) < 0)
			this.changeTrigger.push(trigger);
		this.clearChangeTimer();
		this.changeTimer = setTimeout(() => {
			this._change();
		}, 50);
	}

	private clearChangeTimer() {
		if (this.changeTimer) clearTimeout(this.changeTimer);
	}

	isComposing() {
		return this.event.isComposing;
	}

	isSelecting() {
		return this.event.isSelecting;
	}

	initValue(range?: RangeInterface, apply: boolean = true) {
		const html = this.engine.container.html();
		const defaultHtml = '<p><br /></p>';
		if (html === defaultHtml || this.engine.container.children().length > 0)
			return;
		const emptyHtml = html || defaultHtml;
		const node = $(emptyHtml);
		if (node.children().length === 0) node.html('<br />');
		this.engine.container.empty().append(node);
		const safeRange = range || this.range.get();

		if (!range && apply) {
			safeRange.select(node, true).collapse(false);
			this.apply(safeRange);
		}
	}

	setValue(
		value: string,
		onParse?: (node: NodeInterface) => void,
		callback?: (count: number) => void,
	) {
		const range = this.range.get();
		const { schema, conversion, container, history, mark, card } =
			this.engine;
		if (value === '') {
			this.engine.container.html(value);
			this.initValue(undefined, false);
			if (callback) callback(0);
		} else {
			const parser = new Parser(
				value,
				this.engine,
				(root) => {
					mark.removeEmptyMarks(root);
					root.allChildren(true).forEach((child) => {
						if (onParse) {
							onParse(child);
						}
					});
				},
				false,
			);
			container.html(parser.toValue(schema, conversion, false, true));
			card.render(undefined, (count) => {
				if (callback) callback(count);
			});
			const cursor = container.find(CURSOR_SELECTOR);
			const selection: SelectionInterface = new Selection(
				this.engine,
				range,
			);

			if (cursor.length > 0) {
				selection.anchor = cursor;
				selection.focus = cursor;
			}

			const anchor = container.find(ANCHOR_SELECTOR);
			const focus = container.find(FOCUS_SELECTOR);

			if (anchor.length > 0 && focus.length > 0) {
				selection.anchor = anchor;
				selection.focus = focus;
			}

			if (selection.anchor && selection.focus) {
				selection.move();
				this.range.select(range);
				this.onSelect();
			}
			this.onSetValue();
			history.clear();
		}
		this.change();
	}

	setHtml(html: string, callback?: (count: number) => void) {
		const { card, container } = this.engine;
		this.#nativeEvent.paste(
			html,
			undefined,
			callback,
			true,
			(
				fragment: DocumentFragment,
				_range?: RangeInterface,
				_rangeCallback?: (range: RangeInterface) => void,
				_followActiveMark?: boolean,
			) => {
				container.empty().append(fragment);
				card.render(undefined, (count) => {
					this.initValue(undefined, false);
					this.engine.trigger('paste:after');
					if (callback) callback(count);
				});
			},
		);
	}

	setMarkdown(text: string, callback?: (count: number) => void) {
		const textNode = $(document.createTextNode(text));
		this.engine.trigger('paste:markdown-before', textNode);
		this.engine.trigger('paste:markdown', textNode);
		this.engine.trigger('paste:markdown-after', textNode);
		const { card, container } = this.engine;
		textNode.get<Text>()?.normalize();
		this.#nativeEvent.paste(
			textNode.text(),
			undefined,
			callback,
			true,
			(
				fragment: DocumentFragment,
				_range?: RangeInterface,
				_rangeCallback?: (range: RangeInterface) => void,
				_followActiveMark?: boolean,
			) => {
				container.empty().append(fragment);
				card.render(undefined, (count) => {
					this.initValue(undefined, false);
					this.engine.trigger('paste:after');
					if (callback) callback(count);
				});
			},
		);
	}

	getOriginValue(container: NodeInterface = this.engine.container) {
		const { schema, conversion } = this.engine;
		return new Parser(
			container.get<HTMLElement>()?.outerHTML || '',
			this.engine,
			undefined,
			false,
		).toValue(schema, conversion);
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
			let range = this.range.get();
			let selection;
			const container = this.engine.container.clone(true);
			if (!range.inCard()) {
				const path = range.toPath(true);
				if (!path) return this.getOriginValue();
				range = Range.fromPath(this.engine, path, true, container);
				selection = range.createSelection();
			}
			value = this.getOriginValue(container);
			selection?.move();
		}
		return value;
	}

	cacheRangeBeforeCommand() {
		this.rangePathBeforeCommand = this.range.get().toPath();
	}

	getRangePathBeforeCommand() {
		const rangePath = this.rangePathBeforeCommand;
		this.rangePathBeforeCommand = undefined;
		return rangePath;
	}

	isEmpty() {
		const { container, node, schema } = this.engine;
		const tags = schema.getAllowInTags();
		const children = container.children();
		return (
			children.length === 0 ||
			(children.length === 1 &&
				node.isEmpty(container) &&
				!container
					.allChildren()
					.some((child) => tags.includes(child.name)))
		);
	}

	combinText() {
		combinText(this.engine.container);
	}

	/**
	 * 应用一个具有改变dom结构的操作
	 * @param range 光标
	 */
	apply(range?: RangeInterface) {
		this.combinText();
		const { inline, mark, nodeId } = this.engine;
		if (range) {
			const selection = range.createSelection('change-apply');
			inline
				.findInlines(range)
				.forEach((inlineNode) => inline.repairCursor(inlineNode));
			mark.findMarks(range).forEach((markNode) =>
				mark.repairCursor(markNode),
			);
			selection.move();
			range.shrinkToTextNode();
			this.range.select(range);
		}
		this.change();

		nodeId.generateAll(this.engine.container);
	}

	/**
	 * 插入片段
	 * @param fragment 片段
	 * @param range 指定光标区域
	 * @param callback 插入后的回调函数
	 * @param followActiveMark 删除后空标签是否跟随当前激活的mark样式
	 */
	insert(
		fragment: DocumentFragment,
		range?: RangeInterface,
		callback: (range: RangeInterface) => void = () => {},
		followActiveMark: boolean = true,
	) {
		const { block, list, card, schema, mark, inline } = this.engine;
		const nodeApi = this.engine.node;
		range = range || this.range.toTrusty();
		const firstBlock = block.closest(range.startNode);
		const lastBlock = block.closest(range.endNode);
		const onlyOne = lastBlock[0] === firstBlock[0];
		const isBlockLast = block.isLastOffset(range, 'end');
		const mergeTags = schema.getCanMergeTags();
		const allowInTags = schema.getAllowInTags();
		const mergeNode = firstBlock.closest(mergeTags.join(','));
		const isCollapsed = range.collapsed;
		const childNodes = fragment.childNodes;
		const firstNode = $(fragment.firstChild || []);
		if (!isCollapsed) {
			this.delete(range, onlyOne || !isBlockLast, followActiveMark);
		} else if (range.startNode.isText()) {
			const inlineNode = inline.closest(range.startNode);
			const text = range.startNode.text();
			if (
				inlineNode.length === 0 &&
				!inlineNode.equal(range.startNode) &&
				/^\u200B/.test(text)
			)
				range.startNode.text(text.substr(1));
		}
		let startRange: { node: NodeInterface; offset: number } | undefined =
			undefined;
		const apply = (range: RangeInterface) => {
			if (startRange && startRange.node.parent()) {
				range
					.shrinkToElementNode()
					.setStart(startRange.node, startRange.offset);
				range.enlargeToElementNode();
			}
			block.merge(range);
			list.merge(undefined, range);
			mark.merge(range);
			inline.flat(range);
			if (callback) callback(range);
			this.apply(range);
		};
		if (
			nodeApi.isList(range.startNode) ||
			range.startNode.closest('li').length > 0
		) {
			list.insert(fragment, range);
			apply(range);
			return;
		}
		if (!firstNode[0]) {
			apply(range);
			return;
		}

		// 第一个子节点不是block节点就追加到当前节点下
		if (!nodeApi.isBlock(firstNode)) {
			range.shrinkToElementNode();
			if (childNodes.length > 0) {
				const children = range.startNode.children();
				startRange = {
					node: range.startNode,
					offset:
						children.length === 1 && children[0].nodeName === 'BR'
							? 0
							: range.startOffset,
				};
			}
			let nextNode = firstNode.next();
			let beforeNode = firstNode;
			const newRange = nodeApi.insert(firstNode, range);
			if (newRange) range = newRange;
			while (nextNode && !nodeApi.isBlock(nextNode)) {
				if (range.startContainer.nodeType === Node.TEXT_NODE)
					range.enlargeToElementNode().collapse(false);
				const newNext = nextNode.next();
				beforeNode.after(nextNode);
				beforeNode = nextNode;
				//nodeApi.insert(nextNode, range);
				nextNode = newNext;
			}
			if (beforeNode !== firstNode) {
				range.select(beforeNode, true).collapse(false);
			}
			if (childNodes.length === 0) {
				apply(range);
				return;
			}
		}
		const cloneRange = range
			.cloneRange()
			.enlargeToElementNode(true)
			.collapse(false);
		const startNode =
			cloneRange.startContainer.childNodes[
				range.startOffset === 0 ? 0 : range.startOffset - 1
			];
		const endNode = cloneRange.startContainer.childNodes[range.startOffset];

		if (childNodes.length !== 0) {
			let lastNode = $(childNodes[childNodes.length - 1]);
			if ('br' === lastNode.name) {
				lastNode.remove();
				lastNode = $(childNodes[childNodes.length - 1]);
			}
			if (!startRange) {
				const children = range.startNode.children();
				startRange = {
					node: range.startNode,
					offset:
						children.length === 1 && children[0].nodeName === 'BR'
							? 0
							: range.startOffset,
				};
			}
			let node: NodeInterface | null = $(childNodes[0]);
			let prev: NodeInterface | null = null;
			const appendNodes = [];
			while (node && node.length > 0) {
				nodeApi.removeSide(node);
				const next: NodeInterface | null = node.next();
				if (!next) {
					lastNode = node;
				}

				appendNodes.push(node);
				if (prev) {
					prev.after(node);
				} else {
					nodeApi.insert(node, range, true);
				}
				prev = node;
				if (!next) {
					range.select(node, true).collapse(false);
				}
				// 被删除了重新设置开始节点位置
				if (startRange && !startRange.node[0].parentNode) {
					const parent = node.parent();
					if (parent) {
						startRange = {
							node: parent,
							offset: node.index(),
						};
					}
				}
				node = next;
			}
			if (mergeNode[0]) {
				appendNodes.forEach((element) => {
					if (
						mergeTags.indexOf(element.name) < 0 &&
						element.closest(mergeNode.name).length === 0
					) {
						nodeApi.wrap(
							element,
							nodeApi.clone(mergeNode, false, false),
						);
					}
				});
			}
			//range.shrinkToElementNode().collapse(false);
			const component = card.find(range.startNode);
			if (component) component.focus(range, false);
		}
		const getFirstChild = (node: NodeInterface) => {
			let child = node.first();
			if (!child || !nodeApi.isBlock(child)) return node;
			while (allowInTags.indexOf(child ? child.name : '') > -1) {
				child = child!.first();
			}
			return child;
		};

		const getLastChild = (node: NodeInterface) => {
			let child = node.last();
			if (!child || !nodeApi.isBlock(child)) return node;
			while (allowInTags.indexOf(child ? child.name : '') > -1) {
				child = child!.last();
			}
			return child;
		};

		const isSameListChild = (
			_lastNode: NodeInterface,
			_firstNode: NodeInterface,
		) => {
			if (_lastNode.isCard() || firstNode.isCard()) return;
			const fParent = _firstNode.parent();
			const lParent = _lastNode.parent();
			const isSameParent =
				fParent &&
				!fParent.isEditable() &&
				lParent &&
				!lParent.isEditable() &&
				fParent.name === lParent.name;
			return (
				('p' === _firstNode.name && isSameParent) ||
				(_lastNode.name === _firstNode.name &&
					isSameParent &&
					!(
						'li' === _lastNode.name &&
						!list.isSame(_lastNode.parent()!, _firstNode.parent()!)
					))
			);
		};

		const removeEmptyNode = (node: NodeInterface) => {
			while (!node.isEditable()) {
				const parent = node.parent();
				node.remove();
				if (!parent || !nodeApi.isEmpty(parent)) break;
				node = parent;
			}
		};

		const clearList = (
			lastNode: NodeInterface,
			nextNode: NodeInterface,
		) => {
			if (lastNode.name === nextNode.name && 'p' === lastNode.name) {
				const attr = nextNode.attributes();
				if (attr[DATA_ID]) delete attr[DATA_ID];
				lastNode.attributes(attr);
			}
			if (
				nodeApi.isEmptyWidthChild(lastNode) &&
				!nodeApi.isEmptyWidthChild(nextNode)
			) {
				lastNode.get<Element>()!.innerHTML = '';
			}
			if (nodeApi.isCustomize(lastNode) === nodeApi.isCustomize(nextNode))
				list.unwrapCustomize(nextNode);
		};
		if (startNode) {
			const _firstNode = getFirstChild($(startNode.nextSibling || []))!;
			const _lastNode = getLastChild($(startNode))!;
			if (
				_lastNode.name === 'p' &&
				_firstNode.name !== _lastNode.name &&
				isSameListChild(_lastNode, _firstNode)
			) {
				clearList(_lastNode, _firstNode);
				nodeApi.merge(_lastNode, _firstNode, false);
				removeEmptyNode(_firstNode);
			}
		}
		if (endNode) {
			const prevNode = getLastChild($(endNode.previousSibling || []));
			const nextNode = getFirstChild($(endNode))!;
			if (prevNode && isSameListChild(prevNode, nextNode)) {
				nodeApi.merge(prevNode, nextNode, false);
				removeEmptyNode(nextNode);
			}
		}
		apply(range);
	}

	paste(
		html: string,
		range?: RangeInterface,
		callback?: (count: number) => void,
	) {
		this.#nativeEvent.paste(html, range, callback, true);
	}

	/**
	 * 删除内容
	 * @param range 光标，默认获取当前光标
	 * @param isDeepMerge 删除后是否合并
	 * @param followActiveMark 删除后空标签是否跟随当前激活的mark样式
	 */
	delete(
		range?: RangeInterface,
		isDeepMerge?: boolean,
		followActiveMark: boolean = true,
	) {
		const safeRange = range || this.range.toTrusty();
		if (safeRange.collapsed) {
			if (this.isEmpty()) this.initValue(safeRange);
			if (!range) this.apply(safeRange);
			return;
		}
		const { mark, inline, card } = this.engine;
		const nodeApi = this.engine.node;
		const blockApi = this.engine.block;
		let cloneRange = safeRange.cloneRange();
		cloneRange.collapse(true);
		const activeMarks = followActiveMark ? mark.findMarks(cloneRange) : [];
		safeRange.enlargeToElementNode();
		// 获取上面第一个 Block
		let block = blockApi.closest(
			safeRange
				.cloneRange()
				.shrinkToElementNode()
				.shrinkToTextNode()
				.enlargeToElementNode().startNode,
		);
		// 获取的 block 超出编辑范围
		if (!block.inEditor() && !block.isRoot()) {
			if (this.isEmpty()) this.initValue(safeRange);
			if (!range) this.apply(safeRange);
			return;
		}
		// 选中开始节点是卡片，并且光标位置在根节点，就先删除卡片
		if (block.isRoot()) {
			let child = block.children().eq(safeRange.startOffset);
			while (child?.isCard()) {
				const isBreak =
					child.equal(safeRange.endNode) ||
					child.contains(safeRange.endNode);
				const next = child.next() || undefined;
				const component = card.find(child);
				if (component) card.removeNode(component);
				else child.remove();
				if (isBreak) {
					child = undefined;
					return;
				}
				child = next;
			}
			if (!child) {
				if (this.isEmpty()) this.initValue(safeRange);
				if (!range) this.apply(safeRange);
				return;
			}
			block = child;
		}
		const { endNode, endOffset } = safeRange;
		const isMoreLine = !blockApi
			.closest(safeRange.startNode)
			.equal(blockApi.closest(endNode));
		// <a>aaa<cursor /></a> -> <a>aaa</a>cursor />
		const inlineNode = inline.closest(endNode);
		if (inlineNode.length > 0 && endNode.parent()?.equal(inlineNode)) {
			if (endNode.isText()) {
				const text = endNode.text();
				if (endOffset === text.length - 1) {
					safeRange.setEndAfter(inlineNode);
				}
			}
		}
		// 先删除范围内的所有内容
		safeRange.extractContents();
		if (
			safeRange.startNode.isEditable() &&
			safeRange.startNode.children().length === 0
		) {
			safeRange.startNode.html('<p><br /></p>');
		}
		safeRange.collapse(true);
		// 后续处理
		let { startNode } = safeRange
			.shrinkToElementNode()
			.shrinkToTextNode()
			.enlargeToElementNode();
		// 只删除了文本，不做处理
		if (startNode.isText() || !block.inEditor()) {
			if (this.isEmpty()) this.initValue(safeRange);
			if (!range) this.apply(safeRange);
			return;
		}
		let isRemoveStartNode = false;
		if (isMoreLine && startNode.children().length === 0) {
			const selection = safeRange.createSelection();
			startNode.remove();
			selection.move();
			isRemoveStartNode = true;
			startNode = safeRange.startNode;
		}

		const prevNode = block;
		const nextNode = startNode;
		let isEmptyNode = startNode.children().length === 0;
		if (!isEmptyNode && startNode.length > 0 && startNode.inEditor()) {
			if (
				startNode[0].childNodes.length === 1 &&
				startNode[0].firstChild?.nodeType === Node.ELEMENT_NODE &&
				nodeApi.isCustomize(startNode) &&
				startNode.first()?.isCard()
			)
				isEmptyNode = true;
		}
		if (isEmptyNode && nodeApi.isBlock(startNode) && startNode.inEditor()) {
			let html = nodeApi.getBatchAppendHTML(activeMarks, '<br />');
			if (startNode.isEditable()) {
				html = `<p>${html}</p>`;
			}
			startNode.append($(html));
			const br = startNode.find('br');
			const parent = br.parent();
			if (parent && nodeApi.isMark(parent)) {
				nodeApi.replace(br, $('\u200b', null));
			}
			safeRange
				.select(startNode, true)
				.shrinkToElementNode()
				.shrinkToTextNode();
			safeRange.collapse(false);
			if (this.isEmpty()) this.initValue(safeRange);
			if (!range) this.apply(safeRange);
			return;
		}
		//深度合并
		const deepMergeNode = (
			range: RangeInterface,
			prevNode: NodeInterface,
			nextNode: NodeInterface,
			marks: Array<NodeInterface>,
			isDeepMerge: boolean = false,
		) => {
			if (
				nodeApi.isBlock(prevNode) &&
				!nodeApi.isVoid(prevNode) &&
				!prevNode.isCard()
			) {
				range.select(prevNode, true);
				range.collapse(false);
				const selection = range
					.shrinkToElementNode()
					.shrinkToTextNode()
					.createSelection();
				let parent = nextNode.parent();
				nodeApi.merge(prevNode, nextNode);
				while (
					parent &&
					nodeApi.isBlock(parent) &&
					nodeApi.isEmpty(parent)
				) {
					parent.remove();
					parent = parent.parent();
				}
				selection.move();
				range.enlargeToElementNode(true);
				const prev = range.getPrevNode();
				const next = range.getNextNode();
				// 合并之后变成空 Block
				const { startNode } = range;
				if (!prev && !next && nodeApi.isBlock(startNode)) {
					startNode.append(
						$(nodeApi.getBatchAppendHTML(marks, '<br />')),
					);
					range.select(startNode.find('br'), true);
					range.collapse(false);
				}

				if (
					prev &&
					next &&
					!prev.isCard() &&
					!next.isCard() &&
					isDeepMerge
				) {
					deepMergeNode(range, prev, next, marks);
				}
			}
		};
		if (
			prevNode &&
			nextNode &&
			nodeApi.isBlock(prevNode) &&
			nodeApi.isBlock(nextNode) &&
			!prevNode.equal(nextNode) &&
			nextNode.inEditor()
		) {
			deepMergeNode(
				safeRange,
				prevNode,
				nextNode,
				activeMarks,
				isDeepMerge,
			);
		}

		startNode.children().each((node) => {
			const domNode = $(node);
			if (
				!nodeApi.isVoid(domNode) &&
				domNode.isElement() &&
				'' === nodeApi.html(domNode)
			)
				domNode.remove();
			//给inline节点添加零宽字符，用于光标选择
			if (nodeApi.isInline(domNode)) {
				inline.repairCursor(domNode);
			}
		});
		//移除空列表
		if (nodeApi.isList(startNode) && nodeApi.isEmpty(startNode)) {
			startNode.remove();
		}
		//修复inline节点光标选择在最后的零宽字符上时，将光标位置移到inline节点末尾
		cloneRange = safeRange.cloneRange().shrinkToTextNode();
		if (
			cloneRange.startNode.isText() &&
			/^\u200B/g.test(cloneRange.startNode.text()) &&
			cloneRange.startOffset === 0
		) {
			const prev = cloneRange.startNode.prev();
			if (prev && this.engine.node.isInline(prev)) {
				safeRange.select(prev, true);
				safeRange.collapse(false);
			}
		}
		if (nodeApi.isBlock(startNode) && startNode.children().length === 0) {
			startNode.html('<br />');
		}

		if (isRemoveStartNode) {
			if (nodeApi.isBlock(prevNode) && prevNode.children().length === 0) {
				prevNode.html('<br />');
			}
			if (prevNode.inEditor())
				safeRange.select(prevNode, true).collapse(false);
		}
		if (this.isEmpty()) this.initValue(safeRange);
		if (!range) this.apply(safeRange);
	}

	/**
	 * 去除当前光标最接近的block节点或传入的节点外层包裹
	 * @param node 节点
	 */
	unwrap(node?: NodeInterface) {
		const { block } = this.engine;
		const range = this.range.get();
		node = node || block.closest(range.startNode);
		if (!node.inEditor()) {
			return;
		}

		const selection = range.createSelection();
		this.engine.node.unwrap(node);
		selection.move();
		this.range.select(range);
	}

	/**
	 * 删除当前光标最接近的block节点或传入的节点后与前面一个节点后合并
	 * @param node 节点
	 */
	mergeAfterDelete(node?: NodeInterface) {
		const { block, card, list, mark } = this.engine;
		const nodeApi = this.engine.node;
		const range = this.range.get();
		node = node || block.closest(range.startNode);
		const children = node.children();
		if (children.length === 0) {
			node.append($('<br />'));
			this.apply(range);
			return;
		}
		// <p><br />abc</p>，先删除 br 標簽
		const first = node.first();
		if (children.length > 1 && first?.name === 'br') {
			first?.remove();
			return;
		}
		let prevBlock = node.prev();
		// 前面没有节点
		if (!prevBlock) {
			const parent = node.parent();
			if (parent?.inEditor() && !parent?.isEditable()) {
				this.unwrap(node);
			}
			return;
		}
		// 前面是Card
		if (prevBlock.isCard()) {
			if (
				(children.length === 1 && first?.name === 'br') ||
				nodeApi.isEmpty(node)
			) {
				node.remove();
			}
			const component = card.find(prevBlock);
			if (component) {
				card.focus(component);
				return;
			}
		}
		// 前面是 void 节点
		if (nodeApi.isVoid(prevBlock)) {
			prevBlock.remove();
			return;
		}
		// 前面是空段落
		if (nodeApi.isRootBlock(prevBlock) && nodeApi.isEmpty(prevBlock)) {
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
		if (nodeApi.isList(prevBlock)) {
			prevBlock = prevBlock.last();
		}
		// 只有一个 <br /> 时先删除
		if (children.length === 1 && first?.name === 'br') {
			first?.remove();
		} else if (
			prevBlock &&
			prevBlock.children().length === 1 &&
			prevBlock.first()?.name === 'br'
		) {
			prevBlock.first()?.remove();
		}

		if (!prevBlock || prevBlock.isText()) {
			this.unwrap(node);
		} else {
			const selection = range.createSelection();
			nodeApi.merge(prevBlock, node);
			selection.move();
			this.range.select(range);
			mark.merge();
			list.merge();
		}
	}

	destroy() {
		this.event.destroy();
		this.clearChangeTimer();
	}
}

export default ChangeModel;
