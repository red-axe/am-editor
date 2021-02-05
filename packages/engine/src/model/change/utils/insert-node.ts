import { RangeInterface } from '../../../types/range';
import { NodeInterface } from '../../../types/node';
import { isNodeEntry } from '../../node';

export default (range: RangeInterface, node: Node | NodeInterface) => {
  if (isNodeEntry(node)) {
    if (node.length === 0) throw 'Not found node';
    node = node[0];
  }
  range.insertNode(node);
  return range
    .select(node, true)
    .shrinkToElementNode()
    .collapse(false);
};
