import { CARD_KEY, DATA_ID } from '../constants';
import Range from '../range';
import {
	EditorInterface,
	NodeInterface,
	PluginEntry,
	RangeInterface,
} from '../types';
import { ListInterface, ListModelInterface } from '../types/list';
import { getDocument, isEngine, removeUnit } from '../utils';
import { Enter, Backspace } from './typing';
import { $ } from '../node';
import { isNode } from '../node/utils';

class List implements ListModelInterface {
	private editor: EditorInterface;
	/**
	 * 自定义列表样式
	 */
	readonly CUSTOMZIE_UL_CLASS = 'data-list';
	/**
	 * 自定义列表样式
	 */
	readonly CUSTOMZIE_LI_CLASS = 'data-list-item';
	/**
	 * 列表缩进key
	 */
	readonly INDENT_KEY = 'data-indent';
	/**
	 * 列表项point位置
	 */
	readonly STYLE_POSITION_NAME = 'list-style-position';
	readonly STYLE_POSITION_VALUE = 'inside';

	backspaceEvent?: Backspace;

	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	init() {
		const editor = this.editor;
		if (isEngine(editor)) {
			//绑定回车事件
			const enter = new Enter(editor);
			editor.typing
				.getHandleListener('enter', 'keydown')
				?.on((event) => enter.trigger(event));
			//删除事件
			this.backspaceEvent = new Backspace(editor);
			editor.typing
				.getHandleListener('backspace', 'keydown')
				?.on((event) => this.backspaceEvent?.trigger(event));
		}
	}

	/**
	 * 判断列表项节点是否为空
	 * @param node 节点
	 */
	isEmptyItem(node: NodeInterface): boolean {
		const children = node
			.children()
			.toArray()
			.filter((child) => {
				if (child.isText()) {
					return child.text().replace(/[\n\t]/g, '') !== '';
				}
				return !child.isCursor();
			});
		const nodeApi = this.editor.node;
		return (
			//节点名称必须为li
			'li' === node.name &&
			//空节点
			(nodeApi.isEmpty(node) ||
				children.length === 0 ||
				//子节点只有一个，如果是自定义列表并且第一个是卡片 或者第一个节点是 br标签，就是空节点
				(1 === children.length
					? (nodeApi.isCustomize(node) && children[0].isCard()) ||
					  'br' === children[0].name
					: //子节点有两个，并且是自定义列表而且第一个是卡片，并且第二个节点是br标签
					  2 === children.length &&
					  nodeApi.isCustomize(node) &&
					  !!children[0].isCard() &&
					  'br' === children[1].name))
		);
	}

	/**
	 * 判断两个节点是否是一样的List节点
	 * @param sourceNode 源节点
	 * @param targetNode 目标节点
	 */
	isSame(sourceNode: NodeInterface, targetNode: NodeInterface) {
		//节点名称不一样
		if (sourceNode.name !== targetNode.name) return false;
		const { node } = this.editor;
		//自定义列表类型不一致，要么都是，要么都不是
		if (node.isCustomize(sourceNode) !== node.isCustomize(targetNode))
			return false;
		//判断缩进是否一致
		const sourceIndent =
			parseInt(sourceNode.attributes(this.INDENT_KEY), 10) || 0;
		const targetIndent =
			parseInt(targetNode.attributes(this.INDENT_KEY), 10) || 0;
		return sourceIndent === targetIndent;
	}

	/**
	 * 判断节点集合是否是指定类型的List列表
	 * @param blocks 节点集合
	 * @param name 节点标签类型
	 * @param card 是否是指定的自定义列表项的卡片名称
	 */
	isSpecifiedType(
		blocks: Array<NodeInterface>,
		name: 'ul' | 'ol' = 'ul',
		card?: string,
	) {
		const { node } = this.editor;
		let isSame = true;
		blocks.forEach((block) => {
			//如果节点内包含了列表节点，则跳过此节点
			if (
				['li', 'p'].indexOf(block.name) === -1 &&
				(block.name === name || block.find(name).length > 0)
			)
				return;

			switch (block.name) {
				case 'li':
					//有指定卡片，判断是否是自定义列表项的卡片相同
					if (card) {
						let firstChild = block.first();
						if (firstChild?.isCursor())
							firstChild = firstChild.next();
						isSame =
							isSame &&
							node.isCustomize(block) &&
							(firstChild?.attributes(CARD_KEY) || '') === card;
					} else {
						isSame = isSame && !node.isCustomize(block);
					}
					break;
				case 'p':
					if (block.parent() && block.parent()?.name !== 'li') {
						isSame = false;
					}
					break;
				default:
					isSame = false;
					break;
			}
		});
		return isSame;
	}

	getPlugins() {
		const plugins: Array<ListInterface> = [];
		const pluginApi = this.editor.plugin;
		Object.keys(pluginApi.components).forEach((name) => {
			const plugin = pluginApi.components[name];
			if (!!(plugin as ListInterface).isCurrent) {
				plugins.push(plugin as ListInterface);
			}
		});
		return plugins;
	}

	/**
	 * 根据节点获取列表插件名称
	 * @param block 节点
	 */
	getPluginNameByNode(block: NodeInterface) {
		let name = block.name;
		const getName = (node: NodeInterface) => {
			let name = '';
			this.getPlugins().some((plugin) => {
				if (plugin.isCurrent(node)) {
					name = (plugin.constructor as PluginEntry).pluginName;
					return true;
				}
				return;
			});
			return name;
		};
		//如果是自定义列表
		if (this.editor.node.isCustomize(block)) return getName(block);
		//如果是li标签
		if ('li' === name && block.parent()) return getName(block.parent()!);
		return '';
	}

	/**
	 * 获取列表插件名称
	 * @param blocks 节点集合
	 */
	getPluginNameByNodes(blocks: Array<NodeInterface>) {
		let listType = '';
		for (let i = 0; i < blocks.length; i++) {
			const block = blocks[i];
			//节点父级
			const parent = block.parent();
			let type = '';
			switch (block.name) {
				case 'li':
				case 'ul':
				case 'ol':
					type = this.getPluginNameByNode(blocks[i]);
					break;
				case 'p':
					if (parent && parent.name === 'li') {
						type = this.getPluginNameByNode(parent);
					} else {
						return '';
					}
					break;
				default:
					//如果节点内包含了列表节点，则跳过此节点
					if (
						this.editor.node.isBlock(block) &&
						block.find('ul,ol').length > 0
					)
						break;
					else return '';
			}
			if (listType && type && listType !== type) {
				return '';
			}
			listType = type;
		}
		return listType;
	}

	/**
	 * 清除自定义列表节点相关属性
	 * @param node 节点
	 */
	unwrapCustomize(node: NodeInterface) {
		const nodeApi = this.editor.node;
		if (nodeApi.isCustomize(node)) {
			switch (node.name) {
				case 'li':
					if (nodeApi.isCustomize(node)) {
						const first = node.first();
						if (first?.isCard()) first.remove();
					}
					node.removeAttributes('class');
					return node;
				case 'ul':
					node.removeAttributes('class');
					return node;
				default:
					return node;
			}
		}
		return node;
	}

	/**
	 * 取消节点的列表
	 * @param blocks 节点集合
	 * @param normalBlock 要转换的block默认为 <p />
	 */
	unwrap(
		blocks: Array<NodeInterface>,
		normalBlock: NodeInterface = $('<p />'),
	) {
		let indent = 0;
		const { node, schema } = this.editor;
		const globals = schema.data.globals['block'] || {};
		const globalStyles = globals.style || {};
		blocks.forEach((block) => {
			this.unwrapCustomize(block);
			if (node.isList(block)) {
				indent = parseInt(block.attributes(this.INDENT_KEY), 10) || 0;
				node.unwrap(block);
			}

			if (block.name === 'li') {
				const toBlock = node.clone(normalBlock, false, false);
				if (indent !== 0) {
					toBlock.css('text-indent', indent * 2 + 'em');
				}
				block.removeAttributes(this.INDENT_KEY);
				const attributes = block.attributes();
				Object.keys(attributes).forEach((name) => {
					if (name !== DATA_ID && name !== 'id' && globals[name]) {
						toBlock.attributes(name, attributes[name]);
					}
				});
				const styles = block.css();
				if (styles['text-align'])
					this.addAlign(toBlock, styles['text-align'] as any);
				delete styles['text-align'];
				// 移除align样式
				styles[this.STYLE_POSITION_NAME] = '';
				// 移除不符合全局条件的样式
				Object.keys(styles).forEach((name) => {
					if (!globalStyles[name]) styles[name] = '';
				});
				toBlock.css(styles);
				node.replace(block, toBlock);
			}
		});
	}

	/**
	 * 获取当前选区的修复列表后的节点集合
	 */
	normalize(range?: RangeInterface) {
		const editor = this.editor;
		if (!isEngine(editor)) return [];
		const { change, block, node } = editor;
		range = range || change.range.get();
		const blocks = block.getBlocks(range);
		const listNodes: Array<NodeInterface> = [];
		blocks.forEach((block, i) => {
			const parent = block.parent();
			//节点是p标签
			if (block.name === 'p') {
				//p标签被li节点包裹时，去除p标签，并保留子节点和内容
				if (parent?.name === 'li') {
					if (i === 0) {
						listNodes.push(parent);
					}
					//去除包裹
					node.unwrap(block);
					return;
				}
				// <ul><p>a</p></ul> => <ul><li>a</li></ul>
				if (parent && ['ul', 'ol'].indexOf(parent.name) > -1) {
					block = node.replace(block, $('<li />'));
					listNodes.push(block);
					return;
				}
			}

			if (block.name === 'li' && parent?.name === 'li') {
				// <li><li>a</li></li> => <li>a</li>
				if (i === 0) {
					listNodes.push(parent);
				}

				node.unwrap(block);
				return;
			}

			if (['ul', 'ol'].indexOf(block.name) > -1) {
				// <li><ul>...</ul></li> => <li>...</li>
				if (parent?.name === 'li') {
					node.unwrap(block);
					return;
				}
			}

			listNodes.push(block);
		});
		// 最后一个 li 如果没选中内容，会在 getBlocks 时抛弃掉，这里需要补回来
		const lastBlock = range.endNode.closest('li');

		if (
			!listNodes.some((block) => {
				return block[0] === lastBlock[0];
			})
		) {
			listNodes.push(lastBlock);
		}
		return listNodes;
	}

	/**
	 * 将选中列表项列表分割出来单独作为一个列表
	 */
	split(range?: RangeInterface) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, node } = editor;
		const safeRange = range || change.range.toTrusty();
		const blocks = this.normalize(range);
		if (
			blocks.length > 0 &&
			(blocks[0].name === 'li' || blocks[blocks.length - 1].name === 'li')
		) {
			const selection = safeRange.createSelection();
			const firstBlock = blocks[0];
			const lastBlock = blocks[blocks.length - 1];
			const middleList = [];
			const rightList = [];
			let beforeListElement: NodeInterface | undefined;
			//选区中最后的li节点的列表节点
			let afterListElement: NodeInterface | undefined;
			// 当前选中的第一个节点是li，并且这个节点前面还有节点，那就获取选中的节点所在列表的后续节点然后放入middleList
			if (firstBlock.prev()) {
				beforeListElement = firstBlock.parent();
				let indexInRange = 0;

				while (
					blocks[indexInRange] &&
					blocks[indexInRange].name === 'li'
				) {
					middleList.push(blocks[indexInRange]);
					indexInRange += 1;
				}
			}
			// 当前选中的最后一个节点是li，那么获取到这个列表的最后所有的li节点放入rightList
			if (lastBlock.next()) {
				afterListElement = lastBlock.parent();
				let nextBlock = lastBlock.next();

				while (nextBlock && nextBlock.name === 'li') {
					rightList.push(nextBlock);
					nextBlock = nextBlock.next();
				}
			}

			//将 rightList 集合添加到最后的列表节点内
			let afterListElementClone: NodeInterface | undefined;

			if (rightList.length > 0 && afterListElement) {
				afterListElementClone = node.clone(
					afterListElement,
					false,
					false,
				);
				rightList.forEach((li) => {
					afterListElementClone?.append(li[0]);
				});
				afterListElement.after(afterListElementClone);
			}

			let beforeListElementClone: NodeInterface | undefined;
			//将 middleList 集合添加到前方列表节点内
			if (middleList.length > 0 && beforeListElement) {
				beforeListElementClone = node.clone(
					beforeListElement,
					false,
					false,
				);
				middleList.forEach((li) => {
					beforeListElementClone?.append(li[0]);
				});
				beforeListElement.after(beforeListElementClone);
			}
			//有序列表设置start属性
			if (
				beforeListElement &&
				afterListElement &&
				afterListElement.equal(beforeListElement) &&
				beforeListElement.name === 'ol'
			) {
				const newStart =
					(parseInt(beforeListElement.attributes('start'), 10) || 1) +
					beforeListElement.find('li').length;
				afterListElementClone!.attributes('start', newStart);
			}
			selection.move();
		}
		if (!range) change.apply(safeRange);
	}

	merge(blocks?: Array<NodeInterface>, range?: RangeInterface) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, block, node, schema } = editor;
		const tags = schema.getCanMergeTags();
		if (tags.length === 0) return;
		const safeRange = range || change.range.toTrusty();
		const cloneRange = safeRange.cloneRange();
		const selection = blocks
			? undefined
			: cloneRange.shrinkToElementNode().createSelection();
		blocks = blocks || block.getBlocks(safeRange);
		let hasMerged = false;
		blocks.forEach((block) => {
			block = block.closest('ul,ol');
			if (!node.isList(block) || tags.indexOf(block.name) === -1) {
				return;
			}
			const prevBlock = block.prev();
			const nextBlock = block.next();

			if (prevBlock && this.isSame(prevBlock, block)) {
				node.merge(prevBlock, block);
				// 原来 block 已经被移除，重新指向
				block = prevBlock;
				hasMerged = true;
			}

			if (nextBlock && this.isSame(nextBlock, block)) {
				node.merge(block, nextBlock);
				hasMerged = true;
			}
		});
		if (hasMerged) {
			blocks = block.getBlocks(safeRange);
			if (blocks.length > 0) {
				const block = blocks[0].closest('ul,ol');
				this.addStart(block);
			}
		}
		selection?.move();
		if (!range && selection !== undefined) change.apply(cloneRange);
	}
	/**
	 * 给列表添加start序号
	 * @param block 列表节点
	 */
	addStart(block?: NodeInterface) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, node } = editor;
		if (!block) {
			const blocks = editor.block.getBlocks(change.range.get());
			if (blocks.length === 0) return;
			block = blocks[0].closest('ul,ol');
		}
		if (!block || !node.isList(block)) return;
		const startIndent =
			parseInt(block.attributes(this.INDENT_KEY), 10) || 0;
		// 当前选区起始位置如果不是第一层级，需要向前遍历，找到各层级的前序序号
		// 直到遇到一个非列表截止，比如 p

		let startCache: Array<number> = [];
		let cacheIndent = startIndent;
		let prevNode = block.prev();

		while (prevNode && node.isList(prevNode)) {
			if (prevNode.name === 'ol') {
				const prevIndent =
					parseInt(prevNode.attributes(this.INDENT_KEY), 10) || 0;
				const prevStart =
					parseInt(prevNode.attributes('start'), 10) || 1;
				const len = prevNode.find('li').length;

				if (prevIndent === 0) {
					startCache[prevIndent] = prevStart + len;
					break;
				}
				if (prevIndent <= cacheIndent) {
					cacheIndent = prevIndent;
					startCache[prevIndent] =
						startCache[prevIndent] || prevStart + len;
				}
			} else {
				cacheIndent =
					parseInt(prevNode.attributes(this.INDENT_KEY), 10) || 0;
			}

			prevNode = prevNode.prev();
		}

		let nextNode = block;
		while (nextNode) {
			if (node.isList(nextNode)) {
				const nextIndent =
					parseInt(nextNode.attributes(this.INDENT_KEY), 10) || 0;
				const nextStart = parseInt(nextNode.attributes('start'), 10);
				const _len = nextNode.find('li').length;

				if (nextNode.name === 'ol') {
					let currentStart = startCache[nextIndent];
					if (nextIndent > 0) {
						currentStart = currentStart || 1;
						if (currentStart > 1)
							nextNode.attributes('start', currentStart);
						else nextNode.removeAttributes('start');
						startCache[nextIndent] = currentStart + _len;
					} else {
						if (currentStart && currentStart !== nextStart) {
							if (currentStart > 1)
								nextNode.attributes('start', currentStart);
							else nextNode.removeAttributes('start');
							startCache[nextIndent] = currentStart + _len;
						} else {
							startCache[nextIndent] = (nextStart || 1) + _len;
							startCache = startCache.slice(0, nextIndent + 1);
						}
					}
				}
			} else startCache = [];
			const next = nextNode.next();
			if (!next) break;
			nextNode = next;
		}
	}

	/**
	 * 给列表节点增加缩进
	 * @param block 列表节点
	 * @param value 缩进值
	 */
	addIndent(block: NodeInterface, value: number, maxValue?: number) {
		if (this.editor.node.isList(block)) {
			const indentValue = this.getIndent(block);
			value = indentValue + (value < 0 ? -1 : 1);
			if (maxValue && value > maxValue) value = maxValue;
			if (value < 1) {
				block.removeAttributes(this.INDENT_KEY);
			} else {
				block.attributes(this.INDENT_KEY, value);
			}
		}
	}
	/**
	 * 获取列表节点 indent 值
	 * @param block 列表节点
	 * @returns
	 */
	getIndent(block: NodeInterface) {
		if (this.editor.node.isList(block)) {
			return parseInt(block.attributes(this.INDENT_KEY), 10) || 0;
		}
		return 0;
	}
	/**
	 * 给列表节点增加文字方向
	 * @param block 列表项节点
	 * @param align 方向
	 * @returns
	 */
	addAlign(
		block: NodeInterface,
		align?: 'left' | 'center' | 'right' | 'justify',
	) {
		if (block.name !== 'li') return;
		if (align && align !== 'left') {
			if (['center', 'right'].indexOf(align) > -1) {
				block.css({
					[this.STYLE_POSITION_NAME]: this.STYLE_POSITION_VALUE,
				});
			}
			block.css({ 'text-align': align });
		} else {
			block.css({ [this.STYLE_POSITION_NAME]: '', 'text-align': '' });
		}
	}
	/**
	 * 为自定义列表项添加卡片节点
	 * @param node 列表节点项
	 * @param cardName 卡片名称，必须是支持inline卡片类型
	 * @param value 卡片值
	 */
	addCardToCustomize(
		node: NodeInterface | Node,
		cardName: string,
		value?: any,
	) {
		if (isNode(node)) node = $(node);
		//必须是li标签
		if (node.name !== 'li') return;
		//第一个子节点必须不是相同卡片
		const first = node.first();
		if (
			first?.isBlockCard() ||
			(first?.isCard() && first.attributes(CARD_KEY) === cardName)
		)
			return;
		const editor = this.editor;
		//创建卡片
		const { card } = editor;
		const component = card.create(cardName, {
			value,
		});
		const range = Range.create(editor);
		//设置光标选中空的标签，在这个位置插入卡片
		const br = $('<br />');
		if ((node.get<Node>()?.childNodes.length ?? 0) > 0) {
			node.first()?.before(br);
		} else {
			node.append(br);
		}
		range.select(br, true);
		//插入卡片
		card.insertNode(range, component);
		const lastNode = node.last();
		if (lastNode?.name === 'br') {
			lastNode.remove();
		}
		return component;
	}
	/**
	 * 为自定义列表项添加待渲染卡片节点
	 * @param node 列表节点项
	 * @param cardName 卡片名称，必须是支持inline卡片类型
	 * @param value 卡片值
	 */
	addReadyCardToCustomize(
		node: NodeInterface | Node,
		cardName: string,
		value?: any,
	) {
		if (isNode(node)) node = $(node);
		//必须是li标签
		if (node.name !== 'li') return;
		//第一个子节点必须不是卡片
		const first = node.first();
		if (
			first?.isBlockCard() ||
			(first?.isCard() && first.attributes(CARD_KEY) === cardName)
		)
			return;
		const cardRoot = $('<span />');
		node.prepend(cardRoot);
		this.editor.card.replaceNode(cardRoot, cardName, value);
		return cardRoot;
	}

	/**
	 * 给列表添加BR标签
	 * @param node 列表节点项
	 */
	addBr(node: NodeInterface) {
		const nodeApi = this.editor.node;
		if (nodeApi.isList(node)) {
			node.find('li').each((node) => {
				this.addBr($(node));
			});
		} else if (nodeApi.isCustomize(node)) {
			let child = node.last();
			while (child?.isCursor()) child = child.prev();
			if (child) {
				//自定义节点，并且最后一个是卡片
				const children = node.children();
				if (children.length === 1 && child.isCard()) {
					node.append($('<br />'));
					return;
				}
				if (children.length > 2 && child.name === 'br') {
					if (child.prev()?.name !== 'br') child.remove();
					return;
				}
				while (child) {
					if (
						child.equal(node.first()!) &&
						(child.isCard() || child.text() === '')
					) {
						node.append($('<br />'));
						return;
					}
					//文本
					if (child.type === Node.TEXT_NODE) {
						if (child.text() !== '') return;
						child = child.prev();
					}
					//节点
					else if (child.type === Node.ELEMENT_NODE) {
						if (!nodeApi.isMark(child) || child.text() !== '')
							return;
						child = node.prev();
					}
					//其它
					else child = child.prev();
				}
			} else node.append($('<br />'));
		}
	}

	insert(fragment: DocumentFragment, range?: RangeInterface) {
		const editor = this.editor;
		if (!isEngine(editor) || fragment.childNodes.length === 0) return;
		const { change, node, block } = editor;
		const safeRange = range || change.range.toTrusty();
		// 光标展开，先删除内容
		if (!safeRange.collapsed) change.delete(safeRange, true, true);
		const cloneRange = safeRange.cloneRange().shrinkToElementNode();
		let { startNode, startOffset } = cloneRange;
		let startElement: NodeInterface | undefined = startNode;
		// 如果是列表，取 offset 的li
		if (node.isList(startNode)) {
			startElement = startNode.children().eq(startOffset);
		}
		startElement = startElement?.closest('li', (n) =>
			node.isBlock(n) && n.nodeName !== 'LI'
				? undefined
				: n.parentElement || undefined,
		);
		// 非li不操作
		if (startElement?.length === 0 || startElement?.name !== 'li') return;

		// 缩小范围到文本节点
		safeRange.shrinkToElementNode().shrinkToTextNode();

		// 把列表分割扣出来
		//this.split(safeRange);
		// 从光标处分割
		block.split(safeRange);
		// 把列表分割扣出来
		const selection = safeRange.createSelection('list-insert');
		this.split(safeRange);
		const apply = (newRange: RangeInterface) => {
			block.merge(newRange);
			this.merge(undefined, newRange);
			selection?.move();
			if (!range) {
				change.apply(newRange);
			}
		};
		// 第一个节点嵌入到分割节点位置
		let beginNode = $(fragment)
			.toArray()
			.some((child) => node.isBlock(child))
			? $(fragment.childNodes[0])
			: $('<p></p>').append($(fragment));
		// 要插入的是列表
		const listElement = safeRange.startNode.closest('ul,ol');
		if (!listElement || !node.isList(listElement)) {
			apply(safeRange);
			return;
		}
		const startLi = safeRange.startNode.closest('li');
		// 自定义列表节点，补充被切割后的li里面的卡片
		if (node.isCustomize(listElement)) {
			const cardElement = listElement.prev()?.first()?.first();
			if (cardElement) {
				const cardComponent = editor.card.find(cardElement);
				if (cardComponent)
					this.addCardToCustomize(
						startLi,
						cardComponent.name,
						cardComponent.getValue(),
					);
			}
		}
		// 要插入的不是一个列表，或者是相同的列表，就把第一个节点内容追加到分割后的li后面
		const startIsMerge =
			!node.isList(beginNode) || this.isSame(listElement, beginNode);
		if (startIsMerge) {
			while (node.isBlock(beginNode)) {
				// 如果第一个子节点还是block节点就取这个节点作为第一个节点
				const first = beginNode.first();
				if (first && node.isBlock(first)) {
					beginNode = first;
					continue;
				}
				// 如果不是就跳出
				break;
			}
			// 删除多余的br标签
			const beforeELement = startLi.parent()?.prev()?.last();
			if (beforeELement?.name === 'li') {
				const beforeChildren = beforeELement?.children();
				beforeChildren?.each((child, index) => {
					if (child.nodeName === 'BR')
						beforeChildren.eq(index)?.remove();
				});
				// 自定义列表，删除第一个卡片
				if (node.isCustomize(beginNode)) {
					beginNode.first()?.remove();
				}
				if (beginNode.isBlockCard()) {
					beforeELement.parent()?.after(beginNode);
				} else {
					beforeELement?.append(
						node.isBlock(beginNode)
							? beginNode.children()
							: beginNode,
					);
					if (beforeELement) this.addBr(beforeELement);
					if (node.isBlock(beginNode)) {
						beginNode.remove();
					}
				}
			}
		} else {
			// 如果开头位置不用拼接，判断是否是空节点，空节点就移除
			const beforeELement = startLi.parent()?.prev()?.last();
			if (
				beforeELement &&
				(node.isEmpty(beforeELement) || this.isEmptyItem(beforeELement))
			) {
				beforeELement.remove();
				if (
					beforeELement.parent()?.get<Node>()?.childNodes.length === 0
				)
					beforeELement.parent()?.remove();
			}
		}
		// 只有一行
		if (
			fragment.childNodes.length === 0 ||
			(fragment.childNodes.length === 1 &&
				node.isList(fragment.childNodes[0]) &&
				fragment.childNodes[0].childNodes.length === 0)
		) {
			const parent = startLi.parent();
			if (!beginNode.isBlockCard()) {
				if (node.isCustomize(startLi)) {
					startLi.first()?.remove();
				}
				startLi.find('br').remove();
				parent?.prev()?.last()?.append(startLi.children());
				parent?.remove();
			} else if (parent) {
				if (
					this.isEmptyItem(startLi) &&
					parent.get<Node>()?.childNodes.length === 1
				) {
					parent.remove();
				}
				const mergeNodes = [parent];
				const prev = beginNode.prev();
				if (prev && node.isList(prev)) mergeNodes.push(prev);
				this.merge(mergeNodes);
			}
			apply(safeRange);
			return;
		}

		let startListElment = safeRange.startNode.closest('li').parent();
		if (!startListElment) {
			apply(safeRange);
			return;
		}
		const fragmentLength = fragment.childNodes.length;
		let endNode = $(fragment.childNodes[fragmentLength - 1]);
		const endIsMerge =
			(!node.isList(endNode) || this.isSame(listElement, endNode)) &&
			!endNode.isBlockCard();
		// 如果集合中有列表或者block card，使用原节点，如果没有，其它节点都转换为列表
		let hasList = false;
		for (let i = 0; i < fragment.childNodes.length; i++) {
			const childnode = $(fragment.childNodes[i]);
			if (
				(node.isList(fragment.childNodes[i]) &&
					!this.isSame(listElement, childnode)) ||
				childnode.isBlockCard()
			) {
				hasList = true;
				break;
			}
		}
		const prevListElement = startListElment.prev();
		const mergeLists: NodeInterface[] = prevListElement
			? [prevListElement]
			: [];
		// 需要判断最后一个是否交给最后一个节点做合并，如果集合总含有列表就不合并
		for (
			let i = 0;
			i < (endIsMerge && !hasList ? fragmentLength - 1 : fragmentLength);
			i++
		) {
			// 每处理一个fragment中的集合就少一个，所以这里始终使用0做为索引
			const childElement = $(fragment.childNodes[0]);
			// 如果是列表
			if (node.isList(childElement)) {
				if (childElement.get<Node>()?.childNodes.length === 0) {
					childElement.remove();
					continue;
				}
				startListElment.before(childElement);
				mergeLists.push(childElement);
			} else {
				// 追加为普通节点
				if (hasList) {
					startListElment?.before(childElement);
					continue;
				}
				// 如果是block节点，要把它的所有子block节点都unwrap
				if (node.isBlock(childElement)) {
					childElement.allChildren().forEach((child) => {
						if (child.type === getDocument().TEXT_NODE) return;
						if (node.isBlock(child)) node.unwrap(child);
					});
				}
				// 自定义列表
				if (node.isCustomize(startListElment)) {
					const firstCard = startListElment.first()?.first();
					if (firstCard && firstCard.isCard()) {
						const cardName =
							firstCard.attributes(CARD_KEY) ||
							firstCard.attributes('name');
						const customizeList = this.toCustomize(
							childElement,
							cardName,
						);
						if (customizeList) {
							(Array.isArray(customizeList)
								? customizeList
								: [customizeList]
							).forEach((child) => {
								startListElment?.before(child);
							});
						}
					}
				} else {
					// 非自定义列表
					const listElements = this.toNormal(
						childElement,
						startListElment.name as any,
					);
					(Array.isArray(listElements)
						? listElements
						: [listElements]
					).forEach((child) => {
						if (editor.node.isList(child))
							startListElment?.before(child);
					});
				}
			}
		}
		if (mergeLists.length > 0) this.merge(mergeLists);
		if (!startIsMerge && node.isEmptyWidthChild(startListElment))
			startListElment.remove();
		// 后续不需要拼接到最后节点
		if (fragment.childNodes.length === 0) {
			// 删除由于分割造成的空行
			if (node.isEmpty(startLi) || this.isEmptyItem(startLi)) {
				const prevElement = startLi.parent()?.prev();
				startLi.find('br').remove();
				if (node.isCustomize(startLi)) startLi.first()?.remove();
				if (prevElement && node.isList(prevElement))
					prevElement.last()?.append(startLi.children());
				// 把光标位置放到前面的li里面
				else if (prevElement) prevElement.append(startLi.children());
				startLi.parent()?.remove();
			}
			apply(safeRange);
			return;
		}
		// 最后一个节点嵌入到分割后的最后一个节点内容前面
		while (node.isBlock(endNode)) {
			// 如果最后一个子节点还是block节点就取这个节点作为最后一个节点
			const last = endNode.last();
			if (last && node.isBlock(last)) {
				endNode = last;
				continue;
			}
			// 如果不是就跳出
			break;
		}
		const lasetELement = startLi;
		if (lasetELement) {
			if (!endNode.parent()?.fragment) {
				let beforeElement = lasetELement;
				let prev = endNode.prev();
				while (prev && prev.length > 0) {
					const pN = prev.prev();
					beforeElement.before(prev);
					beforeElement = prev;
					prev = pN;
				}
			}

			// 删除多余的br标签
			if (endNode.name === 'br') endNode.remove();
			else {
				const endChildren = endNode.children();
				endChildren.each((child, index) => {
					if (child.nodeName === 'BR')
						endChildren.eq(index)?.remove();
				});
				if (node.isCustomize(lasetELement)) {
					if (node.isCustomize(endNode)) {
						const endNodeCard = endNode.first();
						if (endNodeCard?.isCard()) endNodeCard.remove();
					}
					lasetELement
						.first()
						?.after(
							node.isBlock(endNode)
								? endNode.children()
								: endNode,
						);
				} else {
					lasetELement.prepend(
						node.isBlock(endNode) ? endNode.children() : endNode,
					);
				}
				this.addBr(lasetELement);
				if (node.isBlock(endNode)) endNode.remove();
			}
		}
		apply(safeRange);
	}

	/**
	 * block 节点转换为列表项节点
	 * @param block block 节点
	 * @param root 列表根节点
	 * @param cardName 可选，自定义列表项卡片名称
	 * @param value 可选，自定义列表项卡片值
	 * @returns
	 */
	blockToItem(
		block: NodeInterface,
		root: NodeInterface,
		cardName?: string,
		value?: string,
	) {
		const item = $('<li></li>');
		const { node, schema } = this.editor;
		if (!node.isList(root)) return root;
		// 获取缩进
		const indent = removeUnit(block.css('text-indent')) / 2;
		// 复制全局属性
		const globals = schema.data.globals['block'] || {};
		const attributes = block.attributes();
		Object.keys(attributes).forEach((name) => {
			if (name !== DATA_ID && name !== 'id' && globals['name']) {
				item.attributes(name, attributes[name]);
			}
		});
		// 复制全局样式，及生成 text-align
		const globalStyles = globals.style || {};
		const styles = block.css();
		if (styles['text-align'])
			this.addAlign(item, styles['text-align'] as any);
		delete styles['text-align'];
		delete styles[this.STYLE_POSITION_NAME];
		Object.keys(styles).forEach((name) => {
			if (!globalStyles[name]) delete styles[name];
		});
		item.css(styles);
		// 替换
		block = node.replace(block, item);
		// 如果是自定义列表，增加卡片
		if (cardName) {
			block.addClass(this.CUSTOMZIE_LI_CLASS);
			this.addCardToCustomize(block, cardName, value);
		}
		// 如果有设置缩进，就设置缩进属性
		if (indent) {
			root.attributes(this.INDENT_KEY, indent);
		}

		return node.wrap(block, root);
	}

	/**
	 * 将节点转换为自定义节点
	 * @param blocks 节点
	 * @param cardName 卡片名称
	 * @param value 卡片值
	 */
	toCustomize(
		blocks: Array<NodeInterface> | NodeInterface,
		cardName: string,
		value?: any,
		tagName: 'ol' | 'ul' = 'ul',
	) {
		const { node } = this.editor;
		if (Array.isArray(blocks)) {
			let nodes: Array<NodeInterface> = [];
			blocks.forEach((block) => {
				if (node.isCustomize(block)) {
					this.unwrapCustomize(block);
				}
				nodes = nodes.concat(
					this.toCustomize(block, cardName, value, tagName),
				);
			});
			return nodes;
		} else {
			const customizeRoot = $(
				`<${tagName} class="${this.CUSTOMZIE_UL_CLASS}"/>`,
			);
			switch (blocks.name) {
				case 'li':
					blocks.addClass(this.CUSTOMZIE_LI_CLASS);
					this.addCardToCustomize(blocks, cardName, value);
					return blocks;

				case 'ul':
				case 'ol':
					customizeRoot.attributes(blocks.attributes());
					blocks = node.replace(blocks, customizeRoot);
					return blocks;
				default:
					if (
						blocks.name === 'p' ||
						(node.isNestedBlock(blocks) && !blocks.isBlockCard())
					) {
						if (blocks.parent()?.name === 'li') {
							node.unwrap(blocks);
							return blocks;
						}
						blocks = this.blockToItem(
							blocks,
							customizeRoot,
							cardName,
							value,
						);
					}
					return blocks;
			}
		}
	}
	/**
	 * 将节点转换为列表节点
	 * @param blocks 节点
	 * @param tagName 列表节点名称，ul 或者 ol
	 * @param start 有序列表开始序号
	 */
	toNormal(
		blocks: Array<NodeInterface> | NodeInterface,
		tagName: 'ul' | 'ol' = 'ul',
		start?: number,
	) {
		const { node } = this.editor;
		if (Array.isArray(blocks)) {
			let nodes: Array<NodeInterface> = [];
			blocks.forEach((block) => {
				const node = this.toNormal(block, tagName, start);
				nodes = nodes.concat(node);
			});
			return nodes;
		} else {
			this.unwrapCustomize(blocks);
			const targetNode = $('<'.concat(tagName, ' />'));

			switch (blocks.name) {
				case 'li':
				case tagName:
					return blocks;

				case 'ol':
				case 'ul':
					targetNode.attributes(blocks.attributes());
					if (targetNode.name === 'ul')
						targetNode.removeAttributes('start');
					blocks = node.replace(blocks, targetNode);
					return blocks;
				default:
					if (
						blocks.name === 'p' ||
						(node.isNestedBlock(blocks) && !blocks.isBlockCard())
					) {
						if (blocks.parent()?.name === 'li') {
							node.unwrap(blocks);
							return blocks;
						}
						blocks = this.blockToItem(blocks, targetNode);
						if (start) {
							blocks.attributes('start', start);
						}
					}
					return blocks;
			}
		}
	}

	/**
	 * 判断选中的区域是否在List列表的开始
	 */
	isFirst(range: RangeInterface) {
		//获取选区开始节点和位置偏移值
		const { startNode, startOffset } = range;
		//复制选区
		const cloneRange = range.cloneRange();
		//找到li节点
		const node =
			'li' === startNode.name ? startNode : startNode.closest('li');
		//如果没有li节点
		if (!node[0]) return false;
		//让选区选择li节点
		cloneRange.select(node, true);
		//设置选区结束位置偏移值
		cloneRange.setEnd(startNode[0], startOffset);
		//复制选区内容
		const contents = cloneRange.cloneContents();
		//如果选区中没有节点
		if (!contents.firstChild) return true;
		const firstChild = $(contents.firstChild);
		const lastChild = $(contents.lastChild || []);
		//如果选区中只有一个节点，并且是br标签
		if (1 === contents.childNodes.length && 'br' === firstChild.name)
			return true;
		//如果选区中只有一个节点，并且是自定义列表并且第一个是Card
		if (
			1 === contents.childNodes.length &&
			node.hasClass(this.CUSTOMZIE_LI_CLASS) &&
			firstChild.isCard()
		)
			return true;
		const nodeApi = this.editor.node;
		//如果选区中只有两个节点，并且是自定义列表并且第一个是Card，最后一个为空节点
		if (
			2 === contents.childNodes.length &&
			node.hasClass(this.CUSTOMZIE_LI_CLASS) &&
			firstChild.isCard() &&
			nodeApi.isEmpty(lastChild)
		)
			return true;
		//判断选区内容是否是空节点
		const block = $('<div />');
		block.append(contents);
		return nodeApi.isEmpty(block);
	}

	/**
	 * 判断选中的区域是否在List列表的末尾
	 */
	isLast(range: RangeInterface) {
		//获取选区范围结束节点和结束位置偏移值
		const { endNode, endOffset } = range;
		//复制选区
		const cloneRange = range.cloneRange();
		//找到li节点
		const node = 'li' === endNode.name ? endNode : endNode.closest('li');
		//如果没有li节点
		if (!node[0]) return false;
		//让选区选择li节点
		cloneRange.select(node, true);
		//设置选区开始位置偏移值
		cloneRange.setStart(endNode, endOffset);
		//复制选区内容
		const contents = cloneRange.cloneContents();
		//如果选区中没有节点
		if (!contents.firstChild) return true;
		const firstChild = $(contents.firstChild);
		const lastChild = $(contents.lastChild || []);
		//如果选区中只有一个节点，并且是br标签
		if (1 === contents.childNodes.length && 'br' === firstChild.name)
			return true;
		//如果选区中只有一个节点，并且是自定义列表并且第一个是Card
		if (
			1 === contents.childNodes.length &&
			node.hasClass(this.CUSTOMZIE_LI_CLASS) &&
			firstChild.isCard()
		)
			return true;
		const nodeApi = this.editor.node;
		//如果选区中只有两个节点，并且是自定义列表并且第一个是Card，最后一个为空节点
		if (
			2 === contents.childNodes.length &&
			node.hasClass(this.CUSTOMZIE_LI_CLASS) &&
			firstChild.isCard() &&
			nodeApi.isEmpty(lastChild)
		)
			return true;
		//判断选区内容是否是空节点
		const block = $('<div />');
		block.append(contents);
		return nodeApi.isEmpty(block);
	}
}

export default List;
