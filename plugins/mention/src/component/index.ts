import {
	$,
	Card,
	isEngine,
	NodeInterface,
	isHotkey,
	CardType,
	isServer,
	Position,
	DATA_ELEMENT,
	UI,
	CardInterface,
} from '@aomao/engine';
import CollapseComponent, { CollapseComponentInterface } from './collapse';
import { MentionItem } from '../types';
import './index.css';

export type MentionValue = {
	key?: string;
	name?: string;
};

class Mention extends Card<MentionValue> {
	private component?: CollapseComponentInterface;
	#container?: NodeInterface;
	#keyword?: NodeInterface;
	#placeholder?: NodeInterface;
	#position?: Position;
	#showTimeout?: NodeJS.Timeout;
	#hideTimeout?: NodeJS.Timeout;
	#enterLayout?: NodeInterface;

	static get cardName() {
		return 'mention';
	}

	static get cardType() {
		return CardType.INLINE;
	}

	static get autoSelected() {
		return false;
	}

	/**
	 * 默认数据
	 */
	static defaultData?: Array<MentionItem>;

	/**
	 * 查询
	 * @param keyword 关键字
	 * @returns
	 */
	static search(keyword: string) {
		return new Promise<Array<MentionItem>>((resolve) => {
			resolve([]);
		});
	}

	/**
	 * 单击
	 * @param key
	 * @param name
	 */
	static itemClick?: (
		node: NodeInterface,
		data: { [key: string]: string },
	) => void;

	/**
	 * 鼠标移入
	 * @param node
	 * @param key
	 * @param name
	 */
	static mouseEnter?: (
		node: NodeInterface,
		data: { [key: string]: string },
	) => void;

	/**
	 * 自定义渲染列表
	 * @param root 根节点
	 */
	static set render(
		fun: (
			root: NodeInterface,
			data: MentionItem[],
			bindItem: (
				node: NodeInterface,
				data: { [key: string]: string },
			) => NodeInterface,
		) => Promise<string | NodeInterface | void>,
	) {
		CollapseComponent.render = fun;
	}

	static onSelect?: (data: {
		[key: string]: string;
	}) => void | { [key: string]: string };

	static onInsert?: (card: CardInterface) => void;

	/**
	 * 自定义渲染列表项
	 * @param item 数据项
	 */
	static set renderItem(
		fun: (
			item: MentionItem,
			root: NodeInterface,
		) => string | NodeInterface | void,
	) {
		CollapseComponent.renderItem = fun;
	}

	static renderLoading?: (
		root: NodeInterface,
	) => string | NodeInterface | void;

	static set renderEmpty(
		fun: (root: NodeInterface) => string | NodeInterface | void,
	) {
		CollapseComponent.renderEmpty = fun;
	}

	init() {
		if (!this.#position) this.#position = new Position(this.editor);
		if (!isEngine(this.editor) || isServer) {
			return;
		}
		super.init();
		if (this.component) return;
		this.component = new CollapseComponent(this.editor, {
			onCancel: () => {
				this.changeToText();
			},
			onSelect: (_, data: { [key: string]: string }) => {
				let newValue =
					this.editor.trigger('mention:select', data) || {};
				delete newValue['id'];
				if (Mention.onSelect) {
					newValue = Mention.onSelect(data) || {};
					delete newValue['id'];
				}
				const { card } = this.editor;
				this.component?.remove();
				this.component = undefined;
				this.#keyword?.remove();
				card.focus(this, false);
				const component = card.insert(Mention.cardName, {
					...data,
					...newValue,
				});
				card.removeNode(this);
				this.editor.trigger('mention:insert', component);
				if (Mention.onInsert) Mention.onInsert(component);
			},
		});
	}

	remove() {
		if (!isEngine(this.editor)) return;
		this.component?.remove();
		this.#keyword?.remove();
		this.editor.card.remove(this.id);
	}

	changeToText() {
		if (!this.root.inEditor() || !isEngine(this.editor)) {
			return;
		}

		const content = this.#keyword?.get<HTMLElement>()?.innerText || '';
		this.remove();
		this.editor.node.insertText(content);
	}

	activate(activated: boolean) {
		super.activate(activated);
		if (!activated && this.#keyword && this.#keyword.length > 0) {
			this.component?.unbindEvents();
			this.changeToText();
		}
	}

	handleInput() {
		if (!isEngine(this.editor)) return;
		const { change, card } = this.editor;
		if (change.isComposing()) {
			return;
		}
		const content =
			this.#keyword
				?.get<HTMLElement>()
				?.innerText.replace(/[\r\n]/g, '') || '';
		// 内容为空
		if (content === '') {
			this.component?.remove();
			card.remove(this.id);
			return;
		}

		const keyword = content.substr(1);
		// 搜索关键词为空
		const defaultData =
			this.editor.trigger('mention:default') || Mention.defaultData;
		if (keyword === '' && defaultData) {
			this.component?.render(this.root, defaultData);
			return;
		}
		//if (Mention.renderLoading) {
		CollapseComponent.renderLoading = Mention.renderLoading;
		this.component?.render(this.root, []);
		CollapseComponent.renderLoading = undefined;
		//}
		Mention.search(keyword).then((data) => {
			this.component?.render(this.root, data);
		});
	}

	resetPlaceHolder() {
		if ('@' === this.#keyword?.get<HTMLElement>()?.innerText)
			this.#placeholder?.show();
		else this.#placeholder?.hide();
	}

	hideEnter = () => {
		this.#hideTimeout = setTimeout(() => {
			this.#position?.destroy();
			this.#enterLayout?.remove();
		}, 200);
	};

	showEnter = () => {
		if (!this.#container || !Mention.mouseEnter) return;
		const value = this.getValue();
		if (!value?.name) return;
		const { id, key, name, ...info } = value;
		if (this.#hideTimeout) clearTimeout(this.#hideTimeout);
		if (this.#showTimeout) clearTimeout(this.#showTimeout);
		if (this.#enterLayout && this.#enterLayout.length > 0) return;
		this.#showTimeout = setTimeout(() => {
			if (!this.#container) return;
			this.#enterLayout = $(
				`<div class="data-mention-hover-layout" ${DATA_ELEMENT}="${UI}"></div>`,
			);
			this.#enterLayout.on('mouseenter', () => {
				if (this.#hideTimeout) clearTimeout(this.#hideTimeout);
			});
			this.#enterLayout.on('mouseleave', this.hideEnter);
			this.editor.trigger('mention:enter', this.#enterLayout, {
				key: unescape(key || ''),
				name: unescape(name),
				...info,
			});
			Mention.mouseEnter!(this.#enterLayout, {
				key: unescape(key || ''),
				name: unescape(name),
				...info,
			});

			setTimeout(() => {
				this.#position?.bind(this.#enterLayout!, this.#container!);
			}, 10);
		}, 200);
	};

	render(): string | void | NodeInterface {
		const value = this.getValue();
		// 有值的情况、展示模式
		if (value?.name && !this.#container) {
			const { id, key, name, ...info } = value;
			this.#container = $(
				`<span class="data-mention-component">@${unescape(
					name,
				)}</span>`,
			);

			this.#container.on('click', () => {
				if (!this.#container) return;
				this.editor.trigger('mention:item-click', this.#container, {
					key: unescape(key || ''),
					name: unescape(name),
					...info,
				});
				if (Mention.itemClick)
					Mention.itemClick(this.#container, {
						key: unescape(key || ''),
						name: unescape(name),
						...info,
					});
			});

			this.#container.on('mouseenter', this.showEnter);
			this.#container.on('mouseleave', this.hideEnter);
		} else if (this.#container) {
			return;
		}

		// 不是引擎，阅读模式
		if (!isEngine(this.editor)) {
			return this.#container;
		}
		const language = this.editor.language.get('mention');
		let timeout: NodeJS.Timeout | undefined = undefined;
		// 没有值的情况下，弹出下拉框编辑模式
		if (!this.#container) {
			this.#container = $(
				`<span class="data-mention-component-keyword data-mention-component" contenteditable="true">@</span><span class="data-mention-component-placeholder">${language['placeholder']}</span>`,
			);
			this.#keyword = this.#container.eq(0);
			this.#placeholder = this.#container.eq(1);
			// 监听输入事件
			this.#keyword?.on('keydown', (e) => {
				if (isHotkey('enter', e)) {
					e.preventDefault();
				}
			});
			const renderTime = Date.now();
			this.#keyword?.on('input', () => {
				this.resetPlaceHolder();
				// 在 Windows 上使用中文输入法，在 keydown 事件里无法阻止用户的输入，所以在这里删除用户的输入
				if (Date.now() - renderTime < 200) {
					const textNode = this.#keyword?.first();
					if (
						textNode &&
						textNode.isText() &&
						textNode[0].nodeValue === '@@'
					) {
						const text = textNode.get<Text>()?.splitText(1);
						text?.remove();
					}
				}
				if (timeout) clearTimeout(timeout);
				timeout = setTimeout(() => {
					this.handleInput();
				}, 100);
			});
			this.getCenter().append(this.#container);
			setTimeout(() => {
				if (isEngine(this.editor)) {
					const range = this.editor.change.range.get();
					range.select(this.#keyword!, true).collapse(false);
					const selection = window.getSelection();
					selection?.removeAllRanges();
					selection?.addRange(range.toRange());
				}
			}, 10);
			this.component?.render(
				this.root,
				this.editor.trigger('mention:default') ||
					Mention.defaultData ||
					[],
			);
			if (
				!(Mention.defaultData
					? Mention.defaultData
					: this.editor.trigger('mention:default'))
			) {
				setTimeout(() => {
					this.handleInput();
				}, 50);
			}
		}
		// 可编辑下，展示模式
		else {
			this.component?.remove();
			return this.#container;
		}
	}

	destroy() {
		this.component?.remove();
		this.#position?.destroy();
	}
}

export default Mention;
