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
import './index.css';

const template = () => {
	return '<div class="data-toolbar data-toolbar-active" contenteditable="false"></div>';
};

class Toolbar implements ToolbarInterface {
	private editor: EditorInterface;
	private options: ToolbarOptions;
	root: NodeInterface;
	private items: Array<NodeInterface | Button | Input | Dropdown> = [];

	constructor(editor: EditorInterface, options: ToolbarOptions) {
		this.editor = editor;
		this.options = { type: 'block', ...options };
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
				item = new Input(this.editor, options as InputOptions);
				item.render(node);
			}
			if (options.type === 'dropdown') {
				item = new Dropdown(this.editor, options as DropdownOptions);
				item.render(node);
			}
			if (options.type === 'node') {
				options = options as NodeOptions;
				item = options.node;
				item.addClass('data-toolbar-item');
				node.append(item);
				if (options.load) options.load(item);
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
		const { type, align } = this.options;
		const group = this.editor.$('<div class="data-toolbar-group"></div>');
		this.root.append(group);
		this.addItems(group);
		if (container) {
			container.append(this.root);
		}

		// inline 目前用于上传错误提示
		if (type === 'inline') {
			this.root.addClass('data-toolbar-inline');
		} else {
			this.root.addClass('data-toolbar-block');
		}

		if (align && ['center', 'right'].indexOf(align) >= 0) {
			this.root.addClass('data-toolbar-'.concat(align));
		}

		return this.root;
	}
}

export default Toolbar;

export { Button, Input, Dropdown, Tooltip };
