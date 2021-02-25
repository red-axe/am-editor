import $ from '../../node';
import { CARD_LEFT_SELECTOR, CARD_RIGHT_SELECTOR } from '../../constants/card';
import { EngineInterface } from '../../types/engine';
import { ChangeInterface } from '../../types/change';
import { RangeInterface } from '../../types/range';
import { CardInterface, CardType } from '../../types/card';
import { NodeInterface } from '../../types/node';
import { getWindow, unwrapNode } from '../../utils';
import Range from '../../range';
// 插入空 block
const insertEmptyBlock = (
	change: ChangeInterface,
	range: RangeInterface,
	block: NodeInterface,
) => {
	const activeBlocks = change.blocks || [];
	const activeMarks = change.marks || [];
	change.insertBlock(block, true);
	if (activeBlocks[0]) {
		const styles = activeBlocks[0].css();
		block.css(styles);
	}

	let node = block.find('br');
	activeMarks.forEach(mark => {
		// 行内代码文本样式，回撤后，默认还是代码文本样式
		if (mark.name !== 'code') {
			mark = mark.clone();
			node.before(mark);
			mark.append(node);
			node = mark;
		}
	});
	range.select(block.find('br'));
	range.collapse(false);
	range.scrollIntoView();
	change.select(range);
};
// 在Card前后插入新段落
const insertNewlineForCard = (
	change: ChangeInterface,
	range: RangeInterface,
	card: CardInterface,
	isStart: boolean,
) => {
	range.select(card.root);
	range.collapse(!!isStart);
	change.select(range);
	const block = $('<p><br /></p>');
	change.insertBlock(block, true);

	if (isStart) {
		card.focus(range, true);
	} else {
		range.select(block, true);
		range.collapse(false);
	}
	change.select(range);
};
// Card
const enterCard = (
	change: ChangeInterface,
	range: RangeInterface,
	card: CardInterface,
	e: KeyboardEvent,
) => {
	if (card.type === CardType.INLINE) {
		// 左侧光标
		const cardLeft = range.startNode.closest(CARD_LEFT_SELECTOR);
		if (cardLeft.length > 0) {
			range.select(card.root);
			range.collapse(true);
			change.select(range);
		}
		// 右侧光标
		const cardRight = range.startNode.closest(CARD_RIGHT_SELECTOR);
		if (cardRight.length > 0) {
			range.select(card.root);
			range.collapse(false);
			change.select(range);
		}
	} else {
		// 左侧光标
		const cardLeft = range.startNode.closest(CARD_LEFT_SELECTOR);
		if (cardLeft.length > 0) {
			e.preventDefault();
			insertNewlineForCard(change, range, card, true);
			return false;
		}
		// 右侧光标
		const cardRight = range.startNode.closest(CARD_RIGHT_SELECTOR);
		if (cardRight.length > 0) {
			e.preventDefault();
			insertNewlineForCard(change, range, card, false);
			return false;
		}
	}
	return;
};

const insertOrSplit = (
	change: ChangeInterface,
	range: RangeInterface,
	block: NodeInterface,
) => {
	const cloneRange = range.cloneRange();
	cloneRange.enlargeFromTextNode();
	if (
		range.isBlockLastOffset('end') ||
		(cloneRange.endNode.type === getWindow().Node.ELEMENT_NODE &&
			block.children().length > 0 &&
			cloneRange.endContainer.childNodes[cloneRange.endOffset] ===
				block.last()?.get() &&
			'br' === block.first()?.name)
	) {
		if (block.name === 'p' && block.get<HTMLElement>()?.className) {
			insertEmptyBlock(
				change,
				range,
				$(
					`<p class="${
						block.get<HTMLElement>()?.className
					}"><br /></p>`,
				),
			);
		} else {
			insertEmptyBlock(change, range, $(`<p><br /></p>`));
		}
	} else {
		change.splitBlock();
	}
};
// 回车键
export default (engine: EngineInterface, e: KeyboardEvent) => {
	const { change } = engine;
	const range = change.getRange();
	// Card
	const card = engine.card.find(range.startContainer);
	if (card && enterCard(change, range, card, e) === false) {
		return false;
	}
	let block = range.endNode.getClosestBlock();
	// 无段落
	if (block.isRoot() || block.isTable()) {
		change.wrapBlock('<p />');
		block = range.endNode.getClosestBlock();
	}
	// 嵌套 block
	const parentBlock = block.parent();
	if (parentBlock && parentBlock.inRoot() && parentBlock.isBlock()) {
		if (
			'blockquote' === parentBlock.name &&
			'p' === block.name &&
			block.nextElement()
		) {
			e.preventDefault();
			insertOrSplit(change, range, block);
			return false;
		}
		if ('li' === parentBlock.name && 'p' === block.name) {
			if (1 === block.children().length && 'br' === block.first()?.name) {
				block.first()!.remove();
			}
			const bookmark = range.createBookmark();
			unwrapNode(block);
			if (bookmark) range.moveToBookmark(bookmark);
			block = range.endNode.getClosestBlock();
		}

		if (
			range.collapsed &&
			range.isBlockLastOffset('end') &&
			range.isBlockFirstOffset('end')
		) {
			e.preventDefault();
			if (['li', 'td', 'th'].indexOf(parentBlock.name || '') >= 0) {
				change.unwrapBlock('<'.concat(parentBlock.name!, ' />'));
				change.setBlocks('<'.concat(parentBlock.name!, ' />'));
			} else {
				change.unwrapBlock('<'.concat(parentBlock.name!, ' />'));
				change.setBlocks('<p />');
			}
			return false;
		}
	}
	// 标题、正文
	if (block.isHeading()) {
		e.preventDefault();
		insertOrSplit(change, range, block);
		return false;
	}
	// 列表
	if (block.name === 'li') {
		if (block.hasClass('data-list-node') && block.first()?.isCard()) {
			return;
		}
		e.preventDefault();
		// <li>foo<cursor /><li>
		if (range.isBlockLastOffset('end')) {
			// <li><cursor /><li>
			if (range.collapsed && range.isBlockFirstOffset('end')) {
				const listRoot = block.closest('ul,ol');
				change.unwrapBlock('<'.concat(listRoot.name!, ' />'));
				change.setBlocks('<p />');
			} else {
				const li = $('<li><br /></li>');
				li.attr(block.attr());
				insertEmptyBlock(change, range, li);
			}
		} else {
			change.splitBlock();
		}
		change.mergeAdjacentList();
		range.scrollIntoView();
		return false;
	}
	return;
};
