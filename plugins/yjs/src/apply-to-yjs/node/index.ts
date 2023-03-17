import { NodeOperation } from '@aomao/engine';
import { OpMapper } from '../types';
import { insertNode } from './insert-node';
import { removeNode } from './remove-node';
import { setNode } from './set-node';

export const NODE_MAPPER: OpMapper<NodeOperation> = {
	insert_node: insertNode,
	remove_node: removeNode,
	set_node: setNode,
};
