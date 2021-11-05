import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants';
import { CardInterface, EngineInterface, RangeInterface } from '../../types';
import { $ } from '../../node';
import { CardType } from '../enum';

class Enter {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	/**
	 * 在卡片处插入空段落
	 * @param range 光标
	 * @param card 卡片
	 * @param isStart 是否聚焦到开始位置
	 */
	insertNewline(
		range: RangeInterface,
		card: CardInterface,
		isStart: boolean,
	) {
		const { change } = this.engine;
		const emptyBlock = $('<p><br /></p>');
		this.engine.nodeId.generate(emptyBlock);
		if (isStart) {
			card.root.before(emptyBlock);
		} else {
			card.root.after(emptyBlock);
		}
		range.select(emptyBlock, true);
		range.collapse(false);
		change.range.select(range);
	}
	/**
	 * 在卡片节点处按下enter键
	 */
	trigger(event: KeyboardEvent) {
		const { change, card } = this.engine;
		const range = change.range.get();
		// 查找当前光标所在卡片
		const component = card.find(range.startNode);
		if (!component) return true;

		if (component.type === CardType.INLINE) {
			// 左侧光标
			const cardLeft = range.startNode.closest(CARD_LEFT_SELECTOR);
			if (cardLeft.length > 0) {
				range.select(component.root);
				range.collapse(true);
				change.range.select(range);
			}
			// 右侧光标
			const cardRight = range.startNode.closest(CARD_RIGHT_SELECTOR);
			if (cardRight.length > 0) {
				range.select(component.root);
				range.collapse(false);
				change.range.select(range);
			}
		} else {
			// 左侧光标
			const cardLeft = range.startNode.closest(CARD_LEFT_SELECTOR);
			if (cardLeft.length > 0) {
				event.preventDefault();
				const prev = component.root.prev();
				if (!prev || prev.isCard()) {
					card.focusPrevBlock(component, range, true);
					change.range.select(range);
				} else {
					this.insertNewline(range, component, true);
				}
				return false;
			}
			// 右侧光标
			const cardRight = range.startNode.closest(CARD_RIGHT_SELECTOR);
			if (cardRight.length > 0) {
				event.preventDefault();
				const next = component.root.next();
				if (!next || next.isCard()) {
					card.focusNextBlock(component, range, true);
					change.range.select(range);
				} else {
					this.insertNewline(range, component, false);
				}
				return false;
			}
		}
		return true;
	}
}

export default Enter;
