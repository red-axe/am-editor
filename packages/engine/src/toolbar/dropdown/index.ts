import { NodeInterface } from '../../types/node';
import Tooltip from '../tooltip';
import Switch from './switch';
import Button from './button';
import { DropdownInterface, DropdownOptions } from '../../types/toolbar';
import { $ } from '../../node';

const template = (options: DropdownOptions) => {
	return `
    <span class="data-toolbar-item data-toolbar-item-dropdown">
        <a class="data-toolbar-btn data-toolbar-dropdown"${
			options.disabled ? ' disabled="disabled"' : ''
		}>${options.content}</a>
        <div class="dropdown-container"></div>
    </span>`;
};

export default class Dropdown implements DropdownInterface {
	private options: DropdownOptions;
	private root: NodeInterface | undefined;
	private dropdown: NodeInterface | undefined;

	constructor(options: DropdownOptions) {
		this.options = options;
	}

	documentMouseDown = (e: MouseEvent) => {
		if (!this.root) return;
		if (
			!this.root[0].contains(e.target as Node) &&
			this.dropdown?.hasClass('show')
		) {
			this.hideDropdown();
		}
	};

	initToggleEvent() {
		const dropdownBtn = this.root!.find('.data-toolbar-dropdown');
		dropdownBtn.on('mousedown', (e) => {
			e.preventDefault();
			e.stopPropagation();
		});
		dropdownBtn.on('click', (e) => {
			e.stopPropagation();
			this.toggleDropdown();
		});
		document.addEventListener('mousedown', this.documentMouseDown, true);
	}

	toggleDropdown() {
		if (this.dropdown?.hasClass('show')) {
			this.hideDropdown();
		} else {
			this.showDropdown();
		}
	}

	showDropdown() {
		this.dropdown?.addClass('show');
	}

	hideDropdown() {
		this.dropdown?.removeClass('show');
	}

	getPlacement() {
		const dataPlacement =
			this.root!.closest('.data-toolbar').attributes('data-placement') ||
			'top';
		return dataPlacement.startsWith('top') ? 'top' : 'bottom';
	}

	renderTooltip() {
		const { title } = this.options;
		if (title) {
			this.root!.on('mouseenter', () => {
				const placement = this.getPlacement();
				Tooltip.show(
					this.root!,
					typeof title === 'function' ? title() : title,
					{
						placement,
					},
				);
			});
			this.root!.on('mouseleave', () => {
				Tooltip.hide();
			});
			this.root!.on('mousedown', () => {
				Tooltip.hide();
			});
		}
	}

	renderDropdown() {
		this.dropdown = this.root!.find('.dropdown-container');
		const { items } = this.options;
		items.forEach((item) => {
			switch (item.type) {
				case 'switch':
					return new Switch(item).renderTo(this.dropdown!);
				case 'button':
					return new Button(item).renderTo(this.dropdown!);
			}
		});
		this.dropdown.on('click', (e) => {
			e.stopPropagation();
			this.hideDropdown();
		});
	}

	render(container: NodeInterface) {
		this.root = $(template(this.options));
		container.append(this.root);
		this.initToggleEvent();
		this.renderTooltip();
		this.renderDropdown();
		const { didMount } = this.options;
		if (didMount) {
			didMount(this.root);
		}
	}

	destroy() {
		document.removeEventListener('mousedown', this.documentMouseDown, true);
	}
}
