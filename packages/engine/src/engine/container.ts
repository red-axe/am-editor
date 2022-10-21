import {
	DATA_CONTENTEDITABLE_KEY,
	EDITABLE_SELECTOR,
	ENGINE_CLASS_NAME,
	ENGINE_MOBILE_CLASS_NAME,
	ROOT_SELECTOR,
	UI_SELECTOR,
} from '../constants';
import { EngineInterface, NodeInterface, Selector } from '../types';
import { $ } from '../node';
import { isEngine, isMobile } from '../utils';

export type Options = {
	engine: EngineInterface;
	lang?: string;
	tabIndex?: number;
	className?: string | Array<string>;
	placeholder?: string;
	autoPrepend?: boolean;
	autoAppend?: boolean;
};

export const DATA_PLACEHOLDER = 'data-placeholder';
export const DATA_PLACEHOLDER_CLASS = 'am-engine-placeholder';
class Container {
	private options: Options;
	private node: NodeInterface;
	private _focused: boolean = false;

	constructor(selector: Selector, options: Options) {
		this.node = $(selector);
		this.options = options;
		this._init();
		this._focused =
			document.activeElement !== null &&
			this.node.equal(document.activeElement);
		const { engine } = options;
		engine.on('blur', this._setBlur);
		engine.on('focus', this._setFocus);
	}

	_init() {
		const { lang, tabIndex, className } = this.options;
		this.node.attributes({
			[DATA_CONTENTEDITABLE_KEY]: 'true',
			role: 'textbox',
			autocorrect: lang === 'en-US' ? 'on' : 'off',
			autocomplete: 'off',
			spellcheck: lang === 'en-US' ? 'true' : 'false',
			'data-gramm': 'false',
		});

		if (tabIndex !== undefined) {
			this.node.attributes('tabindex', tabIndex);
		}

		if (!this.node.hasClass(ENGINE_CLASS_NAME)) {
			this.node.addClass(ENGINE_CLASS_NAME);
		}

		if (isMobile) this.node.addClass(ENGINE_MOBILE_CLASS_NAME);

		if (className !== undefined) {
			(Array.isArray(className)
				? className
				: className.split(/\s+/)
			).forEach((name) => {
				if (name.trim() !== '') this.node.addClass(name);
			});
		}
	}

	init() {
		const { engine } = this.options;
		this.node.on('input', this.onInput);
		engine.on('realtimeChange', this.onRealtimeChange);
		// 编辑器文档尾部始终保持一行
		this.node.on('click', this.handleClick);
		document.addEventListener('mousedown', this.docMouseDown);
		this.node.on(isMobile ? 'touchstart' : 'mousedown', this.triggerFoucs, {
			passive: true,
		});
		this.node.on('focus', this.handleFocus);
	}

	_setFocus = () => {
		this._focused = true;
	};

	_setBlur = () => {
		this._focused = false;
	};

	handleClick = (event: MouseEvent) => {
		const { engine, autoAppend, autoPrepend } = this.options;
		if (event.target && !engine.readonly && isEngine(engine)) {
			const targetNode = $(event.target);
			if (!targetNode.isEditable()) return;
			const node = $('<p><br /></p>');
			const container = targetNode.closest(
				`${EDITABLE_SELECTOR},${ROOT_SELECTOR}`,
			);
			// 获取编辑器内第一个子节点
			const firstBlock = container.first();
			if (!firstBlock) {
				engine.change.initValue(undefined, true, targetNode);
			}
			//获取到编辑器内最后一个子节点
			const lastBlock = container.last();
			let isHandle = false;
			// 存在这个节点，并且鼠标单击位置要小于第一个节点，并且这个节点不是一个空的节点
			if (
				autoPrepend !== false &&
				firstBlock &&
				event.offsetY <
					(firstBlock.get<HTMLElement>()?.offsetTop || 0) &&
				!engine.node.isEmptyWidthChild(firstBlock)
			) {
				container.prepend(node);
				isHandle = true;
			}
			// 存在这个节点，并且鼠标单击位置要大于最后一个节点，并且这个节点不是一个空的节点
			else if (
				autoAppend !== false &&
				lastBlock &&
				event.offsetY >
					(lastBlock.get<HTMLElement>()?.offsetTop || 0) +
						(lastBlock.get<Element>()?.clientHeight || 0) &&
				!engine.node.isEmptyWidthChild(lastBlock)
			) {
				container.append(node);
				isHandle = true;
			}
			// 有父节点说明已经加到编辑器内了
			if (isHandle) {
				const range = engine.change.range.get();
				range.select(node, true).collapse(false);
				engine.change.apply(range);
			}
		}
	};

	handleFocus = () => {
		const { engine } = this.options;
		this.triggerFoucs();
		if (!engine.ot.isStopped() && engine.isEmpty())
			engine.change.initValue();
	};

	private focusTimeout: NodeJS.Timeout | null = null;

	triggerFoucs = () => {
		const { engine } = this.options;
		if (this.focusTimeout) clearTimeout(this.focusTimeout);
		this.focusTimeout = setTimeout(() => {
			if (this._focused) return;
			const range = engine.change.range.get();
			if (
				range.commonAncestorNode.isRoot(engine.container) ||
				range.commonAncestorNode.inEditor(engine.container)
			) {
				engine.change.range.setLastBlurRange();
				engine.trigger('focus');
			}
		}, 0);
	};

	onInput = (e: InputEvent) => {
		const { engine } = this.options;
		if (engine.readonly) {
			return;
		}

		if (e.target && engine.card.find($(e.target))) {
			return;
		}
		const range = engine.change.range.get();
		range.handleBr(true);
	};

	onRealtimeChange = () => {
		const { engine } = this.options;
		if (engine.isEmpty()) {
			engine.showPlaceholder();
		} else {
			engine.hidePlaceholder();
		}
	};

	private blurTimeout: NodeJS.Timeout | null = null;

	docMouseDown = (e: MouseEvent) => {
		if (!e.target) return;
		const targetNode = $(e.target);
		const { engine } = this.options;
		if (
			this._focused &&
			targetNode.closest(UI_SELECTOR).length === 0 &&
			!targetNode.inEditor(engine.container)
		) {
			if (this.blurTimeout) clearTimeout(this.blurTimeout);
			const lastRange = engine.change.range.get();
			this.blurTimeout = setTimeout(() => {
				const range = engine.change.range.get();
				if (!range.commonAncestorNode.inEditor(engine.container)) {
					engine.change.range.setLastBlurRange(lastRange);
					engine.trigger('blur');
				}
			}, 0);
		}
	};

	isFocus() {
		return this._focused;
	}

	getNode() {
		return this.node;
	}

	setReadonly(readonly: boolean) {
		this.node.attributes(
			DATA_CONTENTEDITABLE_KEY,
			readonly ? 'false' : 'true',
		);
	}

	showPlaceholder() {
		const { placeholder } = this.options;
		if (placeholder) {
			//const left = this.node.css('padding-left');
			//const top = this.node.css('padding-top');
			this.node.attributes({
				[DATA_PLACEHOLDER]: placeholder,
			});
			this.node.addClass(DATA_PLACEHOLDER_CLASS);
		}
	}

	hidePlaceholder() {
		this.node.removeAttributes(DATA_PLACEHOLDER);
		this.node.removeClass(DATA_PLACEHOLDER_CLASS);
	}

	destroy() {
		const { className, engine } = this.options;
		engine.on('blur', this._setBlur);
		engine.on('focus', this._setFocus);
		engine.off('realtimeChange', this.onRealtimeChange);
		document.removeEventListener('mousedown', this.docMouseDown);
		this.node.removeAttributes(DATA_CONTENTEDITABLE_KEY);
		this.node.removeAttributes('role');
		this.node.removeAttributes('autocorrect');
		this.node.removeAttributes('autocomplete');
		this.node.removeAttributes('spellcheck');
		this.node.removeAttributes('data-gramm');
		this.node.removeAttributes('tabindex');
		this.node.removeAttributes(DATA_PLACEHOLDER);
		if (this.options.className) {
			(Array.isArray(className)
				? className
				: (className || '').split(/\s+/)
			).forEach((name) => {
				if (name.trim() !== '') this.node.removeClass(name);
			});
		}

		if (engine.card.closest(this.node))
			this.node.removeClass(ENGINE_CLASS_NAME);
		this.node.removeAllEvents();
	}
}

export default Container;
