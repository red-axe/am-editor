import {
	Card,
	CardToolbarItemOptions,
	CardType,
	ToolbarItemOptions,
} from '@aomao/engine';
import './index.css';
class Hr extends Card {
	static get cardName() {
		return 'hr';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	static get autoActivate() {
		return false;
	}

	static get selectStyleType(): 'background' {
		return 'background';
	}

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
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
