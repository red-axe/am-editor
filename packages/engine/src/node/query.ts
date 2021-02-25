import Node, { isNode } from './entry';
import { NodeInterface, Selector, Context, NodeEntry } from '../types/node';
import { getDocument, getWindow } from '../utils';
import Parse from './parse';

/**
 * 查询节点返回NodeInterface
 * @param selector 选择器
 * @param context 节点上下文，或根节点
 * @param nodeConstructor 需要使用的模型，默认 DOMNOde
 */
export default (
	selector: Selector,
	context?: Context | null | false,
	clazz?: NodeEntry,
): NodeInterface => {
	if (context === undefined) context = getDocument();
	const nodes = Parse(selector, context);
	const entry = new (clazz || Node)(nodes);
	if (
		isNode(selector) &&
		selector.nodeType === getWindow().Node.DOCUMENT_FRAGMENT_NODE
	)
		entry.isFragment = true;
	return entry;
};
