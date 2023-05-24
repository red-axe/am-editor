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
	SelectStyleType,
	CardValue,
	unescape,
	AjaxInterface,
	DATA_CONTENTEDITABLE_KEY,
	ToolbarItemOptions,
	CardToolbarItemOptions,
} from '@aomao/engine';
import CollapseComponent, { CollapseComponentInterface } from './collapse';
import { MentionItem } from '../types';
import './index.css';
import { MentionOptions } from '../types';
export interface MentionValue extends CardValue {
	key?: string;
	name?: string;
	marks?: string[];
}

class Mention<T extends MentionValue = MentionValue> extends Card<T> {
	protected component?: CollapseComponentInterface;
	#container?: NodeInterface;
	#keyword?: NodeInterface;
	#placeholder?: NodeInterface;
	#position?: Position;
	#showTimeout?: NodeJS.Timeout;
	#hideTimeout?: NodeJS.Timeout;
	#enterLayout?: NodeInterface;
	#request?: AjaxInterface;

	static get cardName() {
		return 'mention';
	}

	static get cardType() {
		return CardType.INLINE;
	}

	static get autoSelected() {
		return false;
	}

	static get selectStyleType() {
		return SelectStyleType.NONE;
	}

	getMaxWidth = () => {
		const block = this.editor.block.closest(this.root);
		return block.get<Element>()!.clientWidth - 4;
	};

	onWindowResize = () => {
		this.updateMaxWidth();
	};

	updateMaxWidth = () => {
		const maxWidth = this.getMaxWidth();
		this.#container?.css('max-width', Math.max(maxWidth, 0) + 'px');
	};

	getPluginOptions = () => {
		const mentionOptions =
			this.editor.plugin.findPlugin<MentionOptions>('mention');
		return mentionOptions?.options;
	};

	search = (keyword: string): Promise<MentionItem[]> => {
		const options = this.getPluginOptions();
		const editor = this.editor;
		if (options && options.onSearch) return options.onSearch(keyword);
		const reuslt = editor.trigger('mention:search', keyword);
		if (reuslt !== undefined) return reuslt;
		const { request } = editor;
		return new Promise((resolve) => {
			if (options?.action) {
				const { type, contentType, parse, headers } = options;
				this.#request?.abort();
				this.#request = request.ajax({
					url: options.action,
					contentType: contentType || '',
					type: type === undefined ? 'json' : type,
					data: {
						keyword,
					},
					headers,
					success: (response: any) => {
						const { result, data } = parse
							? parse(response)
							: response;
						if (!result) return;
						resolve(data);
					},
					method: 'GET',
				});
			} else resolve([]);
		});
	};

	init() {
		const editor = this.editor;
		if (!this.#position) this.#position = new Position(editor);
		if (!isEngine(editor) || isServer) {
			return;
		}
		super.init();
		if (this.component) return;
		const options = this.getPluginOptions();
		this.component = new CollapseComponent(editor, {
			onCancel: () => {
				this.changeToText();
			},
			onSelect: (_, data: { [key: string]: string }) => {
				let newValue = editor.trigger('mention:select', data) || {};
				delete newValue['id'];
				if (options?.onSelect) {
					newValue = options.onSelect(data) || {};
					delete newValue['id'];
				}
				const { card } = editor;
				const value = this.getValue();
				this.component?.remove();
				this.component = undefined;
				this.#keyword?.remove();
				card.focus(this, false);
				const component = card.insert<MentionValue>(Mention.cardName, {
					...data,
					marks: value.marks,
					...newValue,
				});
				card.removeNode(this);
				editor.trigger('mention:insert', component);
				if (options?.onInsert) options.onInsert(component);
				if (isEngine(editor)) {
					const { change } = editor;
					const range = change.range.get().cloneRange();
					range.setStartAfter(component.root.get()!);
					range.collapse(true);
					change.range.select(range);
				} else {
					card.focus(component, false);
				}
			},
		});
	}

	remove() {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		this.component?.remove();
		this.#keyword?.remove();
		editor.card.remove(this.id);
	}

	changeToText() {
		const editor = this.editor;
		if (!this.root.inEditor() || !isEngine(editor)) {
			return;
		}

		const content = this.#keyword?.get<HTMLElement>()?.innerText || '';
		this.remove();
		editor.node.insertText(content);
	}

	activate(activated: boolean) {
		super.activate(activated);
		if (!activated && this.#keyword && this.#keyword.length > 0) {
			this.component?.unbindEvents();
			this.changeToText();
		}
	}

	handleInput() {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, card } = editor;
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
			editor.trigger<MentionItem[]>('mention:default') ||
			this.getPluginOptions()?.defaultData;
		if (keyword === '' && defaultData) {
			this.component?.render(this.root, defaultData);
			return;
		}

		this.component?.render(this.root, true);

		const reuslt = editor.trigger('mention:search', keyword);
		if (reuslt !== undefined) {
			reuslt;
		}
		this.search(keyword).then((data) => {
			this.component?.render(this.root, data);
		});
	}

	resetPlaceHolder() {
		if ('@' === this.#keyword?.get<HTMLElement>()?.innerText)
			this.#placeholder?.css('visibility', 'visible');
		else this.#placeholder?.css('visibility', 'hidden');
	}

	hideEnter = () => {
		this.#hideTimeout = setTimeout(() => {
			this.#position?.destroy();
			this.#enterLayout?.remove();
		}, 200);
	};

	showEnter = () => {
		const options = this.getPluginOptions();
		if (!this.#container || !options?.onMouseEnter) return;
		const value = this.getValue();
		if (!value?.name) return;
		const { id, key, name, marks, type, ...info } = value;
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
			options.onMouseEnter!(this.#enterLayout, {
				key: unescape(key || ''),
				name: unescape(name),
				...info,
			});

			setTimeout(() => {
				this.#position?.bind(this.#enterLayout!, this.#container!);
			}, 10);
		}, 200);
	};

	executeMark(mark?: NodeInterface, warp?: boolean) {
		if (!this.#container) return;
		const markApi = this.editor.mark;
		const children = this.#container.children();
		if (!mark) {
			// 移除所有标记
			markApi.unwrapByNodes(this.queryMarks(false));
			this.setValue({
				marks: [] as string[],
			} as T);
		} else if (warp) {
			// 增加标记
			children.each((_, index) => {
				const child = children.eq(index);
				if (child) markApi.wrapByNode(child, mark);
			});
			const marks = this.queryMarks().map(
				(child) => child.clone().get<HTMLElement>()?.outerHTML || '',
			);
			this.setValue({
				marks,
			} as T);
		} else {
			// 移除标记
			markApi.unwrapByNodes(this.queryMarks(false), mark);
			const marks = this.queryMarks().map(
				(child) => child.get<HTMLElement>()?.outerHTML || '',
			);
			this.setValue({
				marks,
			} as T);
		}
	}

	queryMarks(clone: boolean = true) {
		if (!this.#container) return [];
		return this.#container
			.allChildren()
			.filter(
				(child) => child.isElement() && this.editor.node.isMark(child),
			)
			.map((c) => (clone ? c.clone() : c));
	}

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
		const options =
			this.editor.plugin.findPlugin<MentionOptions>('mention')?.options;
		if (options?.cardToolbars) {
			return options.cardToolbars([], this.editor);
		}
		return [];
	}

	render(): string | void | NodeInterface {
		const value = this.getValue();
		const editor = this.editor;
		// 有值的情况、展示模式
		if (value?.name && !this.#container) {
			const { id, key, name, ...info } = value;
			this.#container = $(
				`<span class="data-mention-component">@${unescape(
					name,
				)}</span>`,
			);
			(value.marks || []).forEach((mark) => {
				this.executeMark($(mark), true);
			});
			this.#container.on('click', () => {
				if (!this.#container) return;

				editor.trigger('mention:item-click', this.#container, {
					key: unescape(key || ''),
					name: unescape(name),
					...info,
				});
				if (options?.itemClick)
					options?.itemClick(this.#container, {
						key: unescape(key || ''),
						name: unescape(name),
						...info,
					});
			});

			this.#container.on('mouseenter', this.showEnter);
			this.#container.on('mouseleave', this.hideEnter);
		} else if (this.#container) {
			if (value) {
				this.#container.html(`@${unescape(value.name || '')}`);
				(value?.marks || []).forEach((mark) => {
					this.executeMark($(mark), true);
				});
			}
			return;
		}

		// 不是引擎，阅读模式
		if (!isEngine(editor)) {
			return this.#container;
		}
		const language = editor.language.get('mention');
		let timeout: NodeJS.Timeout | undefined = undefined;
		const options = this.getPluginOptions();
		// 没有值的情况下，弹出下拉框编辑模式
		if (!this.#container) {
			this.#container = $(
				`<span class="data-mention-component-keyword data-mention-component" ${DATA_CONTENTEDITABLE_KEY}="true">@</span><span class="data-mention-component-placeholder">${language['placeholder']}</span>`,
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
					const textNode = this.#keyword
						?.allChildren()
						.find((child) => child.isText());
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
				if (isEngine(editor)) {
					const range = editor.change.range.get();
					this.#keyword = this.#container?.eq(0);
					range.select(this.#keyword!, true).collapse(false);
					const selection = window.getSelection();
					selection?.removeAllRanges();
					selection?.addRange(range.toRange());
				}
			}, 10);
			if (
				!(options?.defaultData
					? options?.defaultData
					: editor.trigger('mention:default'))
			) {
				setTimeout(() => {
					this.handleInput();
				}, 50);
			} else {
				this.component?.render(
					this.root,
					editor.trigger('mention:default') ||
						options?.defaultData ||
						[],
				);
			}
		}
		// 可编辑下，展示模式
		else {
			this.component?.remove();
			return this.#container;
		}
	}

	didRender(): void {
		super.didRender();
		this.updateMaxWidth();
		window.addEventListener('resize', this.onWindowResize);
		this.editor.on('editor:resize', this.onWindowResize);
	}

	destroy() {
		this.component?.remove();
		this.#position?.destroy();
		window.removeEventListener('resize', this.onWindowResize);
		this.editor.off('editor:resize', this.onWindowResize);
	}
}

export default Mention;
