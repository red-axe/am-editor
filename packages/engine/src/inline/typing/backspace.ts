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
		const { change, mark, inline, node } = this.engine;
		const range = change.range.get();
		const { collapsed, endNode, startNode, startOffset } = range
			.cloneRange()
			.shrinkToTextNode();
		if (
			endNode.type === Node.TEXT_NODE ||
			startNode.type === Node.TEXT_NODE
		) {
			//光标展开的情况下，判断光标结束位置是否在inline节点内左侧零宽字符后面，并且inline节点为空
			if (!collapsed) {
				const inlineNode = inline.closest(endNode);
				if (
					node.isInline(inlineNode) &&
					!inlineNode.isCard() &&
					node.isEmpty(inlineNode)
				) {
					//offset 大于 1 说明至少不在左侧，不处理
					if (startOffset > 1) return true;
					let prev = endNode.prev();
					let parent = endNode.parent();
					//位于inline 1级子节点下
					if (parent && node.isInline(parent)) {
						//前面还有节点，不处理
						if (prev) return true;
						const text = endNode.text();
						const leftText = text.substr(0, startOffset);
						//不位于零宽字符后，不处理
						if (!/^\u200b$/.test(leftText)) return true;
						//光标结束位置选中inline节点零宽字符后
						const inlineNext = inlineNode.next();
						const nextText = inlineNext?.text();
						if (
							inlineNext &&
							inlineNext.isText() &&
							nextText &&
							/^\u200b/.test(nextText)
						) {
							range.setEnd(inlineNext, 1);
							return false;
						}
					}
				}
				if (node.isInline(inlineNode) && !inlineNode.isCard()) {
					setTimeout(() => {
						inline.repairCursor(inlineNode);
					}, 100);
				}
				return true;
			}
			let inlineNode = inline.closest(startNode);
			//开始节点在inline标签内
			if (node.isInline(inlineNode)) {
				if (inlineNode.isCard()) return true;
				//offset 大于 1 说明至少不在左侧，不处理
				if (startOffset > 1) return true;
				let prev = startNode.prev();
				let parent = startNode.parent();
				//位于inline 1级子节点下
				if (parent && node.isInline(parent)) {
					//前面还有节点，不处理
					if (prev) return true;
					const text = startNode.text();
					const leftText = text.substr(0, startOffset);
					//不位于零宽字符后，不处理
					if (!/\u200b$/.test(leftText)) return true;
				}
				// 其它内嵌节点内
				else if (startOffset === 0) {
					//循环判断是否处于inline节点内的第一个零宽字符后面，可能inline节点内包含多个mark或其它标签
					while (!prev && parent && !node.isInline(parent)) {
						prev = parent.prev();
						parent = parent?.parent();
					}
					//前面有节点，并且不是 text 节点，不处理
					if (prev && !prev.isText()) return true;
					//前面有text节点
					if (prev) {
						//不位于零宽字符后，不处理
						if (!/\u200b$/.test(prev.text())) return true;
					}
				} else return true;
				//让光标选择在inline节点前面零宽字符节点前面
				const inlinePrev = inlineNode.prev();
				const prevText = inlinePrev?.text();
				if (
					inlinePrev &&
					inlinePrev.isText() &&
					prevText &&
					/\u200b$/.test(prevText)
				) {
					range.setStart(inlinePrev, prevText.length - 1);
					//如果inlne节点中没有内容了，选择在inline标签前后零宽字符两侧
					if (node.isEmpty(inlineNode)) {
						const inlineNext = inlineNode.next();
						const nextText = inlineNext?.text();
						if (
							inlineNext &&
							inlineNext.isText() &&
							nextText &&
							/^\u200b/.test(nextText)
						) {
							range.setEnd(inlineNext, 1);
						}
					} else {
						range.collapse(true);
					}
					change.range.select(range);
					return false;
				}
				return true;
			}
			// 在inline节点外
			else {
				let prev = startNode.prev();
				let parent = startNode.parent();
				let inlineNode: NodeInterface | undefined = undefined;
				//在零宽字符后面，并且前面有inline节点
				if (prev) {
					if (node.isInline(prev) && !prev.isCard()) {
						const text = startNode.text();
						const leftText = text.substr(0, startOffset);
						//不位于零宽字符后，不处理
						if (!/^\u200b$/.test(leftText)) return true;
						inlineNode = prev;
					}
				}
				//前方没有节点，考虑是否在mark节点或其它节点内
				else if (startOffset === 0) {
					//循环判断是否处于inline节点内的第一个零宽字符后面，可能inline节点内包含多个mark或其它标签
					while (!prev && parent && !node.isBlock(parent)) {
						prev = parent.prev();
						parent = parent?.parent();
					}
					//前面有节点，并且不是 text 节点，不处理
					if (prev && !prev.isText()) return true;
					//前面有text节点
					if (prev) {
						//不位于零宽字符后，不处理
						if (!/^\u200b$/.test(prev.text())) return true;
						//位于零宽字符后，并且零宽字符前面是inline节点
						prev = prev.prev();
						if (prev && node.isInline(prev)) {
							inlineNode = prev;
						} else return true;
					}
				} else return true;
				//让光标选择inline内部最后一个零宽字符前
				if (inlineNode) {
					const last = inlineNode.last();
					const text = last?.text();
					if (last && last.isText() && text && /\u200b$/.test(text)) {
						event.preventDefault();
						range.setStart(last, text.length - 1);
						range.collapse(true);
						change.range.select(range);
						return false;
					}
				}
			}
		}
		return true;
	}
}
export default Backspace;
