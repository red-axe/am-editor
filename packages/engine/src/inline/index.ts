import { CARD_ELEMENT_KEY, CARD_KEY } from '../constants';
import { EditorInterface, EngineInterface, isEngine } from '../types/engine';
import { InlineModelInterface, isInlinePlugin } from '../types/inline';
import { NodeInterface, isNode } from '../types/node';
import { RangeInterface } from '../types/range';
import { getDocument, getWindow } from '../utils';
import { Backspace } from './typing';

class Inline implements InlineModelInterface {
	private editor: EditorInterface;

	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	init() {
		if (isEngine(this.editor)) {
			//删除事件
			const backspace = new Backspace(this.editor);
			this.editor.typing
				.getHandleListener('backspace', 'keydown')
				?.on(event => backspace.trigger(event));
			this.editor.event.on('keydown:space', event =>
				this.triggerMarkdown(event),
			);
		}
	}

	/**
	 * 解析markdown
	 * @param event 事件
	 */
	triggerMarkdown(event: KeyboardEvent) {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		let range = change.getRange();
		if (!range.collapsed || change.isComposing()) return;
		const { startNode, startOffset } = range;
		const node =
			startNode.type === Node.TEXT_NODE
				? startNode
				: startNode.children().eq(startOffset - 1);
		if (!node) return;

		const text =
			node.type === Node.TEXT_NODE
				? node.text().substr(0, startOffset)
				: node.text();
		return !Object.keys(this.editor.plugin.components).some(pluginName => {
			const plugin = this.editor.plugin.components[pluginName];
			if (isInlinePlugin(plugin) && !!plugin.markdown) {
				const reuslt = plugin.triggerMarkdown(event, text, node);
				if (reuslt === false) return true;
			}
			return;
		});
	}

	/**
	 * 获取最近的 Inline 节点，找不到返回 node
	 */
	closest(node: NodeInterface) {
		while (node && node.parent() && !this.editor.node.isBlock(node)) {
			if (node.isRoot()) break;
			if (this.editor.node.isInline(node)) return node;
			const parentNode = node.parent();
			if (!parentNode) break;
			node = parentNode;
		}
		return node;
	}
	/**
	 * 给当前光标节点添加inline包裹
	 * @param inline inline标签
	 * @param range 光标，默认获取当前光标
	 */
	wrap(inline: NodeInterface | Node | string, range?: RangeInterface) {
		if (!isEngine(this.editor)) return;
		const { change, mark, node, $ } = this.editor;
		const safeRange = range || change.getSafeRange();
		const doc = getDocument(safeRange.startContainer);
		if (typeof inline === 'string' || isNode(inline)) {
			inline = $(inline, doc);
		} else inline = inline;
		if (!node.isInline(inline)) return;

		if (safeRange.collapsed) {
			this.insert(inline, safeRange);
			this.editor.inline.repairCursor(inline);
			//让光标选择在两个零宽字符中间
			const fisrt = inline.first()!;
			safeRange.setStart(fisrt, 1);
			safeRange.setEnd(fisrt, 1);
			if (!range) change.apply(safeRange);
			return;
		}
		mark.split(safeRange);
		let { commonAncestorNode } = safeRange;
		if (commonAncestorNode.type === getWindow().Node.TEXT_NODE) {
			commonAncestorNode = commonAncestorNode.parent()!;
		}

		// 插入范围的开始和结束标记
		const selection = safeRange.createSelection();
		if (!selection.has()) {
			if (!range) change.apply(safeRange);
			return;
		}
		// 遍历范围内的节点，添加 Inline
		let started = false;
		let inlineClone = this.editor.node.clone(inline, false);
		commonAncestorNode.traverse(child => {
			if (!child.equal(selection.anchor!)) {
				if (started) {
					if (child.equal(selection.focus!)) {
						started = false;
						return false;
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
						return true;
					}
					if (inlineClone[0].childNodes.length !== 0) {
						inlineClone = this.editor.node.clone(
							inlineClone,
							false,
						);
					}
					return;
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
			this.editor.node.isRootBlock(anchorParent) &&
			!anchor!.prev() &&
			!anchor!.next()
		) {
			anchor!.after('<br />');
		}

		if (!anchor!.equal(focus!)) {
			const focusParent = focus?.parent();
			if (
				focusParent &&
				this.editor.node.isRootBlock(focusParent) &&
				!focus!.prev() &&
				!focus!.next()
			) {
				focus!.before('<br />');
			}
		}
		this.editor.inline.repairCursor(inlineClone);
		selection.move();
		if (!range) change.apply(safeRange);
	}
	/**
	 * 移除inline包裹
	 * @param range 光标，默认当前编辑器光标
	 */
	unwrap(range?: RangeInterface) {
		if (!isEngine(this.editor)) return;
		const { change, mark } = this.editor;
		const safeRange = range || change.getSafeRange();
		mark.split(safeRange);
		const inlineNodes = this.findInlines(safeRange);
		// 清除 Inline
		const selection = safeRange.createSelection();
		const nodes: Array<NodeInterface> = [];
		inlineNodes.forEach(node => {
			let prev = node.prev();
			if (prev && prev.isCursor()) prev = prev.prev();
			let next = node.next();
			if (next && next.isCursor()) next = next.prev();
			let first = node.first();
			if (first && first.isCursor()) first = first.next();
			let last = node.last();
			if (last && last.isCursor()) last = last.prev();
			const prevText = prev?.text() || '';
			const nextText = next?.text() || '';
			const firstText = first?.text() || '';
			const lastText = last?.text() || '';

			if (prev && prev.isText() && /\u200B$/g.test(prevText)) {
				if (/^\u200B$/g.test(prevText)) prev.remove();
				else prev.text(prevText.substr(0, prevText.length - 1));
			}
			if (next && next.isText() && /^\u200B/g.test(nextText)) {
				if (/^\u200B$/g.test(nextText)) next.remove();
				else next.text(nextText.substr(1));
			}
			if (first && first.isText()) {
				if (/^\u200B$/g.test(firstText)) first.remove();
				else first.text(firstText.replace(/\u200B/g, ''));
			}
			if (last && last.isText()) {
				if (/^\u200B$/g.test(lastText)) last.remove();
				else last.text(lastText.replace(/\u200B/g, ''));
			}
			this.editor.node.unwrap(node);
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
		if (!isEngine(this.editor)) return;
		const { change, node, $ } = this.editor;
		const safeRange = range || change.getSafeRange();
		const doc = getDocument(safeRange.startContainer);
		if (typeof inline === 'string' || isNode(inline)) {
			inline = $(inline, doc);
		}
		if (!node.isInline(inline)) return;
		// 范围为折叠状态时先删除内容
		if (!safeRange.collapsed) {
			change.deleteContent(safeRange);
		}
		// 插入新 Inline
		change
			.insertNode(inline, safeRange)
			.select(inline)
			.collapse(false);

		if (inline.name !== 'br') {
			safeRange.addOrRemoveBr();
		}
		if (!range) change.apply(safeRange);
	}

	/**
	 * 获取光标范围内的所有 inline 标签
	 * @param range 光标
	 */
	findInlines(range: RangeInterface) {
		const cloneRange = range.cloneRange();
		const { $ } = this.editor;
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
					this.editor.node.isBlock(endOffsetNode) &&
					(startNode.type !== Node.ELEMENT_NODE ||
						(!!startOffsetNode &&
							!this.editor.node.isBlock(startOffsetNode)))
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
				const startOffsetNode = startNodeCloneChildren.eq(
					startOffsetClone,
				);
				const startChildrenOffsetNode =
					startChildren.eq(startOffset) ||
					startChildren.eq(startOffset - 1);
				if (
					!allowBlock &&
					startNodeClone.type === Node.ELEMENT_NODE &&
					startOffsetNode &&
					this.editor.node.isBlock(startOffsetNode) &&
					(startNode.type !== Node.ELEMENT_NODE ||
						(startChildrenOffsetNode &&
							!this.editor.node.isBlock(startChildrenOffsetNode)))
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
		if (!range.collapsed) {
			const leftRange = range.cloneRange();
			const rightRange = range.cloneRange();
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

		if (sc.nodeType === getWindow().Node.ELEMENT_NODE) {
			if (sc.childNodes[so]) {
				startNode = sc.childNodes[so] || sc;
			}
		}

		if (ec.nodeType === getWindow().Node.ELEMENT_NODE) {
			if (eo > 0 && ec.childNodes[eo - 1]) {
				endNode = ec.childNodes[eo - 1] || sc;
			}
		}
		// 折叠状态时，按右侧位置的方式处理
		if (range.collapsed) {
			startNode = endNode;
		}
		// 不存在时添加
		const addNode = (nodes: Array<NodeInterface>, nodeB: NodeInterface) => {
			if (!nodes.some(nodeA => nodeA[0] === nodeB[0])) {
				nodes.push(nodeB);
			}
		};
		// 向上寻找
		const findNodes = (node: NodeInterface) => {
			const nodes = [];
			while (node) {
				if (node.isRoot()) break;
				if (this.editor.node.isInline(node)) nodes.push(node);
				const parent = node.parent();
				if (!parent) break;
				node = parent;
			}
			return nodes;
		};

		const nodes = findNodes($(startNode));
		if (!range.collapsed) {
			findNodes($(endNode)).forEach(nodeB => {
				return addNode(nodes, nodeB);
			});
			if (sc !== ec) {
				let isBegin = false;
				let isEnd = false;
				range.commonAncestorNode.traverse(child => {
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
								this.editor.node.isInline(child) &&
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
			}
		}
		return nodes;
	}
	/**
	 * 修复inline节点光标占位符
	 * @param node inlne 节点
	 */
	repairCursor(node: NodeInterface | Node) {
		const { $ } = this.editor;
		if (isNode(node)) node = $(node);
		if (
			!this.editor.node.isInline(node) ||
			this.editor.node.isVoid(node) ||
			node.isCard()
		)
			return;
		this.editor.node.repairBoth(node);
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
}

export default Inline;
