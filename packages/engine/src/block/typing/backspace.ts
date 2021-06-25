import { EngineInterface, RangeInterface } from '../../types';
import { getWindow } from '../../utils';

class Backspace {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	trigger(event: KeyboardEvent) {
		const { change, node, block, card } = this.engine;
		const range = change.getRange();
		if (!range.collapsed) return;
		const prevNode = range.getPrevNode();
		// 光标前面有空 block，<h1><li><br /></li><cursor /></h1>
		if (
			prevNode &&
			node.isBlock(prevNode) &&
			node.isEmptyWithTrim(prevNode)
		) {
			event.preventDefault();
			change.addBrAfterDelete(prevNode);
			return false;
		}
		// 光标不在段落开始位置时
		const isCard = !!card.closest(range.startNode);
		if (!isCard && !block.isFirstOffset(range, 'start')) {
			let cloneRange = range
				.cloneRange()
				.shrinkToElementNode()
				.shrinkToTextNode();
			if (
				cloneRange.startContainer.nodeType ===
					getWindow().Node.TEXT_NODE &&
				(function (range: RangeInterface) {
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
							const { startNode, startOffset } = range;
							let markNode = startNode.parent();
							//开始节点在mark标签内
							if (
								markNode &&
								node.isMark(markNode) &&
								startOffset > 0
							) {
								const text = startNode.text();
								const leftText = text.substr(
									startOffset - 1,
									1,
								);
								//不位于零宽字符后，不处理
								if (/^\u200b$/.test(leftText)) {
									//选中上一个节点
									if (startOffset === 1) {
										const prev = markNode.prev();
										if (prev && !node.isEmpty(prev)) {
											const { startNode, startOffset } =
												range
													.cloneRange()
													.select(prev, true)
													.shrinkToTextNode()
													.collapse(false);
											range.setStart(
												startNode,
												startOffset - 1,
											);
										}
									} else {
										range.setStart(
											startNode,
											startOffset - 1,
										);
									}
								}
							}
							if (range.collapsed)
								range.select(commonAncestorContainer, true);
							change.deleteContent(range, true);
							change.apply(range);
							return true;
						}
					}
					return false;
				})(cloneRange)
			) {
				event.preventDefault();
				event['isDelete'] = true;
				change.change();
			}
			return;
		}
		const blockNode = block.closest(range.startNode);
		// 在正文里
		if (!isCard && node.isRootBlock(blockNode)) {
			event.preventDefault();
			change.mergeAfterDeletePrevNode(blockNode);
			return false;
		}
		return true;
	}
}
export default Backspace;
