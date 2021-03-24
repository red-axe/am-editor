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
		const { change } = this.engine;
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
		}
		return true;
	}
}
export default Backspace;
