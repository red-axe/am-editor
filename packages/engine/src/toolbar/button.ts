import { NodeInterface } from '../types/node';
import { ButtonInterface, ButtonOptions } from '../types/toolbar';
import Tooltip from './tooltip';
import { $ } from '../node';

const template = (options: ButtonOptions) => {
	return `
    <span class="data-toolbar-item">
        <a class="data-toolbar-btn"${
			options.disabled ? ' disabled="disabled"' : ''
		} ${options.link ? ' href="' + options.link + '" target="_blank"' : ''}>
            ${options.content}
        </a>
    </span>`;
};

export default class Button implements ButtonInterface {
	private options: ButtonOptions;
	private root: NodeInterface;
	constructor(options: ButtonOptions) {
		this.options = options;
		this.root = $(template(options));
		if (options.style) {
			this.root.attributes('style', options.style);
		}
		if (options.class) {
			this.root.addClass(options.class);
		}
	}

	getPlacement() {
		const dataPlacement =
			this.root.closest('.data-toolbar').attributes('data-placement') ||
			'top';
		return dataPlacement.startsWith('top') ? 'top' : 'bottom';
	}

	render(container: NodeInterface) {
		const { title, didMount, onClick, link } = this.options;
		container.append(this.root);

		if (title) {
			this.root.on('mouseenter', () => {
				const placement = this.getPlacement();
				Tooltip.show(
					this.root,
					typeof title === 'function' ? title() : title,
					{
						placement,
					},
				);
			});
			this.root.on('mouseleave', () => {
				Tooltip.hide();
			});
			this.root.on('mousedown', () => {
				Tooltip.hide();
			});
		}
		if (!link && onClick) {
			this.root.find('a').on('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				onClick(e, this.root);
			});
		}

		if (didMount) {
			didMount(this.root);
		}
	}
}
