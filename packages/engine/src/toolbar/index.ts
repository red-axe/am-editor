import { NodeInterface } from '../types/node';
import {
	ButtonOptions,
	DropdownOptions,
	InputOptions,
	NodeOptions,
	ToolbarOptions,
	ToolbarInterface,
} from '../types/toolbar';
import Button from './button';
import Dropdown from './dropdown';
import Input from './input';
import Tooltip from './tooltip';
import { EditorInterface } from '../types';
import { DATA_ELEMENT } from '../constants';
import './index.css';

const template = () => {
	return `<div ${DATA_ELEMENT}="ui" class="data-toolbar data-toolbar-active" contenteditable="false"></div>`;
};

class Toolbar implements ToolbarInterface {
	private editor: EditorInterface;
	private options: ToolbarOptions;
	root: NodeInterface;
	private items: Array<NodeInterface | Button | Input | Dropdown> = [];

	constructor(editor: EditorInterface, options: ToolbarOptions) {
		this.editor = editor;
		this.options = { ...options };
		this.root = this.editor.$(template());
	}

	addItems(node: NodeInterface) {
		this.options.items.forEach(options => {
			let item;
			if (options.type === 'button') {
				item = new Button(this.editor, options as ButtonOptions);
				item.render(node);
			}
			if (options.type === 'input') {
				const inputOptions = options as InputOptions;
				item = new Input(this.editor, inputOptions);
				item.render(node);
			}
			if (options.type === 'dropdown') {
				item = new Dropdown(this.editor, options as DropdownOptions);
				item.render(node);
			}
			if (options.type === 'node') {
				const nodeOptions = options as NodeOptions;
				const nodeItem: NodeInterface = nodeOptions.node;
				nodeItem.addClass('data-toolbar-item');
				const { title } = nodeOptions;
				if (title) {
					const tooltip = new Tooltip(this.editor);
					nodeItem.on('mouseenter', () => {
						tooltip.show(
							nodeItem,
							typeof title === 'function' ? title() : title,
						);
					});
					nodeItem.on('mouseleave', () => {
						tooltip.hide();
					});
					nodeItem.on('mousedown', () => {
						tooltip.hide();
					});
				}
				node.append(nodeItem);
				if (options.didMount) options.didMount(nodeItem);
			}
			if (item) this.items.push(item);
		});
	}

	find(role: string) {
		const expr = '[data-role='.concat(role, ']');
		return this.root.find(expr);
	}

	destroy() {
		this.root.remove();
	}

	hide() {
		this.root.removeClass('data-toolbar-active');
	}

	show() {
		this.root.addClass('data-toolbar-active');
	}

	render(container?: NodeInterface) {
		const group = this.editor.$('<div class="data-toolbar-group"></div>');
		this.root.append(group);
		this.addItems(group);
		if (container) {
			container.append(this.root);
		}
		this.root.addClass('data-toolbar-block');
		return this.root;
	}
}

export default Toolbar;

export { Button, Input, Dropdown, Tooltip };
