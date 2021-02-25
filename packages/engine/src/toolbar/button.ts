import $ from '../node';
import { NodeInterface } from '../types/node';
import { ButtonInterface, ButtonOptions } from '../types/toolbar';
import Tooltip from './tooltip';

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
			this.root.attr('style', options.style);
		}
		if (options.class) {
			this.root.addClass(options.class);
		}
	}

	render(container: NodeInterface) {
		const { title, onLoad, onClick } = this.options;
		container.append(this.root);

		if (title) {
			this.root.on('mouseenter', () => {
				Tooltip.show(
					this.root,
					typeof title === 'function' ? title() : title,
				);
			});
			this.root.on('mouseleave', () => {
				Tooltip.hide();
			});
			this.root.on('mousedown', () => {
				Tooltip.hide();
			});
		}

		this.root.find('a').on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			if (onClick) onClick();
		});

		if (onLoad) {
			onLoad(this.root);
		}
	}
}
