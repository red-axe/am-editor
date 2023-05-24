import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants';
import { CardInterface, EngineInterface } from '../../types';

export const unactivateCard = (
	engine: EngineInterface,
	component: CardInterface,
) => {
	const { change } = engine;
	const range = change.range.get();
	const cardLeft = range.commonAncestorNode.closest(CARD_LEFT_SELECTOR);
	const cardRight = range.commonAncestorNode.closest(CARD_RIGHT_SELECTOR);
	const isCenter = cardLeft.length === 0 && cardRight.length === 0;
	if (isCenter) {
		component.select(false);
		component.activate(false);
		component.toolbarModel?.hide();
		return true;
	}
	return false;
};
