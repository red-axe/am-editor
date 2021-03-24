import { EditorInterface } from '../../types';
import { NodeInterface } from '../../types/node';
import { DropdownSwitchOptions } from '../../types/toolbar';

const template = (options: DropdownSwitchOptions) => {
	let checked = !!options.checked;
	if (options.getState) checked = options.getState();
	return `
    <div class="data-toolbar-item data-toolbar-dropdown-item data-toolbar-dropdown-switch">
        <span class="data-toolbar-dropdown-item-content"${
			options.disabled ? ' disabled="disabled"' : ''
		}>${options.content}</span>
        <button type="button" role="switch" aria-checked="true" class="switch-btn ${
			checked ? ' switch-checked' : ''
		}">
            <div class="switch-handle"></div>
            <span class="switch-inner"></span>
        </button>
    </div>`;
};

export default class {
	private editor: EditorInterface;
	private options: DropdownSwitchOptions;
	private root: NodeInterface | undefined;
	private switch: NodeInterface | undefined;

	constructor(editor: EditorInterface, options: DropdownSwitchOptions) {
		this.editor = editor;
		this.options = options;
	}

	renderTo(container: NodeInterface) {
		const { $ } = this.editor;
		this.root = $(template(this.options));
		this.switch = this.root.find('.ant-switch');
		container.append(this.root);
		this.root.on('mousedown', e => e.preventDefault());
		this.root.on('click', e => {
			e.stopPropagation();
			if (this.options.onClick) {
				this.options.onClick();
				this.updateSwitch();
			}
		});
	}

	updateSwitch() {
		if (this.options.getState) {
			if (this.options.getState()) {
				this.switch?.addClass('ant-switch-checked');
			} else {
				this.switch?.removeClass('ant-switch-checked');
			}
		}
	}
}
