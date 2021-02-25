import isHotkey from 'is-hotkey';
import $ from '../node';
import { NodeInterface } from '../types/node';
import { InputInterface, InputOptions } from '../types/toolbar';
import { escape } from '../utils';

const template = (options: InputOptions) => {
	return `
    <span class="data-toolbar-item data-toolbar-item-input">
        <input data-role="input" placeholder="${escape(
			options.placeholder,
		)}" class="data-toolbar-input" type="input" value="${escape(
		options.value,
	)} />
    </span>`;
};

export default class Input implements InputInterface {
	private options: InputOptions;
	private root: NodeInterface;
	onEnter: (value: string) => void;
	onInput: (value: string) => void;
	onChange: (value: string) => void;

	constructor(options: InputOptions) {
		this.options = options;
		this.root = $(template(options));
		this.onEnter = options.onEnter || (() => {});
		this.onInput = options.onInput || (() => {});
		this.onChange = options.onChange || (() => {});
	}

	find(role: string) {
		const expr = '[data-role='.concat(role, ']');
		return this.root.find(expr);
	}

	render(container?: NodeInterface) {
		const { value } = this.options;
		const input = this.find('input');
		const inputElement = input.get<HTMLInputElement>();
		if (!inputElement) return;
		inputElement.value = value !== undefined ? value : '';
		input.on('keydown', e => {
			e.stopPropagation();
			if (isHotkey('enter', e)) {
				e.preventDefault();
				inputElement.blur();
				this.onEnter(inputElement.value);
			}
		});

		input.on('input', () => {
			this.onInput(inputElement.value);
		});

		input.on('change', () => {
			setTimeout(() => {
				this.onChange(inputElement.value);
			}, 10);
		});
		container?.append(this.root);
		return this.root;
	}
}
