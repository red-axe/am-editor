import debounce from 'lodash/debounce';
import {
	$,
	Card,
	CardToolbarItemOptions,
	CardType,
	CardValue,
	isEngine,
	NodeInterface,
	Position,
	ToolbarItemOptions,
} from '@aomao/engine';
import { getLocales } from '../utils';
import MathEditor from './editor';
import './index.css';
import { MathOptions } from '@/types';

export interface MathValue extends CardValue {
	code: string;
	url: string;
}

export default class MathCard<T extends MathValue = MathValue> extends Card<T> {
	#position?: Position;

	static get cardName() {
		return 'math';
	}

	static get cardType() {
		return CardType.INLINE;
	}

	static get autoSelected() {
		return false;
	}

	protected container?: NodeInterface;
	protected editorContainer?: NodeInterface;
	protected mathEditor?: MathEditor;

	isSaving: boolean = false;

	init() {
		super.init();
		const editor = this.editor;
		const tips = getLocales<{ text: string; href: string }>(editor).tips;
		const { card } = editor;
		if (!this.#position) this.#position = new Position(editor);
		if (this.mathEditor) return;
		this.mathEditor = new MathEditor(editor, {
			tips: `<a class="tips-text" href="${tips.href}" target="_blank"><span class="data-icon data-icon-question-circle-o"></span>${tips.text}</a>`,
			onFocus: () => {
				this.editorContainer?.addClass('textarea-focus');
			},
			onBlur: () => {
				this.editorContainer?.removeClass('textarea-focus');
			},
			onChange: this.queryMath,
			onOk: (event: Event) => {
				event.stopPropagation();
				event.preventDefault();
				card.activate($(document.body));
				card.focus(this);
			},
			onDestroy: () => {
				this.#position?.destroy();
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
		command.executeMethod(
			'math',
			'action',
			'query',
			this.id,
			code,
			success,
			failed,
		);
	}

	getMaxWidth(node: NodeInterface = this.root) {
		const editor = this.editor;
		const block = editor.block.closest(node).get<HTMLElement>();
		if (!block) return 0;
		const style = window.getComputedStyle(block);
		const width =
			parseInt(style.width) -
			parseInt(style['padding-left']) -
			parseInt(style['padding-right']);
		return !isEngine(editor) ? width : width - 2;
	}

	focusTextarea() {
		this.mathEditor?.focus();
	}

	onActivate(activated: boolean) {
		const editor = this.editor;
		super.onActivate(activated);
		if (!isEngine(editor) || editor.readonly) return;
		if (activated) this.renderEditor();
		else this.mathEditor?.destroy();
	}

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
		const options =
			this.editor.plugin.findPlugin<MathOptions>('math')?.options;
		if (options?.cardToolbars) {
			return options.cardToolbars([], this.editor);
		}
		return [];
	}

	renderPureText(text: string) {
		const maxWidth = this.getMaxWidth();
		this.container?.html(
			`<span class="data-math-content-tmp" style="max-width: ${maxWidth}px">${text}</span>`,
		);
		this.#position?.update();
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
				} as T);
				this.isSaving = false;
			},
			() => {
				this.renderPureText(code);
				this.setValue({
					url: '',
					code,
				} as T);
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
		this.#position?.update();
	}

	onWindowResize = () => {
		this.updateMaxWidth();
	};

	updateMaxWidth = () => {
		const maxWidth = this.getMaxWidth();
		this.container
			?.find('img')
			?.css('max-width', Math.max(maxWidth, 0) + 'px');
	};

	renderView() {
		const editor = this.editor;
		const value = this.getValue();
		const locales = getLocales(editor);
		const { url, code } = value || { url: '', code: '' };
		if (!this.container) {
			this.container = $('<span class="data-math-container"></span>');
			this.getCenter().empty().append(this.container);
		}
		if (url) {
			let image = this.container.find('img');
			if (image.length === 0) {
				image = $(`<img src="${url}" />`);
				this.container.empty().append(image);
			} else {
				image.attributes('src', url);
			}

			image.on('load', () => {
				this.renderImage(image);
			});

			image.on('error', () => {
				this.renderMath(code);
			});
		} else if (code) {
			if (!isEngine(editor)) {
				this.renderPureText(code);
			} else {
				this.renderMath(code);
			}
		} else {
			this.renderPureText(locales.placeholder);
		}
		if (!isEngine(editor) || editor.readonly) {
			this.container.css('cursor', 'pointer');
			this.container.attributes('draggable', 'true');
			this.container.css('user-select', 'none');
		}
	}

	renderEditor() {
		if (!this.mathEditor) return;
		const value = this.getValue();
		if (!value || !value.id) return;
		this.editorContainer = this.mathEditor.render(value.id, value.code);
		if (this.container)
			this.#position?.bind(this.editorContainer, this.container);
	}

	render(): string | void | NodeInterface {
		this.renderView();
	}

	didRender(): void {
		super.didRender();
		window.addEventListener('resize', this.onWindowResize);
		this.editor.on('editor:resize', this.onWindowResize);
	}

	destroy() {
		super.destroy();
		this.mathEditor?.destroy();
		window.removeEventListener('resize', this.onWindowResize);
		this.editor.off('editor:resize', this.onWindowResize);
	}
}
