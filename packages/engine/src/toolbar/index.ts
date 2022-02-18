import { NodeInterface } from '../types/node';
import {
	ButtonOptions,
	DropdownOptions,
	InputOptions,
	NodeOptions,
	ToolbarOptions,
	ToolbarInterface,
	SwitchOptions,
} from '../types/toolbar';
import Button from './button';
import Dropdown from './dropdown';
import Input from './input';
import Tooltip from './tooltip';
import Switch from './switch';
import { DATA_ELEMENT } from '../constants';
import { $ } from '../node';
import './index.css';

const template = () => {
	return `<div ${DATA_ELEMENT}="ui" class="data-toolbar data-toolbar-active" contenteditable="false"></div>`;
};

class Toolbar implements ToolbarInterface {
	private options: ToolbarOptions;
	root: NodeInterface;
	private items: Array<NodeInterface | Button | Input | Dropdown | Switch> =
		[];

	constructor(options: ToolbarOptions) {
		this.options = { ...options };
		this.root = $(template());
	}

	getPlacement() {
		const dataPlacement = this.root.attributes('data-placement') || 'top';
		return dataPlacement.startsWith('top') ? 'top' : 'bottom';
	}

	addItems(node: NodeInterface) {
		this.options.items.forEach((options) => {
			let item;
			if (options.type === 'button') {
				item = new Button(options as ButtonOptions);
				item.render(node);
			}
			if (options.type === 'switch') {
				item = new Switch(options as SwitchOptions);
				item.render(node);
			}
			if (options.type === 'input') {
				const inputOptions = options as InputOptions;
				item = new Input(inputOptions);
				item.render(node);
			}
			if (options.type === 'dropdown') {
				item = new Dropdown(options as DropdownOptions);
				item.render(node);
			}
			if (options.type === 'node') {
				const nodeOptions = options as NodeOptions;
				const nodeItem: NodeInterface = nodeOptions.node;
				nodeItem.addClass('data-toolbar-item');
				const { title } = nodeOptions;
				if (title) {
					nodeItem.on('mouseenter', () => {
						const placement = this.getPlacement();
						Tooltip.show(
							nodeItem,
							typeof title === 'function' ? title() : title,
							{
								placement,
							},
						);
					});
					nodeItem.on('mouseleave', () => {
						Tooltip.hide();
					});
					nodeItem.on('mousedown', () => {
						Tooltip.hide();
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

	renderGroup() {
		return $('<div class="data-toolbar-group"></div>');
	}

	render(container?: NodeInterface) {
		const group = this.renderGroup();
		this.root.append(group);
		this.addItems(group);
		if (container) {
			container.append(this.root);
		}
		this.root.addClass('data-toolbar-block');
		return this.root;
	}

	update(options: ToolbarOptions) {
		this.options = options;
		this.root.empty();
		const group = this.renderGroup();
		this.root.append(group);
		this.addItems(group);
	}
}

export default Toolbar;

export { Button, Input, Dropdown, Tooltip, Switch };
