import {
	CARD_EDITABLE_KEY,
	CARD_ELEMENT_KEY,
	CARD_KEY,
	CARD_SELECTOR,
	CARD_TYPE_KEY,
} from '../constants';
import {
	EditorInterface,
	EngineInterface,
	InlineModelInterface,
	NodeInterface,
	RangeInterface,
} from '../types';
import { getDocument, isEngine } from '../utils';
import { Backspace, Left, Right } from './typing';
import { $ } from '../node';
import { isNode } from '../node/utils';
import { isRangeInterface } from '../range';
import type { SchemaInterface } from '../types/schema';

class Inline implements InlineModelInterface {
	private editor: EditorInterface;

	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	init() {
		const editor = this.editor;
		if (isEngine(editor)) {
			const { typing, event } = editor;
			//删除事件
			const backspace = new Backspace(editor);
			typing
				.getHandleListener('backspace', 'keydown')
				?.on((event) => backspace.trigger(event));
			//左方向键
			const left = new Left(editor);
			typing
				.getHandleListener('left', 'keydown')
				?.on((event) => left.trigger(event));
			//右方向键
			const right = new Right(editor);
			typing
				.getHandleListener('right', 'keydown')
				?.on((event) => right.trigger(event));
		}
	}

	/**
	 * 修复光标选区位置，&#8203;<a>&#8203;<anchor />acde<focus />&#8203;</a>&#8203; -> <anchor />&#8203;<a>&#8203;acde&#8203;</a>&#8203;<focus />
	 * 否则在ot中，可能无法正确的应用inline节点两边&#8203;的更改
	 */
	repairRange(range?: RangeInterface) {
		const { change, node } = this.editor as EngineInterface;
		range = range || change.range.get();
		const { startNode, startOffset, endNode, endOffset, collapsed } = range;
		if (collapsed) return range;
		const startInline = this.closest(startNode);
		//让其选中节点外的 \u200b 零宽字符
		if (startInline && node.isInline(startInline) && startOffset <= 1) {
			//检测是否处于inline标签内部左侧
			let atBefore = true;
			let childNode: NodeInterface | undefined = startNode;
			while (childNode && !childNode.equal(startInline)) {
				if (childNode.prev()) {
					atBefore = false;
					break;
				}
				childNode = childNode.parent();
			}
			if (atBefore) {
				const prev = startInline.prev();
				const text = prev?.text() || '';
				if (prev && prev.isText() && /\u200B$/g.test(text)) {
					range.setStart(prev, text.length - 1);
				}
			}
		}

		const endInline = this.closest(endNode);
		const last = endInline.last();
		if (
			endInline &&
			node.isInline(endInline) &&
			last &&
			endNode.equal(last) &&
			endOffset >= last.text().length - 1
		) {
			//检测是否处于inline标签内部右侧
			let atAfter = true;
			let childNode: NodeInterface | undefined = startNode;
			while (childNode && !childNode.equal(endInline)) {
				if (childNode.next()) {
					atAfter = false;
					break;
				}
				childNode = childNode.parent();
			}
			if (atAfter) {
				const next = endInline.next();
				const text = next?.text() || '';
				if (next && next.isText() && /^\u200B/g.test(text)) {
					range.setEnd(next, 1);
				}
			}
		}
		return range;
	}

	/**
	 * 获取最近的 Inline 节点，找不到返回 node
	 */
	closest(source: NodeInterface) {
		const nodeApi = this.editor.node;
		let node = source.parent();
		while (node && !node.isEditable() && !nodeApi.isBlock(node)) {
			if (nodeApi.isInline(node)) return node;
			const parentNode = node.parent();
			if (!parentNode) break;
			node = parentNode;
		}
		return source;
	}
	/**
	 * 获取向上第一个非 Inline 节点
	 */
	closestNotInline(node: NodeInterface) {
		const nodeApi = this.editor.node;
		while (
			nodeApi.isInline(node) ||
			nodeApi.isMark(node) ||
			node.isText()
		) {
			if (node.isEditable()) break;
			const parent = node.parent();
			if (!parent) break;
			node = parent;
		}
		return node;
	}
	/**
	 * 给当前光标节点添加inline包裹
	 * @param inline inline标签
	 * @param range 光标，默认获取当前光标
	 */
	wrap(inline: NodeInterface | Node | string, range?: RangeInterface) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, mark, node } = editor;
		const safeRange = range || change.range.toTrusty();
		const doc = getDocument(safeRange.startContainer);
		if (typeof inline === 'string' || isNode(inline)) {
			inline = $(inline, doc);
		} else inline = inline;
		if (!node.isInline(inline)) return;

		if (safeRange.collapsed) {
			this.insert(inline, safeRange);
			if (!range) change.apply(safeRange);
			return;
		}
		mark.split(safeRange);
		this.split(safeRange);
		let { commonAncestorNode } = safeRange;
		if (
			commonAncestorNode.type === Node.TEXT_NODE ||
			node.isMark(commonAncestorNode)
		) {
			commonAncestorNode = commonAncestorNode.parent()!;
			while (node.isMark(commonAncestorNode)) {
				commonAncestorNode = commonAncestorNode.parent()!;
			}
		}

		// 插入范围的开始和结束标记
		const selection = safeRange.enlargeToElementNode().createSelection();
		if (!selection.has()) {
			if (!range) change.apply(safeRange);
			return;
		}
		// 遍历范围内的节点，添加 Inline
		let started = false;
		let inlineClone = node.clone(inline, false);
		const inlnes: NodeInterface[] = [];
		commonAncestorNode.traverse((child) => {
			if (!child.equal(selection.anchor!)) {
				if (started) {
					if (child.equal(selection.focus!)) {
						started = false;
						return false;
					}
					if (node.isInline(child)) {
						if (!child.isCard()) {
							const children = child.children();
							node.unwrap(child);
							child = children;
						} else {
							// 如果不添加，最后选中是一个inline card 的话不会被选中
							inlnes.push(child);
						}
					}
					if (
						(node.isMark(child) && !child.isCard()) ||
						child.isText()
					) {
						if (node.isEmpty(child)) {
							child.remove();
							return true;
						}
						if (!inlineClone.parent()) {
							child.before(inlineClone);
						}
						inlineClone.append(child);
						this.repairCursor(inlineClone);
						inlnes.push(inlineClone);
						return true;
					}
					if (
						inlineClone[0].childNodes.length !== 0 &&
						!!inlineClone.parent()
					) {
						inlineClone = node.clone(inlineClone, false, false);
					}
				}
				return;
			} else {
				started = true;
				return;
			}
		});

		const { anchor, focus } = selection;
		const anchorParent = anchor?.parent();

		if (
			anchorParent &&
			node.isRootBlock(anchorParent) &&
			!anchor!.prev() &&
			!anchor!.next()
		) {
			anchor!.after('<br />');
		}

		if (!anchor!.equal(focus!)) {
			const focusParent = focus?.parent();
			if (
				focusParent &&
				node.isRootBlock(focusParent) &&
				!focus!.prev() &&
				!focus!.next()
			) {
				focus!.before('<br />');
			}
		}
		selection.move();
		if (inlnes.length > 0) {
			const firstInline = inlnes[0];
			if (!firstInline.isCard()) {
				const startNode = firstInline.first()!;
				safeRange.setStart(startNode, 1);
			}
			const lastInline = inlnes[inlnes.length - 1];
			if (!lastInline.isCard()) {
				const lastNode = lastInline.last()!;
				safeRange.setEnd(lastNode, lastNode.text().length - 1);
			}
		}

		if (!range) change.apply(safeRange);
	}
	/**
	 * 移除inline包裹
	 * @param range 光标，默认当前编辑器光标,或者需要移除的inline节点
	 */
	unwrap(range?: RangeInterface | NodeInterface) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, mark } = editor;
		const safeRange =
			!range || !isRangeInterface(range)
				? change.range.toTrusty()
				: range;
		this.repairRange(safeRange);
		mark.split(safeRange);
		const inlineNodes =
			range && !isRangeInterface(range)
				? [range]
				: this.findInlines(safeRange);
		// 清除 Inline
		const selection = safeRange.createSelection();
		inlineNodes.forEach((node) => {
			let prev = node.prev();
			if (prev && prev.isCursor()) prev = prev.prev();
			let next = node.next();
			if (next && next.isCursor()) next = next.prev();
			let first = node.first();
			if (first && first.isCursor()) first = first.next();

			const prevText = prev?.text() || '';
			const nextText = next?.text() || '';
			const firstText = first?.text() || '';

			if (prev && prev.isText() && /\u200B$/g.test(prevText)) {
				if (/^\u200B$/g.test(prevText)) prev.remove();
				else prev.text(prevText.substr(0, prevText.length - 1));
			}
			if (next && next.isText() && /^\u200B/g.test(nextText)) {
				if (/^\u200B$/g.test(nextText)) next.remove();
				else next.text(nextText.substr(1));
			}
			if (first && first.isText() && /^\u200B/g.test(firstText)) {
				if (/^\u200B$/g.test(firstText)) first.remove();
				else {
					first.get<Text>()!.splitText(1);
					first.remove();
				}
			}
			let last = node.last();
			if (last && last.isCursor()) last = last.prev();
			const lastText = last?.text() || '';
			if (last && last.isText() && /\u200B$/g.test(lastText)) {
				if (/^\u200B$/g.test(lastText)) last.remove();
				else
					last.get<Text>()!
						.splitText(lastText.length - 1)
						.remove();
			}
			editor.node.unwrap(node);
		});

		selection.move();
		mark.merge(safeRange);
		if (!range) change.apply(safeRange);
	}

	/**
	 * 插入inline标签
	 * @param inline inline标签
	 * @param range 光标
	 */
	insert(inline: NodeInterface | Node | string, range?: RangeInterface) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, node, mark } = editor;
		const safeRange = range || change.range.toTrusty();
		const doc = getDocument(safeRange.startContainer);
		if (typeof inline === 'string' || isNode(inline)) {
			inline = $(inline, doc);
		}
		if (!node.isInline(inline)) return;
		// 范围为折叠状态时先删除内容
		if (!safeRange.collapsed) {
			change.delete(safeRange);
		}
		mark.split(safeRange);
		this.split(safeRange);
		// 插入新 Inline
		node.insert(inline, safeRange)?.select(inline).collapse(false);

		if (inline.name !== 'br') {
			safeRange.handleBr();
		}
		const hasChild = inline.get<Node>()?.childNodes.length !== 0;
		this.repairCursor(inline);
		//如果有内容，就让光标选择在节点外的零宽字符前
		if (!inline.isCard() && !node.isVoid(inline)) {
			if (hasChild) {
				const next = inline.next()!;
				safeRange.setStart(next, 1);
				safeRange.setEnd(next, 1);
			} else {
				//如果没有子节点，就让光标选择在最后的零宽字符前面
				const last = inline.last()!;
				const text = last.text();
				safeRange.setStart(last, text.length - 1);
				safeRange.setEnd(last, text.length - 1);
			}
		}

		if (!range) change.apply(safeRange);
	}

	/**
	 * 去除一个节点下的所有空 Inline callback 可以设置其它条件
	 * @param root 节点
	 * @param callback 回调
	 */
	unwrapEmptyInlines(
		root: NodeInterface,
		callback?: (node: NodeInterface) => boolean,
	) {
		const { node } = this.editor;
		const children = root.allChildren();
		children.forEach((child) => {
			if (
				node.isEmpty(child) &&
				node.isInline(child) &&
				(!callback || callback(child))
			) {
				node.unwrap(child);
			}
		});
	}

	/**
	 * 在光标重叠位置时分割
	 * @param range 光标
	 */
	splitOnCollapsed(range: RangeInterface, keelpNode?: NodeInterface | Node) {
		if (!range.collapsed) return;
		//扩大光标选区
		range.enlargeFromTextNode();
		range.shrinkToElementNode();
		const { startNode } = range;
		const startParent = startNode.parent();
		//获取卡片
		const { node } = this.editor;
		const card = startNode.isCard()
			? startNode
			: startNode.closest(CARD_SELECTOR);
		if (
			(card.length === 0 ||
				card.attributes(CARD_TYPE_KEY) !== 'inline') &&
			(node.isInline(startNode) ||
				(startParent && node.isInline(startParent)))
		) {
			// 获取上面第一个非inline标签
			const parent = this.closestNotInline(startNode);
			// 插入范围的开始和结束标记
			const selection = range.createSelection();
			// 获取标记左右两侧节点
			const left = selection.getNode(parent, 'left');
			let right: NodeInterface | undefined = undefined;
			let keelpRoot: NodeInterface | undefined = undefined;
			let keelpPath: Array<number> = [];
			if (keelpNode) {
				if (isNode(keelpNode)) keelpNode = $(keelpNode);
				// 获取需要跟踪节点的路径
				const path = keelpNode.getPath(parent.get()!);
				const cloneParent = parent.clone(true);
				keelpPath = path.slice(1);
				// 获取需要跟踪节点的root节点
				keelpRoot = $(cloneParent.getChildByPath(path.slice(0, 1)));
				right = selection.getNode(cloneParent, 'right', false);
			} else right = selection.getNode(parent, 'right');
			// 删除空标签
			this.unwrapEmptyInlines(left);
			this.unwrapEmptyInlines(right);
			// 清空原父容器，用新的内容代替
			const children = parent.children();
			children.each((_, index) => {
				if (!children.eq(index)?.isCard()) {
					children.eq(index)?.remove();
				}
			});
			let appendChild: NodeInterface | undefined | null = undefined;
			const appendToParent = (childrenNodes: NodeInterface) => {
				childrenNodes.each((child, index) => {
					const childNode = childrenNodes.eq(index);
					if (childNode?.isCard()) {
						appendChild = appendChild
							? appendChild.next()
							: parent.first();
						if (appendChild) childrenNodes[index] = appendChild[0];
						return;
					}
					if (appendChild) {
						appendChild.after(child);
						appendChild = childNode;
					} else {
						appendChild = childNode;
						parent.prepend(child);
					}
				});
			};
			const leftChildren = left.children();
			const leftNodes = leftChildren.toArray();
			appendToParent(leftChildren);
			const rightChildren = right.children();
			let rightNodes = rightChildren.toArray();
			// 根据跟踪节点的root节点和path获取其在rightNodes中的新节点
			if (keelpRoot)
				keelpNode = rightNodes
					.find((node) => node.equal(keelpRoot!))
					?.getChildByPath(keelpPath);
			appendToParent(rightChildren);
			rightNodes = rightChildren.toArray();
			// 重新设置范围
			//移除左右两边的 br 标签
			if (leftNodes.length === 1 && leftNodes[0].name === 'br') {
				leftNodes[0].remove();
				leftNodes.splice(0, 1);
			}
			if (rightNodes.length === 1 && rightNodes[0].name === 'br') {
				rightNodes[0].remove();
				rightNodes.splice(0, 1);
			}
			if (rightNodes.filter((child) => !child.isCursor()).length > 0) {
				let rightContainer = rightNodes[0];
				for (let i = 0; i < rightNodes.length - 1; i++) {
					rightContainer = rightNodes[i];
					if (!rightContainer.isCursor()) break;
				}
				range.setStartBefore(rightContainer);
				range.collapse(true);
			} else if (
				leftNodes.filter((childNode) => !childNode.isCursor()).length >
				0
			) {
				let leftContainer = leftNodes[leftNodes.length - 1];
				for (let i = leftNodes.length - 1; i >= 0; i--) {
					leftContainer = leftNodes[i];
					if (!leftContainer.isCursor()) break;
				}
				range.setStartAfter(leftContainer);
				range.collapse(true);
			} else {
				range.select(parent, true).collapse(true);
			}

			parent.traverse((child) => {
				if (node.isInline(child)) {
					this.repairCursor(child);
				}
			});
		}
		range.enlargeToElementNode(!node.isBlock(range.startNode), false);
		return keelpNode;
	}
	/**
	 * 在光标位置不重合时分割
	 * @param range 光标
	 * @param removeMark 要移除的空mark节点
	 */
	splitOnExpanded(range: RangeInterface) {
		if (range.collapsed) return;
		range.enlargeToElementNode();
		range.shrinkToElementNode();
		const { startNode, endNode } = range;
		const cardStart = startNode.isCard()
			? startNode
			: startNode.closest(CARD_SELECTOR);
		const cardEnd = endNode.isCard()
			? endNode
			: endNode.closest(CARD_SELECTOR);
		if (
			!(
				(cardStart.length > 0 &&
					'inline' === cardStart.attributes(CARD_TYPE_KEY)) ||
				(cardEnd.length > 0 &&
					'inline' === cardEnd.attributes(CARD_TYPE_KEY))
			)
		) {
			//开始非inline标签父节点
			const startNotInlineParent = this.closestNotInline(startNode);
			//结束非inine标签父节点
			const endNotInlineParent = this.closestNotInline(endNode);
			if (!startNotInlineParent.equal(endNotInlineParent)) {
				//开始位置
				const startRange = range.cloneRange();
				startRange.collapse(true);
				//结束位置
				const endRange = range.cloneRange();
				endRange.collapse(false);

				//如果开始非inline标签父节点包含结束非inline标签父节点，那么分割的时候会清空 结束非inline标签父节点的内容进行重组。结束非inline标签父节点 将无非找到
				//所以需要从被包含的节点开始分割
				let keelpNode: NodeInterface | Node | undefined = undefined;
				let startOffset = startRange.startOffset;
				let endOffset = endRange.endOffset;
				//如果开始节点的父节点包含结尾父节点，会将结尾父节点删除重组，导致光标失效，需要先执行开始节点分割，并跟踪结尾节点
				if (startNotInlineParent.contains(endNotInlineParent)) {
					//先分割开始节点，并跟踪结尾节点
					keelpNode = this.splitOnCollapsed(
						startRange,
						endRange.endNode,
					);
					range.setStart(
						startRange.startContainer,
						startRange.startOffset,
					);
					//如果有跟踪到，重新设置结尾节点
					if (keelpNode) {
						endRange.setOffset(keelpNode, endOffset, endOffset);
					}
					//分割结尾节点
					this.splitOnCollapsed(endRange);
					range.setEnd(endRange.startContainer, endRange.startOffset);
				} else {
					//结尾父节点包含开始节点父节点
					//先分割结尾节点，并跟踪开始节点
					keelpNode = this.splitOnCollapsed(
						endRange,
						startRange.startNode,
					);
					range.setEnd(endRange.startContainer, endRange.startOffset);
					//如果有跟踪到，重新设置开始节点
					if (keelpNode) {
						startRange.setOffset(
							keelpNode,
							startOffset,
							startOffset,
						);
					}
					//分割开始节点
					this.splitOnCollapsed(startRange);
					range.setStart(
						startRange.startContainer,
						startRange.startOffset,
					);
				}
				return;
			}
			const { node } = this.editor;
			// 节点不是Inline，文本节点时判断父节点
			const startParent = startNode.parent();
			const startIsInline =
				node.isInline(startNode) ||
				(startParent && node.isInline(startParent));
			const endParent = endNode.parent();
			const endIsInline =
				node.isInline(endNode) ||
				(endParent && node.isInline(endParent));
			// 开始节点和结束节点都不是Inline，无需分割
			if (!startIsInline && !endIsInline) {
				return;
			}
			let { commonAncestorNode } = range;
			if (commonAncestorNode.isText()) {
				commonAncestorNode = commonAncestorNode.parent()!;
			}
			// 获取上面第一个非样式标签
			const parent = this.closestNotInline(commonAncestorNode);
			// 插入范围的开始和结束标记
			const selection = range.createSelection();
			// 标记的左边
			const left = selection.getNode(parent, 'left');
			// 标记的节点
			const center = selection.getNode(parent);
			// 标记的右边
			const right = selection.getNode(parent, 'right');
			// 删除空标签
			this.unwrapEmptyInlines(left);
			this.unwrapEmptyInlines(right);
			// 清空原父容器，用新的内容代替
			const children = parent.children();
			children.each((_, index) => {
				if (!children.eq(index)?.isCard()) {
					children.eq(index)?.remove();
				}
			});
			let appendChild: NodeInterface | undefined | null = undefined;
			const appendToParent = (childrenNodes: NodeInterface) => {
				childrenNodes.each((child, index) => {
					if (childrenNodes.eq(index)?.isCard()) {
						appendChild = appendChild
							? appendChild.next()
							: parent.first();
						if (appendChild) childrenNodes[index] = appendChild[0];
						return;
					}
					if (appendChild) {
						appendChild.after(child);
						appendChild = childrenNodes.eq(index);
					} else {
						appendChild = childrenNodes.eq(index);
						parent.prepend(child);
					}
				});
			};
			appendToParent(left.children());
			const centerChildren = center.children();
			const centerNodes = centerChildren.toArray();
			appendToParent(centerChildren);
			appendToParent(right.children());
			parent.traverse((child) => {
				if (node.isInline(child)) {
					this.repairCursor(child);
				}
			});
			// 重新设置范围
			range.setStartBefore(centerNodes[0][0]);
			range.setEndAfter(centerNodes[centerNodes.length - 1][0]);
		}
	}

	/**
	 * 分割inline标签
	 */
	split(range?: RangeInterface) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change } = editor;
		const safeRange = range || change.range.toTrusty();
		//const selection = safeRange.createSelection('inline-split');
		if (safeRange.collapsed) {
			this.splitOnCollapsed(safeRange);
		} else {
			this.splitOnExpanded(safeRange);
		}
		//selection.move()
		if (!range) change.apply(safeRange);
	}

	/**
	 * 获取光标范围内的所有 inline 标签
	 * @param range 光标
	 */
	findInlines(range: RangeInterface) {
		const editor = this.editor;
		const cloneRange = range.cloneRange();
		if (cloneRange.startNode.isRoot()) cloneRange.shrinkToElementNode();
		if (
			!cloneRange.startNode.inEditor() ||
			editor.card.find(cloneRange.startNode)
		)
			return [];
		const nodeApi = editor.node;
		const handleRange = (
			allowBlock: boolean,
			range: RangeInterface,
			toStart: boolean = false,
		) => {
			if (!range.collapsed) return;
			const { startNode, startOffset } = range;
			//没有父节点
			const startParent = startNode.findParent();
			if (!startParent) return;
			//选择父节点内容
			const cloneRange = range.cloneRange();
			cloneRange.select(startParent, true);
			//开始位置
			if (toStart) {
				cloneRange.setEnd(startNode, startOffset);
				cloneRange.enlargeFromTextNode();
				cloneRange.enlargeToElementNode(true);
				const startChildren = startNode.children();
				const { endNode, endOffset } = cloneRange;
				const endChildren = endNode.children();
				const endOffsetNode = endChildren.eq(endOffset);
				const startOffsetNode =
					startChildren.eq(startOffset) ||
					startChildren.eq(startOffset - 1);
				if (
					!allowBlock &&
					endNode.type === Node.ELEMENT_NODE &&
					endOffsetNode &&
					nodeApi.isBlock(endOffsetNode) &&
					(startNode.type !== Node.ELEMENT_NODE ||
						(!!startOffsetNode &&
							!nodeApi.isBlock(startOffsetNode)))
				)
					return;
				cloneRange.select(startParent, true);
				cloneRange.setStart(endNode, endOffset);
				cloneRange.shrinkToElementNode();
				cloneRange.shrinkToTextNode();
				range.setStart(
					cloneRange.startContainer,
					cloneRange.startOffset,
				);
				range.collapse(true);
			} else {
				cloneRange.setStart(startNode, startOffset);
				cloneRange.enlargeFromTextNode();
				cloneRange.enlargeToElementNode(true);
				const startChildren = startNode.children();
				const startNodeClone = cloneRange.startNode;
				const startOffsetClone = cloneRange.startOffset;
				const startNodeCloneChildren = startNodeClone.children();
				const startOffsetNode =
					startNodeCloneChildren.eq(startOffsetClone);
				const startChildrenOffsetNode =
					startChildren.eq(startOffset) ||
					startChildren.eq(startOffset - 1);
				if (
					!allowBlock &&
					startNodeClone.type === Node.ELEMENT_NODE &&
					startOffsetNode &&
					nodeApi.isBlock(startOffsetNode) &&
					(startNode.type !== Node.ELEMENT_NODE ||
						(startChildrenOffsetNode &&
							!nodeApi.isBlock(startChildrenOffsetNode)))
				)
					return;
				cloneRange.select(startParent, true);
				cloneRange.setEnd(startNodeClone, startOffsetClone);
				cloneRange.shrinkToElementNode();
				cloneRange.shrinkToTextNode();
				range.setEnd(cloneRange.endContainer, cloneRange.endOffset);
				range.collapse(false);
			}
		};
		// 左侧不动，只缩小右侧边界
		// <anchor /><strong>foo</strong><focus />bar
		// 改成
		// <anchor /><strong>foo<focus /></strong>bar
		if (!cloneRange.collapsed) {
			const leftRange = cloneRange.cloneRange();
			const rightRange = cloneRange.cloneRange();
			leftRange.collapse(true);
			rightRange.collapse(false);
			handleRange(true, leftRange, true);
			handleRange(true, rightRange);
			cloneRange.setStart(
				leftRange.startContainer,
				leftRange.startOffset,
			),
				cloneRange.setEnd(
					rightRange.startContainer,
					rightRange.startOffset,
				);
		}
		handleRange(false, cloneRange);
		const sc = cloneRange.startContainer;
		const so = cloneRange.startOffset;
		const ec = cloneRange.endContainer;
		const eo = cloneRange.endOffset;
		let startNode = sc;
		let endNode = ec;

		if (sc.nodeType === Node.ELEMENT_NODE) {
			if (sc.childNodes[so]) {
				startNode = sc.childNodes[so] || sc;
			}
		}

		if (ec.nodeType === Node.ELEMENT_NODE) {
			if (eo > 0 && ec.childNodes[eo - 1]) {
				endNode = ec.childNodes[eo - 1] || sc;
			}
		}
		// 折叠状态时，按右侧位置的方式处理
		if (cloneRange.collapsed) {
			startNode = endNode;
		}
		// 不存在时添加
		const addNode = (nodes: Array<NodeInterface>, nodeB: NodeInterface) => {
			if (!nodes.some((nodeA) => nodeA[0] === nodeB[0])) {
				nodes.push(nodeB);
			}
		};
		// 向上寻找
		const findNodes = (node: NodeInterface) => {
			const nodes = [];
			while (node) {
				if (node.isEditable()) break;
				if (nodeApi.isInline(node)) nodes.push(node);
				const parent = node.parent();
				if (!parent) break;
				node = parent;
			}
			return nodes;
		};

		const nodes = findNodes($(startNode));
		const { commonAncestorNode } = cloneRange;
		const card = editor.card.find(commonAncestorNode, true);
		let isEditable = card?.isEditable;
		const selectionNodes = isEditable
			? card?.getSelectionNodes
				? card.getSelectionNodes()
				: []
			: [commonAncestorNode];
		if (selectionNodes.length === 0) {
			isEditable = false;
			selectionNodes.push(commonAncestorNode);
		}
		if (!cloneRange.collapsed || isEditable) {
			findNodes($(endNode)).forEach((nodeB) => {
				return addNode(nodes, nodeB);
			});
			if (sc !== ec || isEditable) {
				let isBegin = false;
				let isEnd = false;
				selectionNodes.forEach((commonAncestorNode) => {
					commonAncestorNode.traverse((child) => {
						if (isEnd) return false;
						//节点不是开始节点
						if (!child.equal(sc)) {
							if (isBegin) {
								//节点是结束节点，标记为结束
								if (child.equal(ec)) {
									isEnd = true;
									return false;
								}
								if (
									nodeApi.isInline(child) &&
									!child.attributes(CARD_KEY) &&
									!child.attributes(CARD_ELEMENT_KEY)
								) {
									addNode(nodes, child);
								}
							}
						} else {
							//如果是开始节点，标记为开始
							isBegin = true;
						}
						return;
					});
				});
			}
		}
		return nodes;
	}
	/**
	 * 修复inline节点光标占位符
	 * @param node inlne 节点
	 */
	repairCursor(node: NodeInterface | Node) {
		const nodeApi = this.editor.node;
		if (isNode(node)) node = $(node);
		if (
			!nodeApi.isInline(node) ||
			node.closest(CARD_SELECTOR).attributes(CARD_EDITABLE_KEY) ===
				'false' ||
			nodeApi.isVoid(node) ||
			node.isCard()
		) {
			const prev = node.prev();
			const prevText = prev?.isText() ? prev.text() : undefined;
			if (prevText && /\u200b$/.test(prevText)) {
				const pPrev = prev?.prev();
				if (!pPrev || !nodeApi.isInline(pPrev)) {
					if (prevText.length === 1) {
						prev?.remove();
					} else {
						prev?.text(prevText.slice(0, -1));
					}
				}
			}
			const next = node.next();
			const nextText = next?.isText() ? next.text() : undefined;
			if (nextText && /^\u200b/.test(nextText)) {
				const nNext = next?.next();
				if (!nNext || !nodeApi.isInline(nNext)) {
					if (nextText.length === 1) {
						next?.remove();
					} else {
						next?.text(nextText.slice(1));
					}
				}
			}
			return;
		}
		const childrenNodes = node.children();
		childrenNodes.each((_, index) => {
			const child = childrenNodes.eq(index);
			if (child?.isText()) {
				const text = child.text();
				if (text.length === 1 && /\u200b/.test(text)) {
					child.remove();
					return;
				}
				child.text(text.replace(/\u200b/g, ''));
			}
		});
		this.repairBoth(node);
		let firstChild = node.first();
		if (firstChild?.isCursor()) firstChild = firstChild.next();
		if (
			!firstChild ||
			firstChild.type !== Node.TEXT_NODE ||
			!/^\u200B/g.test(firstChild.text())
		) {
			if (!firstChild) node.append($('\u200b', null));
			else if (firstChild.isText()) {
				firstChild.text('\u200B' + firstChild.text());
			} else firstChild.before($('\u200b', null));
		}

		let last = node.last();
		if (last?.isCursor()) last = last.prev();
		if (
			last &&
			(/^\u200B$/g.test(node.text()) ||
				last.type !== Node.TEXT_NODE ||
				!/\u200B$/g.test(last.text()))
		) {
			if (last.isText()) {
				last.text(last.text() + '\u200B');
			} else last.after($('\u200b', null));
		}
	}

	/**
	 * 修复节点两侧零宽字符占位
	 * @param node 节点
	 */
	repairBoth(node: NodeInterface | Node) {
		const nodeApi = this.editor.node;
		if (isNode(node)) node = $(node);
		const nodeEl = node.get();
		if (
			(nodeEl?.parentElement ?? nodeEl?.parentNode) &&
			!nodeApi.isVoid(node)
		) {
			const zeroNode = $('\u200b', null);
			const prev = node.prev();
			const prevPrev = prev?.prev();
			const prevText = prev?.text() || '';
			if (
				!prev ||
				!prev.isText() ||
				!/\u200B$/g.test(prevText) ||
				(prevPrev &&
					nodeApi.isInline(prevPrev) &&
					!/\u200B.*\u200B$/g.test(prevText))
			) {
				if (prev && prev.isText()) {
					prev.text(prevText + '\u200b');
				} else {
					node.before(nodeApi.clone(zeroNode, true, false));
				}
			} else if (
				prev &&
				prev.isText() &&
				/\u200B\u200B$/g.test(prevText) &&
				prevPrev &&
				!nodeApi.isInline(prevPrev)
			) {
				prev.text(prevText.substr(0, prevText.length - 1));
			}

			const next = node.next();
			const nextText = next?.text() || '';
			const nextNext = next?.next();
			if (
				!next ||
				!next.isText() ||
				!/^\u200B/g.test(nextText) ||
				(nextNext &&
					nodeApi.isInline(nextNext) &&
					!/^\u200B\u200B/g.test(nextText))
			) {
				if (next && next.isText()) {
					next.text('\u200b' + next.text());
				} else {
					node.after(nodeApi.clone(zeroNode, true, false));
					if (next?.name === 'br') {
						next.remove();
					}
				}
			} else if (
				next &&
				next.isText() &&
				/\u200B\u200B$/g.test(nextText) &&
				nextNext &&
				!nodeApi.isInline(nextNext)
			) {
				next.text(nextText.substr(0, nextText.length - 1));
			}
		}
	}

	flat(node: NodeInterface | RangeInterface, schema?: SchemaInterface) {
		const editor = this.editor;
		if (isRangeInterface(node)) {
			const selection = node
				.cloneRange()
				.shrinkToElementNode()
				.createSelection();
			const inlines = this.findInlines(node);
			const applyInlines: NodeInterface[] = [];
			inlines.forEach((inline) => {
				if (inline.isCard()) return;
				const newInline = this.flat(inline);
				if (newInline) applyInlines.push(newInline);
			});
			selection.move();
			const nodeApi = editor.node;
			applyInlines.forEach((inline) => {
				const prev = inline.prev()?.prev();
				const next = inline.next()?.next();
				if (
					prev &&
					nodeApi.isMark(prev) &&
					prev.get<Element>()!.childNodes.length === 0
				) {
					prev.remove();
				}
				if (
					next &&
					nodeApi.isMark(next) &&
					next.get<Element>()!.childNodes.length === 0
				) {
					next.remove();
				}
			});
			return;
		}
		if (node.isCard()) return;
		const nodeApi = editor.node;
		const markApi = editor.mark;
		//当前节点是 inline 节点，inline 节点不允许嵌套、不允许放入mark节点
		if (nodeApi.isInline(node, schema) && node.name !== 'br') {
			const parentInline = this.closest(node);
			//不允许嵌套
			if (
				!parentInline.equal(node) &&
				nodeApi.isInline(parentInline, schema)
			) {
				nodeApi.unwrap(node);
			}
			//不允许放入mark
			else {
				let parentMark: NodeInterface | undefined =
					markApi.closest(node);

				let element = node as NodeInterface;
				while (
					parentMark &&
					!parentMark.equal(node) &&
					nodeApi.isMark(parentMark, schema)
				) {
					const cloneMark = parentMark.clone();
					const cloneInline = node.clone();
					const children = parentMark.children();
					children.each((child) => {
						// 零宽字符的文本跳过
						if (
							child.nodeType === 3 &&
							/^\u200b$/.test(child.textContent || '')
						) {
							return;
						}

						const childNode = $(child);
						if (
							element.equal(childNode) ||
							childNode.contains(element)
						) {
							element = nodeApi.wrap(
								nodeApi.replace(element, cloneMark),
								cloneInline,
							);
							this.repairBoth(element);
						} else {
							nodeApi.wrap(childNode, cloneMark);
						}
					});
					nodeApi.unwrap(parentMark);
					parentMark = markApi.closest(element);
				}
				return element;
			}
		}
		return;
	}
}

export default Inline;
