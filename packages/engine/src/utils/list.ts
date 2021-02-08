import $ from '../model/node';
import { INDENT_KEY } from '../constants/indent';
import { unwrapNode, setNode, getWindow } from './node';
import { CARD_KEY, CARD_SELECTOR } from '../constants/card';
import { NodeInterface } from '../types/node';
import { isRange, RangeInterface } from '../types/range';

/**
 * ol 添加 start 属性
 * 有序列表序号修正策略：连续的列表会对有序列表做修正，不连续的不做修正
 * @param node 选区或者节点
 */
export const addListStartNumber = (node: NodeInterface | RangeInterface) => {
	let block;
	if (!isRange(node) && ['ol', 'ul'].includes(node.name || '')) {
		block = node;
	} else {
		const blocks = isRange(node) ? node.getBlocks() : [];
		if (blocks.length === 0) return;
		block = blocks[0].closest('ul,ol');
		if (!block[0]) return;
	}
	const startIndent = parseInt(block.attr(INDENT_KEY), 10) || 0;
	// 当前选区起始位置如果不是第一层级，需要向前遍历，找到各层级的前序序号
	// 直到遇到一个非列表截止，比如 p

	let startCache: Array<number> = [];
	let cacheIndent = startIndent;
	let prevNode = block.prev();

	while (prevNode && ['ol', 'ul'].includes(prevNode.name || '')) {
		if (prevNode.name === 'ol') {
			const prevIndent = parseInt(prevNode.attr(INDENT_KEY), 10) || 0;
			const prevStart = parseInt(prevNode.attr('start'), 10) || 1;
			const len = prevNode.find('li').length;

			if (prevIndent === 0) {
				startCache[prevIndent] = prevStart + len;
				break;
			}
			if (prevIndent <= cacheIndent) {
				cacheIndent = prevIndent;
				startCache[prevIndent] =
					startCache[prevIndent] || prevStart + len;
			}
		} else cacheIndent = parseInt(prevNode.attr(INDENT_KEY), 10) || 0;
		prevNode = prevNode.prev();
	}

	let nextNode = block;
	while (nextNode) {
		if (['ol', 'ul'].includes(nextNode.name || '')) {
			const nextIndent = parseInt(nextNode.attr(INDENT_KEY), 10) || 0;
			const nextStart = parseInt(nextNode.attr('start'), 10);
			const _len = nextNode.find('li').length;

			if (nextNode.name === 'ol') {
				let currentStart = startCache[nextIndent];
				if (nextIndent > 0) {
					currentStart = currentStart || 1;
					if (currentStart > 1) nextNode.attr('start', currentStart);
					else nextNode.removeAttr('start');
					startCache[nextIndent] = currentStart + _len;
				} else {
					if (currentStart && currentStart !== nextStart) {
						if (currentStart > 1)
							nextNode.attr('start', currentStart);
						else nextNode.removeAttr('start');
						startCache[nextIndent] = currentStart + _len;
					} else {
						startCache[nextIndent] = (nextStart || 1) + _len;
						startCache = startCache.slice(0, nextIndent + 1);
					}
				}
			}
		} else startCache = [];
		const next = nextNode.next();
		if (!next) break;
		nextNode = next;
	}
};
/**
 * 判断两个节点是否是一样的List（OrderedList UnOrderedList CustomizeList）
 * @param sourceNode 节点
 * @param targetNode 节点
 */
export const isSameList = (
	sourceNode: NodeInterface,
	targetNode: NodeInterface,
) => {
	//节点名称不一样
	if (sourceNode.name !== targetNode.name) return false;
	//任务列表类型不一致，要么都是，要么都不是
	if (isCustomizeListBlock(sourceNode) !== isCustomizeListBlock(targetNode))
		return false;
	//判断indent是否一致
	const sourceIndent = parseInt(sourceNode.attr(INDENT_KEY), 10) || 0;
	const targetIndent = parseInt(targetNode.attr(INDENT_KEY), 10) || 0;
	return sourceIndent === targetIndent;
};

/**
 * 判断是否是自定义列表
 * @param listBlock 节点
 */
export const isCustomizeListBlock = (listBlock: NodeInterface) => {
	switch (listBlock.name) {
		case 'li':
			return listBlock.hasClass('data-list-node');

		case 'ul':
			return listBlock.hasClass('data-list');

		default:
			return false;
	}
};

/**
 * 清除自定义列表节点
 * @param node 节点
 */
export const clearCustomizeList = (node: NodeInterface) => {
	switch (node.name) {
		case 'li':
			node.removeAttr('class');
			node.find(CARD_SELECTOR).remove();
			return node;
		case 'ul':
			node.removeAttr('class');
			return node;
		default:
			return node;
	}
};

/**
 * 修复列表集合
 * @param blocks 节点集合
 * @param range 选区
 */
export const repairListblocks = (
	blocks: Array<NodeInterface>,
	range: RangeInterface,
) => {
	const newBlocks: Array<NodeInterface> = [];
	blocks.forEach((block, i) => {
		const parent = block.parent();
		if (block.name === 'p') {
			// <li><p>a</p></li> => <li>a</li>
			if (parent?.name === 'li') {
				if (i === 0) {
					newBlocks.push(parent);
				}

				unwrapNode(block);
				return;
			}
			// <ul><p>a</p></ul> => <ul><li>a</li></ul>
			if (['ul', 'ol'].includes(parent?.name || '')) {
				block = setNode(block, $('<li />'));
				newBlocks.push(block);
				return;
			}
		}

		if (block.name === 'li' && parent?.name === 'li') {
			// <li><li>a</li></li> => <li>a</li>
			if (i === 0) {
				newBlocks.push(parent);
			}

			unwrapNode(block);
			return;
		}

		if (['ul', 'ol'].includes(block?.name || '')) {
			// <li><ul>...</ul></li> => <li>...</li>
			if (parent?.name === 'li') {
				unwrapNode(block);
				return;
			}
		}

		newBlocks.push(block);
	});
	// 最后一个 li 如果没选中内容，会在 getRangeBlocks 时抛弃掉，这里需要补回来
	const lastBlock = $(range.endContainer).closest('li');

	if (
		!newBlocks.some(block => {
			return block[0] === lastBlock[0];
		})
	) {
		newBlocks.push(lastBlock);
	}
	return newBlocks;
};

/**
 * 判断列表项节点是否为空
 * @param node 节点
 */
export const isEmptyListItem = (node: NodeInterface) => {
	//节点名称必须为li
	return (
		'li' === node.name &&
		//空节点
		(node.isEmpty() ||
			//子节点只有一个，如果是自定义列表并且第一个是卡片 或者第一个节点是 br标签，就是空节点
			(1 === node.children().length
				? (node.hasClass('data-list-node') && node.first()?.isCard()) ||
				  'br' === node.first()?.name
				: //子节点有两个，并且是自定义列表而且第一个是卡片，并且第二个节点是br标签
				  2 === node.children().length &&
				  node.hasClass('data-list-node') &&
				  node.first()?.isCard() &&
				  'br' === node.last()?.name))
	);
};
/**
 * 获取列表样式
 * @param type 类型
 * @param code
 */
export const getListStyle = (
	type?:
		| 'disc'
		| 'circle'
		| 'square'
		| 'lower-alpha'
		| 'lower-roman'
		| 'decimal'
		| string,
	code: string | number = 0,
) => {
	if (!(code = +code)) return '•';
	switch (type?.toLowerCase()) {
		case 'disc':
			return '•';
		case 'circle':
			return '◦';
		case 'square':
			return '◼';
		case 'lower-alpha':
			return String.fromCharCode('a'.charCodeAt(0) + code);
		case 'lower-roman':
			return String.fromCharCode(8559 + code);
		case 'decimal':
		default:
			return code;
	}
};

/**
 * 判断节点集合是否是指定类型的List列表
 * @param blocks 节点集合
 * @param type 节点类型
 */
export const isAllListedByType = (
	blocks: Array<NodeInterface>,
	tagName: 'ul' | 'ol' = 'ul',
	cardName?: string,
) => {
	let isList = true;
	blocks.forEach(block => {
		switch (block.name) {
			case 'li':
				if (cardName) {
					isList =
						isList &&
						isCustomizeListBlock(block) &&
						(block.first()?.attr(CARD_KEY) || '') === cardName;
				} else {
					isList = isList && !isCustomizeListBlock(block);
				}
				break;
			case 'p':
				if (block.parent() && block.parent()?.name !== 'li') {
					isList = false;
				}
				break;
			case tagName:
			case 'blockquote':
				break;

			default:
				isList = false;
				break;
		}
	});
	return isList;
};

const getBlockType = (
	block: NodeInterface,
	callback: (node: NodeInterface) => string,
) => {
	let name = block.name;
	//如果是任务列表就返回
	if (isCustomizeListBlock(block)) return callback(block);
	//如果是li标签
	if ('li' === name && block.parent()) return callback(block.parent()!) || '';
	return '';
};

/**
 * 获取列表类型
 * @param blocks 节点集合
 */
export const getListType = (
	blocks: Array<NodeInterface>,
	callback: (node: NodeInterface) => string,
) => {
	let listType = undefined;
	for (let i = 0; i < blocks.length; i++) {
		//节点名称
		const tagName = blocks[i].name;
		//节点父级
		const parent = blocks[i].parent();
		let type = undefined;
		switch (tagName) {
			case 'li':
			case 'ul':
			case 'ol':
				type = getBlockType(blocks[i], callback);
				break;
			case 'blockquote':
				break;
			case 'p':
				if (parent && parent.name === 'li') {
					type = getBlockType(parent, callback);
				} else {
					return '';
				}
				break;
			default:
				return '';
		}
		if (listType && type && listType !== type) {
			return '';
		}
		listType = type;
	}
	return listType;
};

/**
 * 取消节点的列表
 * @param blocks 节点集合
 */
export const cancelList = (blocks: Array<NodeInterface>) => {
	let indent = 0;
	const commonBlock = $('<p />');
	blocks.forEach(listBlock => {
		clearCustomizeList(listBlock);
		if (['ul', 'ol'].includes(listBlock.name || '')) {
			indent = parseInt(listBlock.attr(INDENT_KEY), 10) || 0;
			unwrapNode(listBlock);
		}

		if (listBlock.name === 'li') {
			const toBlock = commonBlock.clone(false);
			if (indent !== 0) {
				toBlock.css('padding-left', indent * 2 + 'em');
			}
			setNode(listBlock, toBlock);
		}
	});
};

const addBrToCustomzieList = (root: NodeInterface) => {
	root.find('ul>li').each(child => {
		const domChild = $(child);
		let node = child.lastChild;
		while (node) {
			const domNode = $(node);
			//自定义列表项，第一个是card
			if (
				domChild.first()?.equal(domNode) &&
				domChild.first()?.isCard()
			) {
				domChild.append('<br />');
				return;
			}
			if (node.nodeType === getWindow().Node.TEXT_NODE) {
				if (node.textContent !== '') return;
				node = node.previousSibling;
			} else if (node.nodeType === getWindow().Node.ELEMENT_NODE) {
				if (!domNode.isMark() || node.textContent !== '') return;
				node = node.previousSibling;
			} else node = node.previousSibling;
		}
	});
};

/**
 * 修复自定义列表
 * @param range 光标
 */
export const repairCustomzieList = (range: RangeInterface) => {
	if (range.collapsed) {
		const startBlock = range.startNode.closest('ul');
		if (!isCustomizeListBlock(startBlock)) return;
		addBrToCustomzieList(startBlock);
	} else {
		const startBlock1 = range.startNode.closest('ul');
		const startBlock2 = range.startNode.closest('ul');
		if (
			!isCustomizeListBlock(startBlock1) &&
			!isCustomizeListBlock(startBlock2)
		)
			return;
		addBrToCustomzieList(startBlock1);
		if (startBlock1[0] !== startBlock2[0])
			addBrToCustomzieList(startBlock2);
	}
};
