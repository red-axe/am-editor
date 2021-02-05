import Node, { isNode } from './entry';
import Parse from './parse';
import { NodeInterface, Selector, Context, NodeEntry } from '../../types/node';
import { getWindow } from '../../utils';

/**
 * 解析节点返回NodeInterface
 * @param selector 选择器或元素节点
 * @param context 节点上下文，或根节点
 * @param nodeConstructor 需要使用的模型，默认 DOMNOde
 */
export default (
  selector: Selector,
  context?: Context,
  clazz: NodeEntry = Node,
): NodeInterface => {
  const nodes = Parse(selector, context);
  const entry = new clazz(nodes);
  if (
    isNode(selector) &&
    selector.nodeType === getWindow().Node.DOCUMENT_FRAGMENT_NODE
  )
    entry.isFragment = true;
  return entry;
};
