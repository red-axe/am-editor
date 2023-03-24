import { Node, Operation } from '@aomao/engine';
import * as Y from 'yjs';
import { NODE_MAPPER } from './node';
import { TEXT_MAPPER } from './text';
import { ApplyFunc, OpMapper } from './types';

const opMappers: OpMapper = {
	...TEXT_MAPPER,
	...NODE_MAPPER,
};

export function applyEditorOp(
	sharedRoot: Y.XmlElement,
	editorRoot: Node,
	op: Operation,
): void {
	const apply = opMappers[op.type] as ApplyFunc<typeof op>;
	if (!apply) {
		throw new Error(`Unknown operation: ${op.type}`);
	}

	apply(sharedRoot, editorRoot, op);
}
