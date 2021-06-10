import debounce from 'lodash-es/debounce';
import { $, ActiveTrigger, Card, CardType, NodeInterface } from '@aomao/engine';
import { getLocales } from '../utils';
import MathEditor from './editor';
import './index.css';

export type MathValue = {
	code: string;
	url: string;
};

export default class MathCard extends Card<MathValue> {
	static get cardName() {
		return 'math';
	}

	static get cardType() {
		return CardType.INLINE;
	}

	static get selectStyleType(): 'background' | 'border' {
		return 'background';
	}

	private container?: NodeInterface;
	private editorContainer?: NodeInterface;
	private mathEditor?: MathEditor;

	isSaving: boolean = false;

	init() {
		const tips = getLocales<{ text: string; href: string }>(this.editor)
			.tips;
		const { card } = this.editor;
		this.mathEditor = new MathEditor(this.editor, {
			tips: `<a class="tips-text" href="${tips.href}" target="_blank"><span class="data-icon data-icon-question-circle-o"></span>${tips.text}</a>`,
			onFocus: () => {
				this.editorContainer?.addClass('textarea-focus');
			},
			onBlur: () => {
				this.editorContainer?.removeClass('textarea-focus');
			},
			onChange: this.queryMath,
			onOk: (event: MouseEvent) => {
				event.stopPropagation();
				event.preventDefault();
				card.activate($(document.body), ActiveTrigger.MANUAL);
				card.focus(this);
			},
			onDestroy: () => {
				window.removeEventListener(
					'scroll',
					this.updateEditorPosition,
					true,
				);
				window.removeEventListener(
					'resize',
					this.updateEditorPosition,
					true,
				);
			},
		});
	}

	queryMath = debounce((code: string) => this.renderMath(code), 300);

	query(
		code: string,
		success: (url: string) => void,
		failed?: (message: string) => void,
	) {
		const { command } = this.editor;
		command.execute('math', 'query', code, success, failed);
	}

	getMaxWidth() {
		const { container } = this.editor;
		const style = window.getComputedStyle(container.get<HTMLElement>()!);
		const width =
			parseInt(style.width) -
			parseInt(style['padding-left']) -
			parseInt(style['padding-right']);
		return this.readonly ? width : width - 2;
	}

	updateEditorPosition = () => {
		if (!this.editorContainer || !this.container) return;
		const targetRect = this.container
			.get<Element>()
			?.getBoundingClientRect();
		if (!targetRect) return;
		const rootRect = this.editorContainer
			.get<Element>()
			?.getBoundingClientRect();
		if (!rootRect) return;
		const { top, left, bottom } = targetRect;
		const { height, width } = rootRect;
		const styleLeft =
			left + width > window.innerWidth - 20
				? window.pageXOffset + window.innerWidth - width - 10
				: 20 > left - window.pageXOffset
				? window.pageXOffset + 20
				: window.pageXOffset + left;
		const styleTop =
			bottom + height > window.innerHeight - 20
				? window.pageYOffset + top - height - 4
				: window.pageYOffset + bottom + 4;
		this.editorContainer.css({
			top: `${styleTop}px`,
			left: `${styleLeft}px`,
		});
	};

	focusTextarea() {
		this.mathEditor?.focus();
	}

	onActivate(activated: boolean) {
		super.onActivate(activated);
		if (this.readonly) return;
		if (activated) this.renderEditor();
		else this.mathEditor?.destroy();
	}

	renderPureText(text: string) {
		const maxWidth = this.getMaxWidth();
		this.container?.html(
			`<span class="data-math-content-tmp" style="max-width: ${maxWidth}px">${text}</span>`,
		);
		this.updateEditorPosition();
	}

	renderMath(code: string) {
		this.isSaving = true;
		this.query(
			code,
			(url: string) => {
				const image = new Image();
				image.src = url;
				image.onload = () => {
					this.renderImage($(image));
					this.container?.empty();
					this.container?.append(image);
				};
				this.setValue({
					url,
					code,
				});
				this.isSaving = false;
			},
			() => {
				this.renderPureText(code);
				this.setValue({
					url: '',
					code,
				});
				this.isSaving = false;
			},
		);
	}

	renderImage(image: NodeInterface) {
		const maxWidth = this.getMaxWidth();
		const node = image.get<HTMLImageElement>()!;
		let { naturalWidth, naturalHeight } = node;

		const width = parseInt(`${(14 / 17.4) * naturalWidth}`);
		const height = parseInt(`${(14 / 17.4) * naturalHeight}`);
		image.css('width', `${width}px`);
		image.css('height', `${height}px`);
		image.css('max-width', `${maxWidth}px`);
		this.updateEditorPosition();
	}

	renderView() {
		const value = this.getValue();
		const locales = getLocales(this.editor);
		const { url, code } = value || { url: '', code: '' };

		this.container = $('<span class="data-math-container"></span>');
		this.getCenter().append(this.container);
		if (url) {
			const image = $(`<img src="${url}" />`);
			this.container.append(image);
			image.on('load', () => {
				this.renderImage(image);
			});

			image.on('error', () => {
				this.renderMath(code);
			});
		} else if (code) {
			if (this.readonly) {
				this.renderPureText(code);
			} else {
				this.renderMath(code);
			}
		} else {
			this.renderPureText(locales.placeholder);
		}
		if (!this.readonly) {
			this.container.css('cursor', 'pointer');
			this.container.attributes('draggable', 'true');
			this.container.css('user-select', 'none');
		}
	}

	renderEditor() {
		if (!this.mathEditor) return;
		const value = this.getValue();
		this.editorContainer = this.mathEditor.render(value?.code);
		$(document.body).append(this.editorContainer);
		this.updateEditorPosition();
		window.addEventListener('scroll', this.updateEditorPosition, true);
		window.addEventListener('resize', this.updateEditorPosition, true);
	}

	render(): string | void | NodeInterface {
		this.renderView();
	}

	destroy() {
		super.destroy();
		this.mathEditor?.destroy();
	}
}
