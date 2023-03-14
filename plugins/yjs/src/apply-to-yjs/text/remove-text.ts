import { Node, RemoveTextOperation } from '@aomao/engine';
import type Y from 'yjs';
import { getYTarget } from '../../transform';

export function removeText(
	sharedRoot: Y.XmlText,
	editorRoot: Node,
	op: RemoveTextOperation,
): void {
	const { yParent: target, textRange } = getYTarget(
		sharedRoot,
		editorRoot,
		op.path,
	);
	target.delete(textRange.start + op.offset, op.text.length);
}
