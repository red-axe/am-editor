import { $, Card, NodeInterface } from '@aomao/engine';
import './index.css';

const CHECKBOX_CLASS = 'data-checkbox';
const CHECKBOX_INPUT_CLASS = 'data-checkbox-input';
const CHECKBOX_INNER_CLASS = 'data-checkbox-inner';
const CHECKBOX_CHECKED_CLASS = 'data-checkbox-checked';

class Checkbox extends Card {
  onClick = (container: NodeInterface) => {
    const checked = container.hasClass(CHECKBOX_CHECKED_CLASS);
    if (checked) {
      container.removeClass(CHECKBOX_CHECKED_CLASS);
      this.root.find(`.${CHECKBOX_INPUT_CLASS}`).removeAttr('checked');
    } else {
      container.addClass(CHECKBOX_CHECKED_CLASS);
      this.root.find(`.${CHECKBOX_INPUT_CLASS}`).attr('checked', 'checked');
    }
    this.setValue({
      checked: !checked,
    });
    this.setListChecked(checked);
  };

  setListChecked = (checked: boolean) => {
    const block = this.root.getClosestBlock();
    if (block && block.hasClass('data-list-task')) {
      block.attr('data-checked', checked ? 'true' : 'false');
    }
  };

  render() {
    const html = `
        <span class="${CHECKBOX_CLASS}">
            <input type="checkbox" class="${CHECKBOX_INPUT_CLASS}" value="">
            <span class="${CHECKBOX_INNER_CLASS}"></span>
        </span>`;
    const container = $(html);
    const value = this.getValue();
    if (value && value.checked) {
      container.addClass(CHECKBOX_CHECKED_CLASS);
      container.find(`.${CHECKBOX_INPUT_CLASS}`).attr('checked', 'checked');
    }
    this.setListChecked(value);
    if (this.readonly) {
      return container;
    }

    container.on('click', () => {
      return this.onClick(container);
    });
    return container;
  }
}
Checkbox.singleSelectable = false;
Checkbox.collab = false;
Checkbox.focus = false;
export default Checkbox;
