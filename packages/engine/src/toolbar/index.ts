import $ from '../model/node';
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
import './index.css';

const template = () => {
  return '<div class="data-toolbar data-toolbar-active" contenteditable="false"></div>';
};

class Toolbar implements ToolbarInterface {
  private options: ToolbarOptions;
  root: NodeInterface;
  private items: Array<NodeInterface | Button | Input | Dropdown> = [];

  constructor(options: ToolbarOptions) {
    this.options = { type: 'block', ...options };
    this.root = $(template());
  }

  addItems(node: NodeInterface) {
    this.options.items.forEach(options => {
      let item;
      if (options.type === 'button') {
        item = new Button(options as ButtonOptions);
        item.render(node);
      }
      if (options.type === 'input') {
        item = new Input(options as InputOptions);
        item.render(node);
      }
      if (options.type === 'dropdown') {
        item = new Dropdown(options as DropdownOptions);
        item.render(node);
      }
      if (options.type === 'node') {
        item = (options as NodeOptions).node;
        node.append(item);
      }
      if (item) this.items.push(item);
    });
  }

  setPosition(
    options: {
      offsetX: number;
      offsetY: number;
    } = { offsetX: 10, offsetY: 5 },
  ) {
    // 传入 range，定位在 range 下面
    const { range } = this.options;
    if (!range) return;

    const rect = range.getBoundingClientRect();
    let left = Math.round(window.pageXOffset + rect.left);
    const top =
      Math.round(window.pageYOffset + rect.top + rect.height) + options.offsetY;
    const toolbarWidth = this.root.get<Element>()?.clientWidth || 0;
    const docWidth = document.body.clientWidth;

    if (left + toolbarWidth > docWidth - options.offsetX) {
      left = docWidth - toolbarWidth - options.offsetX;
    }

    this.root.css({
      left: left + 'px',
      top: top + 'px',
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
    const group = $('<div class="data-toolbar-group"></div>');
    this.root.append(group);
    this.addItems(group);
    if (container) {
      container.append(this.root);
    }

    this.setPosition();
    // inline 目前用于上传错误提示
    if (type === 'inline') {
      this.root.addClass('data-toolbar-inline');
    } else {
      this.root.addClass('data-toolbar-block');
    }

    if (align && ['center', 'right'].indexOf(align) >= 0) {
      this.root.addClass('data-toolbar-'.concat(align));
    }

    this.root.on('click', e => {
      e.preventDefault();
      e.stopPropagation();
    });
    return this.root;
  }
}

export default Toolbar;

export { Button, Input, Dropdown, Tooltip };
