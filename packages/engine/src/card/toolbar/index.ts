import Toolbar, { Tooltip } from '../../toolbar';
import type {
	EditorInterface,
	CardEntry,
	CardInterface,
	CardToolbarInterface,
	CardToolbarItemOptions,
	ToolbarItemOptions,
	ToolbarInterface as ToolbarBaseInterface,
	NodeInterface,
} from '../../types';
import {
	DATA_CONTENTEDITABLE_KEY,
	DATA_ELEMENT,
	TRIGGER_CARD_ID,
	UI,
} from '../../constants';
import { $ } from '../../node';
import { isEngine, isMobile } from '../../utils';
import Position from '../../position';
import placements from '../../position/placements';
import './index.css';

export const isCardToolbarItemOptions = (
	item: ToolbarItemOptions | CardToolbarItemOptions,
): item is CardToolbarItemOptions => {
	return (
		['button', 'input', 'dropdown', 'node', 'switch'].indexOf(item.type) ===
		-1
	);
};

class CardToolbar implements CardToolbarInterface {
	private card: CardInterface;
	private toolbar?: ToolbarBaseInterface;
	private editor: EditorInterface;
	private offset?: Array<number>;
	private position: Position;
	private dndPosition: Position;
	#hideTimeout: NodeJS.Timeout | null = null;
	#showTimeout: NodeJS.Timeout | null = null;
	#defaultAlign: keyof typeof placements = 'topLeft';
	#dndNode: NodeInterface | null = null;

	constructor(editor: EditorInterface, card: CardInterface) {
		this.editor = editor;
		this.card = card;
		this.position = new Position(editor);
		this.dndPosition = new Position(editor);
		this.unbindEnterShow();
		if (!isEngine(editor) || editor.readonly) {
			this.bindEnterShow();
		}
	}

	setDefaultAlign(align: keyof typeof placements) {
		this.#defaultAlign = align;
	}

	clearHide = () => {
		if (this.#hideTimeout) clearTimeout(this.#hideTimeout);
		this.#hideTimeout = null;
	};

	clearShow = () => {
		if (this.#showTimeout) clearTimeout(this.#showTimeout);
		this.#showTimeout = null;
	};

	enterHide = () => {
		this.clearShow();
		this.#hideTimeout = setTimeout(() => {
			this.hide();
			this.#hideTimeout = null;
			const toolbar = this.toolbar;
			toolbar?.root?.off('mouseenter', this.clearHide);
			toolbar?.root?.off('mouseleave', this.enterHide);
		}, 200);
	};

	enterShow = () => {
		this.clearHide();
		this.#showTimeout = setTimeout(() => {
			this.#showTimeout = null;
			this.show();
			const toolbar = this.toolbar;
			toolbar?.root?.on('mouseenter', this.clearHide);
			toolbar?.root?.on('mouseleave', this.enterHide);
		}, 200);
	};

	bindEnterShow() {
		this.card.root.on('mouseenter', this.enterShow);
		this.card.root.on('mouseleave', this.enterHide);
	}

	unbindEnterShow() {
		this.card.root.off('mouseenter', this.enterShow);
		this.card.root.off('mouseleave', this.enterHide);
	}

	/**
	 * 设置工具栏偏移量[上x，上y，下x，下y]
	 * @param offset 偏移量 [tx,ty,bx,by]
	 */
	setOffset(offset: Array<number>) {
		this.offset = offset;
	}

	getContainer() {
		return this.toolbar?.root;
	}

	getDefaultItem(
		item: CardToolbarItemOptions,
	): ToolbarItemOptions | undefined {
		const editor = this.editor;
		const { language, clipboard, card } = editor;
		switch (item.type) {
			case 'separator':
				return {
					key: 'separator',
					type: 'node',
					node:
						item.node ||
						$(`<span class="data-toolbar-item-split"></span>`),
				};
			case 'copy':
				return {
					key: 'copy',
					type: 'button',
					content:
						item.content ||
						`<span class="data-icon data-icon-copy"></span>`,
					title: item.title || language.get<string>('copy', 'title'),
					onClick: (e, node) => {
						if (item.onClick) {
							item.onClick(e, node);
							return;
						}
						const result = clipboard.copy(this.card.root[0], true);
						if (result)
							editor.messageSuccess(
								'copy',
								language.get<string>('copy', 'success'),
							);
						else
							editor.messageError(
								'copy',
								language.get<string>('copy', 'error'),
							);
					},
				};
			case 'delete':
				return {
					key: 'delete',
					type: 'button',
					content:
						item.content ||
						`<span class="data-icon data-icon-delete"></span>`,
					title:
						item.title ||
						language.get('delete', 'title').toString(),
					onClick: (e, node) => {
						if (item.onClick) {
							item.onClick(e, node);
							return;
						}
						card.remove(this.card.root);
					},
				};
			case 'maximize':
				return {
					key: 'maximize',
					type: 'button',
					content:
						item.content ||
						`<span class="data-icon data-icon-maximize"></span>`,
					title:
						item.title ||
						language.get('maximize', 'title').toString(),
					onClick: (e, node) => {
						if (item.onClick) {
							item.onClick(e, node);
							return;
						}
						this.card.maximize();
					},
				};
			case 'more':
				return {
					key: 'more',
					type: 'dropdown',
					content:
						item.content ||
						`<span class="data-icon data-icon-more"></span>`,
					title:
						item.title || language.get('more', 'title').toString(),
					items: item.items,
				};
		}
		return;
	}

	getItems(): [
		ToolbarItemOptions[],
		(ToolbarItemOptions | CardToolbarItemOptions)[],
	] {
		if (!this.card.toolbar) return [[], []];
		//获取客户端配置
		const config = this.card.toolbar();
		const items: ToolbarItemOptions[] = [];
		config.forEach((item) => {
			//默认项
			if (isCardToolbarItemOptions(item)) {
				switch (item.type) {
					case 'dnd':
						break;
					default:
						const resultItem = this.getDefaultItem(item);
						if (resultItem) items.push(resultItem);
				}
			} else {
				items.push(item);
			}
		});
		return [items, config];
	}

	create() {
		this.hide();
		const [items, config] = this.getItems();
		if (items.length > 0) {
			const dnd: CardToolbarItemOptions | undefined = config.find(
				(item) =>
					isCardToolbarItemOptions(item) &&
					(item as CardToolbarItemOptions).type === 'dnd',
			) as CardToolbarItemOptions | undefined;

			if (dnd && !isMobile && dnd.type === 'dnd') {
				//获取渲染节点
				const { root, language } = this.editor;
				const dndNode = this.createDnd(
					dnd.content ||
						'<span class="data-icon data-icon-drag"></span>',
					dnd.title || language.get('dnd', 'title').toString(),
				);
				root.append(dndNode);
				this.#dndNode = dndNode;
			}
			const toolbar = new Toolbar({
				items,
			});
			toolbar.root.addClass('data-card-toolbar');
			toolbar.root.attributes(TRIGGER_CARD_ID, this.card.id);
			//渲染工具栏
			toolbar.render($(document.body));
			toolbar.hide();
			this.toolbar = toolbar;
		}
	}

	update() {
		const [items] = this.getItems();
		this.toolbar?.update({
			items,
		});
	}

	hide() {
		this.#dndNode?.remove();
		this.dndPosition.destroy();
		this.hideCardToolbar();
	}

	show(event?: MouseEvent) {
		this.showCardToolbar(event);
	}

	hideCardToolbar(): void {
		this.toolbar?.destroy();
		this.position.destroy();
	}

	showDnd() {
		if (!this.#dndNode) return;
		if (this.#dndNode.length === 0) return;
		if (!this.card.isMaximize) {
			if (this.#dndNode.length > 0) {
				this.#dndNode.addClass('data-card-dnd-active');
				setTimeout(() => {
					this.dndPosition.bind(
						this.#dndNode!,
						this.card.root,
						'leftTop',
						this.offset,
					),
						10;
				});
			}
		} else {
			this.#dndNode.removeClass('data-card-dnd-active');
		}
	}

	showCardToolbar(event?: MouseEvent): void {
		this.create();
		const container = this.getContainer();
		if (container && container.length > 0) {
			this.showDnd();
			const card = this.card;
			container.addClass('data-toolbar-active');
			container.attributes(
				'toolbar-trigger-key',
				(card.constructor as CardEntry).cardName,
			);
			if (this.toolbar) this.toolbar.show();
			let prevAlign = this.#defaultAlign;
			const position = this.position;
			setTimeout(() => {
				position.bind(
					container,
					card.isMaximize ? card.getCenter().first()! : card.root,
					this.#defaultAlign,
					this.offset,
					(rect) => {
						if (
							this.offset &&
							this.offset.length === 4 &&
							rect.align === 'bottomLeft' &&
							rect.align !== prevAlign
						) {
							position.setOffset([
								this.offset[2],
								this.offset[3],
							]);
							prevAlign = rect.align;
							position.update(false);
						} else if (
							this.offset &&
							rect.align === this.#defaultAlign &&
							rect.align !== prevAlign
						) {
							position.setOffset(this.offset);
							prevAlign = rect.align;
							position.update(false);
						}
						prevAlign = rect.align;
					},
				);
			}, 10);
		}
	}

	private createDnd(content: string, title: string) {
		const dndNode = $(
			`<div ${DATA_ELEMENT}="${UI}" class="data-card-dnd" draggable="true" dnd-trigger-key="${
				(this.card.constructor as CardEntry).cardName
			}" drag-card-trigger="${
				this.card.id
			}" ${DATA_CONTENTEDITABLE_KEY}="false">
                <div class="data-card-dnd-trigger">
                    ${content}
                </div>
            </div>`,
		);
		dndNode.on('mouseenter', () => {
			Tooltip.show(dndNode, title);
		});
		dndNode.on('mouseleave', () => {
			Tooltip.hide();
		});
		dndNode.on('mousedown', (e) => {
			e.stopPropagation();
			Tooltip.hide();
			this.hideCardToolbar();
		});

		dndNode.on('mouseup', () => {
			this.showCardToolbar();
		});
		return dndNode;
	}

	destroy() {
		this.unbindEnterShow();
		this.dndPosition.destroy();
		this.position.destroy();
	}
}

export default CardToolbar;
