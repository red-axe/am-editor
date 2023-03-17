import { InsertTextOperation, Node, Text } from '@aomao/engine';
import { getYTarget } from '../../transform';
import * as Y from 'yjs';

export function insertText(
	sharedRoot: Y.XmlElement,
	editorRoot: Node,
	op: InsertTextOperation,
): void {
	const { yTarget } = getYTarget(sharedRoot, editorRoot, op.path);

	const targetNode = Node.get(editorRoot, op.path);
	if (!Text.isText(targetNode)) {
		throw new Error('Cannot insert text into non-text node');
	}

	if (yTarget instanceof Y.XmlText) {
		yTarget.insert(op.offset, op.text);
	}
}
