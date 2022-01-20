import {
	$,
	isEngine,
	NodeInterface,
	getHashId,
	Tooltip,
	BlockPlugin,
	PluginEntry,
	PluginOptions,
	DATA_ID,
	DATA_ELEMENT,
	UI,
} from '@aomao/engine';
import Outline from './outline';
import type { OutlineData } from './outline';
import './index.css';

export interface HeadingOptions extends PluginOptions {
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
	enableTypes?: Array<string>;
	disableMark?: Array<string>;
}
export default class<
	T extends HeadingOptions = HeadingOptions,
> extends BlockPlugin<T> {
	attributes = {
		id: '@var0',
	};
	variable = {
		'@var0': /^[\w\.\-]+$/,
	};
	tagName = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].filter(
		(name) =>
			!this.options.enableTypes ||
			this.options.enableTypes.indexOf(name) > -1,
	);

	allowIn = ['blockquote', '$root'];

	disableMark = this.options.disableMark || ['fontsize', 'bold'];

	static get pluginName() {
		return 'heading';
	}

	init() {
		super.init();
		const { language } = this.editor;
		//阅读模式处理
		if (!isEngine(this.editor) && this.options.showAnchor !== false) {
			this.editor.on('render', (root: Node) => {
				const container = $(root);
				if (this.tagName.length === 0) return;
				container.find(this.tagName.join(',')).each((heading) => {
					const node = $(heading);
					const id = node.attributes('id');
					if (id) {
						node.find('.data-anchor-button').remove();
						Tooltip.hide();
						const button = $(
							`<a class="data-anchor-button" ${DATA_ELEMENT}="${UI}"><span class="data-icon data-icon-${node.name}"></span></a>`,
						);
						if (node.height() !== 24) {
							button.css({
								top: (node.height() - 24) / 2 + 'px',
							});
						}
						button.on('mouseenter', () => {
							Tooltip.show(
								button,
								language.get('copyAnchor', 'title').toString(),
							);
						});
						button.on('mouseleave', () => {
							Tooltip.hide();
						});

						button.on('click', (e) => {
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
			this.editor.on('keydown:backspace', (event) =>
				this.onBackspace(event),
			);
			this.editor.on(
				'paste:markdown-check',
				(child) => !this.checkMarkdown(child)?.match,
			);
			this.editor.on('paste:markdown', (child) =>
				this.pasteMarkdown(child),
			);
		}
		//引擎处理
		if (!isEngine(this.editor) || this.options.showAnchor === false) return;

		this.editor.on('setValue', () => {
			this.updateId();
		});
		this.editor.on('realtimeChange', () => {
			this.updateId();
			this.showAnchor();
		});
		this.editor.on('select', () => {
			this.showAnchor();
		});
		this.editor.on('blur', () => {
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
		if (this.tagName.length === 0) return;
		this.editor.container.find(this.tagName.join(',')).each((titleNode) => {
			const node = $(titleNode);

			if (!node.parent()?.isEditable()) {
				node.removeAttributes('id');
				return;
			}

			let id = node.attributes('id');
			if (!id || $(`[id="${id}"]`).length > 1) {
				id = node.attributes(DATA_ID) || getHashId(node);
				node.attributes('id', id);
			}
		});
	}

	updateAnchorPosition() {
		if (!isEngine(this.editor)) return;
		const { change, root } = this.editor;
		const button = root.find('.data-anchor-button');

		if (button.length === 0) {
			return;
		}
		const range = change.range.get();
		const block = range.startNode.closest('h1,h2,h3,h4,h5,h6');

		if (block.length === 0) {
			button.remove();
			Tooltip.hide();
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
		if (!isEngine(this.editor) || this.tagName.length === 0) return;
		const { change, root, clipboard, language, card } = this.editor;
		const range = change.range.get();
		let button = root.find('.data-anchor-button');
		const block = range.startNode.closest(this.tagName.join(','));

		if (
			block.length === 0 ||
			(button.length > 0 &&
				button.find('.data-icon-'.concat(block.name)).length === 0) ||
			!this.editor.isFocus()
		) {
			button.remove();
			Tooltip.hide();
		}

		if (
			block.length === 0 ||
			card.closest(block, true) ||
			!this.editor.isFocus()
		) {
			return;
		}

		if (!block.parent()?.isEditable()) {
			return;
		}

		if (button.find('.data-icon-'.concat(block.name)).length > 0) {
			this.updateAnchorPosition();
			return;
		}

		button = $(
			`<span class="data-anchor-button" ${DATA_ELEMENT}="${UI}"><span class="data-icon data-icon-${block.name}"></span></span>`,
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
		button.on('mouseenter', () => {
			Tooltip.show(
				button,
				language.get('copyAnchor', 'title').toString(),
			);
		});
		button.on('mouseleave', () => {
			Tooltip.hide();
		});

		button.on('click', (e) => {
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

	execute(type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p') {
		if (!isEngine(this.editor)) return;
		if (!type || type === this.queryState()) type = 'p';
		const { enableTypes } = this.options;
		// 未启用
		if (type !== 'p' && enableTypes && enableTypes.indexOf(type) < 0)
			return;
		const { list, block } = this.editor;
		list.split();
		block.setBlocks(`<${type} />`);
	}

	queryState() {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const blocks = change.blocks;
		if (blocks.length === 0) {
			return '';
		}
		const name = this.tagName.find((name) =>
			blocks.some((block) => block.name === name),
		);
		return name || '';
	}

	hotkey() {
		const h1Hotkey = this.options.hotkey?.h1 || 'mod+opt+1';
		const h2Hotkey = this.options.hotkey?.h2 || 'mod+opt+2';
		const h3Hotkey = this.options.hotkey?.h3 || 'mod+opt+3';
		const h4Hotkey = this.options.hotkey?.h4 || 'mod+opt+4';
		const h5Hotkey = this.options.hotkey?.h5 || 'mod+opt+5';
		const h6Hotkey = this.options.hotkey?.h6 || 'mod+opt+6';
		const { enableTypes } = this.options;
		return [
			{ key: h1Hotkey, args: 'h1' },
			{ key: h2Hotkey, args: 'h2' },
			{ key: h3Hotkey, args: 'h3' },
			{ key: h4Hotkey, args: 'h4' },
			{ key: h5Hotkey, args: 'h5' },
			{ key: h6Hotkey, args: 'h6' },
		].filter((item) => !enableTypes || enableTypes.indexOf(item.key) > -1);
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
		const { enableTypes } = this.options;
		// 未启用
		if (enableTypes && enableTypes.indexOf(type) < 0) return true;

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

	checkMarkdown(node: NodeInterface) {
		if (!isEngine(this.editor) || !this.markdown || !node.isText()) return;

		const text = node.text();
		const reg = /(^|\r\n|\n)(#{1,6})(.*)/;
		const match = reg.exec(text);
		return {
			reg,
			match,
		};
	}

	pasteMarkdown(node: NodeInterface) {
		const result = this.checkMarkdown(node);
		if (!result) return;
		let { reg, match } = result;
		if (!match) return;

		let newText = '';
		let textNode = node.clone(true).get<Text>()!;

		const { enableTypes } = this.options;

		while (
			textNode.textContent &&
			(match = reg.exec(textNode.textContent))
		) {
			const codeLength = match[2].length;
			//从匹配到的位置切断
			let regNode = textNode.splitText(match.index);
			newText += textNode.textContent;
			//从匹配结束位置分割
			textNode = regNode.splitText(match[0].length);
			// 过滤不支持的节点
			if (enableTypes && enableTypes.indexOf(`h${codeLength}`) < 0) {
				newText += match[2] + match[3];
			} else
				newText +=
					match[1] +
					`<h${codeLength}>${match[3].trim()}</h${codeLength}>\n`;
		}
		newText += textNode.textContent;

		node.text(newText);
	}

	onBackspace(event: KeyboardEvent) {
		if (!isEngine(this.editor)) return;
		const { change, node } = this.editor;
		const range = change.range.get();
		if (!range.collapsed) return;
		const blockApi = this.editor.block;
		if (!blockApi.isFirstOffset(range, 'start')) return;
		const block = blockApi.closest(range.startNode);

		if (
			this.tagName.indexOf(block.name) > -1 &&
			node.isEmptyWithTrim(block) &&
			block.parent()?.isEditable()
		) {
			event.preventDefault();
			blockApi.setBlocks('<p />');
			return false;
		}
		const parent = block.parent();
		if (
			this.tagName.indexOf(block.name) > -1 &&
			(!parent || !node.isBlock(parent))
		) {
			event.preventDefault();
			change.mergeAfterDelete(block);
			return false;
		}
		return;
	}
}

export type { OutlineData };

export { Outline };
