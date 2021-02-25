import $, { isNode } from '../../node';
import deleteContent from './delete-content';
import insertNode from './insert-node';
import { NodeInterface } from '../../types/node';
import { RangeInterface } from '../../types/range';
import { getDocument } from '../../utils';

export default (
	range: RangeInterface,
	inline: NodeInterface | Node | string,
) => {
	const doc = getDocument(range.startContainer);
	if (typeof inline === 'string' || isNode(inline)) {
		inline = $(inline, doc);
	}
	// 范围为折叠状态时先删除内容
	if (!range.collapsed) {
		deleteContent(range);
	}
	// 插入新 Inline
	range = insertNode(range, inline)
		.select(inline)
		.collapse(false);

	if (inline.name !== 'br') {
		range.addOrRemoveBr();
	}

	return range;
};
