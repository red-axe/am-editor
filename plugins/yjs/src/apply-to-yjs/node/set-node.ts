import { Node, SetNodeOperation } from '@aomao/engine';
import * as Y from 'yjs';
import { getYTarget } from '../../transform';

export function setNode(
	sharedRoot: Y.XmlElement,
	editorRoot: Node,
	op: SetNodeOperation,
): void {
	const { yTarget } = getYTarget(sharedRoot, editorRoot, op.path);

	if (yTarget) {
		Object.entries(op.newProperties).forEach(([key, value]) => {
			if (value === null) {
				return yTarget.removeAttribute(key);
			}

			yTarget.setAttribute(key, value);
		});

		return Object.entries(op.properties).forEach(([key]) => {
			if (!op.newProperties.hasOwnProperty(key)) {
				yTarget.removeAttribute(key);
			}
		});
	}
}
