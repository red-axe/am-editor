import { Node, Operation } from '@aomao/engine';
import * as Y from 'yjs';

export type ApplyFunc<O extends Operation = Operation> = (
	sharedRoot: Y.XmlElement,
	editorRoot: Node,
	op: O,
) => void;

export type OpMapper<O extends Operation = Operation> = {
	[K in O['type']]: O extends { type: K } ? ApplyFunc<O> : never;
};
