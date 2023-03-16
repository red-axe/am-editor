import { Node, RemoveTextOperation } from '@aomao/engine';
import * as Y from 'yjs';
import { getYTarget } from '../../transform';

export function removeText(
	sharedRoot: Y.XmlElement,
	editorRoot: Node,
	op: RemoveTextOperation,
): void {
	const { yTarget } = getYTarget(sharedRoot, editorRoot, op.path);
	if (yTarget instanceof Y.XmlText) {
		yTarget.delete(op.offset, op.text.length);
	}
}
