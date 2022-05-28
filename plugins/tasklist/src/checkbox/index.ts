import {
	$,
	Card,
	CardType,
	isEngine,
	isMobile,
	NodeInterface,
	CardValue,
} from '@aomao/engine';
import './index.css';

const CHECKBOX_CLASS = 'data-checkbox';
const CHECKBOX_INNER_CLASS = 'data-checkbox-inner';
const CHECKBOX_CHECKED_CLASS = 'data-checkbox-checked';

export interface CheckboxValue extends CardValue {
	checked: boolean;
}

class Checkbox<V extends CheckboxValue = CheckboxValue> extends Card<V> {
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

	static get autoSelected() {
		return false;
	}

	static get collab() {
		return false;
	}

	static get focus() {
		return false;
	}

	onSelectByOther() {}

	onSelect() {}

	update = (isChecked?: boolean) => {
		const checked = isChecked === undefined ? this.isChecked() : isChecked;
		const parent = this.root.parent();
		if (checked) {
			this.#container?.removeClass(CHECKBOX_CHECKED_CLASS);
			parent?.removeAttributes('checked');
		} else {
			this.#container?.addClass(CHECKBOX_CHECKED_CLASS);
			parent?.attributes('checked', 'true');
		}
		return checked;
	};

	isChecked = () => {
		return !!this.#container?.hasClass(CHECKBOX_CHECKED_CLASS);
	};

	onClick = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		const checked = this.update();
		this.setValue({
			checked: !checked,
		} as V);
	};

	onActivateByOther() {}

	render() {
		const html = `
        <span class="${CHECKBOX_CLASS}${
			isMobile ? ` ${CHECKBOX_CLASS}-mobile` : ''
		}">
                <span class="${CHECKBOX_INNER_CLASS}"></span>
            </span>`;
		const value = this.getValue();
		if (!this.#container) {
			this.#container = $(html);
			this.getCenter().append(this.#container);
		} else {
			this.#container = this.getCenter().first()!;
		}
		const editor = this.editor;
		this.update(!value?.checked);
		if (!isEngine(editor) || editor.readonly) {
			return;
		}
		this.#container.on('mousedown', this.onClick);
	}

	destroy() {
		this.#container?.off('mousedown', this.onClick);
	}
}
export default Checkbox;
