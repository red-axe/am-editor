import { omit } from './object';
import { Text, Node } from '@aomao/engine';

export function getProperties<TNode extends Node>(
	node: TNode,
): Omit<TNode, TNode extends Text ? 'text' : 'children'> {
	return omit(
		node,
		(Text.isText(node) ? 'text' : 'children') as keyof TNode,
	) as Omit<TNode, TNode extends Text ? 'text' : 'children'>;
}
