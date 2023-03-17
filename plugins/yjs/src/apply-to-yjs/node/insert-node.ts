import { InsertNodeOperation, Node } from '@aomao/engine';
import { getYTarget, editorNodeToYNode } from '../../transform';
import * as Y from 'yjs';

export function insertNode(
	sharedRoot: Y.XmlElement,
	editorRoot: Node,
	op: InsertNodeOperation,
): void {
	const { yParent, yOffset } = getYTarget(sharedRoot, editorRoot, op.path);

	yParent.insert(yOffset, [editorNodeToYNode(op.node)]);
}
