import $ from '../../model/node';
import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants/card';
import { EngineInterface } from '../../types/engine';
import { RangeInterface } from '../../types/range';
import { CardInterface, CardType } from '../../types/card';
import { getWindow } from '../../utils';
import { deleteContent } from '../../model/change/utils';
import { pluginKeydownTrigger } from '../utils';

// Card
export const backspaceCard = (
	engine: EngineInterface,
	range: RangeInterface,
	card: CardInterface,
	e: Event,
) => {
	const { change } = engine;
	if (card.type === CardType.INLINE) {
		// 左侧光标
		const cardLeft = range.startNode.closest(CARD_LEFT_SELECTOR);

		if (cardLeft.length > 0) {
			range.select(card.root).collapse(true);
			change.select(range);
		}
		// 右侧光标
		const cardRight = range.startNode.closest(CARD_RIGHT_SELECTOR);

		if (cardRight.length > 0) {
			e.preventDefault();
			change.removeCard(card.id);
			range.addOrRemoveBr();
			return false;
		}
	} else {
		// 左侧光标
		const cardLeft = range.startNode.closest(CARD_LEFT_SELECTOR);
		if (cardLeft.length > 0) {
			e.preventDefault();
			if (card.root.parent()?.inRoot()) {
				change.unwrapNode(card.root.parent()!);
			} else {
				change.focusPrevBlock(card.root, true);
			}
			return false;
		}
		// 右侧光标
		const cardRight = range.startNode.closest(CARD_RIGHT_SELECTOR);

		if (cardRight.length > 0) {
			e.preventDefault();
			change.focusPrevBlock(card.root);
			change.removeCard(card.id);
			return false;
		}
	}
	return true;
};
// 后退键
export default (engine: EngineInterface, e: KeyboardEvent) => {
	const { change } = engine;
	const range = change.getRange();
	// 在Card里
	const card = engine.card.find(range.startNode);

	if (card) {
		if (backspaceCard(engine, range, card, e) === false) {
			return false;
		}

		if (pluginKeydownTrigger(engine, 'backspace', e) === false) return;
	}
	// 没有可编辑的文本
	if (change.isEmpty()) {
		e.preventDefault();
		change.setValue('<p><br /><cursor /></p>');
		return false;
	}

	const block = range.startNode.getClosestBlock();
	// 表格
	if (block.isTable() && block.isEmptyWithTrim()) {
		e.preventDefault();
		block.html('<p><br /></p>');
		range
			.select(block)
			.shrinkToElementNode()
			.collapse(false);
		change.select(range);
		return false;
	}
	// 范围为展开状态
	if (!range.collapsed) {
		e.preventDefault();
		change.deleteContent();
		return false;
	}
	// 光标前面有Card时
	const prevNode = range.getPrevNode();

	if (
		prevNode &&
		prevNode.isCard() &&
		!(
			prevNode.parent()?.hasClass('data-list-node') &&
			prevNode
				.parent()
				?.first()
				?.equal(prevNode)
		)
	) {
		e.preventDefault();
		change.removeCard(prevNode);
		return false;
	}
	// 光标前面有空 block，<h1><li><br /></li><cursor /></h1>
	if (prevNode && prevNode.isBlock() && prevNode.isEmptyWithTrim()) {
		e.preventDefault();
		change.addBrAfterDelete(prevNode);
		return false;
	}
	// 光标不在段落开始位置时
	if (!range.isBlockFirstOffset('start')) {
		let cloneRange = range
			.cloneRange()
			.shrinkToElementNode()
			.shrinkToTextNode();
		if (
			cloneRange.startContainer.nodeType === getWindow().Node.TEXT_NODE &&
			(function(range: RangeInterface) {
				const { commonAncestorContainer } = range;
				if (
					range.collapsed &&
					1 === range.startOffset &&
					range.startContainer === commonAncestorContainer &&
					commonAncestorContainer.nodeType ===
						getWindow().Node.TEXT_NODE
				) {
					range = range.cloneRange();
					if (
						(commonAncestorContainer.parentNode?.childNodes
							?.length || 0) <= 1 &&
						1 === commonAncestorContainer.textContent?.length
					) {
						range.select(commonAncestorContainer, true);
						deleteContent(range, true);
						return true;
					}
				}
				return false;
			})(cloneRange)
		) {
			e.preventDefault();
			change.change();
		}
		return;
	}
	// 处理 BR
	const { startNode, startOffset } = range;
	if (startNode.isRoot()) {
		const lastChild = startNode[0].childNodes[startOffset - 1];
		if (lastChild && $(lastChild).name === 'br') {
			e.preventDefault();
			$(lastChild).remove();
			return false;
		}
	}

	// 在标题、正文里
	if (block.isHeading()) {
		e.preventDefault();
		change.mergeAfterDeletePrevNode(block);
		return false;
	}
	// 其它段落
	if (['li', 'td', 'th'].indexOf(block.name || '') < 0) {
		e.preventDefault();
		change.setBlocks('<p />');
		return false;
	}
	return;
};
