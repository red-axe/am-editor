import {
	$,
	isEngine,
	getHashId,
	Tooltip,
	BlockPlugin,
	PluginOptions,
	DATA_ID,
	DATA_ELEMENT,
	UI,
	NodeInterface,
} from '@aomao/engine';
import type MarkdownIt from 'markdown-it';
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

	closureRef: Record<'current', Record<'block', NodeInterface | null>> = {
		current: { block: null },
	};

	static get pluginName() {
		return 'heading';
	}

	init() {
		super.init();
		const editor = this.editor;

		if (isEngine(editor)) {
			editor.on('keydown:backspace', this.onBackspace);
			editor.on('markdown-it', this.markdownIt);
			editor.on('setValue', this.updateId);
			editor.on('realtimeChange', this.realtimeChange);
			editor.on('select', this.showAnchor);
			editor.on('blur', this.showAnchor);
			window.addEventListener('resize', this.updateAnchorPosition);
		} else {
			//阅读模式处理
			if (this.options.showAnchor === false) return;
			editor.on('render', this.onRender);
		}
	}

	onRender = (root: Node) => {
		const editor = this.editor;
		const { language } = editor;
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

					if (editor.clipboard.copy(url)) {
						editor.messageSuccess(
							'copy',
							language.get('copy', 'success').toString(),
						);
					} else {
						editor.messageError(
							'copy',
							language.get('copy', 'error').toString(),
						);
					}
				});
				node.prepend(button);
			}
		});
	};

	updateId = () => {
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
	};

	realtimeChange = () => {
		this.updateId();
		this.showAnchor();
	};

	updateAnchorPosition = () => {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, root } = editor;
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
	};

	showAnchor = () => {
		const editor = this.editor;
		if (
			!isEngine(editor) ||
			this.tagName.length === 0 ||
			this.options.showAnchor === false
		)
			return;
		const { change, root, clipboard, language, card } = editor;
		const range = change.range.get();
		let button = root.find('.data-anchor-button');
		const block = range.startNode.closest(this.tagName.join(','));
		this.closureRef.current.block = block;

		if (
			block.length === 0 ||
			(button.length > 0 &&
				button.find('.data-icon-'.concat(block.name)).length === 0) ||
			!editor.isFocus()
		) {
			button.remove();
			Tooltip.hide();
		}

		if (
			block.length === 0 ||
			card.closest(block, true) ||
			!editor.isFocus()
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
			if (!this.closureRef.current.block) return;
			const id = this.closureRef.current.block.attributes('id');
			const url = this.options.anchorCopy
				? this.options.anchorCopy(id)
				: window.location.href + '/' + id;

			if (clipboard.copy(url)) {
				editor!.messageSuccess(
					'copy',
					language.get('copy', 'success').toString(),
				);
			} else {
				editor!.messageError(
					'copy',
					language.get('copy', 'error').toString(),
				);
			}
		});
	};

	execute(type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p') {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		if (!type || type === this.queryState()) type = 'p';
		const { enableTypes } = this.options;
		// 未启用
		if (type !== 'p' && enableTypes && enableTypes.indexOf(type) < 0)
			return;
		const { list, block } = editor;
		list.split();
		block.setBlocks(`<${type} />`);
	}

	queryState() {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change } = editor;
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

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) mardown.enable('heading');
	};

	onBackspace = (event: KeyboardEvent) => {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, node } = editor;
		const range = change.range.get();
		if (!range.collapsed) return;
		const blockApi = editor.block;
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
	};

	destroy() {
		const editor = this.editor;
		if (isEngine(editor)) {
			editor.off('keydown:backspace', this.onBackspace);
			editor.off('markdown-it', this.markdownIt);
			editor.off('setValue', this.updateId);
			editor.off('realtimeChange', this.realtimeChange);
			editor.off('select', this.showAnchor);
			editor.off('blur', this.showAnchor);
			window.removeEventListener('resize', this.updateAnchorPosition);
		} else {
			editor.off('render', this.onRender);
		}
	}
}

export type { OutlineData };

export { Outline };
