import { CARD_KEY, CARD_SELECTOR } from '../constants';
import Range from '../range';
import {
	EditorInterface,
	isEngine,
	NodeInterface,
	PluginEntry,
	RangeInterface,
	isNode,
	CardEntry,
} from '../types';
import { ListInterface, ListModelInterface } from '../types/list';
import { getWindow, removeUnit } from '../utils';
import { Enter, Backspace } from './typing';
import { $ } from '../node';

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

	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	init() {
		if (isEngine(this.editor)) {
			//绑定回车事件
			const enter = new Enter(this.editor);
			this.editor.typing
				.getHandleListener('enter', 'keydown')
				?.on((event) => enter.trigger(event));
			//删除事件
			const backspace = new Backspace(this.editor);
			this.editor.typing
				.getHandleListener('backspace', 'keydown')
				?.on((event) => backspace.trigger(event));
		}
	}

	/**
	 * 判断列表项节点是否为空
	 * @param node 节点
	 */
	isEmptyItem(node: NodeInterface): boolean {
		return (
			//节点名称必须为li
			'li' === node.name &&
			//空节点
			(this.editor.node.isEmpty(node) ||
				//子节点只有一个，如果是自定义列表并且第一个是卡片 或者第一个节点是 br标签，就是空节点
				(1 === node.children().length
					? (node.hasClass(this.CUSTOMZIE_LI_CLASS) &&
							node.first()?.isCard()) ||
					  'br' === node.first()?.name
					: //子节点有两个，并且是自定义列表而且第一个是卡片，并且第二个节点是br标签
					  2 === node.children().length &&
					  node.hasClass(this.CUSTOMZIE_LI_CLASS) &&
					  !!node.first()?.isCard() &&
					  'br' === node.last()?.name))
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
		Object.keys(this.editor.plugin.components).forEach((name) => {
			const plugin = this.editor.plugin.components[name];
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
		if (this.editor.node.isCustomize(node)) {
			switch (node.name) {
				case 'li':
					if (this.editor.node.isCustomize(node)) {
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
	 */
	unwrap(blocks: Array<NodeInterface>) {
		let indent = 0;
		const { node } = this.editor;
		const normalBlock = $('<p />');
		blocks.forEach((block) => {
			this.unwrapCustomize(block);
			if (node.isList(block)) {
				indent = parseInt(block.attributes(this.INDENT_KEY), 10) || 0;
				node.unwrap(block);
			}

			if (block.name === 'li') {
				const toBlock = node.clone(normalBlock, false);
				if (indent !== 0) {
					toBlock.css('text-indent', indent * 2 + 'em');
				}
				node.replace(block, toBlock);
			}
		});
	}

	/**
	 * 获取当前选区的修复列表后的节点集合
	 */
	normalize() {
		if (!isEngine(this.editor)) return [];
		const { change, block, node } = this.editor;
		const range = change.getRange();
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
		if (!isEngine(this.editor)) return;
		const { change, node } = this.editor;
		const safeRange = range || change.getSafeRange();
		const blocks = this.normalize();
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
				afterListElementClone = node.clone(afterListElement, false);
				rightList.forEach((li) => {
					afterListElementClone?.append(li[0]);
				});
				afterListElement.after(afterListElementClone);
			}

			let beforeListElementClone: NodeInterface | undefined;
			//将 middleList 集合添加到前方列表节点内
			if (middleList.length > 0 && beforeListElement) {
				beforeListElementClone = node.clone(beforeListElement, false);
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
		if (!isEngine(this.editor)) return;
		const { change, block, node } = this.editor;
		const safeRange = range || change.getSafeRange();
		blocks = blocks || block.getBlocks(safeRange);
		blocks.forEach((block) => {
			block = block.closest('ul,ol');
			if (!node.isList(block)) {
				return;
			}
			const prevBlock = block.prev();
			const nextBlock = block.next();

			if (prevBlock && this.isSame(prevBlock, block)) {
				const selection = safeRange.createSelection();
				node.merge(prevBlock, block);
				selection.move();
				// 原来 block 已经被移除，重新指向
				block = prevBlock;
			}

			if (nextBlock && this.isSame(nextBlock, block)) {
				const selection = safeRange.createSelection();
				node.merge(block, nextBlock);
				selection.move();
			}
		});
		blocks = block.getBlocks(safeRange);
		if (blocks.length > 0) {
			const block = blocks[0].closest('ul,ol');
			this.addStart(block);
		}
		if (!range) change.apply(safeRange);
	}
	/**
	 * 给列表添加start序号
	 * @param block 列表节点
	 */
	addStart(block?: NodeInterface) {
		if (!isEngine(this.editor)) return;
		const { change, node } = this.editor;
		if (!block) {
			const blocks = this.editor.block.getBlocks(change.getRange());
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
			} else
				cacheIndent =
					parseInt(prevNode.attributes(this.INDENT_KEY), 10) || 0;
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
		//创建卡片
		const { card } = this.editor;
		const component = card.create(cardName, {
			value,
		});
		const range = Range.create(this.editor);
		//设置光标选中空的标签，在这个位置插入卡片
		const br = $('<br />');
		if (node.children().length > 0) {
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
		} else if (node.name === 'li') {
			let child = node.last();
			if (child?.isCursor()) child = child.prev();
			if (child) {
				//最后一个节点是br节点
				if (child.name === 'br') return;
				//自定义节点，并且最后一个是卡片
				if (nodeApi.isCustomize(node) && child.isCard()) {
					node.append($('<br />'));
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
					if (child.type === getWindow().Node.TEXT_NODE) {
						if (child.text() !== '') return;
						child = child.prev();
					}
					//节点
					else if (child.type === getWindow().Node.ELEMENT_NODE) {
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
	) {
		const { node } = this.editor;
		if (Array.isArray(blocks)) {
			let nodes: Array<NodeInterface> = [];
			blocks.forEach((block) => {
				if (!node.isCustomize(block)) {
					const node = this.toCustomize(block, cardName, value);
					nodes = nodes.concat(node);
				}
			});
			return nodes;
		} else {
			let indent;
			const customizeRoot = $(`<ul class="${this.CUSTOMZIE_UL_CLASS}"/>`);
			const customizeItem = $(`<li class="${this.CUSTOMZIE_LI_CLASS}"/>`);
			switch (blocks.name) {
				case 'li':
					blocks.addClass(this.CUSTOMZIE_LI_CLASS);
					this.addCardToCustomize(blocks, cardName, value);
					return blocks;

				case 'ul':
					blocks.addClass(this.CUSTOMZIE_UL_CLASS);
					return blocks;

				case 'ol':
					customizeRoot.attributes(blocks.attributes());
					blocks = node.replace(blocks, customizeRoot);
					return blocks;

				case 'p':
					indent = removeUnit(blocks.css('text-indent')) / 2;
					blocks = node.replace(blocks, customizeItem);
					this.addCardToCustomize(blocks, cardName, value);

					if (indent) {
						customizeRoot.attributes(this.INDENT_KEY, indent);
					}

					blocks = node.wrap(blocks, customizeRoot);
					return blocks;
				default:
					if (node.isSimpleBlock(blocks) && !blocks.isBlockCard()) {
						blocks = node.replace(blocks, customizeItem);
						this.addCardToCustomize(blocks, cardName, value);
						blocks = node.wrap(blocks, customizeRoot);
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
			let indent;
			const targetNode = $('<'.concat(tagName, ' />'));
			const itemNode = $('<li />');

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

				case 'p':
					if (blocks.parent()?.name === 'li') {
						node.unwrap(blocks);
						return blocks;
					}

					indent = removeUnit(blocks.css('text-indent')) / 2;
					blocks = node.replace(blocks, itemNode);

					if (indent) {
						targetNode.attributes(this.INDENT_KEY, indent);
					}

					if (start) {
						targetNode.attributes('start', start);
					}
					blocks = node.wrap(blocks, targetNode);
					return blocks;
				default:
					if (node.isSimpleBlock(blocks) && !blocks.isBlockCard()) {
						blocks = node.replace(blocks, itemNode);
						blocks = node.wrap(blocks, targetNode);
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
		//如果选区中只有一个节点，并且是br标签
		if (
			1 === contents.childNodes.length &&
			'br' === $(contents.firstChild).name
		)
			return true;
		//如果选区中只有一个节点，并且是自定义列表并且第一个是Card
		if (
			1 === contents.childNodes.length &&
			node.hasClass('data-list-item') &&
			$(contents.firstChild).isCard()
		)
			return true;
		const nodeApi = this.editor.node;
		//如果选区中只有两个节点，并且是自定义列表并且第一个是Card，最后一个为空节点
		if (
			2 === contents.childNodes.length &&
			node.hasClass('data-list-item') &&
			$(contents.firstChild).isCard() &&
			nodeApi.isEmpty($(contents.lastChild || []))
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
		//如果选区中只有一个节点，并且是br标签
		if (
			1 === contents.childNodes.length &&
			'br' === $(contents.firstChild).name
		)
			return true;
		//如果选区中只有一个节点，并且是自定义列表并且第一个是Card
		if (
			1 === contents.childNodes.length &&
			node.hasClass('data-list-item') &&
			$(contents.firstChild).isCard()
		)
			return true;
		const nodeApi = this.editor.node;
		//如果选区中只有两个节点，并且是自定义列表并且第一个是Card，最后一个为空节点
		if (
			2 === contents.childNodes.length &&
			node.hasClass('data-list-item') &&
			$(contents.firstChild).isCard() &&
			nodeApi.isEmpty($(contents.lastChild || []))
		)
			return true;
		//判断选区内容是否是空节点
		const block = $('<div />');
		block.append(contents);
		return this.editor.node.isEmpty(block);
	}
}

export default List;
