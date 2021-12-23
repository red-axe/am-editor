import {
	Card,
	CardToolbarItemOptions,
	CardType,
	isEngine,
	ToolbarItemOptions,
	SelectStyleType,
	CardValue,
} from '@aomao/engine';
import './index.css';
export interface HrValue extends CardValue {}
class Hr<T extends HrValue = HrValue> extends Card<T> {
	static get cardName() {
		return 'hr';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	static get autoActivate() {
		return false;
	}

	static get selectStyleType() {
		return SelectStyleType.BACKGROUND;
	}

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
		if (!isEngine(this.editor) || this.editor.readonly) return [];
		return [
			{
				type: 'dnd',
			},
			{
				type: 'copy',
			},
			{
				type: 'delete',
			},
		];
	}

	onActivate(activated: boolean) {
		super.onActivate(activated);
		const activatedClass = 'hr-activated';
		const center = this.getCenter();
		if (activated) {
			center.addClass(activatedClass);
		} else center.removeClass(activatedClass);
	}

	onSelectByOther(selected: boolean, value?: { color: string; rgb: string }) {
		super.onSelectByOther(selected, value);
		this.getCenter()
			.find('hr')
			.css('background-color', selected ? value!.rgb : '');
	}

	onActivateByOther(
		activated: boolean,
		value?: { color: string; rgb: string },
	) {
		this.onSelectByOther(activated, value);
	}

	render() {
		this.getCenter().addClass('card-hr');
		return '<hr />';
	}
}
export default Hr;
