import {
	$,
	Card,
	isEngine,
	NodeInterface,
	escape,
	isHotkey,
	CardType,
	isServer,
} from '@aomao/engine';
import CollapseComponent, { CollapseComponentInterface } from './collapse';
import { MentionItem } from '../types';
import './index.css';

export type MentionValue = {
	key?: string;
	name?: string;
};

class Mention extends Card<MentionValue> {
	#container?: NodeInterface;
	#keyword?: NodeInterface;
	#placeholder?: NodeInterface;
	private component?: CollapseComponentInterface;

	static get cardName() {
		return 'mention';
	}

	static get cardType() {
		return CardType.INLINE;
	}

	static get singleSelectable() {
		return false;
	}

	/**
	 * 默认数据
	 */
	static defaultData: Array<MentionItem> = [];

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
	static itemClick(node: NodeInterface, key: string, name: string) {}

	/**
	 * 鼠标移入
	 * @param node
	 * @param key
	 * @param name
	 */
	static mouseEnter(node: NodeInterface, key: string, name: string) {}

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
				name: string,
				key?: string,
			) => NodeInterface,
		) => Promise<string | NodeInterface | void>,
	) {
		CollapseComponent.render = fun;
	}

	static onSelect?: (
		key: string,
		name: string,
	) => void | { [key: string]: string };

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
		if (!isEngine(this.editor) || isServer) {
			return;
		}
		this.component = new CollapseComponent(this.editor, {
			onCancel: () => {
				this.changeToText();
			},
			onSelect: (_, key, name) => {
				let newValue = {};
				if (Mention.onSelect) {
					newValue = Mention.onSelect(key, name) || {};
					delete newValue['id'];
				}
				const { card } = this.editor;
				this.component?.remove();
				this.component = undefined;
				card.focus(this, false);
				const newCard = card.insert(Mention.cardName, {
					key,
					name,
					...newValue,
				});
				setTimeout(() => {
					card.focus(newCard, false);
				}, 20);
				card.removeNode(this);
			},
		});
	}

	remove() {
		if (!isEngine(this.editor)) return;
		this.component?.remove();
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

	destroy() {
		this.component?.remove();
	}

	activate(activated: boolean) {
		super.activate(activated);
		if (!activated && this.component) {
			this.component.unbindEvents();
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
				?.innerText.replaceAll(/[\r\n]/g, '') || '';
		// 内容为空
		if (content === '') {
			this.component?.remove();
			card.remove(this.id);
			return;
		}

		const keyword = content.substr(1);
		// 搜索关键词为空
		if (keyword === '') {
			this.component?.render(this.root, Mention.defaultData);
			return;
		}
		if (Mention.renderLoading) {
			CollapseComponent.renderLoading = Mention.renderLoading;
			this.component?.render(this.root, []);
			CollapseComponent.renderLoading = undefined;
		}
		Mention.search(keyword).then((data) => {
			this.component?.render(this.root, data);
		});
	}

	resetPlaceHolder() {
		if ('@' === this.#keyword?.get<HTMLElement>()?.innerText)
			this.#placeholder?.show();
		else this.#placeholder?.hide();
	}

	render(): string | void | NodeInterface {
		const value = this.getValue();
		if (value?.name) {
			const { key, name } = value;
			this.#container = $(
				`<span class="data-mention-component">@${unescape(
					name,
				)}</span>`,
			);
			this.#container.on('click', () => {
				Mention.itemClick(
					this.#container!,
					unescape(key || ''),
					unescape(name),
				);
			});
			this.#container.on('mouseenter', () => {
				if (!this.#container) return;
				Mention.mouseEnter(
					this.#container,
					unescape(key || ''),
					unescape(name),
				);
			});
		}

		//阅读模式
		if (!isEngine(this.editor)) {
			return this.#container;
		}
		const language = this.editor.language.get('mention');
		let timeout: NodeJS.Timeout | undefined = undefined;
		//编辑模式
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
				if (Date.now() - renderTime < 100) {
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
			this.component?.render(this.root, Mention.defaultData);
		} else {
			this.component = undefined;
			return this.#container;
		}
	}
}

export default Mention;
