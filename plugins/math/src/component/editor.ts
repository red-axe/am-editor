import {
	DATA_ELEMENT,
	EditorInterface,
	NodeInterface,
	Tooltip,
	UI,
} from '@aomao/engine';
import { getLocales } from '../utils';

export type Options = {
	tips?: string;
	onFocus?: () => void;
	onBlur?: () => void;
	onChange?: (value: string) => void;
	onOk?: (event: MouseEvent) => void;
	onDestroy?: () => void;
};

class MathEditor {
	private editor: EditorInterface;
	private options: Options;
	private container?: NodeInterface;
	private tooltip: Tooltip;

	constructor(editor: EditorInterface, options: Options) {
		this.editor = editor;
		this.tooltip = new Tooltip(this.editor);
		this.options = options;
	}

	focus() {
		this.container
			?.find('textarea')
			.get<HTMLTextAreaElement>()
			?.focus();
	}

	render(defaultValue?: string) {
		this.destroy();

		const { $ } = this.editor;
		this.container = $(
			`<div class="data-card-math-editor" ${DATA_ELEMENT}="${UI}"></div>`,
		);

		const locales = getLocales(this.editor);
		const { onBlur, onFocus, onChange, onOk, tips } = this.options;
		const textarea = $(`<textarea>${defaultValue || ''}</textarea>`);

		textarea.on('focus', () => {
			if (onFocus) onFocus();
		});

		textarea.on('blur', () => {
			if (onBlur) onBlur();
		});

		textarea.on('input', (event: KeyboardEvent) => {
			if (onChange) onChange((event.target as HTMLTextAreaElement).value);
		});

		textarea.on('mousedown', () => {
			textarea.get<HTMLTextAreaElement>()?.focus();
		});

		this.container.append(textarea);
		const toolbar = $(`<div class="data-math-editor-toolbar"></div>`);
		if (tips)
			toolbar.append(
				$(`<div class="data-math-editor-toolbar-tips">${tips}</div>`),
			);
		const buttonContainer = $(
			`<div class="data-math-editor-toolbar-button"><a class="data-embed-toolbar-btn">${locales.ok}</div>`,
		);
		const button = buttonContainer.find('a');
		button.on('mouseenter', () => {
			this.tooltip.show(button, locales.buttonTips);
		});
		button.on('mouseleave', () => {
			this.tooltip.hide();
		});
		button.on('mousedown', () => {
			this.tooltip.hide();
		});
		if (onOk) button.on('click', onOk);
		toolbar.append(buttonContainer);
		this.container.append(toolbar);
		return this.container;
	}

	destroy() {
		this.container?.remove();
		const { onDestroy } = this.options;
		if (onDestroy) onDestroy();
	}
}

export default MathEditor;
