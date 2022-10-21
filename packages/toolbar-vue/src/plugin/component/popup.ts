import { createApp, App } from 'vue';
import { $, isEngine, isMobile, Range, UI_SELECTOR } from '@aomao/engine';
import type { NodeInterface, EditorInterface } from '@aomao/engine';
import Toolbar from '../../components/toolbar.vue';
import type { GroupItemProps } from '../../types';

type PopupOptions = {
	items?: GroupItemProps[];
};

export default class Popup {
	#editor: EditorInterface;
	#root: NodeInterface;
	#point: Record<'left' | 'top', number> = { left: 0, top: -9999 };
	#align: 'top' | 'bottom' = 'bottom';
	#options: PopupOptions = {};
	#vm?: App;

	constructor(editor: EditorInterface, options: PopupOptions = {}) {
		this.#options = options;
		this.#editor = editor;
		this.#root = $(`<div class="data-toolbar-popup-wrapper"></div>`);
		(
			this.#editor.scrollNode?.get<HTMLElement>() || document.body
		).appendChild(this.#root[0]);
		if (isEngine(editor)) {
			this.#editor.on('selectEnd', this.onSelect);
		} else {
			document.addEventListener('selectionchange', this.onSelect);
		}
		if (!isMobile)
			window.addEventListener('scroll', this.onSelect, {
				passive: true,
			});
		window.addEventListener('resize', this.onSelect);
		this.#editor.scrollNode?.on('scroll', this.onSelect, {
			passive: true,
		});
		document.addEventListener('mousedown', this.hide);
	}

	onSelect = () => {
		const range = Range.from(this.#editor)
			?.cloneRange()
			.shrinkToTextNode();
		const selection = window.getSelection();
		if (
			!range ||
			!selection ||
			!selection.focusNode ||
			range.collapsed ||
			this.#editor.card.getSingleSelectedCard(range) ||
			(!range.commonAncestorNode.inEditor(this.#editor.container) &&
				!range.commonAncestorNode.isRoot(this.#editor.container))
		) {
			this.hide();
			return;
		}
		const next = range.startNode.next();
		if (
			next?.isElement() &&
			Math.abs(range.endOffset - range.startOffset) === 1
		) {
			const component = this.#editor.card.closest(next);
			if (component) {
				this.hide();
				return;
			}
		}
		const prev = range.startNode.prev();
		if (
			prev?.isElement() &&
			Math.abs(range.startOffset - range.endOffset) === 1
		) {
			const component = this.#editor.card.closest(prev);
			if (component) {
				this.hide();
				return;
			}
		}
		const subRanges = range.getSubRanges();
		if (
			subRanges.length === 0 ||
			(this.#editor.card.active && !this.#editor.card.active.isEditable)
		) {
			this.hide();
			return;
		}
		const topRange = subRanges[0];
		const bottomRange = subRanges[subRanges.length - 1];
		const topRect = topRange
			.cloneRange()
			.collapse(true)
			.getBoundingClientRect();
		const bottomRect = bottomRange
			.cloneRange()
			.collapse(false)
			.getBoundingClientRect();

		let rootRect: DOMRect | undefined = undefined;
		this.showContent(() => {
			rootRect = this.#root.get<HTMLElement>()?.getBoundingClientRect();
			if (!rootRect) {
				this.hide();
				return;
			}
			this.#align =
				bottomRange.startNode.equal(selection.focusNode!) &&
				(!topRange.startNode.equal(selection.focusNode!) ||
					selection.focusOffset > selection.anchorOffset)
					? 'bottom'
					: 'top';
			const space = 12;
			let targetRect = this.#align === 'bottom' ? bottomRect : topRect;
			if (
				this.#align === 'top' &&
				targetRect.top - rootRect.height - space <
					window.innerHeight -
						(this.#editor.scrollNode?.height() || 0)
			) {
				this.#align = 'bottom';
			} else if (
				this.#align === 'bottom' &&
				targetRect.bottom + rootRect.height + space > window.innerHeight
			) {
				this.#align = 'top';
			}
			targetRect = this.#align === 'bottom' ? bottomRect : topRect;
			const scrollElement = this.#editor.scrollNode?.get<HTMLElement>();
			const scrollNodeRect = scrollElement?.getBoundingClientRect();
			const top =
				this.#align === 'top'
					? targetRect.top -
					  rootRect.height -
					  space -
					  (scrollNodeRect?.top || 0) +
					  (scrollElement?.scrollTop || 0)
					: targetRect.bottom +
					  space -
					  (scrollNodeRect?.top || 0) +
					  (scrollElement?.scrollTop || 0);

			let left =
				targetRect.left -
				(scrollNodeRect?.left || 0) +
				(scrollElement?.scrollLeft || 0) +
				targetRect.width -
				rootRect.width / 2;
			if (left < 0) left = 16;
			this.#point = {
				left,
				top,
			};
			this.#root.css({
				left: `${this.#point.left}px`,
				top: `${this.#point.top}px`,
			});
		});
	};

	showContent(callback?: () => void) {
		const result = this.#editor.trigger('toolbar-render', this.#options);
		if (!result && (this.#options.items || []).length === 0) {
			this.#vm?.unmount();
			this.#vm = undefined;
			this.hide();
			return;
		}
		let content = Toolbar;
		if (typeof result === 'object') {
			this.#vm?.unmount();
			this.#vm = undefined;
			content = result;
		}
		if (!this.#vm) {
			this.#vm = createApp(content, {
				...this.#options,
				engine: this.#editor,
				popup: true,
			});
			this.#vm.mount(this.#root.get<HTMLDivElement>()!);
		}
		setTimeout(() => {
			if (callback) callback();
		}, 200);
	}

	hide = (event?: MouseEvent) => {
		if (event?.target) {
			const target = $(event.target);
			if (
				target.closest('.data-toolbar-popup-wrapper').length > 0 ||
				target.closest(UI_SELECTOR).length > 0
			)
				return;
		}
		this.#root.css({
			left: '0px',
			top: '-9999px',
		});
	};

	destroy() {
		this.#root.remove();
		if (isEngine(this.#editor)) {
			this.#editor.off('select', this.onSelect);
		} else {
			document.removeEventListener('selectionchange', this.onSelect);
		}
		if (!isMobile) window.removeEventListener('scroll', this.onSelect);
		window.removeEventListener('resize', this.onSelect);
		this.#editor.scrollNode?.off('scroll', this.onSelect);
		document.removeEventListener('mousedown', this.hide);
		if (this.#vm) {
			this.#vm.unmount();
			this.#vm = undefined;
		}
	}
}
export type { GroupItemProps };
