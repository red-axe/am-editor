import {
	CARD_EDITABLE_KEY,
	CARD_ELEMENT_KEY,
	CARD_KEY,
	CARD_LEFT_SELECTOR,
	CARD_LOADING_KEY,
	CARD_RIGHT_SELECTOR,
	CARD_TYPE_KEY,
	CARD_VALUE_KEY,
} from '../constants/card';
import {
	CardOptions,
	CardInterface,
	MaximizeInterface,
	CardToolbarItemOptions,
	CardEntry as CardEntryType,
	CardToolbarInterface,
	ResizeInterface,
	CardValue,
} from '../types/card';
import { EditorInterface } from '../types/editor';
import { NodeInterface } from '../types/node';
import { RangeInterface } from '../types/range';
import { ToolbarItemOptions } from '../types/toolbar';
import { TinyCanvasInterface } from '../types/tiny-canvas';
import { decodeCardValue, encodeCardValue, isEngine, random } from '../utils';
import Maximize from './maximize';
import Resize from './resize';
import Toolbar from './toolbar';
import { $ } from '../node';
import { CardType, SelectStyleType } from './enum';
import { DATA_ELEMENT, UI } from '../constants';

abstract class CardEntry<T extends CardValue = CardValue>
	implements CardInterface<T>
{
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
	static readonly selectStyleType: SelectStyleType = SelectStyleType.BORDER;
	static readonly lazyRender: boolean = false;
	private defaultMaximize: MaximizeInterface;
	isMaximize: boolean = false;
	private _id: string;

	get isEditable() {
		return this.contenteditable.length > 0;
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
		if (this._id) return this._id;
		const value = this.getValue();
		return typeof value === 'object' ? value?.id || '' : '';
	}

	get name() {
		return this.root.attributes(CARD_KEY);
	}

	get type() {
		return (
			this.getValue()?.type ||
			(this.root.attributes(CARD_TYPE_KEY) as CardType)
		);
	}

	set type(type: CardType) {
		if (!this.name || type === this.type) return;
		// 替换后重新渲染
		const { card } = this.editor;
		const component = card.replace(this, this.name, {
			...this.getValue(),
			type,
		});
		card.render(component.root);
		component.activate(false);
		card.activate(component.root);
	}

	get loading() {
		return !!this.root.attributes(CARD_LOADING_KEY);
	}

	constructor({ editor, value, root }: CardOptions<T>) {
		this.editor = editor;
		const type =
			value?.type || (this.constructor as CardEntryType).cardType;
		const tagName = type === 'inline' ? 'span' : 'div';
		this.root = root ? root : $('<'.concat(tagName, ' />'));
		if (typeof value === 'string') value = decodeCardValue(value);
		value = value || ({} as T);
		value.id = this.getId(value.id);
		this._id = value.id;
		value.type = type;
		this.setValue(value);
		this.defaultMaximize = new Maximize(this.editor, this);
	}

	init() {
		this.root.attributes(
			CARD_EDITABLE_KEY,
			this.isEditable ? 'true' : 'false',
		);
		this.toolbarModel?.hide();
		this.toolbarModel?.destroy();
		if (this.toolbar) {
			this.toolbarModel = new Toolbar(this.editor, this);
		}
		if (this.resize) {
			this.resizeModel = new Resize(this.editor, this);
		}
	}

	private getId(curId?: string) {
		const idCache: Array<string> = [];
		this.editor.card.each((card) => {
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
		value = { ...currentValue, ...value } as T;
		if (value.type && currentValue?.type !== value.type) {
			this.type = value.type;
		}

		this.root.attributes(CARD_VALUE_KEY, encodeCardValue(value));
	}
	// 获取 DOM 属性里的数据
	getValue() {
		const value = this.root.attributes(CARD_VALUE_KEY);
		if (!value) return {} as T;

		return decodeCardValue<T>(value);
	}

	/**
	 * 获取Card内的 DOM 节点
	 * @param selector
	 */
	find(selector: string) {
		return this.root.find(selector);
	}

	findByKey(key: string) {
		const body = this.root.first() || $([]);
		if (key === 'body' || body.length === 0) return body;
		const children = body.children();
		const index = ['left', 'center', 'right'].indexOf(key);
		if (index > -1) {
			const child = children.eq(index);
			if (child?.attributes(CARD_ELEMENT_KEY) === key) return child;
		}
		const tag = this.type === CardType.BLOCK ? 'div' : 'span';
		return this.find(`${tag}[${CARD_ELEMENT_KEY}=${key}]`);
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
		if (!isEngine(this.editor) || this.activatedByOther) {
			return;
		}
		if (selected) {
			if (!this.selected && !this.isMaximize) {
				this.setSelected(selected);
				this.onSelect(selected);
			}
		} else if (this.selected) {
			this.setSelected(selected);
			this.onSelect(false);
		}
	}

	getCenter() {
		return this.findByKey('center');
	}

	isCenter(node: NodeInterface) {
		const center = node.closest(
			this.type === CardType.BLOCK
				? `div[${CARD_ELEMENT_KEY}=center]`
				: `span[${CARD_ELEMENT_KEY}=center]`,
		);
		return center.length > 0 && center.equal(this.findByKey('center'));
	}

	isCursor(node: NodeInterface) {
		return this.isLeftCursor(node) || this.isRightCursor(node);
	}

	isLeftCursor(node: NodeInterface) {
		if (node.isElement() && node.attributes(CARD_ELEMENT_KEY) !== 'left')
			return false;
		const cursor = node.closest(CARD_LEFT_SELECTOR);
		return cursor.length > 0 && cursor.equal(this.findByKey('left'));
	}

	isRightCursor(node: NodeInterface) {
		if (node.isElement() && node.attributes(CARD_ELEMENT_KEY) !== 'right')
			return false;
		const cursor = node.closest(CARD_RIGHT_SELECTOR);
		return cursor.length > 0 && cursor.equal(this.findByKey('right'));
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

	/**
	 * 当卡片聚焦时触发
	 */
	onFocus?(): void;

	maximize() {
		this.isMaximize = true;
		this.defaultMaximize.maximize();
		this.toolbarModel?.show();
	}

	minimize() {
		this.isMaximize = false;
		this.defaultMaximize.restore();
		this.toolbarModel?.show();
	}

	/**
	 * 工具栏配置项
	 */
	toolbar?(): Array<CardToolbarItemOptions | ToolbarItemOptions>;
	/**
	 * 是否可改变卡片大小，或者传入渲染节点
	 */
	resize?: boolean | (() => NodeInterface | void);

	onSelect(selected: boolean): void {
		const selectStyleType = (this.constructor as CardEntryType)
			.selectStyleType;
		if (selectStyleType === SelectStyleType.NONE) return;
		const selectedClass = `data-card-${selectStyleType}-selected`;
		const center = this.getCenter();
		if (selected) {
			center.addClass(selectedClass);
		} else {
			center.removeClass(selectedClass);
		}
	}
	onSelectByOther(
		selected: boolean,
		value?: {
			color: string;
			rgb: string;
		},
	): NodeInterface | void {
		const center = this.getCenter();
		const selectStyleType = (this.constructor as CardEntryType)
			.selectStyleType;
		if (selectStyleType === SelectStyleType.BACKGROUND) {
			center.css('background-color', selected ? value!.rgb : '');
		} else {
			center.css('outline', selected ? '2px solid ' + value!.color : '');
		}
		const className = 'card-selected-other';
		if (selected) this.root.addClass(className);
		else this.root.removeClass(className);
		return center;
	}
	onSelectLeft?(event: KeyboardEvent): boolean | void;
	onSelectRight?(event: KeyboardEvent): boolean | void;
	onSelectUp?(event: KeyboardEvent): boolean | void;
	onSelectDown?(event: KeyboardEvent): boolean | void;
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
		return this.onSelectByOther(activated, value);
	}
	onChange?(trigger: 'remote' | 'local', node: NodeInterface): void;
	private initToolbar() {
		if (this.toolbar) {
			if (!this.toolbarModel)
				this.toolbarModel = new Toolbar(this.editor, this);
			if (this.activated) {
				this.toolbarModel.show();
			}
		} else {
			this.toolbarModel?.hide();
			this.toolbarModel?.destroy();
			this.toolbarModel = undefined;
		}
	}
	private initResize() {
		if (this.resize) {
			const container =
				typeof this.resize === 'function'
					? this.resize()
					: this.findByKey('body');
			if (container && container.length > 0) {
				this.resizeModel?.render(container);
			}
		}
	}
	didInsert?(): void;
	didUpdate() {
		this.initResize();
		this.initToolbar();
	}
	beforeRender() {
		const center = this.getCenter();
		const loadingElement = $(
			`<${
				this.type === CardType.BLOCK ? 'div' : 'span'
			} class="${CARD_LOADING_KEY}" ${DATA_ELEMENT}="${UI}" />`,
		);
		loadingElement.append(
			'<svg viewBox="0 0 1024 1024" class="data-card-spin" data-icon="loading" width="1em" height="1em" fill="currentColor" aria-hidden="true"> <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 0 0-94.3-139.9 437.71 437.71 0 0 0-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path></svg>',
		);
		center.empty().append(loadingElement);
	}
	didRender() {
		if (this.loading) {
			this.find(`.${CARD_LOADING_KEY}`).remove();
			if (!isEngine(this.editor))
				this.root.removeAttributes(CARD_LOADING_KEY);
		}
		this.initResize();
		this.initToolbar();
		if (this.isEditable) {
			this.editor.nodeId.generateAll(this.getCenter().get<Element>()!);
		}
	}
	abstract render(): NodeInterface | string | void;

	updateBackgroundSelection?(range: RangeInterface): void;

	drawBackground?(
		node: NodeInterface,
		range: RangeInterface,
		targetCanvas: TinyCanvasInterface,
	): DOMRect | RangeInterface[] | void | false;

	/**
	 * 获取卡片区域选中的所有节点
	 */
	getSelectionNodes?(): Array<NodeInterface>;

	executeMark?(mark: NodeInterface): void;

	queryMarks?(): NodeInterface[];

	destroy() {
		this.toolbarModel?.hide();
		this.toolbarModel?.destroy();
		this.toolbarModel = undefined;
		this.resizeModel?.hide();
		this.resizeModel?.destroy();
		this.resizeModel = undefined;
	}
}

export default CardEntry;
