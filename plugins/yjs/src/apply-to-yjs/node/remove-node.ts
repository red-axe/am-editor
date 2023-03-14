import { Node, RemoveNodeOperation } from '@aomao/engine';
import * as Y from 'yjs';
import { getYTarget } from '../../transform';

export function removeNode(
	sharedRoot: Y.XmlText,
	editorRoot: Node,
	op: RemoveNodeOperation,
): void {
	const { yParent: parent, textRange } = getYTarget(
		sharedRoot,
		editorRoot,
		op.path,
	);
	parent.delete(textRange.start, textRange.end - textRange.start);
}
