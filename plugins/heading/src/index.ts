import {
	$,
	ANCHOR,
	brToParagraph,
	CURSOR,
	DATA_ELEMENT,
	HEADING_TAG_MAP,
	isCustomizeListBlock,
	NodeInterface,
	Plugin,
	random,
	Tooltip,
	unwrapNode,
} from '@aomao/engine';
import './index.css';

const HeadingTags = Object.keys(HEADING_TAG_MAP);
export type Options = {
	hotkey?: {
		h1?: string;
		h2?: string;
		h3?: string;
		h4?: string;
		h5?: string;
		h6?: string;
	};
	showAnchor?: boolean;
	anchorCopy?: (id: string) => string;
	markdown?: boolean;
};
export default class extends Plugin<Options> {
	initialize() {
		//阅读模式处理
		if (this.contentView && this.options.showAnchor !== false) {
			this.contentView.on('render', (root: Node) => {
				const container = $(root);
				container.find('h1,h2,h3,h4,h5,h6').each(heading => {
					const node = $(heading);
					const id = node.attr('id');
					if (id) {
						node.find('.data-anchor-button').remove();
						const button = $(
							`<a class="data-anchor-button"><span class="data-icon data-icon-${node.name}"></span></a>`,
						);
						if (node.height() !== 24) {
							button.css({
								top: (node.height() - 24) / 2 + 'px',
							});
						}
						const lang = this.getLang();
						button.on('mouseenter', () => {
							Tooltip.show(
								button,
								lang.get('copyAnchor', 'title').toString(),
							);
						});
						button.on('mouseleave', () => {
							Tooltip.hide();
						});

						button.on('click', e => {
							e.preventDefault();
							e.stopPropagation();
							const url = this.options.anchorCopy
								? this.options.anchorCopy(id)
								: window.location.href + '/' + id;

							if (this.contentView!.clipboard.copy(url)) {
								this.contentView!.messageSuccess(
									lang.get('copy', 'success').toString(),
								);
							} else {
								this.contentView!.messageError(
									lang.get('copy', 'error').toString(),
								);
							}
						});
						node.prepend(button);
					}
				});
			});
		}
		//引擎处理
		if (!this.engine || this.options.showAnchor === false) return;
		this.engine.on('setvalue', () => {
			this.updateId();
		});
		this.engine.on('change', () => {
			this.updateId();
			this.showAnchor();
		});
		this.engine.on('select', () => {
			this.showAnchor();
		});
		window.addEventListener(
			'resize',
			() => {
				this.updateAnchorPosition();
			},
			false,
		);
	}

	updateId() {
		const ids = {};
		this.engine?.container.find('h1,h2,h3,h4,h5,h6').each(titleNode => {
			const node = $(titleNode);

			if (!node.parent()?.isRoot()) {
				node.removeAttr('id');
				return;
			}

			let id = node.attr('id');
			if (!id) {
				id = random();
				node.attr('id', id);
			}
			if (ids[id]) {
				while (ids[id]) {
					id = random();
				}
				node.attr('id', id);
			}
			ids[id] = true;
		});
	}

	updateAnchorPosition() {
		if (!this.engine) return;
		const { change, root } = this.engine;
		const button = root.find('.data-anchor-button');

		if (button.length === 0) {
			return;
		}
		const range = change.getRange();
		const block = range.startNode.closest('h1,h2,h3,h4,h5,h6');

		if (block.length === 0) {
			button.remove();
			return;
		}
		const rootRect = root.get<Element>()?.getBoundingClientRect() || {
			left: 0,
			top: 0,
		};
		const rect = block.get<Element>()!.getBoundingClientRect();
		const left = Math.round(
			rect.left - rootRect.left - button.get<Element>()!.clientWidth - 1,
		);
		const top = Math.round(
			rect.top -
				rootRect.top +
				rect.height / 2 -
				button.get<Element>()!.clientHeight / 2,
		);
		button.css({
			top: `${top}px`,
			left: `${left}px`,
		});
	}

	showAnchor() {
		if (!this.engine) return;
		const { change, root, clipboard } = this.engine;
		const range = change.getRange();
		let button = root.find('.data-anchor-button');
		const block = range.startNode.closest('h1,h2,h3,h4,h5,h6');

		if (
			block.length === 0 ||
			(button.length > 0 &&
				button.find('.data-icon-'.concat(block.name || '')).length ===
					0)
		) {
			button.remove();
		}

		if (block.length === 0) {
			return;
		}

		if (!block.parent()?.isRoot()) {
			return;
		}

		if (button.find('.data-icon-'.concat(block.name || '')).length > 0) {
			this.updateAnchorPosition();
			return;
		}

		button = $(
			`<span class="data-anchor-button"><span class="data-icon data-icon-${block.name}"></span></span>`,
		);
		root.append(button);
		const parentRect = root.get<Element>()?.getBoundingClientRect() || {
			left: 0,
			top: 0,
		};
		const rect = block.get<Element>()!.getBoundingClientRect();
		const left = Math.round(
			rect.left -
				parentRect.left -
				button.get<Element>()!.clientWidth -
				1,
		);
		const top = Math.round(
			rect.top -
				parentRect.top +
				rect.height / 2 -
				button.get<Element>()!.clientHeight / 2,
		);
		button.css({
			top: `${top}px`,
			left: `${left}px`,
		});
		const lang = this.getLang();
		button.addClass('data-anchor-button-active');
		button.on('mouseenter', () => {
			Tooltip.show(button, lang.get('copyAnchor', 'title').toString());
		});
		button.on('mouseleave', () => {
			Tooltip.hide();
		});

		button.on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			const id = block.attr('id');
			const url = this.options.anchorCopy
				? this.options.anchorCopy(id)
				: window.location.href + '/' + id;

			if (clipboard.copy(url)) {
				this.engine!.messageSuccess(
					lang.get('copy', 'success').toString(),
				);
			} else {
				this.engine!.messageError(lang.get('copy', 'error').toString());
			}
		});
	}

	/**
	 * 将p标签下的节点放到标题节点下，并且移除p标签
	 */
	private replaceParagraph() {
		if (!this.engine) return;
		const { change } = this.engine;
		const range = change.getRange();
		const blocks = range.getBlocks();
		const bookmark = range.createBookmark();
		blocks.forEach(block => {
			if (block.name === 'p') {
				const parent = block.parent();
				if (parent && parent.isHeading()) {
					const childNodes = block[0].childNodes;
					for (
						let index = childNodes.length - 1;
						index >= 0;
						index--
					) {
						parent[0].insertBefore(childNodes[index], block[0]);
					}
					block.remove();
				}
			}
		});
		if (bookmark) range.moveToBookmark(bookmark);
	}

	// 前置处理
	beforeProcess() {
		if (!this.engine) return;
		this.replaceParagraph();
		const { change } = this.engine;
		const range = change.getRange();
		const blocks = range.getBlocks();
		const bookmark = range.createBookmark();

		if (!bookmark) {
			return;
		}
		let start;
		blocks.forEach(block => {
			const parent = block.parent();
			let first = block.first();
			//如果是光标相关节点取下一个兄弟节点
			if ([CURSOR, ANCHOR].includes(first?.attr(DATA_ELEMENT) || '')) {
				first = first!.next();
			}
			//如果是有序列表，转换序号
			if (
				block.name === 'li' &&
				parent &&
				parent.name === 'ol' &&
				first &&
				first.isText()
			) {
				start = parseInt(parent.attr('start'), 10) || 1;
				first[0].nodeValue = `${start}.` + first[0].nodeValue;
			}
			brToParagraph(block);
		});
		if (bookmark) range.moveToBookmark(bookmark);
		return start;
	}

	// 后续处理
	afterProcess(start?: number) {
		if (!this.engine) return;
		const { change } = this.engine;
		const range = change.getRange();
		const blocks = range.getBlocks();
		const bookmark = range.createBookmark();
		if (!bookmark) {
			return;
		}

		blocks.forEach(block => {
			block.allChildren().forEach(child => {
				const node = $(child);
				//字体大小去除
				if (
					node.name === 'strong' ||
					(node.name === 'span' &&
						/^data-fontsize-\d+$/.test(
							node.get<Element>()?.className || '',
						))
				) {
					unwrapNode(node);
					return;
				}

				if (node.name === 'span') {
					const match = /(?:^|\b)(data-fontsize-\d+)(?:$|\b)/.exec(
						node.get<Element>()?.className || '',
					);
					if (match) {
						node.removeClass(match[1]);
					}
				}
			});
			//有序列表序号
			const parent = block.parent();
			if (start) {
				const parentNext = parent?.next();
				if (
					parentNext &&
					parentNext.name === 'ol' &&
					parentNext.attr('start')
				) {
					parentNext.attr('start', start + 1);
				}
			}
			//列表
			if (parent && ['ul', 'ol'].includes(parent.name || '')) {
				if (isCustomizeListBlock(parent)) {
					parent.first()?.remove();
				}
				unwrapNode(parent);
			}
		});
		if (bookmark) range.moveToBookmark(bookmark);
	}

	execute(type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p') {
		if (!this.engine) return;
		if (type === this.queryState()) type = 'p';
		this.beforeProcess();
		const { change } = this.engine;
		change.separateBlocks();
		change.setBlocks(`<${type} />`);
		this.afterProcess();
	}

	queryState() {
		if (!this.engine) return;
		const { change } = this.engine;
		const blocks = change.blocks;
		if (blocks.length === 0) {
			return '';
		}
		return HeadingTags.indexOf(blocks[0].name || '') >= 0
			? blocks[0].name
			: '';
	}

	hotkey() {
		const h1Hotkey = this.options.hotkey?.h1 || 'mod+opt+1';
		const h2Hotkey = this.options.hotkey?.h2 || 'mod+opt+2';
		const h3Hotkey = this.options.hotkey?.h3 || 'mod+opt+3';
		const h4Hotkey = this.options.hotkey?.h4 || 'mod+opt+4';
		const h5Hotkey = this.options.hotkey?.h5 || 'mod+opt+5';
		const h6Hotkey = this.options.hotkey?.h6 || 'mod+opt+6';
		return [
			{ key: h1Hotkey, args: 'h1' },
			{ key: h2Hotkey, args: 'h2' },
			{ key: h3Hotkey, args: 'h3' },
			{ key: h4Hotkey, args: 'h4' },
			{ key: h5Hotkey, args: 'h5' },
			{ key: h6Hotkey, args: 'h6' },
		];
	}

	schema() {
		const rules: Array<any> = [];
		HeadingTags.forEach(key => {
			rules.push({
				[key]: {
					id: /^[\w\.\-]+$/,
					'data-id': '*',
				},
			});
		});
		return rules;
	}

	//设置markdown
	onKeydownSpace(event: KeyboardEvent, node: NodeInterface) {
		if (!this.engine || this.options.markdown === false) return;

		const block = node.getClosestBlock();
		if (!block.isHeading()) {
			return;
		}
		const { change } = this.engine;
		const range = change.getRange();
		const text = range.getBlockLeftText(block[0]);
		let type: any = '';
		switch (text) {
			case '#':
				type = 'h1';
				break;
			case '##':
				type = 'h2';
				break;
			case '###':
				type = 'h3';
				break;
			case '####':
				type = 'h4';
				break;
			case '#####':
				type = 'h5';
				break;
			case '######':
				type = 'h6';
				break;
		}
		if (!type) return;
		event.preventDefault();
		range.removeBlockLeftText(block[0]);
		if (block.isEmpty()) {
			block.empty();
			block.append('<br />');
		}
		this.execute(type);
		return false;
	}

	onCustomizeKeydown(
		type:
			| 'enter'
			| 'backspace'
			| 'space'
			| 'tab'
			| 'at'
			| 'slash'
			| 'selectall',
		event: KeyboardEvent,
	) {
		if (!this.engine || type !== 'backspace') return;
		const { change } = this.engine;
		const range = change.getRange();
		if (!range.isBlockFirstOffset('start')) return;
		const block = range.startNode.getClosestBlock();

		if (
			block.isTitle() &&
			block.isEmptyWithTrim() &&
			block.parent()?.isRoot()
		) {
			event.preventDefault();
			change.setBlocks('<p />');
			return false;
		}
		if (block.isTitle()) {
			event.preventDefault();
			change.mergeAfterDeletePrevNode(block);
			return false;
		}
		return;
	}
}
