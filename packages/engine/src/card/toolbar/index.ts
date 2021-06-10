import Toolbar, { Tooltip } from '../../toolbar';
import {
	CardEntry,
	CardInterface,
	CardToolbarInterface,
	CardToolbarItemOptions,
} from '../../types/card';
import {
	ToolbarItemOptions,
	ToolbarInterface as ToolbarBaseInterface,
} from '../../types/toolbar';
import { EditorInterface } from '../../types/engine';
import { DATA_ELEMENT, UI } from '../../constants';
import { $ } from '../../node';
import { isMobile } from '../../utils';
import './index.css';

export const isCardToolbarItemOptions = (
	item: ToolbarItemOptions | CardToolbarItemOptions,
): item is CardToolbarItemOptions => {
	return ['button', 'input', 'dropdown', 'node'].indexOf(item.type) === -1;
};

class CardToolbar implements CardToolbarInterface {
	private card: CardInterface;
	private toolbar?: ToolbarBaseInterface;
	private editor: EditorInterface;

	constructor(editor: EditorInterface, card: CardInterface) {
		this.editor = editor;
		this.card = card;
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
					type: 'node',
					node:
						item.node ||
						$(`<span class="data-toolbar-item-split"></span>`),
				};
			case 'copy':
				return {
					type: 'button',
					content:
						item.content ||
						`<span class="data-icon data-icon-copy"></span>`,
					title:
						item.title || language.get('copy', 'title').toString(),
					onClick: () => {
						const result = clipboard.copy(this.card.root[0], true);
						if (result)
							editor.messageSuccess(
								language.get('copy', 'success').toString(),
							);
						else
							editor.messageError(
								language.get('copy', 'error').toString(),
							);
					},
				};
			case 'delete':
				return {
					type: 'button',
					content:
						item.content ||
						`<span class="data-icon data-icon-delete"></span>`,
					title:
						item.title ||
						language.get('delete', 'title').toString(),
					onClick: () => {
						card.remove(this.card.root);
					},
				};
			case 'maximize':
				return {
					type: 'button',
					content:
						item.content ||
						`<span class="data-icon data-icon-maximize"></span>`,
					title:
						item.title ||
						language.get('maximize', 'title').toString(),
					onClick: () => {
						this.card.maximize();
					},
				};
			case 'more':
				return {
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

	create() {
		if (this.card.toolbar) {
			//获取客户端配置
			const config = this.card.toolbar();
			//获取渲染节点
			const { root, language } = this.editor;
			this.hide();
			const items: Array<ToolbarItemOptions> = [];
			config.forEach((item) => {
				//默认项
				if (isCardToolbarItemOptions(item)) {
					switch (item.type) {
						case 'dnd':
							if (isMobile) return;
							const dndNode = this.createDnd(
								item.content ||
									'<span class="data-icon data-icon-drag"></span>',
								item.title ||
									language.get('dnd', 'title').toString(),
							);
							root.append(dndNode);
							break;
						default:
							const resultItem = this.getDefaultItem(item);
							if (resultItem) items.push(resultItem);
					}
				} else {
					items.push(item);
				}
			});

			if (items.length > 0) {
				const toolbar = new Toolbar({
					items,
				});
				toolbar.root.addClass('data-card-toolbar');
				//渲染工具栏
				toolbar.render(root);
				toolbar.hide();
				this.toolbar = toolbar;
			}
		}
	}

	hide() {
		const { root } = this.editor;
		root.find('.data-card-dnd').remove();
		this.hideCardToolbar();
	}

	show(event?: MouseEvent) {
		this.showCardToolbar(event);
	}

	hideCardToolbar(): void {
		this.toolbar?.destroy();
	}

	showCardToolbar(event?: MouseEvent): void {
		this.create();
		const container = this.getContainer();
		if (container && container.length > 0) {
			const element = container.get<HTMLElement>()!;
			element.style.left = '0px';
			if (event) {
				const { clientX } = event;
				const groupElement = container.first();
				const cardRect = this.card.root
					.get<Element>()!
					.getBoundingClientRect();
				if (
					groupElement &&
					clientX >= cardRect.left &&
					clientX <= cardRect.right
				) {
					const groupRect = groupElement
						.get<Element>()!
						.getBoundingClientRect();
					const space = cardRect.width - groupRect.width;
					if (space > 0) {
						const left =
							clientX - cardRect.width - groupRect.width / 2;
						element.style.left =
							Math.max(Math.min(left, space), 0) + 'px';
					}
				}
			} else {
				const cardRect = this.card.root.getBoundingClientRect() || {
					left: 0,
					top: 0,
				};
				const { root } = this.editor;
				const rootRect = root.getBoundingClientRect() || {
					left: 0,
					top: 0,
				};
				const top = cardRect.top - rootRect.top;
				const left = cardRect.left - rootRect.left;
				element.style.top = `${top - 48}px`;
				element.style.left = `${left}px`;

				const dnd = root.find('.data-card-dnd');
				const dndElement = dnd.get<HTMLElement>();
				if (dndElement) {
					dndElement.style.top = `${top}px`;
					dndElement.style.left = `${left - 21}px`;
					dnd.addClass('data-card-dnd-active');
				}
			}

			container.addClass('data-toolbar-active');
			container.attributes(
				'toolbar-trigger-key',
				(this.card.constructor as CardEntry).cardName,
			);
			if (this.toolbar) this.toolbar.show();
		}
	}

	private createDnd(content: string, title: string) {
		const dndNode = $(
			`<div ${DATA_ELEMENT}="${UI}" class="data-card-dnd" draggable="true" dnd-trigger-key="${
				(this.card.constructor as CardEntry).cardName
			}" drag-card-trigger="${this.card.id}" contenteditable="false">
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
}

export default CardToolbar;
