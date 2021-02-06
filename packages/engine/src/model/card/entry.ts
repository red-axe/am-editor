import {
	CARD_CENTER_SELECTOR,
	CARD_ELEMENT_KEY,
	CARD_KEY,
	CARD_LEFT_SELECTOR,
	CARD_RIGHT_SELECTOR,
	CARD_VALUE_KEY,
} from '../../constants/card';
import {
	CardToolbarInterface,
	CardType,
	CardOptions,
	CardInterface,
	MaximizeInterface,
	CardToolbarItemOptions,
} from '../../types/card';
import { ContentViewInterface } from '../../types/content-view';
import { EngineInterface } from '../../types/engine';
import { LanguageInterface } from '../../types/language';
import { NodeInterface } from '../../types/node';
import { RangeInterface } from '../../types/range';
import { ToolbarItemOptions } from '../../types/toolbar';
import { decodeCardValue, encodeCardValue, random } from '../../utils';
import $ from '../node';
import Maximize from './maximize';
import Toolbar from './toolbar';

abstract class CardEntry implements CardInterface {
	protected readonly engine?: EngineInterface;
	protected readonly contentView?: ContentViewInterface;
	readonly root: NodeInterface;
	readonly toolbar: CardToolbarInterface;
	activatedByOther: string | false = false;
	selectedByOther: string | false = false;
	readonly type: CardType;
	static autoActivate: boolean;
	static autoSelected: boolean = true;
	static singleSelectable: boolean;
	static collab: boolean = true;
	static focus: boolean;
	private defaultMaximize: MaximizeInterface;
	isMaximize: boolean = false;
	private _activated: boolean = false;
	private _selected: boolean = false;

	get readonly() {
		return !this.engine;
	}

	get activated() {
		return this._activated;
	}

	private setActivated(activated: boolean) {
		this._activated = activated;
		if (!this.onActivate) return;
		activated
			? this.root.addClass('card-activated')
			: this.root.removeClass('card-activated');
	}

	get selected() {
		return this.root.hasClass('card-selected');
	}

	private setSelected(selected: boolean) {
		this._selected = selected;
		if (!this.onSelect) return;
		selected
			? this.root.addClass('card-selected')
			: this.root.removeClass('card-selected');
	}

	get id() {
		const value = this.getValue();
		return typeof value === 'object' ? value.id : undefined;
	}

	get name() {
		return this.root.attr(CARD_KEY);
	}

	constructor({ engine, contentView, type, value, root }: CardOptions) {
		this.engine = engine;
		this.contentView = contentView;
		const tagName = type === 'inline' ? 'span' : 'div';
		this.root = root ? root : $('<'.concat(tagName, ' />'));
		this.type = type;
		if (typeof value === 'string') value = decodeCardValue(value);

		if (engine && type === CardType.BLOCK) {
			value = value || {};
			value.id = this.getId(value.id);
		}
		this.setValue(value);
		if (this.id) this.root.attr('id', this.id);

		this.toolbar = new Toolbar(this);
		this.defaultMaximize = new Maximize(this);
	}

	private getId(curId?: string) {
		if (!this.engine && !this.contentView) return curId || '';
		const idCache: Array<string> = [];
		(this.engine || this.contentView)!.card.each(card => {
			idCache.push(card.id);
		});
		if (curId && idCache.indexOf(curId) < 0) return curId;
		let id = random();
		while (idCache.indexOf(id) >= 0) id = random();
		return id;
	}

	getLang(): LanguageInterface {
		return this.getEngine().language;
	}

	getEngine() {
		return (this.engine || this.contentView)!;
	}

	// 设置 DOM 属性里的数据
	setValue(value: any) {
		if (value == null) {
			return;
		}
		value = { ...this.getValue(), ...value };
		if (this.id) value.id = this.id;

		value = encodeCardValue(value);
		this.root.attr(CARD_VALUE_KEY, value);
	}
	// 获取 DOM 属性里的数据
	getValue(): any {
		const value = this.root.attr(CARD_VALUE_KEY);
		if (!value) return;

		return decodeCardValue(value);
	}

	/**
	 * 获取Card内的 DOM 节点
	 * @param selector
	 */
	find(selector: string) {
		const nodes = this.root.find(selector);
		const children: Array<Node> = [];
		nodes.each(item => {
			const card = (this.engine || this.contentView)!.card.find(item);
			if (card && card.root.equal(this.root)) {
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
				if (this.onActivate) this.onActivate(activated);
			}
		} else if (this.activated) {
			this.setActivated(activated);
			if (this.onActivate) this.onActivate(false);
		}
	}

	select(selected: boolean) {
		if (this.readonly || this.activatedByOther) {
			return;
		}
		if (selected) {
			if (!this.selected) {
				this.setSelected(selected);
				if (this.onSelect) this.onSelect(selected);
			}
		} else if (this.selected) {
			this.setSelected(selected);
			if (this.onSelect) this.onSelect(false);
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
	}

	// 焦点移动到上一个 Block
	focusPrevBlock(range: RangeInterface, hasModify: boolean) {
		if (!this.engine) throw 'Engine not initialized';
		let prevBlock;

		if (this.type === 'inline') {
			const block = this.root.getClosestBlock();
			if (block.isRoot()) {
				prevBlock = this.root.prevElement();
			} else {
				prevBlock = block.prevElement();
			}
		} else {
			prevBlock = this.root.prevElement();
		}

		if (hasModify) {
			if (!prevBlock || prevBlock.attr(CARD_KEY)) {
				const _block = $('<p><br /></p>');
				this.root.before(_block);
				range.select(_block, true);
				range.collapse(false);
				return;
			}
		} else {
			if (!prevBlock) {
				return;
			}

			if (prevBlock.attr(CARD_KEY)) {
				this.engine?.card.find(prevBlock)?.focus(range, false);
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
		if (!this.engine) throw 'Engine not initialized';
		let nextBlock;
		if (this.type === 'inline') {
			const block = this.root.getClosestBlock();

			if (block.isRoot()) {
				nextBlock = this.root.nextElement();
			} else {
				nextBlock = block.nextElement();
			}
		} else {
			nextBlock = this.root.nextElement();
		}

		if (hasModify) {
			if (!nextBlock || nextBlock.attr(CARD_KEY)) {
				const _block = $('<p><br /></p>');
				this.root.after(_block);
				range.select(_block, true);
				range.collapse(false);
				return;
			}
		} else {
			if (!nextBlock) {
				return;
			}

			if (nextBlock.attr(CARD_KEY)) {
				this.engine?.card.find(nextBlock)?.focus(range, false);
				return;
			}
		}

		range
			.select(nextBlock, true)
			.shrinkToElementNode()
			.collapse(true);
	}

	maximize() {
		this.isMaximize = true;
		this.defaultMaximize.maximize();
	}

	minimize() {
		this.isMaximize = false;
		this.defaultMaximize.restore();
	}

	onSelect?(selected: boolean): void;
	onSelectByOther?(
		selected: boolean,
		value?: {
			color: string;
			rgb: string;
		},
	): NodeInterface | void;
	onActivate?(activated: boolean): void;
	onActivateByOther?(
		activated: boolean,
		value?: {
			color: string;
			rgb: string;
		},
	): NodeInterface | void;
	toolbarConfig?(): Array<CardToolbarItemOptions | ToolbarItemOptions>;
	destroy?(): void;
	didInsert?(): void;
	didUpdate?(): void;
	abstract render(): NodeInterface | string | void;
}

export default CardEntry;
