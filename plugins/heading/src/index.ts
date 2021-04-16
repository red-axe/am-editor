import {
	ANCHOR,
	CURSOR,
	DATA_ELEMENT,
	isEngine,
	NodeInterface,
	random,
	Tooltip,
	Block,
	PluginEntry,
} from '@aomao/engine';
import './index.css';

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
	disableMark?: Array<string>;
};
export default class extends Block<Options> {
	attributes = {
		id: '@var0',
	};
	variable = {
		'@var0': /^[\w\.\-]+$/,
	};
	tagName = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

	allowIn = ['blockquote', '$root'];

	disableMark = this.options.disableMark || ['fontsize', 'bold'];

	static get pluginName() {
		return 'heading';
	}

	init() {
		super.init();
		this.editor.on('paser:html', node => this.parseHtml(node));
		const { $, language } = this.editor;
		//阅读模式处理
		if (!isEngine(this.editor) && this.options.showAnchor !== false) {
			this.editor.on('render', (root: Node) => {
				const container = $(root);
				container.find(this.tagName.join(',')).each(heading => {
					const node = $(heading);
					const id = node.attributes('id');
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
						const tooltip = new Tooltip(this.editor);
						button.on('mouseenter', () => {
							tooltip.show(
								button,
								language.get('copyAnchor', 'title').toString(),
							);
						});
						button.on('mouseleave', () => {
							tooltip.hide();
						});

						button.on('click', e => {
							e.preventDefault();
							e.stopPropagation();
							const url = this.options.anchorCopy
								? this.options.anchorCopy(id)
								: window.location.href + '/' + id;

							if (this.editor.clipboard.copy(url)) {
								this.editor.messageSuccess(
									language.get('copy', 'success').toString(),
								);
							} else {
								this.editor.messageError(
									language.get('copy', 'error').toString(),
								);
							}
						});
						node.prepend(button);
					}
				});
			});
		}
		if (isEngine(this.editor)) {
			this.editor.on('keydown:backspace', event =>
				this.onBackspace(event),
			);
			this.editor.on('paste:each', child => this.pasteMarkdown(child));
		}
		//引擎处理
		if (!isEngine(this.editor) || this.options.showAnchor === false) return;

		this.editor.on('setvalue', () => {
			this.updateId();
		});
		this.editor.on('change', () => {
			this.updateId();
			this.showAnchor();
		});
		this.editor.on('select', () => {
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
		const { $ } = this.editor;
		this.editor.container.find(this.tagName.join(',')).each(titleNode => {
			const node = $(titleNode);

			if (!node.parent()?.isRoot()) {
				node.removeAttributes('id');
				return;
			}

			let id = node.attributes('id');
			if (!id || id === 'temp') {
				id = random();
				node.attributes('id', id);
			}
			if (ids[id]) {
				while (ids[id]) {
					id = random();
				}
				node.attributes('id', id);
			}
			ids[id] = true;
		});
	}

	updateAnchorPosition() {
		if (!isEngine(this.editor)) return;
		const { change, root } = this.editor;
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
		if (!isEngine(this.editor)) return;
		const { change, root, clipboard, $, language } = this.editor;
		const range = change.getRange();
		let button = root.find('.data-anchor-button');
		const block = range.startNode.closest(this.tagName.join(','));

		if (
			block.length === 0 ||
			(button.length > 0 &&
				button.find('.data-icon-'.concat(block.name)).length === 0)
		) {
			button.remove();
		}

		if (block.length === 0) {
			return;
		}

		if (!block.parent()?.isRoot()) {
			return;
		}

		if (button.find('.data-icon-'.concat(block.name)).length > 0) {
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
		button.addClass('data-anchor-button-active');
		const tooltip = new Tooltip(this.editor);
		button.on('mouseenter', () => {
			tooltip.show(
				button,
				language.get('copyAnchor', 'title').toString(),
			);
		});
		button.on('mouseleave', () => {
			tooltip.hide();
		});

		button.on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			const id = block.attributes('id');
			const url = this.options.anchorCopy
				? this.options.anchorCopy(id)
				: window.location.href + '/' + id;

			if (clipboard.copy(url)) {
				this.editor!.messageSuccess(
					language.get('copy', 'success').toString(),
				);
			} else {
				this.editor!.messageError(
					language.get('copy', 'error').toString(),
				);
			}
		});
	}

	/**
	 * 将p标签下的节点放到标题节点下，并且移除p标签
	 */
	private replaceParagraph() {
		if (!isEngine(this.editor)) return;
		const { change, block } = this.editor;
		const range = change.getRange();
		const blocks = block.getBlocks(range);
		const selection = range.createSelection();
		blocks.forEach(block => {
			if (block.name === 'p') {
				const parent = block.parent();
				if (parent && this.tagName.indexOf(parent.name) > -1) {
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
		selection.move();
	}

	// 前置处理
	beforeProcess() {
		if (!isEngine(this.editor)) return;
		this.replaceParagraph();
		const { change, block } = this.editor;
		const range = change.getRange();
		const blocks = block.getBlocks(range);
		const selection = range.createSelection();

		if (!selection.has()) {
			return;
		}
		let start;
		blocks.forEach(block => {
			const parent = block.parent();
			let first = block.first();
			//如果是光标相关节点取下一个兄弟节点
			if (
				[CURSOR, ANCHOR].includes(first?.attributes(DATA_ELEMENT) || '')
			) {
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
				start = parseInt(parent.attributes('start'), 10) || 1;
				first[0].nodeValue = `${start}.` + first[0].nodeValue;
			}
			this.editor.block.brToBlock(block);
		});
		selection.move();
		return start;
	}

	// 后续处理
	afterProcess(start?: number) {
		if (!isEngine(this.editor)) return;
		const { change, block, mark, $ } = this.editor;
		const range = change.getRange();
		const blocks = block.getBlocks(range);
		const selection = range.createSelection();
		if (!selection.has()) {
			return;
		}

		blocks.forEach(block => {
			block.allChildren().forEach(child => {
				const node = $(child);
				const plugins = mark.findPlugin(node);
				this.disableMark.forEach(pluginName => {
					const plugin = plugins.find(
						plugin =>
							(plugin.constructor as PluginEntry).pluginName ===
							pluginName,
					);
					if (plugin) {
						this.editor.node.unwrap(node);
					}
				});
			});
			//有序列表序号
			const parent = block.parent();
			if (start) {
				const parentNext = parent?.next();
				if (
					parentNext &&
					parentNext.name === 'ol' &&
					parentNext.attributes('start')
				) {
					parentNext.attributes('start', start + 1);
				}
			}
			//列表
			if (parent && this.editor.node.isList(parent)) {
				if (this.editor.node.isCustomize(parent)) {
					parent.first()?.remove();
				}
				this.editor.node.unwrap(parent);
			}
		});
		selection.move();
	}

	execute(type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p') {
		if (!isEngine(this.editor)) return;
		if (type === this.queryState()) type = 'p';
		this.beforeProcess();
		const { list, block } = this.editor;
		list.split();
		block.setBlocks(`<${type}${type !== 'p' ? ' id="temp"' : ''} />`);
		this.afterProcess();
	}

	queryState() {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const blocks = change.blocks;
		if (blocks.length === 0) {
			return '';
		}
		return this.tagName.indexOf(blocks[0].name) >= 0 ? blocks[0].name : '';
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

	//设置markdown
	markdown(event: KeyboardEvent, text: string, block: NodeInterface) {
		if (!isEngine(this.editor) || this.options.markdown === false)
			return false;
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
		if (!type) return true;
		event.preventDefault();
		this.editor.block.removeLeftText(block);
		if (this.editor.node.isEmpty(block)) {
			block.empty();
			block.append('<br />');
		}
		this.editor.command.execute(
			(this.constructor as PluginEntry).pluginName,
			type,
		);
		return false;
	}

	pasteMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown) return;
		if (
			this.editor.node.isBlock(node) ||
			(node.parent()?.isFragment && node.isText())
		) {
			const textNode = node.isText() ? node : node.first();
			if (!textNode?.isText()) return;
			const text = textNode.text();
			const match = /^(#{1,6})/.exec(text);
			if (!match) return;
			const { $ } = this.editor;
			const codeLength = match[1].length;
			const newTextNode = textNode
				.get<Text>()!
				.splitText(
					/^\s+/.test(text.substr(codeLength))
						? codeLength + 1
						: codeLength,
				);
			textNode.replaceWith(newTextNode);
			let heading = $(`<h${codeLength} />`);
			if (node.isText()) {
				newTextNode.before(heading[0]);
				heading.append(newTextNode.cloneNode(true));
				newTextNode.remove();
			} else {
				heading = this.editor.node.replace(node, heading);
			}
			this.editor.trigger('paste:each', heading.first());
		}
	}

	onBackspace(event: KeyboardEvent) {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const range = change.getRange();
		if (!this.editor.block.isFirstOffset(range, 'start')) return;
		const block = this.editor.block.closest(range.startNode);

		if (
			this.tagName.indexOf(block.name) > -1 &&
			this.editor.node.isEmptyWithTrim(block) &&
			block.parent()?.isRoot()
		) {
			event.preventDefault();
			this.editor.block.setBlocks('<p />');
			return false;
		}
		if (this.tagName.indexOf(block.name) > -1) {
			event.preventDefault();
			change.mergeAfterDeletePrevNode(block);
			return false;
		}
		return;
	}

	parseHtml(root: NodeInterface) {
		root.find('h1,h2,h3,h4,h5,h6')
			.css({
				padding: '7px 0',
				margin: '0',
				'font-weight': '700',
			})
			.each(node => {
				const element = node as HTMLElement;
				if ('H1' === element.tagName) {
					element.style['font-size'] = '28px';
					element.style['line-height'] = '36px';
				} else if ('H2' === element.tagName) {
					element.style['font-size'] = '24px';
					element.style['line-height'] = '32px';
				} else if ('H3' === element.tagName) {
					element.style['font-size'] = '20px';
					element.style['line-height'] = '28px';
				} else if ('H4' === element.tagName) {
					element.style['font-size'] = '16px';
					element.style['line-height'] = '24px';
				} else if ('H5' === element.tagName) {
					element.style['font-size'] = '14px';
					element.style['line-height'] = '24px';
				} else if ('H6' === element.tagName) {
					element.style['font-size'] = '14px';
					element.style['line-height'] = '24px';
					element.style['font-weight'] = '400';
				}
			});
	}
}
