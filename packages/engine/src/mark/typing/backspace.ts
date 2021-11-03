import { EngineInterface, NodeInterface } from '../../types';

class Backspace {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}
	/**
	 * 在inline节点处按下backspace键
	 */
	trigger(event: KeyboardEvent) {
		const { change, node, block } = this.engine;
		const range = change.range.get();
		const { collapsed, endNode, startNode, startOffset, endOffset } = range
			.cloneRange()
			.shrinkToTextNode();
		// 空的block节点下不处理mark
		if (collapsed) {
			const blockNode = block.closest(startNode);
			if (blockNode.length > 0 && node.isEmpty(blockNode)) {
				return;
			}
		}

		if (
			endNode.type === Node.TEXT_NODE ||
			startNode.type === Node.TEXT_NODE
		) {
			//光标展开的情况下，判断光标结束位置是否在mark节点内侧零宽字符后面，不在后面让光标选在后面
			if (!collapsed) {
				let markNode = endNode.parent();
				if (
					markNode &&
					endNode.type === Node.TEXT_NODE &&
					node.isMark(markNode)
				) {
					const text = endNode.text();
					const rightText = text.substr(endOffset);
					//不位于零宽字符前，不处理
					if (!/^\u200b$/.test(rightText)) return true;
					range.setEnd(endNode, endOffset + 1);
				}
				return true;
			}
			let markNode = startNode.parent();
			//开始节点在mark标签内
			if (
				markNode &&
				startNode.type === Node.TEXT_NODE &&
				node.isMark(markNode)
			) {
				if (startOffset < 1) return true;
				const text = startNode.text();
				const leftText = text.substr(startOffset - 1, 1);
				//不位于零宽字符后，不处理
				if (!/^\u200b$/.test(leftText)) return true;
				if (startOffset === 1) {
					const prev = markNode.prev();
					if (prev && !node.isEmpty(prev)) {
						const { startNode, startOffset } = range
							.cloneRange()
							.select(prev, true)
							.shrinkToTextNode()
							.collapse(false);
						range.setStart(startNode, startOffset - 1);
					}
					//在段落的开始位置
					else if (!prev && node.isEmpty(markNode)) {
						const parent = markNode.parent();
						const offset = markNode.getIndex();
						markNode.remove();
						if (parent)
							range.setStart(
								parent,
								offset <= 0 ? 0 : offset - 1,
							);
					}
				} else {
					range.setStart(startNode, startOffset - 1);
				}

				return true;
			}
			//mark 标签后面的零宽字符后删除零宽字符前面的字符
			markNode = startNode.prev() || undefined;
			if (
				markNode &&
				startNode.type === Node.TEXT_NODE &&
				node.isMark(markNode)
			) {
				const text = startNode.text();
				const leftText = text.substr(startOffset - 1, 1);
				//不位于零宽字符后，不处理
				if (!/^\u200b$/.test(leftText)) return true;
				if (startOffset === 1) {
					const { startNode, startOffset } = range
						.cloneRange()
						.select(markNode, true)
						.shrinkToTextNode()
						.collapse(false);
					range.setStart(startNode, startOffset - 1);
				} else {
					range.setStart(
						startNode,
						startOffset > 0 ? startOffset - 1 : 0,
					);
				}
			}
		}
		return true;
	}
}
export default Backspace;
