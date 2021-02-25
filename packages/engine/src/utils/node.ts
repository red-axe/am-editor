import md5 from 'blueimp-md5';
import $, { isNodeEntry } from '../node';
import {
	CARD_KEY,
	READY_CARD_KEY,
	CARD_SELECTOR,
	CARD_TYPE_KEY,
} from '../constants/card';
import { ANCHOR, FOCUS, CURSOR } from '../constants/selection';
import { MARK_ELEMENTID_MAP, ROOT_TAG_MAP } from '../constants/tags';
import { Level } from '../constants/semantics';
import { INDENT_KEY } from '../constants/indent';
import { isSameList } from './list';
import { toCamelCase, getStyleMap } from './string';
import { NodeInterface } from '../types/node';
import { RangeInterface } from '../types/range';
import { DATA_ELEMENT } from '../constants/root';
import Range from '../range';

/**
 * 获取样式名称
 * @param className 全部样式名称
 * @param aticallyFontsize 是否整理data-fontsize-12为data-fontsize
 */
const getClassNames = (className: string, aticallyFontsize: boolean) => {
	return className
		? aticallyFontsize
			? className
					.trim()
					.replace(/\bdata-fontsize-\d+/g, 'data-fontsize')
					.split(/\s+/)
			: className.trim().split(/s+/)
		: [];
};

/**
 * 对比两个节点是否一致包括属性、样式
 * @param node1 节点1
 * @param node2 节点2
 */
export const comparisonNode = (
	domNode1: NodeInterface,
	domNode2: NodeInterface,
	aticallyFontsize: boolean = false,
) => {
	if (domNode1.name !== domNode2.name) {
		return false;
	}
	//删除样式
	const attrs1 = domNode1.attr();
	delete attrs1['style'];

	const attrs2 = domNode2.attr();
	delete attrs2['style'];

	//获取style
	const styles1 = domNode1.css();
	const styles2 = domNode2.css();
	delete attrs1['class'];
	delete attrs2['class'];
	//获取class
	const class1 = getClassNames(
		domNode1.get<Element>()?.className || '',
		!aticallyFontsize,
	);
	const class2 = getClassNames(
		domNode2.get<Element>()?.className || '',
		!aticallyFontsize,
	);

	return (
		(Object.keys(attrs1).length === 0 &&
			Object.keys(attrs2).length === 0 &&
			Object.keys(styles1).length === 0 &&
			Object.keys(styles2).length === 0 &&
			class1.length === 0 &&
			class2.length === 0) ||
		(Object.keys(attrs1).length === Object.keys(attrs2).length &&
			Object.keys(styles1).length === Object.keys(styles2).length &&
			class1.length === class2.length &&
			!!Object.keys(attrs1).every(attr => attrs2[attr]) &&
			!!Object.keys(styles1).every(style =>
				aticallyFontsize
					? styles2[style] === styles1[style]
					: styles2[style] &&
					  class1.every(c => class2.indexOf(c) !== -1),
			))
	);
};

export const getDocument = (node?: Node): Document => {
	if (
		typeof document === 'undefined' &&
		typeof global['__amWindow'] === 'undefined'
	)
		throw 'document is not defined,If you are using ssr, you can assign a value to the `__amWindow` global variable.';

	return node
		? node.ownerDocument || node['document'] || node
		: typeof document === 'undefined'
		? global['__amWindow'].document
		: document;
};

export const getWindow = (node?: Node): Window & typeof globalThis => {
	if (
		typeof window === 'undefined' &&
		typeof global['__amWindow'] === 'undefined'
	)
		throw 'window is not defined,If you are using ssr, you can assign a value to the `__amWindow` global variable.';
	const win = typeof window === 'undefined' ? global['__amWindow'] : window;
	if (!node) return win;
	const document = getDocument(node);
	return document['parentWindow'] || document.defaultView || win;
};

/**
 * 移除占位符 \u200B
 * @param root 节点
 */
export const removeZeroWidthSpace = (root: NodeInterface) => {
	root.traverse(child => {
		const node = child[0];
		if (node.nodeType !== getWindow().Node.TEXT_NODE) {
			return;
		}
		const text = node.nodeValue;
		if (text?.length !== 2) {
			return;
		}
		if (
			text.charCodeAt(1) === 0x200b &&
			node.nextSibling &&
			node.nextSibling.nodeType === getWindow().Node.ELEMENT_NODE &&
			[ANCHOR, FOCUS, CURSOR].indexOf(
				(<Element>node.nextSibling).getAttribute(DATA_ELEMENT) || '',
			) >= 0
		) {
			return;
		}

		if (text.charCodeAt(0) === 0x200b) {
			const newNode = (<Text>node).splitText(1);
			if (newNode.previousSibling)
				newNode.parentNode?.removeChild(newNode.previousSibling);
		}
	});
};

/**
 * 删除两边的 Br 标签
 * @param node 节点
 */
export const removeSideBr = (node: NodeInterface) => {
	// 删除第一个 BR
	const firstNode = node.first();
	if (firstNode && firstNode.name === 'br' && node.children().length > 1) {
		firstNode.remove();
	}
	// 删除最后一个 BR
	const lastNode = node.last();
	if (lastNode && lastNode.name === 'br' && node.children().length > 1) {
		lastNode.remove();
	}
};

/**
 * 替换Pre标签
 * @param node 节点
 */
const replacePre = (node: NodeInterface) => {
	const firstNode = node.first();
	if (firstNode && 'code' !== firstNode.name) {
		const html = node.html();
		html.split(/\r?\n/).forEach(temHtml => {
			temHtml = temHtml
				.replace(/^\s/, '&nbsp;')
				.replace(/\s$/, '&nbsp;')
				.replace(/\s\s/g, ' &nbsp;')
				.trim();
			if ('' === temHtml) {
				temHtml = '<br />';
			}
			node.before('<p>'.concat(temHtml, '</p>'));
		});
		node.remove();
	}
};

/**
 * 查找Block节点的一级节点。如 div -> H2 返回 H2节点
 * @param parentNode 父节点
 * @param childNode 子节点
 */
const findBlockRoot = (parentNode: NodeInterface, childNode: NodeInterface) => {
	//如果父节点没有级别或者子节点没有级别就返回子节点
	if (!Level[parentNode.name!] || !Level[childNode.name!]) return childNode;
	//如果父节点的级别大于子节点的级别就返回节点
	if (Level[parentNode.name!] > Level[childNode.name!]) return parentNode;
	//如果父节点是 ul、ol 这样的List列表，并且子节点也是这样的列表
	if (
		['ul', 'ol'].includes(parentNode.name!) &&
		['ul', 'ol'].includes(childNode.name!)
	) {
		const childIndent = parseInt(childNode.attr(INDENT_KEY), 10) || 0;
		const parentIndent = parseInt(parentNode.attr(INDENT_KEY), 10) || 0;
		childNode.attr(
			INDENT_KEY,
			parentIndent ? parentIndent + 1 : childIndent + 1,
		);
	}
	//默认返回子节点
	return childNode;
};

/**
 * 整理块级节点
 * @param domNode 节点
 * @param root 根节点
 */
const flattenBlock = (domNode: NodeInterface, root: NodeInterface) => {
	//获取父级节点
	let parentNode = domNode[0].parentNode;
	const rootElement = root.isFragment ? root[0].parentNode : root[0];
	//在根节点内循环
	while (parentNode !== rootElement) {
		const domParentNode = $(parentNode || []);
		//如果是内容节点，就在父节点前面插入
		if (domNode.isCard()) domParentNode.before(domNode);
		else if (
			//如果是li标签，并且父级是 ol、ul 列表标签
			(['ol', 'ul'].includes(domParentNode.name!) &&
				'li' === domNode.name) ||
			//如果是父级blockquote标签，并且当前节点是根节点标签，并且不是 blockquote
			('blockquote' === domParentNode.name &&
				ROOT_TAG_MAP[domNode.name!] &&
				'blockquote' !== domNode.name)
		) {
			//复制节点
			const cloneNode = domParentNode.clone(false);
			//追加到复制的节点
			cloneNode.append(domNode);
			//设置新的节点
			domNode = cloneNode;
			//将新的节点插入到父节点之前
			domParentNode.before(domNode);
		} else {
			domNode = setNode(
				domNode,
				findBlockRoot(domParentNode, domNode).clone(false),
			);
			domParentNode.before(domNode);
		}
		//如果没有子节点就移除
		if (!domParentNode.first()) domParentNode.remove();
		//设置新的父节点
		parentNode = domNode[0].parentNode;
	}
	if ('pre' === domNode.name) replacePre(domNode);
};

/**
 * 整理节点
 * @param node 节点
 * @param root 根节点
 */
export const flatten = (node: NodeInterface, root: NodeInterface = node) => {
	//第一个子节点
	let childNode = node.first();
	const rootElement = root.isFragment ? root.get()?.parentNode : root.get();
	const tempNode = node.isFragment ? $('<p />') : node.clone(false);
	while (childNode) {
		//获取下一个兄弟节点
		let nextNode = childNode.next();
		//如果当前子节点是块级的Card组件或者是表格，或者是简单的block
		if (
			childNode.isBlockCard() ||
			childNode.isTable() ||
			childNode.isSimpleBlock()
		)
			flattenBlock(childNode, $(rootElement || []));
		//如果当前是块级标签，递归循环
		else if (childNode.isBlock()) flatten(childNode, $(rootElement || []));
		else {
			const cloneNode = tempNode.clone(false);
			const isLI = 'li' === cloneNode.name;
			childNode.before(cloneNode);
			while (childNode) {
				nextNode = childNode.next();
				const isBR = 'br' === childNode.name && !isLI;
				cloneNode.append(childNode);
				if (isBR || !nextNode || nextNode.isBlock()) break;
				childNode = nextNode;
			}
			removeSideBr(cloneNode);
			flattenBlock(cloneNode, $(rootElement || []));
		}
		childNode = nextNode;
	}
	//如果没有子节点了，就移除当前这个节点
	childNode = node.first();
	if (!childNode) node.remove();
};

/**
 * 合并两个节点的子节点
 * @param prevNode 当前节点
 * @param nextNode 要合并的节点
 */
export const mergeChildNode = (
	prevNode: NodeInterface,
	nextNode: NodeInterface,
) => {
	let nextChildNode = nextNode.first();
	//循环要合并节点的子节点
	while (nextChildNode) {
		const next = nextChildNode.next();
		prevNode.append(nextChildNode);
		nextChildNode = next;
	}
	nextNode.remove();
};

/**
 * 合并两个相同的相邻节点的子节点，通常是 blockquote、ul、ol 标签
 * @param node 当前节点
 */
export const mergeAdjacentNode = (node: NodeInterface) => {
	//获取第一个子节点
	let childDom: NodeInterface | null = node.first();
	//遍历全部子节点
	while (childDom) {
		//获取下一个子节点
		let nextNode = childDom.next();
		while (
			//如果下一个子节点不为空，并且与上一个子节点名称一样
			nextNode &&
			childDom.name === nextNode.name &&
			//并且上一个节点是 blockquote 或者是 ul、li 并且list列表类型是一致的
			('blockquote' === childDom.name ||
				(['ul', 'ol'].includes(childDom.name || '') &&
					isSameList(childDom, nextNode)))
		) {
			//获取下一个节点的下一个节点
			const nNextNode = nextNode.next();
			//合并下一个节点
			mergeChildNode(childDom, nextNode);
			//继续合并当前子节点的子节点
			mergeAdjacentNode(childDom);
			nextNode = nNextNode;
		}
		childDom = nextNode;
	}
};

/**
 * 标准化节点
 * @param node 节点
 */
export const normalize = (node: NodeInterface) => {
	flatten(node);
	mergeAdjacentNode(node);
};

/**
 * 移除值为负的样式
 * @param node 节点
 * @param style 样式名称
 */
export const removeMinusStyle = (node: NodeInterface, style: string) => {
	if (node.isBlock()) {
		const val = parseInt(node.css(style), 10) || 0;
		if (val < 0) node.css(style, '');
	}
};

/**
 * 将旧节点的子节点追加到新节点，并返回新节点
 * @param oldNode 旧节点
 * @param newNode 新节点
 */
export const setNode = (oldNode: NodeInterface, newNode: NodeInterface) => {
	const domOldNode = oldNode;
	const domNewNode = newNode.clone(false);
	let childNode = domOldNode.first();

	while (childNode) {
		const nextNode = childNode.next();
		domNewNode.append(childNode);
		childNode = nextNode;
	}

	return domOldNode.replaceWith(domNewNode);
};

/**
 * 设置节点属性
 * @param node 节点
 * @param props 属性
 */
export const setNodeProps = (node: NodeInterface, props: any) => {
	let { style, ...attrs } = props;
	Object.keys(attrs).forEach(key => {
		if (key === 'className') {
			const value = attrs[key];
			if (Array.isArray(value)) {
				value.forEach(name => node.addClass(name));
			} else node.addClass(value);
		} else node.attr(key, attrs[key].toString());
	});
	if (typeof style === 'number') style = {};
	if (typeof style === 'string') style = getStyleMap(style);
	Object.keys(style || {}).forEach(key => {
		let val = (<{ [k: string]: string | number }>style)[key];
		if (/^0(px|em)?$/.test(val.toString())) {
			val = '';
		}

		node.css(key, val.toString());
	});

	return node;
};

/**
 * 合并节点
 * @param toNode 合并的节点
 * @param fromNode 需要合并的节点
 * @param remove 合并后是否移除
 */
export const mergeNode = (
	toNode: NodeInterface,
	fromNode: NodeInterface,
	remove: boolean = true,
) => {
	//要合并的节点是文本，就直接追加
	if (fromNode.isText()) {
		toNode.append(fromNode);
		return;
	}

	let mergedNode = fromNode;
	const toIsList = ['ul', 'ol'].includes(toNode.name || '');
	const fromIsList = ['ul', 'ol'].includes(fromNode.name || '');
	// p 与列表合并时需要做特殊处理
	if (toIsList && !fromIsList) {
		const liBlocks = toNode.find('li');
		//没有li标签
		if (liBlocks.length === 0) {
			return;
		}
		//设置被合并节点为最后一个li标签
		toNode = $(liBlocks[liBlocks.length - 1]);
	}
	//被合并的节点为列表
	if (!toIsList && fromIsList) {
		//查找li节点
		const liBlocks = fromNode.find('li');
		if (liBlocks.length > 0) {
			//设置需要合并的节点为第一个li节点
			fromNode = $(liBlocks[0]);
		}
		if (liBlocks[1]) {
			mergedNode = $(liBlocks[0]);
		}
	}
	//被合并的节点最后一个子节点为br，则移除
	const toNodeLast = toNode.last();
	let child = fromNode.first();
	//循环追加
	while (child) {
		const next = child.next();
		//如果是title标签，移除字体大小样式
		if (toNode.isTitle()) {
			removeFontSize(child);
		}
		//追加到要合并的列表中
		toNode.append(child);
		child = next;
	}
	//移除需要合并的节点
	if (remove) mergedNode.remove();

	if (toNodeLast && toNodeLast.name === 'br') {
		let next = toNodeLast.next();
		while (next) {
			if ([CURSOR, ANCHOR, FOCUS].indexOf(next.attr(DATA_ELEMENT))) {
				toNodeLast.remove();
				break;
			}
			next = next.next();
		}
	}
};

/**
 * 去除包裹
 * @param node 需要去除包裹的节点
 */
export const unwrapNode = (domNode: NodeInterface) => {
	let childNode = domNode.first();
	while (childNode) {
		const next = childNode.next();
		domNode?.before(childNode);
		childNode = next;
	}
	domNode.remove();
};

/**
 * 包裹mark节点
 * node: <em><strong>foo</strong></em>
 * otherNode: <strong></strong>
 * result : <strong><em>foo</em></strong>
 * @param node 需要包裹的节点
 * @param outerNode 包裹节点
 */
export const wrapMarkNode = (node: NodeInterface, outerNode: NodeInterface) => {
	outerNode.append(node.clone(true));
	const children = outerNode.allChildren();
	children.forEach(child => {
		const domChildNode = $(child);
		if (domChildNode.isMark() && comparisonNode(domChildNode, outerNode)) {
			unwrapNode(domChildNode);
		}
	});
	return node.replaceWith(outerNode);
};

/**
 * 查找两个mark节点相同的样式
 * @param mark1 mark节点
 * @param mark2 mark节点
 */
const findMarkSameStyle = (mark1: NodeInterface, mark2: NodeInterface) => {
	const mark1Css = mark1.css();
	const mark2Css = mark2.css();
	const mark1Class = mark1.attr('class');
	const mark2Class = mark2.attr('class');
	const markCssAttr: { [k: string]: boolean } = {};
	const markClassAttr: { [k: string]: boolean } = {};
	//比较style
	if (Object.keys(mark1Css).length < Object.keys(mark2Css).length) {
		Object.keys(mark1Css).forEach(attr => {
			if (mark2Css[attr]) {
				markCssAttr[attr] = true;
			}
		});
	} else {
		Object.keys(mark2Css).forEach(attr => {
			if (mark1Css[attr]) {
				markCssAttr[attr] = true;
			}
		});
	}
	//比较fontsize
	if (
		mark1Class &&
		mark2Class &&
		mark1Class.indexOf('data-fontsize-') > -1 &&
		mark2Class.indexOf('data-fontsize-') > -1
	) {
		markClassAttr['font-size'] = true;
	}
	return { ...markCssAttr, ...markClassAttr };
};

/**
 * 包裹节点
 * @param node 需要包裹的节点
 * @param outerNode 包裹节点
 */
export const wrapNode = (node: NodeInterface, outerNode: NodeInterface) => {
	outerNode = outerNode.clone(false);
	// 文本节点
	if (node.isText()) {
		outerNode.append(node.clone(false));
		return node.replaceWith(outerNode);
	}

	// 包裹样式节点
	if (outerNode.isMark()) {
		let wrapedNode;
		//合并样式
		if (node.name === 'span' && outerNode.name === 'span') {
			const attrs = outerNode.attr();
			delete attrs.style;
			Object.keys(attrs).forEach(key => {
				node.attr(key, attrs[key]);
			});

			const styles = outerNode.css();
			Object.keys(styles).forEach(key => {
				node.css(key, styles[key]);
			});
			wrapedNode = node;
		} else {
			wrapedNode = wrapMarkNode(node, outerNode);
		}
		//循环子节点，整理mark标签
		const children = wrapedNode.allChildren();
		children.forEach(child => {
			const domChildNode = $(child);
			if (domChildNode.isMark()) {
				const markStyles = findMarkSameStyle(domChildNode, node);
				Object.keys(markStyles).forEach(styleName => {
					if ('font-size' !== styleName) {
						//移除样式
						const element = <HTMLElement>node[0];
						element.style.removeProperty(toCamelCase(styleName));
					} else {
						//移除fontsize
						const classVal = node.attr('class');
						node.attr(
							'class',
							classVal.replace(/data-fontsize-[0-9]{1,5}/, ''),
						);
					}
				});
			}
		});
		return wrapedNode;
	}
	// 其它情况
	const shadowNode = node.clone(false);
	node.after(shadowNode);
	outerNode.append(node);
	return shadowNode.replaceWith(outerNode);
};

/**
 * 生成 cursor 左侧或右侧的节点，放在一个和父节点一样的容器里
 * isLeft = true：左侧
 * isLeft = false：右侧
 * @param param0
 */
export const createSideBlock = ({
	block,
	range,
	isLeft,
	clone = false,
	keepID = false,
}: {
	block: Node;
	range: RangeInterface;
	isLeft: boolean;
	clone?: boolean;
	keepID?: boolean;
}) => {
	const domBlock = $(block);
	const newRange = Range.create(domBlock.doc!);

	if (isLeft) {
		newRange.select(domBlock, true);
		newRange.setEnd(range.startContainer, range.startOffset);
	} else {
		newRange.select(domBlock, true);
		newRange.setStart(range.endContainer, range.endOffset);
	}

	const fragement = clone
		? newRange.cloneContents()
		: newRange.extractContents();
	const dupBlock = keepID
		? domBlock.cloneKeepID(false)
		: domBlock.clone(false);
	dupBlock.append(fragement);
	if (clone) {
		dupBlock.find(CARD_SELECTOR).each(card => {
			const domCard = $(card);
			const cardName = domCard.attr(CARD_KEY);
			domCard.attr(READY_CARD_KEY, cardName);
			domCard.removeAttr(CARD_KEY);
		});
	}
	return dupBlock;
};

/**
 * br 换行改成段落
 * @param block 节点
 */
export const brToParagraph = (block: NodeInterface) => {
	// 没有子节点
	if (!block.first()) {
		return;
	}
	// 只有一个节点
	if (block.children().length === 1) {
		return;
	}
	if (block.isTable()) return;
	if ('li' === block.name) return;
	// 只有一个节点（有光标标记节点）
	if (
		(block.children().length === 2 &&
			block.first()?.attr(DATA_ELEMENT) === CURSOR) ||
		block.last()?.attr(DATA_ELEMENT) === CURSOR
	) {
		return;
	}

	let container;
	let prevContainer;
	let node = block.first();

	while (node) {
		const next = node.next();
		if (!container || node.name === 'br') {
			prevContainer = container;
			container = block.clone(false);
			block.before(container);
		}
		if (node.name !== 'br') {
			container.append(node);
		}
		if (
			(node.name === 'br' || !next) &&
			prevContainer &&
			!prevContainer.first()
		) {
			prevContainer.append($('<br />'));
		}
		node = next;
	}

	if (container && !container.first()) {
		container.remove();
	}
	block.remove();
};

/**
 * 移除一个节点下的所有空 Mark，通过 callback 可以设置其它条件
 * @param root 节点
 * @param callback 回调
 */
export const removeEmptyMarks = (
	root: NodeInterface,
	callback?: (node: NodeInterface) => boolean,
) => {
	const children = root.allChildren();
	children.forEach(child => {
		const domChild = $(child);
		if (
			domChild.isEmpty() &&
			domChild.isMark() &&
			(!callback || callback(domChild))
		) {
			unwrapNode(domChild);
		}
	});
};

const isFontsize = (node: Node) => {
	const element = <Element>node;
	return (
		!element.className || -1 === element.className.indexOf('data-fontsize-')
	);
};

/**
 * 判断是不是可移除的 Mark
 * @param node 节点
 * @param mark mark节点
 */
export const canRemoveMark = (node: NodeInterface, mark?: NodeInterface) => {
	if (node.isCard()) return false;
	if (!mark || mark.length === 0) return true;
	return (
		isFontsize(mark[0]) === isFontsize(node[0]) &&
		comparisonNode(node, mark)
	);
};

/**
 * 从下开始往上遍历删除空 Mark，当遇到空 Block，添加 BR 标签
 * @param node 节点
 * @param addBr 是否添加br
 */
export const removeEmptyMarksAndAddBr = (
	node: NodeInterface | undefined,
	addBr?: boolean,
) => {
	if (
		!node ||
		node.length === 0 ||
		node.isRoot() ||
		node.isCard() ||
		node.attr(DATA_ELEMENT)
	) {
		return;
	}

	if (!node.attr(DATA_ELEMENT)) {
		const parent = node.parent();
		// 包含光标标签
		// <p><strong><cursor /></strong></p>
		if (node.children().length === 1 && node.first()?.attr(DATA_ELEMENT)) {
			if (node.isMark()) {
				node.before(node.first()!);
				node.remove();
				removeEmptyMarksAndAddBr(parent, true);
			} else if (addBr && node.isBlock()) {
				node.prepend('<br />');
			}
			return;
		}

		const html = node.html();

		if (html === '' || html === '\u200B') {
			if (node.isMark()) {
				node.remove();
				removeEmptyMarksAndAddBr(parent, true);
			} else if (addBr && node.isBlock()) {
				node.html('<br />');
			}
		}
	}
};

/**
 * 移除元素的fontsize
 */
export const removeFontSize = (node: NodeInterface) => {
	const classValue = node.attr('class');
	if (classValue) {
		node.attr('class', classValue.replace(/data-fontsize-[\d]{1,2}/, ''));
	}
};

/**
 * 具有 block css 属性的行内Card
 * @param cardRoot 节点
 */
export const inlineCardHasBlockStyle = (cardRoot: NodeInterface) => {
	return (
		cardRoot.attr(CARD_TYPE_KEY) === 'inline' &&
		cardRoot.css('display') === 'block'
	);
};

/**
 * 移除空的文本节点，并连接相邻的文本节点
 * @param node 节点
 */
export const combinTextNode = (node: NodeInterface | Node) => {
	if (isNodeEntry(node)) node = node[0];
	node.normalize();
};

/**
 * 获取批量追加子节点后的outerHTML
 * @param nodes 节点集合
 * @param appendExp 追加的节点
 */
export const getBatchAppendHTML = (
	nodes: Array<NodeInterface>,
	appendExp: string,
) => {
	if (nodes.length === 0) return appendExp;
	let appendNode = $(appendExp);
	nodes.forEach(node => {
		node = node.clone(false);
		node.append(appendNode);
		appendNode = node;
	});
	return appendNode.get<Element>()?.outerHTML!;
};

const createElementID = (node: HTMLElement, index: number) => {
	const name = node.nodeName.toLowerCase();
	const id =
		md5(
			''
				.concat(name, '_')
				.concat(index.toString(), '_')
				.concat(node.innerText),
		) +
		'_' +
		name +
		'_' +
		index.toString();
	node.setAttribute('data-id', id);
	return id;
};

export const generateElementID = (
	root: Element,
	node: HTMLElement,
): string | null => {
	const { nodeName } = node;
	const id = node.getAttribute('data-id');
	if (id) return id;
	const nodes = root.querySelectorAll(nodeName);
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i] === node) return createElementID(node, i);
	}
	return null;
};
export const generateElementIDForDescendant = (root: Element) => {
	Object.keys(MARK_ELEMENTID_MAP).forEach(nodeName => {
		const nodes = root.querySelectorAll(nodeName);
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			if (!node.getAttribute('data-id'))
				createElementID(node as HTMLElement, i);
		}
	});
};
export const generateRandomID = (node: Element, isCreate: boolean = false) => {
	if (!isCreate) {
		const id = node.getAttribute('data-id');
		if (id) return id;
	}
	const id = md5(
		''.concat(Math.random().toString(), '_').concat(Date.now().toString()),
	);
	node.setAttribute('data-id', id);
	return id;
};
export const generateRandomIDForDescendant = (
	node: Node,
	isCreate: boolean = false,
) => {
	if (
		node.nodeType === getWindow().Node.ELEMENT_NODE ||
		node.nodeType === getWindow().Node.DOCUMENT_FRAGMENT_NODE
	) {
		Object.keys(MARK_ELEMENTID_MAP).forEach(nodeName => {
			const nodes = (node as Element | DocumentFragment).querySelectorAll(
				nodeName,
			);
			for (let i = 0; i < nodes.length; i++) {
				generateRandomID(nodes[i], isCreate);
			}
		});
	}
};

export const needMarkElementID = (name: string) => {
	return !!MARK_ELEMENTID_MAP[name.toLowerCase()];
};
