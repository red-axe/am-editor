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
			if (inline.children().length === 0)
				inline.append(doc.createTextNode('\u200b'));
			this.insert(inline, safeRange);
			this.editor.inline.repairCursor(inline);
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
							this.editor.inline.repairCursor(inlineClone);
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
		inlineNodes.forEach(node => {
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
		const dupRange = range.cloneRange();
		// 左侧不动，只缩小右侧边界
		// <anchor /><a>foo</a><focus />bar
		// 改成s
		// <anchor /><a>foo<focus /></a>bar
		if (!range.collapsed) {
			const rightRange = range.cloneRange();
			rightRange.shrinkToElementNode();
			dupRange.setEnd(rightRange.endContainer, rightRange.endOffset);
		}
		const { $ } = this.editor;
		const sc = dupRange.startContainer;
		const so = dupRange.startOffset;
		const ec = dupRange.endContainer;
		const eo = dupRange.endOffset;
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
		if (!this.editor.node.isInline(node) || this.editor.node.isVoid(node))
			return;
		this.editor.node.repairBoth(node);
		const firstChild = node.first();
		if (
			!firstChild ||
			firstChild.type !== Node.TEXT_NODE ||
			!/^\u200B/g.test(firstChild.text())
		) {
			if (!firstChild) node.append($('\u200b', null));
			else if (firstChild.isText()) {
				firstChild.get<Element>()!.textContent =
					'\u200B' + firstChild.text();
			} else firstChild.before($('\u200b', null));
		}
	}
}

export default Inline;
