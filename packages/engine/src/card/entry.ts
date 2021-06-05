import {
	CARD_CENTER_SELECTOR,
	CARD_ELEMENT_KEY,
	CARD_KEY,
	CARD_LEFT_SELECTOR,
	CARD_RIGHT_SELECTOR,
	CARD_VALUE_KEY,
} from '../constants/card';
import {
	CardType,
	CardOptions,
	CardInterface,
	MaximizeInterface,
	CardToolbarItemOptions,
	CardEntry as CardEntryType,
	CardToolbarInterface,
	ResizeInterface,
	CardValue,
} from '../types/card';
import { EditorInterface, isEngine } from '../types/engine';
import { NodeInterface } from '../types/node';
import { RangeInterface } from '../types/range';
import { ToolbarItemOptions } from '../types/toolbar';
import { TinyCanvasInterface } from '../types/tiny-canvas';
import { decodeCardValue, encodeCardValue, random } from '../utils';
import Maximize from './maximize';
import Resize from './resize';
import Toolbar from './toolbar';

abstract class CardEntry<T extends CardValue = {}> implements CardInterface {
	protected readonly editor: EditorInterface;
	readonly root: NodeInterface;
	toolbarModel?: CardToolbarInterface;
	resizeModel?: ResizeInterface;
	activatedByOther: string | false = false;
	selectedByOther: string | false = false;
	/**
	 * 可编辑的节点
	 */
	readonly contenteditable: Array<string> = [];
	static readonly cardName: string;
	static readonly cardType: CardType;
	static readonly autoActivate: boolean;
	static readonly autoSelected: boolean = true;
	static readonly singleSelectable: boolean;
	static readonly collab: boolean = true;
	static readonly focus: boolean;
	static readonly selectStyleType: 'border' | 'background' = 'border';
	static readonly toolbarFollowMouse: boolean = false;
	private defaultMaximize: MaximizeInterface;
	isMaximize: boolean = false;

	get isEditable() {
		return this.contenteditable.length > 0;
	}

	get readonly() {
		return !isEngine(this.editor);
	}

	get activated() {
		return this.root.hasClass('card-activated');
	}

	private setActivated(activated: boolean) {
		activated
			? this.root.addClass('card-activated')
			: this.root.removeClass('card-activated');
	}

	get selected() {
		return this.root.hasClass('card-selected');
	}

	private setSelected(selected: boolean) {
		selected
			? this.root.addClass('card-selected')
			: this.root.removeClass('card-selected');
	}

	get id() {
		const value = this.getValue();
		return typeof value === 'object' ? value.id : '';
	}

	get name() {
		return this.root.attributes(CARD_KEY);
	}

	constructor({ editor, value, root }: CardOptions) {
		this.editor = editor;
		const { $ } = this.editor;
		const type = (this.constructor as CardEntryType).cardType;
		const tagName = type === 'inline' ? 'span' : 'div';
		this.root = root ? root : $('<'.concat(tagName, ' />'));
		if (typeof value === 'string') value = decodeCardValue(value);

		value = value || {};
		value['id'] = this.getId(value['id']);
		this.setValue(value as T);
		if (this.toolbar) this.toolbarModel = new Toolbar(this.editor, this);
		this.defaultMaximize = new Maximize(this.editor, this);
	}

	init?(): void;

	private getId(curId?: string) {
		const idCache: Array<string> = [];
		this.editor.card.each(card => {
			idCache.push(card.id);
		});
		if (curId && idCache.indexOf(curId) < 0) return curId;
		let id = random();
		while (idCache.indexOf(id) >= 0) id = random();
		return id;
	}

	// 设置 DOM 属性里的数据
	setValue(value: Partial<T>) {
		if (value == null) {
			return;
		}
		const currentValue = this.getValue();
		if (!!currentValue?.id) delete value['id'];
		value = { ...this.getValue(), ...value } as T;

		this.root.attributes(CARD_VALUE_KEY, encodeCardValue(value));
	}
	// 获取 DOM 属性里的数据
	getValue(): (T & { id: string }) | undefined {
		const value = this.root.attributes(CARD_VALUE_KEY);
		if (!value) return;

		return decodeCardValue(value) as T & { id: string };
	}

	/**
	 * 获取Card内的 DOM 节点
	 * @param selector
	 */
	find(selector: string) {
		const { card, $ } = this.editor;
		const nodes = this.root.find(selector);
		const children: Array<Node> = [];
		nodes.each(item => {
			const cardComponent = card.find(item);
			if (cardComponent && cardComponent.root.equal(this.root)) {
				children.push(item);
			}
		});
		return $(children);
	}

	findByKey(key: string) {
		return this.find('['.concat(CARD_ELEMENT_KEY, '=').concat(key, ']'));
	}

	activate(activated: boolean) {
		if (activated) {
			if (!this.activated) {
				this.setActivated(activated);
				this.onActivate(activated);
			}
		} else if (this.activated) {
			this.setActivated(activated);
			this.onActivate(false);
		}
	}

	select(selected: boolean) {
		if (this.readonly || this.activatedByOther) {
			return;
		}
		if (selected) {
			if (!this.selected) {
				this.setSelected(selected);
				this.onSelect(selected);
			}
		} else if (this.selected) {
			this.setSelected(selected);
			this.onSelect(false);
		}
	}

	getCenter() {
		return this.find(CARD_CENTER_SELECTOR);
	}

	isCenter(node: NodeInterface) {
		const center = node.closest(CARD_CENTER_SELECTOR);
		return (
			center.length > 0 && center.equal(this.find(CARD_CENTER_SELECTOR))
		);
	}

	isCursor(node: NodeInterface) {
		return this.isLeftCursor(node) || this.isRightCursor(node);
	}

	isLeftCursor(node: NodeInterface) {
		const cursor = node.closest(CARD_LEFT_SELECTOR);
		return cursor.length > 0 && cursor.equal(this.find(CARD_LEFT_SELECTOR));
	}

	isRightCursor(node: NodeInterface) {
		const cursor = node.closest(CARD_RIGHT_SELECTOR);
		return (
			cursor.length > 0 && cursor.equal(this.find(CARD_RIGHT_SELECTOR))
		);
	}

	focus(range: RangeInterface, toStart?: boolean) {
		const cardLeft = this.findByKey('left');
		const cardRight = this.findByKey('right');

		if (cardLeft.length === 0 || cardRight.length === 0) {
			return;
		}

		range.select(toStart ? cardLeft : cardRight, true);
		range.collapse(false);
		if (this.onFocus) this.onFocus();
	}

	// 焦点移动到上一个 Block
	focusPrevBlock(range: RangeInterface, hasModify: boolean) {
		if (!isEngine(this.editor)) throw 'Engine not initialized';
		let prevBlock;
		if ((this.constructor as CardEntryType).cardType === 'inline') {
			const block = this.editor.block.closest(this.root);
			if (block.isEditable()) {
				prevBlock = this.root.prevElement();
			} else {
				prevBlock = block.prevElement();
			}
		} else {
			prevBlock = this.root.prevElement();
		}

		if (hasModify) {
			if (!prevBlock || prevBlock.attributes(CARD_KEY)) {
				const _block = this.editor.$('<p><br /></p>');
				this.root.before(_block);
				range.select(_block, true);
				range.collapse(false);
				return;
			}
		} else {
			if (!prevBlock) {
				return;
			}

			if (prevBlock.attributes(CARD_KEY)) {
				this.editor.card.find(prevBlock)?.focus(range, false);
				return;
			}
		}

		range
			.select(prevBlock, true)
			.shrinkToElementNode()
			.collapse(false);
	}
	// 焦点移动到下一个 Block
	focusNextBlock(range: RangeInterface, hasModify: boolean) {
		if (!isEngine(this.editor)) throw 'Engine not initialized';
		let nextBlock;
		if ((this.constructor as CardEntryType).cardType === 'inline') {
			const block = this.editor.block.closest(this.root);

			if (block.isEditable()) {
				nextBlock = this.root.nextElement();
			} else {
				nextBlock = block.nextElement();
			}
		} else {
			nextBlock = this.root.nextElement();
		}

		if (hasModify) {
			if (!nextBlock || nextBlock.attributes(CARD_KEY)) {
				const _block = this.editor.$('<p><br /></p>');
				this.root.after(_block);
				range.select(_block, true);
				range.collapse(false);
				return;
			}
		} else {
			if (!nextBlock) {
				return;
			}

			if (nextBlock.attributes(CARD_KEY)) {
				this.editor.card.find(nextBlock)?.focus(range, false);
				return;
			}
		}

		range
			.select(nextBlock, true)
			.shrinkToElementNode()
			.collapse(true);
	}

	/**
	 * 当卡片聚焦时触发
	 */
	onFocus?(): void;

	maximize() {
		this.isMaximize = true;
		this.defaultMaximize.maximize();
	}

	minimize() {
		this.isMaximize = false;
		this.defaultMaximize.restore();
	}

	/**
	 * 工具栏配置项
	 */
	toolbar?(): Array<CardToolbarItemOptions | ToolbarItemOptions>;
	/**
	 * 是否可改变卡片大小，或者传入渲染节点
	 */
	resize?: boolean | (() => NodeInterface);

	onSelect(selected: boolean): void {
		const selectedClass = `data-card-${
			(this.constructor as CardEntryType).selectStyleType
		}-selected`;
		const center = this.getCenter();
		if (selected) center.addClass(selectedClass);
		else center.removeClass(selectedClass);
	}
	onSelectByOther(
		selected: boolean,
		value?: {
			color: string;
			rgb: string;
		},
	): NodeInterface | void {
		const center = this.getCenter();
		if (
			(this.constructor as CardEntryType).selectStyleType === 'background'
		) {
			center.css('background-color', selected ? value!.rgb : '');
		} else {
			center.css('outline', selected ? '2px solid ' + value!.color : '');
		}
	}
	onActivate(activated: boolean) {
		if (!this.resize) return;
		if (activated) this.resizeModel?.show();
		else this.resizeModel?.hide();
	}
	onActivateByOther(
		activated: boolean,
		value?: {
			color: string;
			rgb: string;
		},
	): NodeInterface | void {
		this.onSelectByOther(activated, value);
	}
	onChange?(node: NodeInterface): void;
	destroy() {
		this.toolbarModel?.hide();
	}
	didInsert?(): void;
	didUpdate?(): void;
	didRender() {
		if (this.resize) {
			const container =
				typeof this.resize === 'function'
					? this.resize()
					: this.findByKey('body');
			this.resizeModel = new Resize(this.editor, this);
			this.resizeModel.render(container);
		}
		if (this.contenteditable.length > 0) {
			this.editor.block.generateDataIDForDescendant(
				this.getCenter().get<Element>()!,
			);
		}
	}
	abstract render(): NodeInterface | string | void;

	updateBackgroundSelection?(range: RangeInterface): void;

	drawBackground?(
		node: NodeInterface,
		range: RangeInterface,
		targetCanvas: TinyCanvasInterface,
	): DOMRect | RangeInterface[] | void | false;
}

export default CardEntry;
