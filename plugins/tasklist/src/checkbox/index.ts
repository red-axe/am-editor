import {
	$,
	Card,
	CardType,
	isEngine,
	isMobile,
	NodeInterface,
} from '@aomao/engine';
import './index.css';

const CHECKBOX_CLASS = 'data-checkbox';
const CHECKBOX_INPUT_CLASS = 'data-checkbox-input';
const CHECKBOX_INNER_CLASS = 'data-checkbox-inner';
const CHECKBOX_CHECKED_CLASS = 'data-checkbox-checked';

export type CheckboxValue = {
	checked: boolean;
};

class Checkbox extends Card<CheckboxValue> {
	#container?: NodeInterface;

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

	update = (isChecked?: boolean) => {
		const checked = isChecked === undefined ? this.isChecked() : isChecked;
		if (checked) {
			this.#container?.removeClass(CHECKBOX_CHECKED_CLASS);
			this.root
				.find(`.${CHECKBOX_INPUT_CLASS}`)
				.removeAttributes('checked');
		} else {
			this.#container?.addClass(CHECKBOX_CHECKED_CLASS);
			this.root
				.find(`.${CHECKBOX_INPUT_CLASS}`)
				.attributes('checked', 'checked');
		}
		return checked;
	};

	isChecked = () => {
		return !!this.#container?.hasClass(CHECKBOX_CHECKED_CLASS);
	};

	onClick = () => {
		const checked = this.update();
		this.setValue({
			checked: !checked,
		});
	};

	onActivateByOther() {}

	render() {
		const html = `
            <span class="${CHECKBOX_CLASS}${
			isMobile ? ` ${CHECKBOX_CLASS}-mobile` : ''
		}">
                <input type="checkbox" class="${CHECKBOX_INPUT_CLASS}" value="">
                <span class="${CHECKBOX_INNER_CLASS}"></span>
            </span>`;
		const value = this.getValue();
		if (!this.#container) {
			this.#container = $(html);
			this.getCenter().append(this.#container);
		} else {
			this.#container = this.getCenter().first()!;
		}
		this.update(!value?.checked);
		if (!isEngine(this.editor) || this.editor.readonly) {
			return;
		}

		this.#container.on('click', this.onClick);
	}

	destroy() {
		this.#container?.off('click', this.onClick);
	}
}
export default Checkbox;
