import { Card, CardType, NodeInterface } from '@aomao/engine';
import './index.css';

const CHECKBOX_CLASS = 'data-checkbox';
const CHECKBOX_INPUT_CLASS = 'data-checkbox-input';
const CHECKBOX_INNER_CLASS = 'data-checkbox-inner';
const CHECKBOX_CHECKED_CLASS = 'data-checkbox-checked';

class Checkbox extends Card {
	static get cardName() {
		return 'checkbox';
	}

	static get cardType() {
		return CardType.INLINE;
	}

	static get singleSelectable() {
		return false;
	}

	static get collab() {
		return false;
	}

	static get focus() {
		return false;
	}

	onClick = (container: NodeInterface) => {
		const checked = container.hasClass(CHECKBOX_CHECKED_CLASS);
		if (checked) {
			container.removeClass(CHECKBOX_CHECKED_CLASS);
			this.root
				.find(`.${CHECKBOX_INPUT_CLASS}`)
				.removeAttributes('checked');
		} else {
			container.addClass(CHECKBOX_CHECKED_CLASS);
			this.root
				.find(`.${CHECKBOX_INPUT_CLASS}`)
				.attributes('checked', 'checked');
		}
		this.setValue({
			checked: !checked,
		});
	};

	render() {
		const { $ } = this.editor;
		const html = `
            <span class="${CHECKBOX_CLASS}">
                <input type="checkbox" class="${CHECKBOX_INPUT_CLASS}" value="">
                <span class="${CHECKBOX_INNER_CLASS}"></span>
            </span>`;
		const container = $(html);
		const value = this.getValue();
		if (value && value.checked) {
			container.addClass(CHECKBOX_CHECKED_CLASS);
			container
				.find(`.${CHECKBOX_INPUT_CLASS}`)
				.attributes('checked', 'checked');
		}
		if (this.readonly) {
			return container;
		}

		container.on('click', () => {
			return this.onClick(container);
		});
		return container;
	}
}
export default Checkbox;
