import {
	CARD_ELEMENT_KEY,
	CARD_KEY,
	CARD_SELECTOR,
	CARD_TYPE_KEY,
	CARD_VALUE_KEY,
	READY_CARD_KEY,
	READY_CARD_SELECTOR,
} from '../constants/card';
import {
	ActiveTrigger,
	CardEntry,
	CardInterface,
	CardModelInterface,
	CardType,
	CardValue,
} from '../types/card';
import { NodeInterface, isNode, isNodeEntry } from '../types/node';
import { RangeInterface } from '../types/range';
import { EditorInterface, EngineInterface, isEngine } from '../types/engine';
import {
	decodeCardValue,
	encodeCardValue,
	transformCustomTags,
} from '../utils';
import { Backspace, Enter, Left, Right, Up, Down, Default } from './typing';
import './index.css';

class CardModel implements CardModelInterface {
	classes: {
		[k: string]: CardEntry;
	};
	private components: Array<CardInterface>;
	private editor: EditorInterface;

	constructor(editor: EditorInterface) {
		this.classes = {};
		this.components = [];
		this.editor = editor;
	}

	get active() {
		return this.components.find(component => component.activated);
	}

	get length() {
		return this.components.length;
	}

	init(cards: Array<CardEntry>) {
		if (isEngine(this.editor)) {
			//绑定回车事件
			const enter = new Enter(this.editor);
			this.editor.typing
				.getHandleListener('enter', 'keydown')
				?.on(event => enter.trigger(event));
			//删除事件
			const backspace = new Backspace(this.editor);
			this.editor.typing
				.getHandleListener('backspace', 'keydown')
				?.on(event => backspace.trigger(event));
			//方向键事件
			const left = new Left(this.editor);
			this.editor.typing
				.getHandleListener('left', 'keydown')
				?.on(event => left.trigger(event));

			const right = new Right(this.editor);
			this.editor.typing
				.getHandleListener('right', 'keydown')
				?.on(event => right.trigger(event));

			const up = new Up(this.editor);
			this.editor.typing
				.getHandleListener('up', 'keydown')
				?.on(event => up.trigger(event));

			const down = new Down(this.editor);
			this.editor.typing
				.getHandleListener('down', 'keydown')
				?.on(event => down.trigger(event));

			const _default = new Default(this.editor);
			this.editor.typing
				.getHandleListener('default', 'keydown')
				?.on(event => _default.trigger(event));
		}

		cards.forEach(card => {
			this.classes[card.cardName] = card;
		});
	}

	add(clazz: CardEntry) {
		this.classes[clazz.cardName] = clazz;
	}

	each(
		callback: (card: CardInterface, index?: number) => boolean | void,
	): void {
		this.components.every((card, index) => {
			if (callback && callback(card, index) === false) return false;
			return true;
		});
	}

	closest(selector: Node | NodeInterface): NodeInterface | undefined {
		const { $ } = this.editor;
		if (isNode(selector)) selector = $(selector);
		if (isNodeEntry(selector) && !selector.isCard()) {
			const card = selector.closest(CARD_SELECTOR, (node: Node) => {
				if (node && $(node).isRoot()) {
					return;
				}
				return node.parentNode || undefined;
			});
			if (!card || card.length === 0) return;
			selector = card;
		}
		return selector;
	}

	find(selector: string | Node | NodeInterface): CardInterface | undefined {
		if (typeof selector !== 'string') {
			const cardNode = this.closest(selector);
			if (!cardNode) return;
			selector = cardNode;
		}
		const cards = this.components.filter(item => {
			if (typeof selector === 'string') return item.id === selector;
			return item.root.equal(selector);
		});
		if (cards.length === 0) return;

		return cards[0];
	}

	findBlock(selector: Node | NodeInterface): CardInterface | undefined {
		const { $ } = this.editor;
		if (isNode(selector)) selector = $(selector);
		if (!selector.get()) return;
		const parent = selector.parent();
		if (!parent) return;
		const card = this.find(parent);
		if (!card) return;
		if ((card.constructor as CardEntry).cardType === CardType.BLOCK)
			return card;
		return this.findBlock(card.root);
	}

	getSingleCard(range: RangeInterface) {
		let card = this.find(range.commonAncestorNode);
		if (!card) card = this.getSingleSelectedCard(range);
		return card;
	}

	getSingleSelectedCard(range: RangeInterface) {
		const { $ } = this.editor;
		const elements = range.findElementsInSimpleRange();
		let node = elements[0];
		if (elements.length === 1 && node) {
			const domNode = $(node);
			if (domNode.isCard()) {
				return this.find(domNode);
			}
		}
		return;
	}

	// 插入Card
	insertNode(range: RangeInterface, card: CardInterface) {
		const { $ } = this.editor;
		const isInline = (card.constructor as CardEntry).cardType === 'inline';
		const editor = this.editor as EngineInterface;
		// 范围为折叠状态时先删除内容
		if (!range.collapsed) {
			editor.change.deleteContent(range);
		}
		this.gc();
		// 插入新 Card
		if (isInline) {
			editor.inline.insert(card.root, range);
		} else {
			editor.block.insert(card.root, true, range);
		}
		this.components.push(card);
		card.focus(range);
		// 矫正错误 HTML 结构
		const rootParent = card.root.parent();
		if (
			rootParent &&
			rootParent.inEditor() &&
			this.editor.node.isBlock(rootParent)
		) {
			editor.block.unwrap(card.root.parent()!, range);
		}
		const result = card.render();
		if (result !== undefined) {
			card.getCenter().append(
				typeof result === 'string' ? $(result) : result,
			);
		}
		//创建工具栏
		card.didRender();
		if (card.didInsert) {
			card.didInsert();
		}
		return card;
	}

	// 移除Card
	removeNode(card: CardInterface) {
		if (card.destroy) card.destroy();
		const editor = this.editor as EngineInterface;
		if ((card.constructor as CardEntry).cardType === CardType.BLOCK) {
			editor.readonly = false;
		}
		this.removeComponent(card);
		card.root.remove();
	}

	// 更新Card
	updateNode(card: CardInterface, value: CardValue) {
		const { $ } = this.editor;
		if (card.destroy) card.destroy();
		const container = card.findByKey('center');
		container.empty();
		card.setValue(value);
		const result = card.render();
		if (result !== undefined) {
			card.getCenter().append(
				typeof result === 'string' ? $(result) : result,
			);
		}
		if (card.didUpdate) {
			card.didUpdate();
		}
	}
	// 将指定节点替换成等待创建的Card DOM 节点
	replaceNode(node: NodeInterface, name: string, value?: CardValue) {
		const clazz = this.classes[name];
		if (!clazz) throw ''.concat(name, ': This card does not exist');
		const { $ } = this.editor;
		value = encodeCardValue(value);
		const cardNode = transformCustomTags(
			`<card type="${clazz.cardType}" name="${name}" value="${value}"></card>`,
		);
		const readyCard = $(cardNode);
		node.before(readyCard);
		readyCard.append(node);
	}

	activate(
		node: NodeInterface,
		trigger: ActiveTrigger = ActiveTrigger.MANUAL,
		event?: MouseEvent,
	) {
		if (!isEngine(this.editor)) return;
		//获取当前卡片所在编辑器的根节点
		const container = node.getRoot();
		//如果当前编辑器根节点和引擎的根节点不匹配就不执行，主要是子父编辑器的情况
		if (!container.get() || this.editor.container.equal(container)) {
			let card = this.find(node);
			const blockCard = card ? this.findBlock(card.root) : undefined;
			if (blockCard) {
				card = blockCard;
			}
			if (card && card.isCursor(node)) card = undefined;
			let isCurrentActiveCard =
				card && this.active && this.active.root.equal(card.root);
			if (trigger === ActiveTrigger.UPDATE_CARD) {
				isCurrentActiveCard = false;
			}
			if (this.active && !isCurrentActiveCard) {
				this.active.toolbarModel?.hide();
				const type = (this.active.constructor as CardEntry).cardType;
				this.active.activate(false);
				if (type === CardType.BLOCK) {
					this.editor.readonly = false;
				}
			}
			if (card) {
				if (card.activatedByOther) return;
				if (!isCurrentActiveCard) {
					card.toolbarModel?.show(event);
					if (
						(card.constructor as CardEntry).cardType ===
							CardType.INLINE &&
						(card.constructor as CardEntry).autoSelected !==
							false &&
						(trigger !== ActiveTrigger.CLICK || !card.readonly)
					) {
						this.select(card);
					}
					card.activate(true);
				}
				if (
					(card.constructor as CardEntry).cardType === CardType.BLOCK
				) {
					card.select(false);
					this.editor.readonly = true;
				}
				if (
					!isCurrentActiveCard &&
					trigger === ActiveTrigger.MOUSE_DOWN
				) {
					this.editor.trigger('focus');
				}
				this.editor.change.onSelect();
			}
		}
	}

	select(card: CardInterface) {
		if (!isEngine(this.editor)) return;
		if (
			(card.constructor as CardEntry).singleSelectable !== false &&
			((card.constructor as CardEntry).cardType !== CardType.BLOCK ||
				!card.activated)
		) {
			const range = this.editor.change.getRange();
			const center = card.getCenter();
			const parentNode = center.parent()!;
			const index = parentNode
				.children()
				.toArray()
				.findIndex(child => child.equal(center));
			range.setStart(parentNode, index);
			range.setEnd(parentNode, index + 1);
			this.editor.change.select(range);
		}
	}

	focus(card: CardInterface, toStart: boolean = false) {
		if (!isEngine(this.editor)) return;
		const range = this.editor.change.getRange();
		card.focus(range, toStart);
		this.editor.change.select(range);
		this.editor.readonly = false;
		this.activate(range.startNode, ActiveTrigger.MOUSE_DOWN);
		this.editor.change.onSelect();
		if (this.editor.scrollNode)
			range.scrollIntoViewIfNeeded(
				this.editor.container,
				this.editor.scrollNode,
			);
	}

	insert(name: string, value?: CardValue) {
		if (!isEngine(this.editor)) throw 'Engine not found';
		const component = this.create(name, {
			value,
		});
		const { change } = this.editor;
		const range = change.getSafeRange();
		const card = this.insertNode(range, component);
		const type = (component.constructor as CardEntry).cardType;
		if (type === 'inline') {
			card.focus(range, false);
		}
		change.select(range);
		if (
			type === 'block' &&
			(component.constructor as CardEntry).autoActivate !== false
		) {
			this.activate(card.root, ActiveTrigger.INSERT_CARD);
		}
		change.change();
		return card;
	}

	update(selector: NodeInterface | Node | string, value: CardValue) {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const card = this.find(selector);
		if (card) {
			this.updateNode(card, value);
			const range = change.getRange();
			card.focus(range, false);
			change.change();
		}
	}

	remove(selector: NodeInterface | Node | string) {
		if (!isEngine(this.editor)) return;
		const { change, list, node } = this.editor;
		const range = change.getRange();
		const card = this.find(selector);
		if (!card) return;
		if ((card.constructor as CardEntry).cardType === CardType.INLINE) {
			range.setEndAfter(card.root[0]);
			range.collapse(false);
		} else {
			card.focusPrevBlock(range, true);
		}
		const parent = card.root.parent();
		this.removeNode(card);
		list.addBr(range.startNode);
		if (parent && node.isEmpty(parent)) {
			if (parent.isRoot()) {
				this.editor.node.html(parent, '<p><br /></p>');
				range.select(parent, true);
				range.shrinkToElementNode();
				range.collapse(false);
			} else {
				this.editor.node.html(parent, '<br />');
				range.select(parent, true);
				range.collapse(false);
			}
		}
		change.select(range);
		change.change();
	}

	// 创建Card DOM 节点
	create(
		name: string,
		options?: {
			value?: CardValue;
			root?: NodeInterface;
		},
	): CardInterface {
		const clazz = this.classes[name];
		if (!clazz) throw ''.concat(name, ': This card does not exist');
		const { $ } = this.editor;
		if (['inline', 'block'].indexOf(clazz.cardType) < 0) {
			throw ''.concat(
				name,
				': the type of card must be "inline", "block"',
			);
		}
		if (options?.root) options.root.empty();
		const component = new clazz({
			editor: this.editor,
			value: options?.value,
			root: options?.root,
		});

		component.root.attributes(CARD_TYPE_KEY, clazz.cardType);
		component.root.attributes(CARD_KEY, name);
		//如果没有指定是否能聚集，那么当card不是只读的时候就可以聚焦
		const hasFocus =
			clazz.focus !== undefined ? clazz.focus : !component.readonly;
		const tagName = clazz.cardType === CardType.INLINE ? 'span' : 'div';
		//center
		const center = $(`<${tagName} />`);
		center.attributes(CARD_ELEMENT_KEY, 'center');

		if (hasFocus) {
			center.attributes('contenteditable', 'false');
		} else {
			component.root.attributes('contenteditable', 'false');
		}
		//body
		const body = $(
			'<'.concat(tagName, ' ').concat(CARD_ELEMENT_KEY, '="body" />'),
		);
		//可以聚焦的情况下，card左右两边添加光标位置
		if (hasFocus) {
			//left
			const left = $(
				'<span '.concat(CARD_ELEMENT_KEY, '="left">&#8203;</span>'),
			);
			//right
			const right = $(
				'<span '.concat(CARD_ELEMENT_KEY, '="right">&#8203;</span>'),
			);
			body.append(left);
			body.append(center);
			body.append(right);
		} else {
			body.append(center);
		}

		component.root.append(body);
		if (component.init) component.init();
		return component;
	}

	/**
	 * 渲染
	 * @param container 需要重新渲染包含卡片的节点，如果不传，则渲染全部待创建的卡片节点
	 */
	render(container?: NodeInterface) {
		const { $ } = this.editor;
		const cards = container
			? container.isCard()
				? container
				: container.find(CARD_SELECTOR)
			: this.editor.container.find(READY_CARD_SELECTOR);
		this.gc();
		cards.each(node => {
			const cardNode = $(node);
			const readyKey = cardNode.attributes(READY_CARD_KEY);
			const key = cardNode.attributes(CARD_KEY);
			const name = readyKey || key;
			if (this.classes[name]) {
				const value = cardNode.attributes(CARD_VALUE_KEY);
				let card: CardInterface | undefined;
				if (key) {
					card = this.find(cardNode);
					if (card) {
						if (card.destroy) card.destroy();
						this.removeComponent(card);
					}
				}
				//ready_card_key 待创建的需要重新生成节点，并替换当前待创建节点
				card = this.create(name, {
					value: decodeCardValue(value),
					root: key ? cardNode : undefined,
				});
				if (readyKey) cardNode.replaceWith(card.root);
				this.components.push(card);
				// 重新渲染
				const result = card.render();
				if (result !== undefined) {
					card.getCenter().append(
						typeof result === 'string' ? $(result) : result,
					);
				}
				//创建工具栏
				card.didRender();
			}
		});
	}

	removeComponent(card: CardInterface): void {
		this.each((c, index) => {
			if (c.root.equal(card.root)) {
				this.components.splice(index!, 1);
				return false;
			}
			return;
		});
	}

	gc() {
		for (let i = 0; i < this.components.length; i++) {
			const component = this.components[i];
			if (
				!component.root[0] ||
				component.root.closest('body').length === 0
			) {
				if (component.destroy) component.destroy();
				this.components.splice(i, 1);
				i--;
			}
		}
	}
}

export default CardModel;
