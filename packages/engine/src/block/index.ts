import md5 from 'blueimp-md5';
import {
	CARD_KEY,
	CARD_SELECTOR,
	CARD_TYPE_KEY,
	CURSOR,
	CURSOR_SELECTOR,
	DATA_ELEMENT,
	READY_CARD_KEY,
	ROOT_SELECTOR,
} from '../constants';
import Range from '../range';
import {
	EditorInterface,
	isEngine,
	NodeInterface,
	RangeInterface,
	isNode,
} from '../types';
import {
	BlockInterface,
	BlockModelInterface,
	isBlockPlugin,
} from '../types/block';
import { getDocument, getWindow } from '../utils';
import { Backspace, Enter } from './typing';

class Block implements BlockModelInterface {
	private editor: EditorInterface;

	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	init() {
		if (isEngine(this.editor)) {
			//绑定回车事件
			const enter = new Enter(this.editor);
			this.editor.typing
				.getHandleListener('enter', 'keydown')
				?.on(event => enter.trigger(event));
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
		const { change, block } = this.editor;
		let range = change.getRange();
		if (!range.collapsed || change.isComposing()) return;
		const { startNode, startOffset } = range;
		const node =
			startNode.type === Node.TEXT_NODE
				? startNode
				: startNode.children().eq(startOffset - 1);
		if (!node) return;
		const blockNode = block.closest(node);
		if (!this.editor.node.isRootBlock(blockNode)) return;
		const text = block.getLeftText(blockNode);
		return !Object.keys(this.editor.plugin.components).some(pluginName => {
			const plugin = this.editor.plugin.components[pluginName];
			if (isBlockPlugin(plugin) && !!plugin.markdown) {
				const reuslt = plugin.markdown(event, text, blockNode, node);
				if (reuslt === false) return true;
			}
			return;
		});
	}
	/**
	 * 根据节点查找block插件实例
	 * @param node 节点
	 */
	findPlugin(node: NodeInterface) {
		if (!this.editor.node.isBlock(node)) return [];
		const plugins: Array<BlockInterface> = [];
		Object.keys(this.editor.plugin.components).some(pluginName => {
			const plugin = this.editor.plugin.components[pluginName];
			if (isBlockPlugin(plugin)) {
				if (
					plugin.tagName &&
					(typeof plugin.tagName === 'string'
						? plugin.tagName === node.name
						: plugin.tagName.indexOf(node.name) > -1)
				) {
					let schema = plugin.schema();
					if (Array.isArray(schema)) {
						const targetSchema = schema.find(
							schema => schema.name === node.name,
						);
						if (!targetSchema) return;
						schema = targetSchema;
					}
					if (
						!this.editor.schema.checkNode(
							node,
							'block',
							schema.attributes,
						)
					)
						return;
					plugins.push(plugin);
				}
			}
			return;
		});
		return plugins;
	}
	/**
	 * 查找Block节点的一级节点。如 div -> H2 返回 H2节点
	 * @param parentNode 父节点
	 * @param childNode 子节点
	 */
	findTop(parentNode: NodeInterface, childNode: NodeInterface) {
		const { schema } = this.editor;
		const topParentName = schema.closest(parentNode.name);
		const topChildName = schema.closest(childNode.name);
		//如果父节点没有级别或者子节点没有级别就返回子节点
		if (topParentName === parent.name || topChildName === childNode.name)
			return childNode;
		//如果父节点的级别大于子节点的级别就返回父节点
		if (schema.isAllowIn(parentNode.name, childNode.name))
			return parentNode;
		//如果父节点是 ul、ol 这样的List列表，并且子节点也是这样的列表，设置ident
		const { node, list } = this.editor;
		if (node.isList(parentNode) && node.isList(childNode)) {
			const childIndent =
				parseInt(childNode.attributes(list.INDENT_KEY), 10) || 0;
			const parentIndent =
				parseInt(parentNode.attributes(list.INDENT_KEY), 10) || 0;
			childNode.attributes(
				list.INDENT_KEY,
				parentIndent ? parentIndent + 1 : childIndent + 1,
			);
		}
		//默认返回子节点
		return childNode;
	}
	/**
	 * 获取最近的block节点，找不到返回 node
	 * @param node 节点
	 */
	closest(node: NodeInterface) {
		const originNode = node;
		while (node) {
			if (node.isEditable() || this.editor.node.isBlock(node)) {
				return node;
			}
			const parentNode = node.parent();
			if (!parentNode) break;
			node = parentNode;
		}
		return originNode;
	}
	/**
	 * 在光标位置包裹一个block节点
	 * @param block 节点
	 * @param range 光标
	 */
	wrap(block: NodeInterface | Node | string, range?: RangeInterface) {
		if (!isEngine(this.editor)) return;
		const { change, node } = this.editor;
		const safeRange = range || change.getSafeRange();
		const doc = getDocument(safeRange.startContainer);
		if (typeof block === 'string' || isNode(block)) {
			block = this.editor.$(block, doc);
		} else block = block;

		if (!node.isBlock(block)) return;

		let blocks: Array<NodeInterface | null> = this.getBlocks(safeRange);

		// li 节点改成 ul 或 ol
		const listBlocks: Array<NodeInterface> = [];
		blocks = blocks
			.map(node => {
				const parent = node?.parent();
				if (
					node?.name === 'li' &&
					parent &&
					this.editor.node.isList(parent)
				) {
					if (!listBlocks.find(block => block.equal(parent))) {
						listBlocks.push(parent);
						return parent;
					}
					return null;
				}
				return node;
			})
			.filter(node => node !== null);
		// 不在段落内
		if (blocks.length === 0) {
			const root = this.closest(safeRange.startNode);
			const selection = safeRange.createSelection();
			root.children().each(node => {
				(block as NodeInterface).append(node);
			});
			root.append(block);
			selection.move();
			return;
		}

		const selection = safeRange.createSelection();
		blocks[0]?.before(block);
		blocks.forEach(node => {
			if (node) (block as NodeInterface).append(node);
		});
		selection.move();
		if (!range) change.apply(safeRange);
	}
	/**
	 * 移除光标所在block节点包裹
	 * @param block 节点
	 * @param range 光标
	 */
	unwrap(block: NodeInterface | Node | string, range?: RangeInterface) {
		if (!isEngine(this.editor)) return;
		const { change, node } = this.editor;
		const safeRange = range || change.getSafeRange();
		const doc = getDocument(safeRange.startContainer);
		if (typeof block === 'string' || isNode(block)) {
			block = this.editor.$(block, doc);
		} else block = block;

		if (!node.isBlock(block)) return;
		const blocks = this.getSiblings(safeRange, block);
		if (blocks.length === 0) {
			return;
		}

		const firstNodeParent = blocks[0].node.parent();
		if (!firstNodeParent?.inEditor()) {
			return;
		}
		const hasLeft = blocks.some(item => item.position === 'left');
		const hasRight = blocks.some(item => item.position === 'right');
		let leftParent: NodeInterface | undefined = undefined;

		if (hasLeft) {
			const parent = firstNodeParent;
			leftParent = this.editor.node.clone(parent, false);
			parent.before(leftParent);
		}

		let rightParent: NodeInterface | undefined = undefined;
		if (hasRight) {
			const _parent = blocks[blocks.length - 1].node.parent();
			if (_parent) {
				rightParent = this.editor.node.clone(_parent, false);
				_parent?.after(rightParent);
			}
		}

		// 插入范围的开始和结束标记
		const selection = safeRange.createSelection();
		blocks.forEach(item => {
			const status = item.position,
				node = item.node,
				parent = node.parent();

			if (status === 'left') {
				leftParent?.append(node);
			}

			if (status === 'center') {
				if (
					parent?.name === (block as NodeInterface)?.name &&
					parent?.inEditor()
				) {
					this.editor.node.unwrap(parent);
				}
			}

			if (status === 'right') {
				rightParent?.append(node);
			}
		});
		// 有序列表被从中间拆开后，剩余的两个部分的需要保持序号连续
		if (
			leftParent &&
			leftParent.name === 'ol' &&
			rightParent &&
			rightParent.name === 'ol'
		) {
			rightParent.attributes(
				'start',
				(parseInt(leftParent.attributes('start'), 10) || 1) +
					leftParent.find('li').length,
			);
		}
		selection.move();
		if (!range) change.apply(safeRange);
	}

	/**
	 * 获取节点相对于光标开始位置、结束位置下的兄弟节点集合
	 * @param range 光标
	 * @param block 节点
	 */
	getSiblings(range: RangeInterface, block: NodeInterface) {
		const blocks: Array<{
			node: NodeInterface;
			position: 'left' | 'center' | 'right';
		}> = [];
		if (!this.editor.node.isBlock(block)) return blocks;
		const getTargetBlock = (node: NodeInterface, tagName: string) => {
			let block = this.closest(node);
			while (block) {
				const parent = block.parent();
				if (!parent) break;
				if (!block.inEditor()) break;
				if (block.text().trim() !== parent.text().trim()) break;
				if (parent.name === tagName) break;
				block = parent;
			}

			return block;
		};
		const startBlock = getTargetBlock(range.startNode, block.name);
		const endBlock = getTargetBlock(range.endNode, block.name);
		const parentBlock = startBlock.parent();
		let position: 'left' | 'center' | 'right' = 'left';
		let node = parentBlock?.first();

		while (node) {
			node = this.editor.$(node);
			if (!this.editor.node.isBlock(node)) return blocks;
			// 超过编辑区域
			if (!node.inEditor()) return blocks;

			if (node[0] === startBlock[0]) {
				position = 'center';
			}

			blocks.push({
				position,
				node,
			});

			if (node[0] === endBlock[0]) {
				position = 'right';
			}
			node = node.next();
		}
		return blocks;
	}
	/**
	 * 分割当前光标选中的block节点
	 * @param range 光标
	 */
	split(range?: RangeInterface) {
		if (!isEngine(this.editor)) return;
		const { change, mark } = this.editor;
		const safeRange = range || change.getSafeRange();
		// 范围为展开状态时先删除内容
		if (!safeRange.collapsed) {
			change.deleteContent(safeRange);
		}
		// 获取上面第一个 Block
		const block = this.closest(safeRange.startNode);
		// 获取的 block 超出编辑范围
		if (!block.isEditable() && !block.inEditor()) {
			return;
		}

		if (block.isEditable()) {
			// <p>wo</p><cursor /><p>other</p>
			// to
			// <p>wo</p><p><cursor />other</p>
			const sc =
				safeRange.startContainer.childNodes[safeRange.startOffset];
			if (sc) {
				safeRange
					.select(sc, true)
					.shrinkToElementNode()
					.collapse(true);
			}
			if (!range) change.apply(safeRange);
			return;
		}
		const cloneRange = safeRange.cloneRange();
		cloneRange
			.shrinkToElementNode()
			.shrinkToTextNode()
			.collapse(true);
		const activeMarks = mark.findMarks(cloneRange);

		const sideBlock = this.createSide({
			block: block[0],
			range: safeRange,
			isLeft: false,
			keepID: true,
		});
		sideBlock.traverse(node => {
			if (
				!this.editor.node.isVoid(node) &&
				(this.editor.node.isInline(node) ||
					this.editor.node.isMark(node)) &&
				this.editor.node.isEmpty(node)
			) {
				node.remove();
			}
		}, true);
		const isEmptyElement = (node: Node) => {
			return (
				this.editor.node.isBlock(node) &&
				(node.childNodes.length === 0 ||
					(node as HTMLElement).innerText === '')
			);
		};
		if (isEmptyElement(block[0]) && !isEmptyElement(sideBlock[0])) {
			this.generateRandomID(block, true);
		} else {
			this.generateRandomID(sideBlock, true);
		}
		block.after(sideBlock);
		// Chrome 不能选中 <p></p>，里面必须要有节点，插入 BR 之后输入文字自动消失
		if (this.editor.node.isEmpty(block)) {
			this.editor.node.html(
				block,
				this.editor.node.getBatchAppendHTML(activeMarks, '<br />'),
			);
		}

		if (this.editor.node.isEmpty(sideBlock)) {
			this.editor.node.html(
				sideBlock,
				this.editor.node.getBatchAppendHTML(activeMarks, '<br />'),
			);
		}
		block.children().each(child => {
			if (this.editor.node.isInline(child)) {
				this.editor.inline.repairCursor(child);
			}
		});
		sideBlock.children().each(child => {
			if (this.editor.node.isInline(child)) {
				this.editor.inline.repairCursor(child);
			}
		});
		// 重新设置当前选中范围
		safeRange.select(sideBlock, true).shrinkToElementNode();

		if (
			sideBlock.children().length === 1 &&
			sideBlock.first()?.name === 'br'
		) {
			safeRange.collapse(false);
		} else {
			safeRange.collapse(true);
		}

		if (!range) change.apply(safeRange);
	}
	/**
	 * 在当前光标位置插入block节点
	 * @param block 节点
	 * @param removeEmpty 是否移除当前位置上的block
	 * @param range 光标
	 */
	insert(
		block: NodeInterface | Node | string,
		removeEmpty: boolean = false,
		range?: RangeInterface,
	) {
		if (!isEngine(this.editor)) return;
		const { $ } = this.editor;
		const { change, node } = this.editor;
		const safeRange = range || change.getSafeRange();
		const doc = getDocument(safeRange.startContainer);
		if (typeof block === 'string' || isNode(block)) {
			block = $(block, doc);
		} else block = block;

		if (!node.isBlock(block)) return;

		// 范围为折叠状态时先删除内容
		if (!safeRange.collapsed) {
			change.deleteContent(safeRange);
		}

		// 获取上面第一个 Block
		const container = this.closest(safeRange.startNode);
		// 超出编辑范围
		if (!container.isEditable() && !container.inEditor()) {
			if (!range) change.apply(safeRange);
			return;
		}
		// 当前选择范围在段落外面
		if (container.isEditable()) {
			change.insertNode(block, safeRange);
			safeRange.collapse(false);
			if (!range) change.apply(safeRange);
			return;
		}
		// <p><cursor /><br /></p>
		// to
		// <p><br /><cursor /></p>
		if (
			container.children().length === 1 &&
			container.first()?.name === 'br'
		) {
			safeRange.select(container, true).collapse(false);
		}
		// 插入范围的开始和结束标记
		const selection = safeRange.enlargeToElementNode().createSelection();
		if (!selection.has()) {
			if (!range) change.apply(safeRange);
			return;
		}

		const containerClone = this.editor.node.clone(container, false);
		// 切割 Block
		let child = container.first();
		let isLeft = true;

		while (child) {
			const next = child.next();
			if (child.equal(selection.anchor!)) {
				isLeft = false;
				child = next;
				continue;
			}

			if (!isLeft) {
				containerClone.append(child);
			}
			child = next;
		}

		if (!node.isEmpty(containerClone)) {
			container.after(containerClone);
		}
		// 如果是列表，增加br标签
		const containerParent = container.parent();
		if (containerParent && this.editor.node.isList(containerParent)) {
			const cardNode = container.first();
			if (cardNode?.isCard()) {
				const cardName = cardNode.attributes(CARD_KEY);
				this.editor.list.addCardToCustomize(containerClone, cardName);
			}

			if (this.editor.node.isCustomize(container)) {
				this.editor.list.addBr(container);
			}
		}
		// 移除范围的开始和结束标记
		selection.move();
		// 移除原 Block
		safeRange.setStartAfter(container);
		safeRange.collapse(true);
		if (node.isEmpty(container) && !removeEmpty) container.remove();
		// 插入新 Block
		change.insertNode(block, safeRange);
		if (!range) change.apply(safeRange);
	}
	/**
	 * 设置当前光标所在的所有block节点为新的节点或设置新属性
	 * @param block 需要设置的节点或者节点属性
	 * @param range 光标
	 */
	setBlocks(block: string | { [k: string]: any }, range?: RangeInterface) {
		if (!isEngine(this.editor)) return;
		const { $ } = this.editor;
		const { change } = this.editor;
		const safeRange = range || change.getSafeRange();
		const doc = getDocument(safeRange.startContainer);
		let targetNode: NodeInterface | null = null;
		let attributes: { [k: string]: any } = {};
		if (typeof block === 'string') {
			targetNode = $(block, doc);
			attributes = targetNode.attributes();
			attributes.style = targetNode.css();
		} else {
			attributes = block;
		}

		const blocks = this.getBlocks(safeRange);
		// 编辑器根节点，无段落
		const { startNode } = safeRange;
		if (startNode.isEditable() && blocks.length === 0) {
			const newBlock = targetNode || $('<p></p>');
			this.editor.node.setAttributes(newBlock, attributes);

			const selection = safeRange.createSelection();

			startNode.children().each(node => {
				newBlock.append(node);
			});

			startNode.append(newBlock);
			selection.move();
			if (!range) change.apply(safeRange);
			return;
		}

		const selection = safeRange.createSelection();
		blocks.forEach(node => {
			// Card 不做处理
			if (node.attributes(CARD_KEY)) {
				return;
			}
			// 相同标签，或者只传入样式属性
			if (!targetNode || node.name === targetNode.name) {
				this.editor.node.setAttributes(node, attributes);
				return;
			}
			this.editor.node.replace(node, targetNode);
		});
		selection.move();
		if (!range) change.apply(safeRange);
	}
	/**
	 * 合并当前光标位置相邻的block
	 * @param range 光标
	 */
	merge(range?: RangeInterface) {
		if (!isEngine(this.editor)) return;
		const { change, schema } = this.editor;
		const safeRange = range || change.getSafeRange();
		const blocks = this.getBlocks(safeRange);
		if (0 === blocks.length) return;
		const root = blocks[0].closest(ROOT_SELECTOR);
		const tags = schema.getCanMergeTags();
		if (tags.length === 0) return;
		const block = root.find(tags.join(','));
		if (block.length > 0) {
			const selection = safeRange.createSelection();
			let nextNode = block.next();
			while (nextNode) {
				const prevNode = nextNode.prev();
				const nextAttributes = nextNode.attributes();
				const prevAttributes = prevNode?.attributes();
				if (
					nextNode.name === prevNode?.name &&
					nextAttributes['class'] ===
						(prevAttributes
							? prevAttributes['class']
							: undefined) &&
					Object.keys(nextAttributes).join(',') ===
						Object.keys(prevAttributes || {}).join(',')
				) {
					this.editor.node.merge(prevNode, nextNode);
				}
				nextNode = nextNode.next();
			}
			selection.move();
		}
		if (!range) change.apply(safeRange);
	}

	/**
	 * 获取对范围有效果的所有 Block
	 */
	findBlocks(range: RangeInterface) {
		range = range.cloneRange();
		range.shrinkToElementNode();
		const sc = range.startContainer;
		const so = range.startOffset;
		const ec = range.endContainer;
		const eo = range.endOffset;
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
		const addNode = (
			nodes: Array<NodeInterface>,
			nodeB: NodeInterface,
			preppend?: boolean,
		) => {
			if (
				!nodes.some(nodeA => {
					return nodeA[0] === nodeB[0];
				})
			) {
				if (preppend) {
					nodes.unshift(nodeB);
				} else {
					nodes.push(nodeB);
				}
			}
		};
		// 向上寻找
		const findNodes = (node: NodeInterface) => {
			const nodes = [];
			while (node) {
				if (node.isEditable()) {
					break;
				}
				if (this.editor.node.isBlock(node)) {
					nodes.push(node);
				}
				const parent = node.parent();
				if (!parent) break;
				node = parent;
			}
			return nodes;
		};

		const nodes = this.getBlocks(range);
		const { $ } = this.editor;
		// rang头部应该往数组头部插入节点
		findNodes($(startNode)).forEach(node => {
			return addNode(nodes, node, true);
		});

		if (!range.collapsed) {
			findNodes($(endNode)).forEach(node => {
				return addNode(nodes, node);
			});
		}
		return nodes;
	}

	/**
	 * 判断范围的 {Edge}Offset 是否在 Block 的开始位置
	 * @param range 光标
	 * @param edge start ｜ end
	 */
	isFirstOffset(range: RangeInterface, edge: 'start' | 'end') {
		const { startNode, endNode, startOffset, endOffset } = range;
		const container = edge === 'start' ? startNode : endNode;
		const offset = edge === 'start' ? startOffset : endOffset;
		range = range.cloneRange();
		const block = this.closest(container);
		range.select(block, true);
		range.setEnd(container[0], offset);
		const fragment = range.cloneContents();

		if (!fragment.firstChild) {
			return true;
		}
		const { $ } = this.editor;
		if (
			fragment.childNodes.length === 1 &&
			$(fragment.firstChild).name === 'br'
		) {
			return true;
		}

		const node = $('<div />');
		node.append(fragment);
		return this.editor.node.isEmpty(node);
	}

	/**
	 * 判断范围的 {Edge}Offset 是否在 Block 的最后位置
	 * @param range 光标
	 * @param edge start ｜ end
	 */
	isLastOffset(range: RangeInterface, edge: 'start' | 'end') {
		const { startNode, endNode, startOffset, endOffset } = range;
		const container = edge === 'start' ? startNode : endNode;
		const offset = edge === 'start' ? startOffset : endOffset;
		range = range.cloneRange();
		const block = this.closest(container);
		range.select(block, true);
		range.setStart(container, offset);
		const fragment = range.cloneContents();

		if (!fragment.firstChild) {
			return true;
		}
		const { $ } = this.editor;
		const node = $('<div />');
		node.append(fragment);

		return 0 >= node.find('br').length && this.editor.node.isEmpty(node);
	}

	/**
	 * 获取范围内的所有 Block
	 * @param range  光标s
	 */
	getBlocks(range: RangeInterface) {
		range = range.cloneRange();
		range.shrinkToElementNode();
		range.shrinkToTextNode();
		const startBlock = this.closest(range.startNode);
		const endBlock = this.closest(range.endNode);
		const closest = this.closest(range.commonAncestorNode);
		const blocks: Array<NodeInterface> = [];
		let started = false;
		const { $ } = this.editor;
		closest.traverse(node => {
			const child = $(node);
			if (child.equal(startBlock)) {
				started = true;
			}
			if (
				started &&
				this.editor.node.isBlock(child) &&
				!child.isCard() &&
				child.inEditor()
			) {
				blocks.push(child);
			}
			if (child.equal(endBlock)) {
				started = false;
				return false;
			}
			return;
		});
		// 未选中文本时忽略该 Block
		// 示例：<h3><anchor />word</h3><p><focus />another</p>
		if (blocks.length > 1 && this.isFirstOffset(range, 'end')) {
			blocks.pop();
		}
		return blocks;
	}

	/**
	 * 生成 cursor 左侧或右侧的节点，放在一个和父节点一样的容器里
	 * isLeft = true：左侧
	 * isLeft = false：右侧
	 * @param param0
	 */
	createSide({
		block,
		range,
		isLeft,
		clone = false,
		keepID = false,
	}: {
		block: NodeInterface | Node;
		range: RangeInterface;
		isLeft: boolean;
		clone?: boolean;
		keepID?: boolean;
	}) {
		const { $ } = this.editor;
		if (isNode(block)) block = $(block);
		const newRange = Range.create(this.editor, block.document!);

		if (isLeft) {
			newRange.select(block, true);
			newRange.setEnd(range.startContainer, range.startOffset);
		} else {
			newRange.select(block, true);
			newRange.setStart(range.endContainer, range.endOffset);
		}

		const fragement = clone
			? newRange.cloneContents()
			: newRange.extractContents();
		const dupBlock = keepID
			? block.clone(false)
			: this.editor.node.clone(block, false);
		dupBlock.append(fragement);
		if (clone) {
			dupBlock.find(CARD_SELECTOR).each(card => {
				const domCard = $(card);
				const cardName = domCard.attributes(CARD_KEY);
				domCard.attributes(READY_CARD_KEY, cardName);
				domCard.removeAttributes(CARD_KEY);
			});
		}
		return dupBlock;
	}

	/**
	 * 获取 Block 左侧文本
	 * @param block 节点
	 */
	getLeftText(block: NodeInterface | Node, range?: RangeInterface) {
		if (!isEngine(this.editor)) return '';
		range = range || this.editor.change.getRange();
		const leftBlock = this.createSide({
			block,
			range,
			isLeft: true,
			clone: true,
		});
		return leftBlock
			.text()
			.trim()
			.replace(/\u200B/g, '');
	}

	/**
	 * 删除 Block 左侧文本
	 * @param block 节点
	 */
	removeLeftText(block: NodeInterface | Node, range?: RangeInterface) {
		if (!isEngine(this.editor)) return;
		const { $ } = this.editor;
		range = range || this.editor.change.getRange();
		if (isNode(block)) block = $(block);
		range.createSelection();
		const cursor = block.find(CURSOR_SELECTOR);
		let isRemove = false;
		// 删除左侧文本节点
		block.traverse(node => {
			const child = $(node);
			if (child.equal(cursor)) {
				cursor.remove();
				isRemove = true;
				return;
			}
			if (isRemove && child.isText()) {
				child.remove();
			}
		}, false);
	}

	/**
	 * 整理块级节点
	 * @param domNode 节点
	 * @param root 根节点
	 */
	flatten(domNode: NodeInterface, root: NodeInterface) {
		if (!isEngine(this.editor)) return;
		const { $, schema } = this.editor;
		const mergeTags = schema.getCanMergeTags();
		//获取父级节点
		let parentNode = domNode[0].parentNode;
		const rootElement = root.isFragment ? root[0].parentNode : root[0];
		//在根节点内循环
		while (parentNode !== rootElement) {
			const domParentNode = $(parentNode || []);
			//如果是卡片节点，就在父节点前面插入
			if (domNode.isCard()) domParentNode.before(domNode);
			else if (
				//如果是li标签，并且父级是 ol、ul 列表标签
				(this.editor.node.isList(domParentNode) &&
					'li' === domNode.name) ||
				//如果是父级可合并标签，并且当前节点是根block节点，并且不是 父节点一样的block节点
				(mergeTags.indexOf(domParentNode.name) > -1 &&
					this.editor.node.isBlock(domNode) &&
					domParentNode.name !== domNode.name)
			) {
				//复制节点
				const cloneNode = this.editor.node.clone(domParentNode, false);
				//追加到复制的节点
				cloneNode.append(domNode);
				//设置新的节点
				domNode = cloneNode;
				//将新的节点插入到父节点之前
				domParentNode.before(domNode);
			} else {
				domNode = this.editor.node.replace(
					domNode,
					this.editor.node.clone(
						this.findTop(domParentNode, domNode),
						false,
					),
				);
				domParentNode.before(domNode);
			}
			//如果没有子节点就移除
			if (!domParentNode.first()) domParentNode.remove();
			//设置新的父节点
			parentNode = domNode[0].parentNode;
		}
	}

	/**
	 * 根据规则获取需要为节点创建 data-id 的标签名称集合
	 * @returns
	 */
	getMarkIdTags() {
		const names: Array<string> = [];
		this.editor.schema.data.blocks.forEach(schema => {
			if (names.indexOf(schema.name) < 0) {
				names.push(schema.name);
			}
		});
		return names;
	}
	/**
	 * 给节点创建data-id
	 * @param node 节点
	 * @param index 索引
	 * @returns
	 */
	createDataID(node: Node | NodeInterface, index: number) {
		const { $ } = this.editor;
		if (isNode(node)) node = $(node);
		const { name } = node;
		const id =
			md5(
				''
					.concat(name, '_')
					.concat(index.toString(), '_')
					.concat(node.get<HTMLElement>()?.innerText || ''),
			) +
			'_' +
			name +
			'_' +
			index.toString();
		node.attributes('data-id', id);
		return id;
	}
	/**
	 * 获取或产生节点的data-id
	 * @param root 根节点
	 * @param node 节点
	 * @returns
	 */
	generateDataID(root: Element, node: HTMLElement): string | null {
		const { nodeName } = node;
		const id = node.getAttribute('data-id');
		if (id) return id;
		const nodes = root.querySelectorAll(nodeName);
		for (let i = 0; i < nodes.length; i++) {
			if (nodes[i] === node) return this.createDataID(node, i);
		}
		return null;
	}
	/**
	 * 在根节点内为需要创建data-id的子节点创建data-id
	 * @param root 根节点
	 */
	generateDataIDForDescendant(root: Element) {
		this.getMarkIdTags().forEach(nodeName => {
			const nodes = root.querySelectorAll(nodeName);
			for (let i = 0; i < nodes.length; i++) {
				const node = this.editor.$(nodes[i]);
				if (!node.attributes('data-id') && !node.isCard())
					this.createDataID(node, i);
			}
		});
	}
	/**
	 * 为节点创建一个随机data-id
	 * @param node 节点
	 * @param isCreate 如果有，是否需要重新创建
	 * @returns
	 */
	generateRandomID(node: Node | NodeInterface, isCreate: boolean = false) {
		const { $ } = this.editor;
		if (isNode(node)) node = $(node);
		if (node.isCard()) return '';
		if (!isCreate) {
			const id = node.attributes('data-id');
			if (id) return id;
		}
		const id = md5(
			''
				.concat(Math.random().toString(), '_')
				.concat(Date.now().toString()),
		);
		node.attributes('data-id', id);
		return id;
	}
	/**
	 * 在根节点内为需要创建data-id的子节点创建随机data-id
	 * @param node 节点
	 * @param isCreate 如果有，是否需要重新创建
	 */
	generateRandomIDForDescendant(root: Node, isCreate: boolean = false) {
		if (
			root.nodeType === getWindow().Node.ELEMENT_NODE ||
			root.nodeType === getWindow().Node.DOCUMENT_FRAGMENT_NODE
		) {
			this.getMarkIdTags().forEach(nodeName => {
				const nodes = (root as
					| Element
					| DocumentFragment).querySelectorAll(nodeName);
				for (let i = 0; i < nodes.length; i++) {
					const node = this.editor.$(nodes[i]);
					if (node.isCard()) continue;
					this.generateRandomID(node, isCreate);
				}
			});
		}
	}
	/**
	 * 判断一个节点是否需要创建data-id
	 * @param name 节点名称
	 * @returns
	 */
	needMarkDataID(name: string) {
		return !!this.getMarkIdTags()[name.toLowerCase()];
	}

	/**
	 * br 换行改成段落
	 * @param block 节点
	 */
	brToBlock(block: NodeInterface) {
		// 没有子节点
		if (!block.first()) {
			return;
		}
		// 只有一个节点
		if (block.children().length === 1) {
			return;
		}
		if ('li' === block.name) return;
		// 只有一个节点（有光标标记节点）
		if (
			(block.children().length === 2 &&
				block.first()?.attributes(DATA_ELEMENT) === CURSOR) ||
			block.last()?.attributes(DATA_ELEMENT) === CURSOR
		) {
			return;
		}

		let container;
		let prevContainer;
		let node = block.first();
		const { $ } = this.editor;
		while (node) {
			const next = node.next();
			if (!container || node.name === 'br') {
				prevContainer = container;
				container = this.editor.node.clone(block, false);
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
	}

	/**
	 * 插入一个空的block节点
	 * @param range 光标所在位置
	 * @param block 节点
	 * @returns
	 */
	insertEmptyBlock(range: RangeInterface, block: NodeInterface) {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const { blocks, marks } = change;
		this.insert(block, true);
		if (blocks[0]) {
			const styles = blocks[0].css();
			block.css(styles);
		}
		let node = block.find('br');
		marks.forEach(mark => {
			// 回车后，默认是否复制makr样式，因为mark插件样式可能合并了，所以查找出来可能是多个插件
			const plugins = this.editor.mark.findPlugin(mark);
			let removeCount = 0;
			mark = this.editor.node.clone(mark);
			plugins.forEach(plugin => {
				//插件判断
				if (plugin.copyOnEnter === false) {
					//移除插件不允许的属性
					Object.keys(plugin.attributes || {}).forEach(
						attributesName => {
							mark.removeAttributes(attributesName);
						},
					);
					//移除插件不允许的样式
					Object.keys(plugin.style || {}).forEach(styleName => {
						mark.css(styleName);
					});
					removeCount++;
				}
			});
			//一个插件都没有移除，或者移除的个数小于插件的个数，说明还有插件保留的样式需要复制
			if (removeCount === 0 || removeCount < plugins.length) {
				mark = this.editor.node.clone(mark);
				node.before(mark);
				mark.append(node);
				node = mark;
			}
		});
		range.select(block.find('br'));
		range.collapse(false);
		range.scrollIntoView();
		change.select(range);
	}
	/**
	 * 在光标位置插入或分割节点
	 * @param range 光标所在位置
	 * @param block 节点
	 */
	insertOrSplit(range: RangeInterface, block: NodeInterface) {
		const cloneRange = range.cloneRange();
		cloneRange.enlargeFromTextNode();
		const { $ } = this.editor;
		if (
			this.isLastOffset(range, 'end') ||
			(cloneRange.endNode.type === getWindow().Node.ELEMENT_NODE &&
				block.children().length > 0 &&
				cloneRange.endContainer.childNodes[cloneRange.endOffset] ===
					block.last()?.get() &&
				'br' === block.first()?.name)
		) {
			if (block.name === 'p' && block.get<HTMLElement>()?.className) {
				this.insertEmptyBlock(
					range,
					$(
						`<p class="${
							block.get<HTMLElement>()?.className
						}"><br /></p>`,
					),
				);
			} else {
				this.insertEmptyBlock(range, $(`<p><br /></p>`));
			}
		} else {
			this.split();
		}
	}
}
export default Block;
