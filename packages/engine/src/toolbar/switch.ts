import { NodeInterface } from '../types/node';
import { SwitchOptions } from '../types/toolbar';
import { $ } from '../node';

const template = (options: SwitchOptions) => {
	let checked = !!options.checked;
	if (options.getState) checked = options.getState();
	return `
    <div class="data-toolbar-switch">
        <span class="switch-content"${
			options.disabled ? ' disabled="disabled"' : ''
		}>${options.content}</span>
        <button type="button" role="switch" aria-checked="true" class="switch-btn ${
			checked ? ' switch-checked' : ''
		}"${options.disabled ? ' disabled="disabled"' : ''}>
            <div class="switch-handle"></div>
            <span class="switch-inner"></span>
        </button>
    </div>`;
};

export default class {
	private options: SwitchOptions;
	private root: NodeInterface;
	private switch: NodeInterface | undefined;

	constructor(options: SwitchOptions) {
		this.options = options;
		this.root = $(template(options));
		this.switch = this.root.find('.switch-btn');
		if (options.class) {
			this.root.addClass(options.class);
		}
	}

	render(container: NodeInterface) {
		const { didMount, onClick } = this.options;
		container.append(this.root);

		this.root.on('mousedown', (e) => e.preventDefault());
		this.root.on('click', (e) => {
			e.stopPropagation();
			if (onClick) {
				onClick(e, this.root);
				this.updateSwitch();
			}
		});

		if (didMount) {
			didMount(this.root);
		}
	}

	updateSwitch() {
		if (this.options.getState) {
			if (this.options.getState()) {
				this.switch?.addClass('switch-checked');
			} else {
				this.switch?.removeClass('switch-checked');
			}
		}
	}
}
