import { EngineInterface } from '../../types';

class Enter {
	private engine: EngineInterface;
	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	trigger(event: KeyboardEvent) {
		const { change, node, list } = this.engine;
		const range = change.range
			.get()
			.shrinkToElementNode()
			.shrinkToTextNode();
		// 选区选中最后的节点
		const blockApi = this.engine.block;
		let block = blockApi.closest(range.endNode);
		// 嵌套 block
		const parent = block.parent();
		if (parent && parent.inEditor() && node.isBlock(parent)) {
			if ('li' === parent.name && 'p' === block.name) {
				if (
					1 === block.get<Node>()?.childNodes.length &&
					'br' === block.first()?.name
				) {
					block.first()!.remove();
				}
				const selection = range.createSelection();
				change.unwrap(block);
				selection.move();
				block = blockApi.closest(range.endNode);
			}
			if (
				range.collapsed &&
				((range.startContainer.childNodes.length === 1 &&
					'BR' === range.startContainer.firstChild?.nodeName) ||
					(blockApi.isLastOffset(range, 'end') &&
						blockApi.isFirstOffset(range, 'end')))
			) {
				event.preventDefault();
				if (['li'].indexOf(parent.name) >= 0) {
					blockApi.unwrap('<'.concat(parent.name!, ' />'));
					blockApi.setBlocks('<'.concat(parent.name!, ' />'));
				} else {
					blockApi.unwrap('<'.concat(parent.name!, ' />'));
					blockApi.setBlocks('<p />');
				}
				return false;
			}
		}
		if (
			node.isBlock(block) &&
			(!parent || !node.isList(parent)) &&
			!block.isCard()
		) {
			event.preventDefault();
			blockApi.insertOrSplit(range, block);
			return false;
		}
		// 列表
		if (block.name === 'li') {
			return;
		}
		return true;
	}
}

export default Enter;
