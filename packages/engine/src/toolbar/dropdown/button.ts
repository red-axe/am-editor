import { NodeInterface } from '../../types/node';
import { DropdownButtonOptions } from '../../types/toolbar';
import { $ } from '../../node';

const template = (options: DropdownButtonOptions) => {
	return `
    <div class="data-toolbar-item data-toolbar-dropdown-item data-toolbar-dropdown-btn">
        <span class="data-toolbar-dropdown-item-content"${
			options.disabled ? ' disabled="disabled"' : ''
		}>
            ${options.content}
        </span>
    </div>`;
};

export default class {
	private options: DropdownButtonOptions;
	private root: NodeInterface | undefined;

	constructor(options: DropdownButtonOptions) {
		this.options = options;
	}

	renderTo(container: NodeInterface) {
		this.root = $(template(this.options));
		container.append(this.root);
		const { onClick } = this.options;
		if (onClick) {
			this.root.on('click', (event) => onClick(event, this.root!));
		}
	}
}
