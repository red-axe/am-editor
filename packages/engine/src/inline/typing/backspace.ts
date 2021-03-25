import { EngineInterface } from '../../types';

class Backspace {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}
	/**
	 * 在inline节点处按下backspace键
	 */
	trigger(event: KeyboardEvent) {
		const { change, mark } = this.engine;
		const range = change.getRange();
		const {
			collapsed,
			endNode,
			endOffset,
			startNode,
			startOffset,
		} = range.cloneRange().shrinkToTextNode();
		if (
			endNode.type === Node.TEXT_NODE ||
			startNode.type === Node.TEXT_NODE
		) {
			if (collapsed) {
				const prev = startNode.prev();
				const text = startNode.text().substr(0, startOffset);
				if (
					prev &&
					this.engine.node.isInline(prev) &&
					/\u200B$/g.test(text)
				) {
					range.setEnd(endNode, endOffset - 1);
					range.setStart(endNode, endOffset - 1);
					change.select(range);
				}
			}
			//在inline节点内删除
			let inlineNode = mark.closestNotMark(startNode);
			if (this.engine.node.isInline(inlineNode)) {
				const text = inlineNode.text();
				if (/^\u200B\u200B$/g.test(text)) {
					//删除inline前面节点的零宽字符
					const prev = inlineNode.prev();
					const prevText = prev?.text() || '';
					if (prev && /\u200B$/g.test(prevText)) {
						if (/^\u200B$/g.test(prevText)) prev.remove();
						else prev.text(prevText.substr(0, prevText.length - 1));
					}
					//删除inline后面节点的零宽字符
					const next = inlineNode.next();
					const nextText = next?.text() || '';
					if (next && /^\u200B/g.test(nextText)) {
						if (/^\u200B$/g.test(nextText)) next.remove();
						else next.text(nextText.substr(1));
					}
					//删除内部最后一个零宽字符
					startNode.text('\u200B');
					range.setStart(startNode, startOffset);
					change.select(range);
				}
			}
			if (!collapsed) {
				inlineNode = mark.closestNotMark(endNode);
				if (this.engine.node.isInline(inlineNode)) {
					const text = inlineNode.text();
					if (/^\u200B\u200B$/g.test(text)) {
						//删除inline前面节点的零宽字符
						const prev = inlineNode.prev();
						const prevText = prev?.text() || '';
						if (prev && /\u200B$/g.test(prevText)) {
							if (/^\u200B$/g.test(prevText)) prev.remove();
							else
								prev.text(
									prevText.substr(0, prevText.length - 1),
								);
						}
						//删除inline后面节点的零宽字符
						const next = inlineNode.next();
						const nextText = next?.text() || '';
						if (next && /^\u200B/g.test(nextText)) {
							if (/^\u200B$/g.test(nextText)) next.remove();
							else next.text(nextText.substr(1));
						}
						//删除内部最后一个零宽字符
						endNode.text('\u200B');
						range.setStart(endNode, endOffset);
						change.select(range);
					}
				}
			}
		}
		return true;
	}
}
export default Backspace;
