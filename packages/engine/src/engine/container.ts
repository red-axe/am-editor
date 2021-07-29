import { DATA_ELEMENT, ROOT } from '../constants';
import { EngineInterface, NodeInterface, Selector } from '../types';
import { $ } from '../node';
import { isMobile } from '../utils';

export type Options = {
	engine: EngineInterface;
	lang?: string;
	tabIndex?: number;
	className?: string | Array<string>;
	placeholder?: string;
};

class Container {
	private options: Options;
	private node: NodeInterface;
	private _focused: boolean = false;
	#styleElement?: Element;

	constructor(selector: Selector, options: Options) {
		this.node = $(selector);
		this.options = options;
		this._init();
		this._focused =
			document.activeElement !== null &&
			this.node.equal(document.activeElement);
	}

	_init() {
		const { lang, tabIndex, className } = this.options;
		this.node.attributes(DATA_ELEMENT, ROOT);
		this.node.attributes({
			contenteditable: 'true',
			role: 'textbox',
			autocorrect: lang === 'en-US' ? 'on' : 'off',
			autocomplete: 'off',
			spellcheck: lang === 'en-US' ? 'true' : 'false',
			'data-gramm': 'false',
		});

		if (tabIndex !== undefined) {
			this.node.attributes('tabindex', tabIndex);
		}

		if (!this.node.hasClass('am-engine')) {
			this.node.addClass('am-engine');
		}

		if (isMobile) this.node.addClass('am-engine-mobile');

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
		this.node.on('input', (e) => {
			if (engine.readonly) {
				return;
			}

			if (engine.card.find(e.target)) {
				return;
			}
			const range = engine.change.getRange();
			range.addOrRemoveBr(true);
		});
		// 编辑器文档尾部始终保持一行
		this.node.on('click', (event: MouseEvent) => {
			if (event.target && $(event.target).isEditable()) {
				//获取到编辑器内最后一个子节点
				const block = this.node.last();
				if (block) {
					//不是卡片不处理
					if (!block.isCard()) return;
					//节点不可见不处理
					if (
						(block.get<HTMLElement>()?.offsetTop || 0) +
							(block.get<Element>()?.clientHeight || 0) >
						event.offsetY
					)
						return;
				}
				const node = $('<p><br /></p>');
				this.node.append(node);
				const range = engine.change.getRange();
				range.select(node, true).collapse(false);
				engine.change.apply(range);
			}
		});
		let isMousedown = false;
		this.node.on(isMobile ? 'touchstart' : 'mousedown', () => {
			isMousedown = true;
			setTimeout(() => {
				if (!this._focused) {
					this._focused = true;
					engine.trigger('focus');
				}
				isMousedown = false;
			}, 10);
		});
		this.node.on('focus', () => {
			isMousedown = false;
			this._focused = true;
			engine.trigger('focus');
		});
		this.node.on('blur', () => {
			if (isMousedown) return;
			isMousedown = false;
			this._focused = false;
			engine.trigger('blur');
		});
	}

	isFocus() {
		return this._focused;
	}

	getNode() {
		return this.node;
	}

	setReadonly(readonly: boolean) {
		this.node.attributes('contenteditable', readonly ? 'false' : 'true');
	}

	showPlaceholder() {
		const { placeholder } = this.options;
		if (placeholder) {
			if (this.#styleElement)
				document.body.removeChild(this.#styleElement);
			this.#styleElement = document.createElement('style');
			//const left = this.node.css('padding-left');
			//const top = this.node.css('padding-top');
			const styleText = document.createTextNode(`.am-engine:before {
                content: attr(data-placeholder);
                pointer-events: none;
                position: absolute;
                color: #bbbfc4;
                height: 0;
            }`);
			this.#styleElement.appendChild(styleText);
			document.body.appendChild(this.#styleElement);
			this.node.attributes({
				'data-placeholder': placeholder,
			});
		} else if (this.#styleElement)
			document.body.removeChild(this.#styleElement);
	}

	hidePlaceholder() {
		this.node.removeAttributes('data-placeholder');
	}

	destroy() {
		const { className, engine } = this.options;
		this.node.removeAttributes(DATA_ELEMENT);
		this.node.removeAttributes('contenteditable');
		this.node.removeAttributes('role');
		this.node.removeAttributes('autocorrect');
		this.node.removeAttributes('autocomplete');
		this.node.removeAttributes('spellcheck');
		this.node.removeAttributes('data-gramm');
		this.node.removeAttributes('tabindex');
		this.node.removeAttributes('data-placeholder');
		if (this.#styleElement) document.body.removeChild(this.#styleElement);
		if (this.options.className) {
			(Array.isArray(className)
				? className
				: (className || '').split(/\s+/)
			).forEach((name) => {
				if (name.trim() !== '') this.node.removeClass(name);
			});
		}

		if (engine.card.closest(this.node)) this.node.removeClass('am-engine');
		this.node.removeAllEvents();
	}
}

export default Container;
