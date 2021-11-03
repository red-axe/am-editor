import isHotkey from 'is-hotkey';
import { EngineInterface, NodeInterface } from '../../types';

class Left {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	trigger(event: KeyboardEvent) {
		const { change, inline, node } = this.engine;
		const range = change.range.get().cloneRange().shrinkToTextNode();
		const { startNode, startOffset } = range;
		const card = this.engine.card.getSingleCard(range);
		if (!card && startNode.type === Node.TEXT_NODE) {
			//&#8203<inline>&#8203<cursor />&#8203</inline>&#8203 -> <cursor />&#8203<inline>&#8203&#8203</inline>&#8203
			const inlineNode = inline.closest(startNode);
			//在inline节点内，靠近左侧位置
			if (node.isInline(inlineNode)) {
				if (inlineNode.isCard()) return;
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
					if (!/^\u200b$/.test(leftText)) return true;
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
						if (!/^\u200b$/.test(prev.text())) return true;
					}
				} else return true;
				//让光标选择在inline节点前面节点
				const inlinePrev = inlineNode.prev();
				const prevText = inlinePrev?.text();
				if (
					inlinePrev &&
					inlinePrev.isText() &&
					prevText &&
					/\u200b$/.test(prevText)
				) {
					event.preventDefault();
					const { collapsed } = range.cloneRange();
					range.setStart(inlinePrev, prevText.length - 1);
					if (collapsed) range.collapse(true);
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
					event.preventDefault();
					const last = inlineNode.last();
					const text = last?.text();
					if (last && last.isText() && text && /\u200b$/.test(text)) {
						const { collapsed } = range.cloneRange();
						range.setStart(last, text.length - 1);
						if (collapsed && !isHotkey('shift+left', event)) {
							range.collapse(true);
						}
						change.range.select(range);
						return false;
					}
				}
			}
		}
		return true;
	}
}
export default Left;
