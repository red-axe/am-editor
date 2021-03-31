import Toolbar, { Tooltip } from '../../toolbar';
import {
	CardInterface,
	CardToolbarInterface,
	CardToolbarItemOptions,
} from '../../types/card';
import {
	ToolbarItemOptions,
	ToolbarInterface as ToolbarBaseInterface,
} from '../../types/toolbar';
import { EditorInterface } from '../../types/engine';
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

	getDefaultItem(
		item: CardToolbarItemOptions,
	): ToolbarItemOptions | undefined {
		const { $, language } = this.editor;
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
						const result = this.editor.clipboard.copy(
							this.card.root[0],
							true,
						);
						if (result)
							this.editor.messageSuccess(
								language.get('copy', 'success').toString(),
							);
						else
							this.editor.messageError(
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
						const { card } = this.editor;
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
			const body = this.card.root.first();
			if (!body) return;

			const items: Array<ToolbarItemOptions> = [];
			config.forEach(item => {
				//默认项
				if (isCardToolbarItemOptions(item)) {
					switch (item.type) {
						case 'dnd':
							const dndNode = this.createDnd(
								item.content ||
									'<span class="data-icon data-icon-drag"></span>',
								item.title ||
									this.editor.language
										.get('dnd', 'title')
										.toString(),
							);
							body.append(dndNode);
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
				const toolbar = new Toolbar(this.editor, {
					items,
				});
				toolbar.root.addClass('data-card-toolbar');
				//渲染工具栏
				toolbar.render(body);
				toolbar.hide();
				this.toolbar = toolbar;
			}
		}
	}

	hide() {
		this.card.find('.data-card-dnd').removeClass('data-card-dnd-active');
		this.hideCardToolbar();
	}

	show(event?: MouseEvent) {
		this.card.find('.data-card-dnd').addClass('data-card-dnd-active');
		this.showCardToolbar(event);
	}

	hideCardToolbar(): void {
		this.card.find('.data-card-toolbar').removeClass('data-toolbar-active');
		this.card.root.removeClass('data-card-toolbar-active');
	}

	showCardToolbar(event?: MouseEvent): void {
		const toolbarElement = this.card.find('.data-card-toolbar');
		if (toolbarElement.length > 0) {
			const element = toolbarElement.get<HTMLElement>()!;
			element.style.left = '0px';
			this.card.root.addClass('data-card-toolbar-active');
			if (this.toolbar) this.toolbar.show();
			toolbarElement.addClass('data-toolbar-active');

			if (event) {
				const { clientX } = event;
				const groupElement = toolbarElement.first();
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
			}
		}
	}

	private createDnd(content: string, title: string) {
		const { $ } = this.editor;
		const dndNode = $(
			`<div class="data-card-dnd" draggable="true" contenteditable="false">
                <div class="data-card-dnd-trigger">
                    ${content}
                </div>
            </div>`,
		);
		const tooltip = new Tooltip(this.editor);
		dndNode.on('mouseenter', () => {
			tooltip.show(dndNode, title);
		});
		dndNode.on('mouseleave', () => {
			tooltip.hide();
		});
		dndNode.on('mousedown', e => {
			e.stopPropagation();
			tooltip.hide();
			this.hideCardToolbar();
		});

		dndNode.on('mouseup', () => {
			this.showCardToolbar();
		});
		return dndNode;
	}
}

export default CardToolbar;
