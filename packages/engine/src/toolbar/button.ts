import { EditorInterface } from '../types';
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
	private editor: EditorInterface;
	private options: ButtonOptions;
	private root: NodeInterface;
	constructor(editor: EditorInterface, options: ButtonOptions) {
		this.editor = editor;
		this.options = options;
		this.root = this.editor.$(template(options));
		if (options.style) {
			this.root.attributes('style', options.style);
		}
		if (options.class) {
			this.root.addClass(options.class);
		}
	}

	render(container: NodeInterface) {
		const { title, didMount, onClick } = this.options;
		container.append(this.root);

		if (title) {
			const tooltip = new Tooltip(this.editor);
			this.root.on('mouseenter', () => {
				tooltip.show(
					this.root,
					typeof title === 'function' ? title() : title,
				);
			});
			this.root.on('mouseleave', () => {
				tooltip.hide();
			});
			this.root.on('mousedown', () => {
				tooltip.hide();
			});
		}

		this.root.find('a').on('click', e => {
			e.preventDefault();
			e.stopPropagation();
			if (onClick) onClick();
		});

		if (didMount) {
			didMount(this.root);
		}
	}
}
