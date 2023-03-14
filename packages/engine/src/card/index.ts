import {
	CARD_ELEMENT_KEY,
	CARD_KEY,
	CARD_SELECTOR,
	CARD_TYPE_KEY,
	CARD_VALUE_KEY,
	READY_CARD_KEY,
	READY_CARD_SELECTOR,
	DATA_ELEMENT,
	EDITABLE,
	EDITABLE_SELECTOR,
	DATA_TRANSIENT_ELEMENT,
	DATA_TRANSIENT_ATTRIBUTES,
	CARD_LOADING_KEY,
	DATA_CONTENTEDITABLE_KEY,
	DATA_ID,
} from '../constants';
import {
	CardEntry,
	CardInterface,
	CardModelInterface,
	CardValue,
} from '../types/card';
import { NodeInterface } from '../types/node';
import { RangeInterface } from '../types/range';
import { EditorInterface } from '../types/editor';
import {
	decodeCardValue,
	encodeCardValue,
	isEngine,
	transformCustomTags,
} from '../utils';
import { Backspace, Enter, Left, Right, Up, Down, Default } from './typing';
import { $ } from '../node';
import { isNode } from '../node/utils';
import { CardActiveTrigger, CardType } from './enum';
import './index.css';

class CardModel implements CardModelInterface {
	classes: {
		[k: string]: CardEntry;
	};
	components: Array<CardInterface>;
	lazyRender: boolean;
	private asyncComponents: CardInterface[] = [];
	private editor: EditorInterface;
	private renderTimeout?: NodeJS.Timeout;

	constructor(editor: EditorInterface, lazyRender: boolean = true) {
		this.classes = {};
		this.components = [];
		this.editor = editor;
		this.lazyRender = lazyRender;
	}

	get active() {
		return this.components.find((component) => component.activated);
	}

	get length() {
		return this.components.length;
	}

	init(cards: Array<CardEntry>) {
		const editor = this.editor;
		if (isEngine(editor)) {
			const { typing } = editor;
			//绑定回车事件
			const enter = new Enter(editor);
			typing
				.getHandleListener('enter', 'keydown')
				?.on((event) => enter.trigger(event));
			//删除事件
			const backspace = new Backspace(editor);
			typing
				.getHandleListener('backspace', 'keydown')
				?.on((event) => backspace.trigger(event));
			//方向键事件
			const left = new Left(editor);
			typing
				.getHandleListener('left', 'keydown')
				?.on((event) => left.trigger(event));

			const right = new Right(editor);
			typing
				.getHandleListener('right', 'keydown')
				?.on((event) => right.trigger(event));

			const up = new Up(editor);
			typing
				.getHandleListener('up', 'keydown')
				?.on((event) => up.trigger(event));

			const down = new Down(editor);
			typing
				.getHandleListener('down', 'keydown')
				?.on((event) => down.trigger(event));

			const _default = new Default(editor);
			typing
				.getHandleListener('default', 'keydown')
				?.on((event) => _default.trigger(event));
		}

		cards.forEach((card) => {
			this.classes[card.cardName] = card;
		});
		if (!this.lazyRender) return;
		window.addEventListener('resize', this.renderAsyncComponents, {
			passive: true,
		});
		editor.scrollNode
			?.get<HTMLElement>()
			?.addEventListener('scroll', this.renderAsyncComponents, {
				passive: true,
			});
		window.addEventListener('scroll', this.renderAsyncComponents, {
			passive: true,
		});
		editor.on('card:async-render', this.renderAsyncComponents);
	}

	renderAsyncComponents = async () => {
		if (this.renderTimeout) clearTimeout(this.renderTimeout);
		const editor = this.editor;
		this.renderTimeout = setTimeout(() => {
			const components = this.asyncComponents.concat();
			components.forEach(async (card) => {
				// 在视图内才渲染卡片
				if (
					card.root.length === 0 ||
					(editor.root.inViewport(card.root, true) &&
						editor.trigger('card:async-render-component', card) !==
							false)
				) {
					this.asyncComponents.splice(
						this.asyncComponents.findIndex(
							(component) => component === card,
						),
						1,
					);
					if (card.root.length > 0 && card.loading) {
						if (card.destroy) card.destroy();
						card.getCenter().empty();
						this.renderComponent(card);
					}
				}
			});
		}, 50);
	};

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

	closest(
		selector: Node | NodeInterface,
		ignoreEditable?: boolean,
	): NodeInterface | undefined {
		if (isNode(selector)) selector = $(selector);
		if (!selector.isCard()) {
			const card = selector.closest(CARD_SELECTOR, (node: Node) => {
				if (
					node && ignoreEditable
						? $(node).isRoot()
						: $(node).isEditable()
				) {
					return;
				}
				return (node.parentElement ?? node.parentNode) || undefined;
			});
			if (!card || card.length === 0) return;
			selector = card;
		}
		return selector;
	}

	find<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(
		selector: string | Node | NodeInterface,
		ignoreEditable?: boolean,
	): T | undefined {
		if (typeof selector !== 'string') {
			const cardNode = this.closest(selector, ignoreEditable);
			if (!cardNode) return;
			selector = cardNode;
		}

		const getValue = (node: Node | NodeInterface): E => {
			if (isNode(node)) node = $(node);
			const value = node.attributes(CARD_VALUE_KEY);
			return decodeCardValue<E>(value);
		};
		const cards = this.components.filter((item) => {
			if (typeof selector === 'string') return item.id === selector;
			if (
				item.root.name !==
				(isNode(selector)
					? selector.nodeName.toString().toLowerCase()
					: selector.name)
			)
				return false;
			return (
				item.root.equal(selector) || item.id === getValue(selector).id
			);
		});
		if (cards.length === 0) return;

		return cards[0] as T;
	}

	findBlock<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(selector: Node | NodeInterface): T | undefined {
		if (isNode(selector)) selector = $(selector);
		if (!selector.get()) return;
		const parent = selector.parent();
		if (!parent) return;
		const card = this.find(parent);
		if (!card) return;
		if (card.type === CardType.BLOCK) return card as T;
		return this.findBlock(card.root);
	}

	getSingleCard<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(range: RangeInterface) {
		let card = this.find<E, T>(range.commonAncestorNode);
		if (!card) card = this.getSingleSelectedCard<E, T>(range);
		return card;
	}

	getSingleSelectedCard<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(range: RangeInterface) {
		const elements = range.findElements();
		let node = elements[0];
		if (elements.length === 1 && node) {
			const domNode = $(node);
			if (domNode.isCard()) {
				return this.find<E, T>(domNode);
			}
		}
		return;
	}

	// 插入Card
	insertNode<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(range: RangeInterface, card: T, ...args: any) {
		const isInline = card.type === 'inline';
		const editor = this.editor;
		// 范围为折叠状态时先删除内容
		if (!range.collapsed && isEngine(editor)) {
			editor.change.delete(range);
		}
		this.gc();
		const { inline, block, node } = editor;
		// 插入新 Card
		let marks: NodeInterface[] = [];
		if (isInline) {
			if (isEngine(editor) && card.executeMark) {
				marks = editor.change.marks.map((mark) => mark.clone());
				const cardComponent = editor.card.find(range.startNode);
				if (cardComponent?.queryMarks) {
					marks.push(...cardComponent.queryMarks());
				}
			}
			inline.insert(card.root, range);
		} else {
			block.insert(
				card.root,
				range,
				(container) => {
					//获取最外层的block嵌套节点
					let blockParent = container.parent();
					while (blockParent && !blockParent.isEditable()) {
						container = blockParent;
						const parent = blockParent.parent();
						if (parent && node.isBlock(parent)) {
							blockParent = parent;
						} else break;
					}
					return container;
				},
				true,
			);
		}
		this.components.push(card);
		// 矫正错误 HTML 结构
		const rootParent = card.root.parent();
		if (
			!isInline &&
			rootParent &&
			rootParent.inEditor() &&
			node.isBlock(rootParent)
		) {
			block.unwrap(rootParent, range);
		}
		this.renderComponent(card, ...args);
		card.focus(range, false);
		if (card.didInsert) {
			card.didInsert();
		}
		marks.forEach((mark) => {
			card.executeMark!(mark, true);
		});
		return card;
	}

	// 移除Card
	removeNode(card: CardInterface) {
		if (card.destroy) card.destroy();
		this.removeComponent(card);
		card.root.remove();
	}

	// 更新Card
	updateNode(card: CardInterface, value: CardValue, ...args: any) {
		if (card.destroy) card.destroy();
		const center = card.getCenter();
		center?.empty();
		card.setValue(value);
		this.renderComponent(card, ...args);
		if (card.didUpdate) {
			card.didUpdate();
		}
	}
	// 将指定节点替换成等待创建的Card DOM 节点
	replaceNode(node: NodeInterface, name: string, value?: CardValue) {
		const clazz = this.classes[name];
		if (!clazz) throw ''.concat(name, ': This card does not exist');
		const type = value?.type || clazz.cardType;
		const dataId = node.attributes(DATA_ID);
		const cardNode = transformCustomTags(
			`<card ${
				dataId ?? `${DATA_ID}="${dataId}"`
			} type="${type}" name="${name}" value="${encodeCardValue(
				value,
			)}"></card>`,
		);
		const readyCard = $(cardNode);
		node.before(readyCard);
		readyCard.append(node);
		return readyCard;
	}

	activate(
		node: NodeInterface,
		trigger?: CardActiveTrigger,
		event?: MouseEvent,
	) {
		const editor = this.editor;
		if (!isEngine(editor) || editor.readonly) return;
		//获取当前卡片所在编辑器的根节点
		const container = node.getRoot();
		const active = this.active;
		//如果当前编辑器根节点和引擎的根节点不匹配就不执行，主要是子父编辑器的情况
		if (!container.get() || editor.container.equal(container)) {
			let card = this.find(node);
			const editableElement = node.closest(EDITABLE_SELECTOR);
			if (!card && editableElement.length > 0) {
				const editableParent = editableElement.parent();
				card = editableParent ? this.find(editableParent) : undefined;
			}
			const blockCard = card ? this.findBlock(card.root) : undefined;
			if (blockCard) {
				card = blockCard;
			}
			if (card && card.isCursor(node)) {
				if (editableElement.length > 0) {
					const editableParent = editableElement.parent();
					card = editableParent
						? this.find(editableParent)
						: undefined;
				} else card = undefined;
			}
			const isCurrentActiveCard =
				card && active && active.root.equal(card.root);
			// 当前是卡片，但是与当前激活的卡片不一致，就取消当前的卡片激活状态
			if (active && !isCurrentActiveCard) {
				active.toolbarModel?.hide();
				active.select(false);
				active.activate(false);
			}
			if (card) {
				if (card.activatedByOther) return;
				if (!isCurrentActiveCard) {
					if (
						(card.constructor as CardEntry).singleSelectable !==
							false &&
						(trigger !== CardActiveTrigger.CLICK ||
							isEngine(editor))
					) {
						this.select(card, event);
					}
					if (
						!card.isEditable &&
						(card.constructor as CardEntry).autoSelected !== false
					)
						card.select(!card.isEditable);
					card.activate(true);
					card!.toolbarModel?.show(event);
				} else if (card.isEditable) {
					card.select(false);
				} else if (
					trigger === CardActiveTrigger.MOUSE_DOWN &&
					node.name !== 'input' &&
					card.root.find('.data-drag-image').length === 0
				) {
					event?.preventDefault();
				}
				editor.change.onSelect();
			}
		} else if (active) {
			active.toolbarModel?.hide();
			active.select(false);
			active.activate(false);
		}
	}

	select(card: CardInterface, event?: MouseEvent | KeyboardEvent) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		if (
			(card.constructor as CardEntry).singleSelectable !== false &&
			(card.type !== CardType.BLOCK || !card.activated)
		) {
			const range = editor.change.range.get().cloneRange();
			if (
				(range.startNode.closest(EDITABLE_SELECTOR).length > 0 &&
					(!event ||
						(event instanceof MouseEvent &&
							(!event.target ||
								!this.closest(
									event.target as Node,
									false,
								))))) ||
				card.isEditable ||
				card.isMaximize
			)
				return;
			// 重新设置光标，不加 preventDefault 会导致设置后失效
			event?.preventDefault();
			const root = card.root;
			const parentNode = root.parent()!;
			const index = parentNode
				.children()
				.toArray()
				.findIndex((child) => child.equal(root));
			range.setStart(parentNode, index);
			range.setEnd(parentNode, index + 1);
			editor.change.range.select(range);
		}
	}

	focus(card: CardInterface, toStart: boolean = false) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, container, scrollNode } = editor;
		const range = change.range.get();
		card.focus(range, toStart);
		change.range.select(range);
		this.activate(range.startNode, CardActiveTrigger.MOUSE_DOWN);
		change.onSelect();
		if (scrollNode) range.scrollIntoViewIfNeeded(container, scrollNode);
	}

	insert<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(name: string, value?: E, ...args: any) {
		const editor = this.editor;
		if (!isEngine(editor)) throw 'Engine not found';
		const component = this.create<E, T>(name, {
			value,
		});
		const change = editor.change;
		const range = change.range.toTrusty();
		const card = this.insertNode(range, component, ...args);
		change.change();
		return card;
	}

	update(
		selector: NodeInterface | Node | string,
		value: CardValue,
		...args: any
	) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const change = editor.change;
		const card = this.find(selector);
		if (card) {
			this.updateNode(card, value, ...args);
			const range = change.range.get();
			card.focus(range, false);
			change.change();
		}
	}

	replace<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(source: CardInterface, name: string, value?: E, ...args: any) {
		this.remove(source.root);
		return this.insert<E, T>(name, value, ...args);
	}

	remove(selector: NodeInterface | Node | string, hasModify: boolean = true) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, list, node } = editor;
		const range = change.range.get();
		const card = this.find(selector);
		if (!card) return;
		if (card.type === CardType.INLINE) {
			range.setEndAfter(card.root[0]);
			range.collapse(false);
		} else {
			this.focusPrevBlock(card, range, hasModify);
		}
		const parent = card.root.parent();
		this.removeNode(card);
		list.addBr(range.startNode);
		if (
			parent &&
			node.isEmpty(parent) &&
			!editor.model.mutation.isStopped
		) {
			if (parent.isEditable()) {
				node.html(parent, '<p><br /></p>');
				range.select(parent, true);
				range.shrinkToElementNode();
				range.collapse(false);
			} else {
				node.html(parent, '<br />');
				range.select(parent, true);
				range.collapse(false);
			}
		}
		if (hasModify) change.apply(range);
		else {
			// 远程移除时，如果调用 change.apply() 会把字符合并在一起，这样就会少一个text节点，后续的ops命令无法找到节点删除
			change.range.select(range);
			change.change();
		}
	}

	removeRemote(selector: NodeInterface | Node | string) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { node } = editor;
		const card = this.find(selector);
		if (!card) return;

		const parent = card.root.parent();
		this.removeNode(card);
		if (
			parent &&
			node.isEmpty(parent) &&
			!editor.model.mutation.isStopped
		) {
			if (parent.isEditable()) {
				node.html(parent, '<p><br /></p>');
			} else {
				node.html(parent, '<br />');
			}
		}
	}

	// 创建Card DOM 节点
	create<
		E extends CardValue = {},
		T extends CardInterface<E> = CardInterface<E>,
	>(
		name: string,
		options?: {
			value?: E;
			root?: NodeInterface;
		},
	): T {
		const clazz = this.classes[name];
		if (!clazz) throw ''.concat(name, ': This card does not exist');
		const type = options?.value?.type || clazz.cardType;
		if (['inline', 'block'].indexOf(type) < 0) {
			throw ''.concat(
				name,
				': the type of card must be "inline", "block"',
			);
		}
		if (options?.root) options.root.empty();
		const editor = this.editor;
		const component = new clazz({
			editor,
			value: options?.value,
			root: options?.root,
		}) as T;
		const root = component.root;
		root.attributes(CARD_TYPE_KEY, type);
		root.attributes(CARD_KEY, name);
		root.attributes(CARD_LOADING_KEY, 'true');

		const tagName = type === CardType.INLINE ? 'span' : 'div';
		//center
		const center = $(
			`<${tagName} ${
				component.isEditable ? DATA_TRANSIENT_ATTRIBUTES + "='*'" : ''
			}/>`,
		);
		center.attributes(CARD_ELEMENT_KEY, 'center');

		//body
		const body = $(
			'<'.concat(tagName, ' ').concat(CARD_ELEMENT_KEY, '="body" />'),
		);
		// center
		body.append(center);
		root.append(body);
		//可以聚焦的情况下，card左右两边添加光标位置
		this.createCursor(component);
		if (type === CardType.BLOCK) {
			editor.nodeId.generate(component.root);
		}
		component.init();
		return component;
	}

	createCursor(component: CardInterface) {
		const editor = this.editor;
		const cardClazz = component.constructor as CardEntry;
		const hasFocus =
			cardClazz.focus !== undefined
				? cardClazz.focus
				: isEngine(editor) && !editor.readonly;
		const center = component.getCenter();
		center.removeAttributes(DATA_CONTENTEDITABLE_KEY);
		const root = component.root;
		root.removeAttributes(DATA_CONTENTEDITABLE_KEY);
		const left = component.findByKey('left');
		const right = component.findByKey('right');
		if (hasFocus) {
			center.attributes(DATA_CONTENTEDITABLE_KEY, 'false');
			if (!left) {
				center.before(
					$(
						`<span ${CARD_ELEMENT_KEY}="left" ${DATA_TRANSIENT_ELEMENT}="true">&#8203;</span>`,
					),
				);
			}
			if (!right) {
				center.after(
					$(
						`<span ${CARD_ELEMENT_KEY}="right" ${DATA_TRANSIENT_ELEMENT}="true">&#8203;</span>`,
					),
				);
			}
		} else {
			left?.remove();
			right?.remove();
			root.attributes(DATA_CONTENTEDITABLE_KEY, 'false');
		}
	}

	reRender(...cards: Array<CardInterface>) {
		if (cards.length === 0) cards = this.components;
		cards.forEach((card) => {
			if (card.destroy) card.destroy();
			this.createCursor(card);
			card.init();
			this.renderComponent(card);
		});
	}

	/**
	 * 渲染
	 * @param container 需要重新渲染包含卡片的节点，如果不传，则渲染全部待创建的卡片节点
	 * @param callback 渲染完成后回调
	 * @param lazyRender 是否懒渲染，默认取决于editor的lazyRender属性
	 */
	render(
		container?: NodeInterface,
		callback?: (count: number) => void,
		lazyRender = this.lazyRender,
	) {
		const cards = container
			? container.isCard()
				? container
				: container.find(`${READY_CARD_SELECTOR}`)
			: this.editor.container.find(READY_CARD_SELECTOR);
		this.gc();

		const asyncRenderCards: Array<CardInterface> = [];
		const readyCards: NodeInterface[] = [];
		const allCards = cards.toArray();
		// 卡片内的子节点卡片移除
		allCards.forEach((cardNode) => {
			if (!readyCards.find((node) => node.equal(cardNode))) {
				readyCards.push(cardNode);
			}
			const childCards = cardNode
				.find(`${CARD_SELECTOR},${READY_CARD_SELECTOR}`)
				.toArray();
			childCards.forEach((childCard) => {
				if (childCard.equal(cardNode)) return;
				const index = readyCards.findIndex((node) =>
					node.equal(childCard),
				);
				if (index > -1) {
					readyCards.splice(index, 1);
				}
			});
		});
		readyCards.forEach((cardNode) => {
			const attributes = cardNode.attributes();
			const readyKey = attributes[READY_CARD_KEY];
			const key = attributes[CARD_KEY];
			const name = readyKey || key;
			if (this.classes[name]) {
				const value = attributes[CARD_VALUE_KEY];

				let card: CardInterface | undefined;
				if (key) {
					card = this.find(cardNode);
					if (card && card.root.equal(cardNode)) {
						if (card.destroy) card.destroy();
						this.removeComponent(card);
					}
					cardNode.attributes(CARD_LOADING_KEY, 'true');
					attributes[CARD_LOADING_KEY] = 'true';
					cardNode.empty();
				}
				//ready_card_key 待创建的需要重新生成节点，并替换当前待创建节点
				card = this.create(name, {
					value: decodeCardValue(value),
					root: key ? cardNode : undefined,
				});
				Object.keys(attributes).forEach((attributesName) => {
					if (
						(attributesName.indexOf('data-') === 0 &&
							attributesName.indexOf('data-card') !== 0) ||
						attributesName === CARD_LOADING_KEY
					) {
						card!.root.attributes(
							attributesName,
							attributes[attributesName],
						);
					}
				});
				if (readyKey) {
					cardNode.replaceWith(card.root);
					cardNode.remove();
				}
				this.components.push(card);

				// 重新渲染
				asyncRenderCards.push(card);

				if (readyKey) {
					card.root.removeAttributes(READY_CARD_KEY);
				}
			}
		});
		let isTriggerRenderAsync = false;
		asyncRenderCards.forEach((card) => {
			// 可编辑卡片不进行异步渲染
			if (
				lazyRender &&
				(card.constructor as CardEntry).lazyRender &&
				!card.isEditable
			) {
				if (card.beforeRender) {
					const result = card.beforeRender();
					const center = card.getCenter();
					if (result !== undefined) {
						center.append(
							typeof result === 'string' ? $(result) : result,
						);
					}
				}
				isTriggerRenderAsync = true;
				this.asyncComponents.push(card);
			} else {
				this.renderComponent(card);
			}
		});
		if (callback) callback(asyncRenderCards.length);
		if (isTriggerRenderAsync) {
			// 触发当前在视图内的卡片渲染
			this.renderAsyncComponents();
		}
	}

	renderComponent(card: CardInterface, ...args: any) {
		const editor = this.editor;
		const center = card.getCenter();
		const result = card.render(...args);
		if (result !== undefined) {
			center.append(typeof result === 'string' ? $(result) : result);
		}
		if (card.contenteditable.length > 0) {
			const contenteditable =
				!isEngine(editor) || editor.readonly ? 'false' : 'true';
			center.find(card.contenteditable.join(',')).each((node) => {
				const child = $(node);
				if (
					child.attributes(DATA_CONTENTEDITABLE_KEY) !==
					contenteditable
				)
					child.attributes(DATA_CONTENTEDITABLE_KEY, contenteditable);
				if (child.attributes(DATA_ELEMENT) !== EDITABLE)
					child.attributes(DATA_ELEMENT, EDITABLE);
				if (isEngine(editor)) {
					editor.normalize(child);
				}
			});
			this.render(center);
		}
		card.didRender();
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

	destroy() {
		this.gc();
		const editor = this.editor;
		window.removeEventListener('resize', this.renderAsyncComponents);
		editor.scrollNode
			?.get<HTMLElement>()
			?.removeEventListener('scroll', this.renderAsyncComponents);
		window.removeEventListener('scroll', this.renderAsyncComponents);
		editor.off('card:async-render', this.renderAsyncComponents);
	}

	// 焦点移动到上一个 Block
	focusPrevBlock(
		card: CardInterface,
		range: RangeInterface,
		hasModify: boolean,
	) {
		const editor = this.editor;
		if (!isEngine(editor)) throw 'Engine not initialized';
		let prevBlock;
		if (card.type === 'inline') {
			const block = editor.block.closest(card.root);
			if (block.isEditable()) {
				prevBlock = card.root.prevElement();
			} else {
				prevBlock = block.prevElement();
			}
		} else {
			prevBlock = card.root.prevElement();
		}

		if (hasModify) {
			if (!prevBlock || prevBlock.attributes(CARD_KEY)) {
				const _block = $('<p><br /></p>');
				card.root.before(_block);
				range.select(_block, true);
				range.collapse(false);
				editor.nodeId.generate(_block);
				return;
			}
		} else {
			if (!prevBlock) {
				return;
			}

			if (prevBlock.attributes(CARD_KEY)) {
				editor.card.find(prevBlock)?.focus(range, false);
				return;
			}
		}

		range
			.select(prevBlock, true)
			.shrinkToElementNode()
			.shrinkToTextNode()
			.collapse(false);
	}
	// 焦点移动到下一个 Block
	focusNextBlock(
		card: CardInterface,
		range: RangeInterface,
		hasModify: boolean,
	) {
		const editor = this.editor;
		if (!isEngine(editor)) throw 'Engine not initialized';
		let nextBlock;
		if (card.type === 'inline') {
			const block = editor.block.closest(card.root);

			if (block.isEditable()) {
				nextBlock = card.root.nextElement();
			} else {
				nextBlock = block.nextElement();
			}
		} else {
			nextBlock = card.root.nextElement();
		}

		if (hasModify) {
			if (!nextBlock || nextBlock.attributes(CARD_KEY)) {
				const _block = $('<p><br /></p>');
				card.root.after(_block);
				range.select(_block, true);
				range.collapse(false);
				editor.nodeId.generate(_block);
				return;
			}
		} else {
			if (!nextBlock) {
				return;
			}

			if (nextBlock.attributes(CARD_KEY)) {
				editor.card.find(nextBlock)?.focus(range, true);
				return;
			}
		}

		range
			.select(nextBlock, true)
			.shrinkToElementNode()
			.shrinkToTextNode()
			.collapse(true);
	}
}

export default CardModel;
