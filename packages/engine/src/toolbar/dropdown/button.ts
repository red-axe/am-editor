import { EditorInterface } from '../../types';
import { NodeInterface } from '../../types/node';
import { DropdownButtonOptions } from '../../types/toolbar';

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
	private editor: EditorInterface;
	private options: DropdownButtonOptions;
	private root: NodeInterface | undefined;

	constructor(editor: EditorInterface, options: DropdownButtonOptions) {
		this.editor = editor;
		this.options = options;
	}

	renderTo(container: NodeInterface) {
		const { $ } = this.editor;
		this.root = $(template(this.options));
		container.append(this.root);
		const { onClick } = this.options;
		if (onClick) {
			this.root.on('click', () => onClick());
		}
	}
}
