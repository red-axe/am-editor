import isHotkey from 'is-hotkey';
import { EngineInterface, NodeInterface } from '../../types';

class Right {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	trigger(event: KeyboardEvent) {
		const { change, inline, node } = this.engine;
		const range = change.range.get().cloneRange().shrinkToTextNode();
		const { endNode, endOffset } = range;
		const card = this.engine.card.getSingleCard(range);
		if (!card && endNode.type === Node.TEXT_NODE) {
			//&#8203<inline>&#8203<cursor />&#8203</inline>&#8203 -> &#8203<inline>&#8203&#8203</inline>&#8203<cursor />
			const inlineNode = inline.closest(endNode);
			const text = endNode.text();
			//在inline节点内，靠近右侧位置
			if (node.isInline(inlineNode)) {
				if (inlineNode.isCard()) return;
				//offset 小于 文本长度 说明至少不在右侧，不处理
				if (endOffset < text.length - 1) return true;
				let next = endNode.next();
				let parent = endNode.parent();
				//位于inline 1级子节点下
				if (parent && node.isInline(parent)) {
					//后面还有节点，不处理
					if (next) return true;
					const rightText = text.substr(endOffset);
					//不位于零宽字符前，不处理
					if (!/^\u200b$/.test(rightText)) return true;
				}
				// 其它内嵌节点内，并且开始offset在最后位置，或者在倒数第一前面的位置，浏览器默认会跳出inline节点
				else if (
					endOffset === text.length ||
					endOffset === text.length - 1
				) {
					//循环判断是否处于inline节点内的第一个零宽字符前面，可能inline节点内包含多个mark或其它标签
					while (!next && parent && !node.isInline(parent)) {
						next = parent.next();
						parent = parent?.parent();
					}
					//后面有节点，并且不是 text 节点，不处理
					if (next && !next.isText()) return true;
					//后面有text节点
					if (next) {
						//不位于零宽字符前，不处理
						if (!/^\u200b$/.test(next.text())) return true;
						//选中零宽字符前面
						if (endOffset === text.length - 1) {
							event.preventDefault();
							const { collapsed } = range.cloneRange();
							range.setEnd(next, 0);
							if (collapsed) range.collapse(false);
							change.range.select(range);
							return false;
						}
					}
				} else return true;
				//让光标选择在inline节点的下一个零宽字符后面
				const inlineNext = inlineNode.next();
				const nextText = inlineNext?.text();
				if (
					inlineNext &&
					inlineNext.isText() &&
					nextText &&
					/^\u200b/.test(nextText)
				) {
					event.preventDefault();
					const { collapsed } = range.cloneRange();
					range.setEnd(inlineNext, 1);
					if (collapsed) range.collapse(false);
					change.range.select(range);
					return false;
				}
				return true;
			}
			// 在inline节点外
			else {
				let next = endNode.next();
				let parent = endNode.parent();
				let inlineNode: NodeInterface | undefined = undefined;
				//在零宽字符后面，并且后面有inline节点
				if (next) {
					if (node.isInline(next) && !next.isCard()) {
						const rightText = text.substr(endOffset);
						//不位于零宽字符前，不处理
						if (!/^\u200b$/.test(rightText)) return true;
						inlineNode = next;
					}
				}
				//后方没有节点，考虑是否在mark节点或其它节点内
				else if (endOffset === text.length) {
					//循环判断是否处于inline节点内的最后一个零宽字符前面，可能inline节点内包含多个mark或其它标签
					while (!next && parent && !node.isBlock(parent)) {
						next = parent.next();
						parent = parent?.parent();
					}
					//后面有节点，并且不是 text 节点，不处理
					if (next && !next.isText()) return true;
					//后面有text节点
					if (next) {
						//不位于零宽字符前，不处理
						if (!/^\u200b$/.test(next.text())) return true;
						//位于零宽字符前，并且零宽字符后面是inline节点
						next = next.next();
						if (next && node.isInline(next)) {
							inlineNode = next;
						} else return true;
					}
				} else return true;
				//让光标选择inline内部最第一个零宽字符后
				if (inlineNode) {
					event.preventDefault();
					const first = inlineNode.first();
					const text = first?.text();
					if (
						first &&
						first.isText() &&
						text &&
						/^\u200b/.test(text)
					) {
						const { collapsed } = range.cloneRange();
						range.setEnd(first, 1);
						if (collapsed && !isHotkey('shift+right', event)) {
							range.collapse(false);
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
export default Right;
