import Entry from './entry';
import Event from './event';
import {
	NodeInterface,
	NodeModelInterface,
	EditorInterface,
	PluginEntry,
	SchemaInterface,
	SchemaBlock,
	RangeInterface,
} from '../types';
import {
	ANCHOR,
	CARD_ELEMENT_KEY,
	CARD_KEY,
	CARD_SELECTOR,
	CURSOR,
	DATA_ELEMENT,
	EDITABLE_SELECTOR,
	FOCUS,
	READY_CARD_KEY,
	READY_CARD_SELECTOR,
} from '../constants';
import { getDocument, getStyleMap, isEngine } from '../utils';
import $ from './query';
import getHashId, { uuid } from './hash';
import { isNode, isNodeEntry } from './utils';

class NodeModel implements NodeModelInterface {
	private editor: EditorInterface;
	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	isVoid(
		node: NodeInterface | Node | string,
		schema: SchemaInterface = this.editor.schema,
	) {
		let name = typeof node === 'string' ? node : '';
		if (isNode(node)) name = node.nodeName.toLowerCase();
		else if (isNodeEntry(node)) name = node.name;
		return (
			schema.find((rule) => rule.name === name && rule.isVoid === true)
				.length > 0
		);
	}

	isMark(
		node: NodeInterface | Node,
		schema: SchemaInterface = this.editor.schema,
	) {
		if (isNode(node)) node = $(node);
		return schema.getType(node) === 'mark';
	}

	/**
	 * 是否是inline标签
	 * @param node 节点
	 */
	isInline(
		node: NodeInterface | Node,
		schema: SchemaInterface = this.editor.schema,
	) {
		if (isNode(node)) node = $(node);
		return schema.getType(node) === 'inline';
	}

	/**
	 * 是否是块级节点
	 * @param node 节点
	 */
	isBlock(
		node: NodeInterface | Node,
		schema: SchemaInterface = this.editor.schema,
	) {
		if (isNode(node)) node = $(node);
		return schema.getType(node) === 'block';
	}

	/**
	 * 判断block节点的子节点是否不包含blcok 节点
	 */
	isNestedBlock(node: NodeInterface) {
		if (!this.isBlock(node)) return false;
		let child = node.first();
		while (child) {
			if (this.isBlock(child)) return false;
			child = child.next();
		}
		return true;
	}

	/**
	 * 判断节点是否是顶级根节点，父级为编辑器根节点，且，子级节点没有block节点
	 * @param node 节点
	 * @returns
	 */
	isRootBlock(node: NodeInterface, schema?: SchemaInterface) {
		//父级不是根节点
		if (!node.parent()?.isEditable()) return false;
		if (!this.isNestedBlock(node)) return false;
		//并且规则上不可以设置子节点
		return (schema || this.editor.schema)
			.find((schema) => schema.name === node.name)
			.every((schema) => {
				if (schema.type !== 'block') return false;
				const allowIn = (schema as SchemaBlock).allowIn;
				if (!allowIn) return true;
				return allowIn.indexOf('$root') > -1;
			});
	}
	/**
	 * 判断节点下的文本是否为空
	 * @param withTrim 是否 trim
	 */
	isEmpty(node: NodeInterface, withTrim?: boolean) {
		if (node.isElement()) {
			// 卡片不为空
			if (
				node.attributes(CARD_KEY) ||
				(node.find(CARD_SELECTOR).length > 0 &&
					node.find(EDITABLE_SELECTOR).length === 0)
			) {
				return false;
			}
			// 只读卡片不为空
			if (
				node.attributes(READY_CARD_KEY) ||
				(node.find(READY_CARD_SELECTOR).length > 0 &&
					node.find(EDITABLE_SELECTOR).length === 0)
			) {
				return false;
			}
			// 非br节点的空节点不为空
			if (node.name !== 'br' && this.isVoid(node)) {
				return false;
			}
			// 多个br节点不为空
			if (node.find('br').length > 1) {
				return false;
			}
		}

		let value = node.isText() ? node[0].nodeValue || '' : node.text();
		value = value?.replace(/\u200B/g, '');
		value = value?.replace(/\r\n|\n/, '');

		if (value && withTrim) {
			value = value.trim();
		}

		return value === '';
	}

	/**
	 * 判断一个节点下的文本是否为空，或者只有空白字符
	 */
	isEmptyWithTrim(node: NodeInterface) {
		return this.isEmpty(node, true);
	}
	/**
	 * 判断节点包括子节点是否为空
	 * @param node 节点
	 * @returns
	 */
	isEmptyWidthChild(node: NodeInterface) {
		if (node.length === 0) return true;
		const { childNodes } = node[0];
		if (childNodes.length === 0) return true;
		for (let i = 0; i < childNodes.length; i++) {
			const child = childNodes[i];
			if (child.nodeType === Node.TEXT_NODE) {
				if (child['data'].replace(/\u200b/g, '') !== '') return false;
			} else if (child.nodeType === Node.ELEMENT_NODE) {
				if (
					child.nodeName.toLowerCase() === 'li' &&
					!this.editor.list.isEmptyItem($(child))
				)
					return false;
				if ((child as Element).hasAttribute(CARD_KEY)) return false;
				if (!this.isEmptyWidthChild($(child))) {
					return false;
				}
			}
		}
		return true;
	}
	/**
	 * 判断节点是否为列表节点
	 * @param node 节点或者节点名称
	 */
	isList(node: NodeInterface | string | Node) {
		let name = typeof node === 'string' ? node : '';
		if (isNode(node)) name = node.nodeName.toLowerCase();
		else if (isNodeEntry(node)) name = node.name;
		return ['ul', 'ol'].indexOf(name) > -1;
	}

	/**
	 * 判断节点是否是自定义列表
	 * @param node 节点
	 */
	isCustomize(node: NodeInterface) {
		const { list } = this.editor;
		switch (node.name) {
			case 'li':
				return node.hasClass(list.CUSTOMZIE_LI_CLASS);

			case 'ul':
				return node.hasClass(list.CUSTOMZIE_UL_CLASS);

			default:
				return false;
		}
	}
	/**
	 * 去除包裹
	 * @param node 需要去除包裹的节点
	 */
	unwrap(node: NodeInterface) {
		let child = node.first();
		const nodes: NodeInterface[] = [];
		while (child) {
			const next = child.next();
			node.before(child);
			nodes.push(child);
			child = next;
		}
		node.remove();
		return nodes;
	}
	/**
	 * 包裹节点
	 * @param source 需要包裹的节点
	 * @param outer 包裹的外部节点
	 * @param mergeSame 合并相同名称的节点样式和属性在同一个节点上
	 */
	wrap(
		source: NodeInterface | Node,
		outer: NodeInterface,
		mergeSame: boolean = false,
	) {
		const { mark } = this.editor;
		if (isNode(source)) source = $(source);
		outer = this.clone(outer, false);
		// 文本节点
		if (source.isText()) {
			outer.append(this.clone(source, false));
			return source.replaceWith(outer);
		}

		// 包裹样式节点
		if (mergeSame && this.isMark(outer)) {
			//合并属性和样式值
			const outerClone = this.clone(outer, false, false);
			if (source.name === outer.name) {
				const attributes = source.attributes();
				delete attributes.style;
				Object.keys(attributes).forEach((key) => {
					if (!outer.attributes(key))
						outer.attributes(key, attributes[key]);
					else {
						const attributes = outer.attributes(key).split(',');
						if (
							attributes[key] !== undefined &&
							attributes.indexOf(attributes[key]) < 0
						)
							attributes.push(attributes[key]);
						outer.attributes(key, attributes.join(','));
					}
				});

				const styles = source.css();
				Object.keys(styles).forEach((key) => {
					if (!outer.css(key)) outer.css(key, styles[key]);
				});
				outer.append(this.clone(source, true, false).children());
			} else {
				outer.append(this.clone(source, true, false));
			}

			const children = outer.allChildren();
			children.forEach((child) => {
				if (
					!child.isText() &&
					this.isMark(child) &&
					mark.compare(child, outerClone)
				) {
					this.unwrap(child);
				}
			});
			return source.replaceWith(outer);
		}
		// 其它情况
		const parent = source.parent();
		const shadowNode = this.clone(source, false, false);
		source.after(shadowNode);
		outer.append(source);
		// 没有父级节点就直接返回包裹后的节点
		return parent ? shadowNode.replaceWith(outer) : outer;
	}

	/**
	 * 合并节点
	 * @param source 合并的节点
	 * @param target 需要合并的节点
	 * @param remove 合并后是否移除
	 */
	merge(
		source: NodeInterface,
		target: NodeInterface,
		remove: boolean = true,
	) {
		//要合并的节点是文本，就直接追加
		if (target.isText()) {
			source.append(target);
			this.removeSide(source);
			return;
		}
		const { block, mark, list } = this.editor;
		let mergedNode = target;
		const toIsList = this.isList(source);
		const fromIsList = this.isList(target.name);
		// p 与列表合并时需要做特殊处理
		if (toIsList && !fromIsList) {
			const liBlocks = source.find('li');
			//没有li标签
			if (liBlocks.length === 0) {
				return;
			}
			//设置被合并节点为最后一个li标签
			source = $(liBlocks[liBlocks.length - 1]);
		}
		//被合并的节点为列表
		if (!toIsList && fromIsList) {
			//查找li节点
			const liBlocks = target.find('li');
			if (liBlocks.length > 0) {
				//设置需要合并的节点为第一个li节点
				target = $(liBlocks[0]);
			}
			if (liBlocks[1]) {
				mergedNode = $(liBlocks[0]);
			}
		}
		// 自定义列表合并
		if (this.isCustomize(source)) {
			// 源节点如果还有card节点，
			let sourceFirst = source.first();
			if (!sourceFirst?.isCard()) {
				// 源节点没有卡片节点就添加
				const plugins = list.getPlugins();
				const pluginName = list.getPluginNameByNode(source);
				const plugin = plugins.find(
					(p) =>
						(p.constructor as PluginEntry).pluginName ===
						pluginName,
				);
				if (plugin?.cardName) {
					list.addCardToCustomize(source, plugin.cardName);
					sourceFirst = source.first();
				}
			}
			// 源节点卡片名称与目标节点卡片一样就删除目标节点的第一个卡片节点
			if (this.isCustomize(target)) {
				const targetFirst = target.first();
				if (
					targetFirst?.isCard() &&
					sourceFirst!.attributes(CARD_KEY) ===
						targetFirst.attributes(CARD_KEY)
				)
					targetFirst.remove();
			}
		}
		//被合并的节点最后一个子节点为br，则移除
		const toNodeLast = source.last();
		let child = target.first();
		const plugin = block.findPlugin(source);
		//循环追加
		while (child) {
			const next = child.next();
			const markPlugin = mark.findPlugin(child);
			if (
				plugin &&
				markPlugin &&
				plugin.disableMark &&
				plugin.disableMark!.indexOf(
					(markPlugin.constructor as PluginEntry).pluginName,
				) > -1
			) {
				const result = this.unwrap(child!);
				result.forEach((children) => {
					source.append(children);
				});
			}
			// 孤立的零宽字符删除
			else if (child.isText() && /\u200b/.test(child.text())) {
				const parent = child.parent();
				const prev = child.prev();
				const next = child.next();
				// 不在mark里面，或者没有父级节点，它的上级节点或者下级节点不是inline
				if (
					!parent ||
					(!this.isMark(parent) &&
						((prev && !this.isInline(prev)) ||
							(next && !this.isInline(next))))
				) {
					child.remove();
					child = next;
					continue;
				}
			}
			// 移除mark插件下面的所有零宽字符
			else if (markPlugin && child.children().length === 1) {
				const prev = child.prev();
				if (!prev || prev.isText()) {
					child.allChildren().forEach((child) => {
						const text = child.text();
						if (
							child.type === getDocument().TEXT_NODE &&
							!!text &&
							!child.next()?.isCursor()
						) {
							child.text(text.replace(/\u200b/, ''));
						}
					});
				}
			}

			//追加到要合并的列表中
			if (child.length > 0 && !child.equal(source)) source.append(child);
			child = next;
		}
		//移除需要合并的节点
		if (remove) mergedNode.remove();

		if (toNodeLast && toNodeLast.name === 'br') {
			let next = toNodeLast.next();
			while (next) {
				if (
					[CURSOR, ANCHOR, FOCUS].indexOf(
						next.attributes(DATA_ELEMENT),
					)
				) {
					toNodeLast.remove();
					break;
				}
				next = next.next();
			}
		}
		this.removeSide(source);
	}

	/**
	 * 将源节点的子节点追加到目标节点，并替换源节点
	 * @param source 旧节点
	 * @param target 新节点
	 */
	replace(
		source: NodeInterface,
		target: NodeInterface,
		copyId: boolean = false,
	) {
		const clone = this.clone(target, false, copyId);
		let childNode =
			this.isCustomize(source) &&
			source.name === 'li' &&
			source.first()?.isCard()
				? source.first()?.next()
				: source.first();

		while (childNode) {
			const nextNode = childNode.next();
			clone.append(childNode);
			childNode = nextNode;
		}
		if (source.isText()) {
			clone.append(source.clone());
		}

		return source.replaceWith(clone);
	}

	/**
	 * 光标位置插入文本
	 * @param text 文本
	 * @param range 光标
	 */
	insertText(text: string, range?: RangeInterface) {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const safeRange = range || change.range.toTrusty();

		const doc = getDocument(safeRange.startContainer);
		// 范围为折叠状态时先删除内容
		if (!safeRange.collapsed) {
			change.delete(range);
		}
		const node = doc.createTextNode(text);
		this.insert(node, safeRange)?.handleBr();
		if (!range) change.apply(safeRange);
		return safeRange;
	}

	/**
	 * 在光标位置插入一个节点
	 * @param node 节点
	 * @param range 光标
	 * @param removeCurrentEmptyBlock 当前光标行是空行时是否删除
	 */
	insert(
		node: Node | NodeInterface,
		range?: RangeInterface,
		removeCurrentEmptyBlock: boolean = false,
	) {
		if (isNodeEntry(node)) {
			if (node.length === 0) throw 'Not found node';
			node = node[0];
		}
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change, block, schema, mark } = editor;
		range = range || change.range.get();
		const { startNode, startOffset } = range
			.cloneRange()
			.shrinkToTextNode();
		const prev = startNode.prev();
		const parent = startNode.parent();
		let text = startNode.text() || '';
		const leftText = text.substr(0, startOffset);
		//文本节点
		if (startNode.isText() && /\u200b$/.test(leftText)) {
			//零宽字符前面还有其它字符。或者节点前面还有节点，不能是inline节点。或者前面没有节点了，并且父级不是inline节点
			if (
				text.length > 1 &&
				((prev && !this.isInline(prev)) ||
					(!prev && parent && !this.isInline(parent)))
			) {
				startNode
					.get<Text>()!
					.splitText(text.length - 1)
					.remove();
			}
		}
		// 是否在卡片上，卡片还没有渲染
		let elementType = parent?.attributes(CARD_ELEMENT_KEY);
		if (!elementType && startNode.isCard()) {
			range.setStartAfter(startNode);
		}
		// 检测是否位于卡片两边节点
		if (elementType && parent && ['left', 'right'].includes(elementType)) {
			const cardComponent = editor.card.find(parent);
			if (cardComponent) {
				if (elementType === 'left') {
					range.setStartBefore(cardComponent.root);
				} else {
					range.setStartAfter(cardComponent.root);
				}
			}
		}

		if (this.isBlock(node)) {
			// 如果当前光标位置的block节点是空节点，就不用分割
			let { commonAncestorNode } = range;
			if (commonAncestorNode.isText()) {
				commonAncestorNode =
					this.editor.block.closest(commonAncestorNode);
			}
			let splitNode = null;
			if (
				this.isBlock(commonAncestorNode) &&
				this.isEmpty(commonAncestorNode)
			) {
				splitNode = removeCurrentEmptyBlock
					? commonAncestorNode
					: undefined;
			} else {
				let isFirst = false;
				if (block.isFirstOffset(range, 'start')) {
					isFirst = true;
				}
				splitNode = block.split(range);
				if (isFirst) {
					splitNode = splitNode?.prev();
				}
			}
			let blockNode = block.closest(
				range.startNode.isEditable()
					? range
							.cloneRange()
							.shrinkToElementNode()
							.shrinkToTextNode().startNode
					: range.startNode,
			);
			if (
				!blockNode.isCard() &&
				schema.isAllowIn(blockNode.name, node.nodeName.toLowerCase())
			) {
				blockNode.find('br').remove();
				blockNode.append(node);
			} else {
				let parentBlock = blockNode.parent();
				while (
					parentBlock &&
					this.isBlock(parentBlock) &&
					!blockNode.isEditable() &&
					!schema.isAllowIn(
						parentBlock.name,
						node.nodeName.toLowerCase(),
					)
				) {
					blockNode = parentBlock;
					parentBlock = blockNode.parent();
				}
				if (
					blockNode.isEditable() &&
					blockNode.children().length === 0
				) {
					blockNode.append(node);
				} else {
					if (
						this.isEmptyWidthChild(blockNode) ||
						block.isLastOffset(range, 'start')
					) {
						blockNode.after(node);
						// 没有分割就不会有新增的行就不用删除
						if (this.isEmptyWidthChild(blockNode) && splitNode)
							blockNode.remove();
					} else {
						blockNode.before(node);
						if (splitNode && this.isEmptyWidthChild(splitNode))
							splitNode.remove();
					}
				}
			}
		} else {
			const targetNode = block.closest(
				range.startNode.isEditable()
					? range
							.cloneRange()
							.shrinkToElementNode()
							.shrinkToTextNode().startNode
					: range.startNode,
			);
			const targetPlugin = targetNode
				? block.findPlugin(targetNode)
				: undefined;
			//先移除不能放入块级节点的mark标签
			if (targetPlugin) {
				const nodeDom = $(node);
				const isUnwrap = (markNode: NodeInterface) => {
					if (this.isMark(markNode)) {
						const markPlugin = mark.findPlugin(markNode);
						if (!markPlugin) return;
						if (
							targetPlugin.disableMark &&
							targetPlugin.disableMark.indexOf(
								(markPlugin.constructor as PluginEntry)
									.pluginName,
							) > -1
						) {
							return true;
						}
					}
					return false;
				};
				nodeDom.allChildren().forEach((markNode) => {
					if (isUnwrap(markNode)) {
						this.unwrap(markNode);
					}
				});
				if (isUnwrap(nodeDom)) {
					const fragment = nodeDom.document!.createDocumentFragment();
					nodeDom.children().each((child) => {
						fragment.appendChild(child);
					});
					nodeDom.remove();
					node = fragment.childNodes[fragment.childNodes.length - 1];
					range.insertNode(fragment);
				} else range.insertNode(node);
				if (nodeDom.length === 0) return range;
			} else range.insertNode(node);
		}
		if (
			node.nodeType === Node.ELEMENT_NODE &&
			((node as Element).hasAttribute(READY_CARD_KEY) ||
				(node as Element).hasAttribute(CARD_KEY))
		) {
			return range.collapse(false);
		}
		return range
			.select(
				node,
				this.isVoid(node) || node.nodeType === Node.TEXT_NODE
					? false
					: true,
			)
			.shrinkToElementNode()
			.collapse(false);
	}

	/**
	 * 设置节点属性
	 * @param node 节点
	 * @param props 属性
	 */
	setAttributes(node: NodeInterface, attrs: any) {
		let style = attrs.style;
		Object.keys(attrs).forEach((key) => {
			if (key === 'style') return;
			if (key === 'className') {
				const value = attrs[key];
				if (Array.isArray(value)) {
					value.forEach((name) => node.addClass(name));
				} else node.addClass(value);
			} else node.attributes(key, attrs[key].toString());
		});
		if (typeof style === 'number') style = {};
		else if (typeof style === 'string') style = getStyleMap(style);
		style = style || {};
		const keys = Object.keys(style);
		keys.forEach((key) => {
			let val = (<{ [k: string]: string | number }>style)[key];
			if (/^0(px|em)?$/.test(val.toString())) {
				val = '';
			}

			node.css(key, val.toString());
		});

		if (keys.length === 0 || Object.keys(node.css()).length === 0) {
			node.removeAttributes('style');
		}

		return node;
	}

	/**
	 * 移除值为负的样式
	 * @param node 节点
	 * @param style 样式名称
	 */
	removeMinusStyle(node: NodeInterface, style: string) {
		if (node.isElement()) {
			const styles = node.css();
			if (styles[style]) {
				const val = parseInt(styles[style] || '0', 10) || 0;
				if (val < 0) node.css(style, '');
			}
		}
	}

	/**
	 * 合并节点下的子节点，两个相同的相邻节点的子节点
	 * @param node 当前节点
	 */
	mergeChild(node: NodeInterface) {
		const { schema, list } = this.editor;
		const topTags = schema.getAllowInTags();
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
				//并且上一个节点是可拥有block子节点的节点 或者是 ul、li 并且list列表类型是一致的
				((topTags.indexOf(childDom.name) > -1 &&
					!this.isList(childDom)) ||
					(this.isList(childDom) && list.isSame(childDom, nextNode)))
			) {
				//获取下一个节点的下一个节点
				const nNextNode = nextNode.next();
				//合并下一个节点
				let nextChildNode = nextNode.first();
				//循环要合并节点的子节点
				while (nextChildNode) {
					const next = nextChildNode.next();
					childDom.append(nextChildNode);
					nextChildNode = next;
				}
				nextNode.remove();
				//继续合并当前子节点的子节点
				this.mergeChild(childDom);
				nextNode = nNextNode;
			}
			childDom = nextNode;
		}
	}
	/**
	 * 删除节点两边标签
	 * @param node 节点
	 * @param tagName 标签名称，默认为br标签
	 */
	removeSide(node: NodeInterface, tagName: string = 'br') {
		// 删除第一个 BR
		const firstNode = node.first();
		if (
			firstNode?.name === tagName &&
			node
				.children()
				.toArray()
				.filter((node) => !node.isCursor()).length > 1
		) {
			firstNode.remove();
		}
		// 删除最后一个 BR
		const lastNode = node.last();
		if (
			lastNode?.name === tagName &&
			node
				.children()
				.toArray()
				.filter((node) => !node.isCursor()).length > 1
		) {
			lastNode.remove();
		}
	}
	/**
	 * 扁平化节点
	 * @param node 节点
	 * @param root 根节点
	 */
	flat(node: NodeInterface, root: NodeInterface = node) {
		const { block } = this.editor;
		//第一个子节点
		let childNode = node.first();
		const rootElement = root.fragment ? root.fragment : root.get();
		const tempNode = node.fragment ? $('<p />') : this.clone(node, false);
		const addBrForBlock = (blockNode: NodeInterface) => {
			const children = blockNode.children().toArray();
			if (
				blockNode.name === 'p' &&
				children.filter((node) => !node.isCursor()).length === 0
			) {
				blockNode.append($('<br />'));
			}
			if (
				this.isBlock(blockNode) &&
				this.isEmptyWithTrim(blockNode) &&
				children.every((child) => child.isText())
			) {
				blockNode.html('<br />');
			}
		};
		while (childNode) {
			//获取下一个兄弟节点
			let nextNode = childNode.next();
			//如果当前子节点是块级的Card组件，或者是简单的block
			if (childNode.isBlockCard() || this.isNestedBlock(childNode)) {
				block.flat(childNode, $(rootElement || []));
			}
			//如果当前是块级标签，递归循环
			else if (this.isBlock(childNode)) {
				childNode = this.flat(childNode, $(rootElement || []));
			} else {
				const cloneNode = this.clone(tempNode, false);
				const isLI = 'li' === cloneNode.name;
				childNode.before(cloneNode);

				while (childNode) {
					nextNode = childNode.next();

					const isBR = 'br' === childNode.name && !isLI;
					if (isBR && childNode.parent()?.isRoot()) {
						cloneNode.append(childNode);
					}
					//判断当前节点末尾是否是换行符，有换行符就跳出
					if (childNode.isText()) {
						let text = childNode.text();
						//先移除开头的换行符
						let match = /^((\n|\r)+)/.exec(text);
						let isBegin = false;
						if (match) {
							text = text.substring(match[1].length);
							isBegin = true;
							if (text.length === 0) {
								childNode.remove();
							}
						}
						//移除末尾换行符
						match = /((\n|\r)+)$/.exec(text);
						if (match) {
							childNode.text(text.substr(0, match.index));
							cloneNode.append(childNode);
							break;
						} else if (isBegin && childNode.length > 0) {
							childNode.text(text);
						}
					}
					if (childNode.length > 0) cloneNode.append(childNode);
					//判断下一个节点的开头是换行符，有换行符就跳出
					if (nextNode?.isText()) {
						const text = nextNode.text();
						let match = /^(\n|\r)+/.exec(text);
						if (match) {
							break;
						}
					}
					if (
						isBR ||
						!nextNode ||
						this.isBlock(nextNode) ||
						nextNode.isBlockCard()
					)
						break;

					childNode = nextNode;
				}
				this.removeSide(cloneNode);
				block.flat(cloneNode, $(rootElement || []));
				addBrForBlock(cloneNode);
			}
			addBrForBlock(childNode);
			this.removeSide(childNode);
			childNode = nextNode;
		}
		// 重新更新框架的引用
		if (node.fragment) {
			node = $(node.fragment);
		}
		//如果没有子节点了，就移除当前这个节点
		childNode = node.first();
		if (!childNode) node.remove();
		return node;
	}

	/**
	 * 标准化节点
	 * @param node 节点
	 */
	normalize(node: NodeInterface) {
		node = this.flat(node);
		this.mergeChild(node);
		return node;
	}

	/**
	 * 获取或设置元素节点html文本
	 * @param {string|undefined} val html文本
	 * @return {NodeEntry|string} 当前实例或html文本
	 */
	html(node: NodeInterface): string;
	html(node: NodeInterface, val: string): NodeInterface;
	html(node: NodeInterface, val?: string): NodeInterface | string {
		if (val === undefined) {
			return node.length > 0
				? node.get<HTMLElement>()?.innerHTML || ''
				: '';
		}

		node.each((node) => {
			const element = <Element>node;
			element.innerHTML = val;
			this.editor.nodeId.generateAll(element);
		});
		return node;
	}

	/**
	 * 复制元素节点
	 * @param {boolean} deep 是否深度复制
	 * @return 复制后的元素节点
	 */
	clone(
		node: NodeInterface,
		deep?: boolean,
		copyId: boolean = true,
	): NodeInterface {
		const { nodeId } = this.editor;
		const nodes: Array<Node> = [];
		node.each((node) => {
			const cloneNode = node.cloneNode(deep);
			const nodeDom = $(cloneNode);
			if (!copyId) {
				nodeId.generateAll(nodeDom, true);
				if (nodeId.isNeed(nodeDom)) {
					nodeId.generate(nodeDom, true);
				}
			}
			nodes.push(cloneNode);
		});
		return $(nodes);
	}

	/**
	 * 获取批量追加子节点后的outerHTML
	 * @param nodes 节点集合
	 * @param selector 追加的节点
	 */
	getBatchAppendHTML(nodes: Array<NodeInterface>, selector: string) {
		if (nodes.length === 0) return selector;
		let appendNode =
			selector.startsWith('\\u') || selector.startsWith('&#')
				? $(selector, null)
				: $(selector);
		nodes.forEach((node) => {
			node = node.clone(false);
			node.append(appendNode);
			appendNode = node;
		});
		return appendNode.get<Element>()?.outerHTML || '';
	}

	removeZeroWidthSpace(node: NodeInterface) {
		node.traverse((child) => {
			const node = child[0];
			if (node.nodeType !== Node.TEXT_NODE) {
				return;
			}
			const text = node.nodeValue;
			if (text?.length !== 2) {
				return;
			}
			const next = node.nextSibling;
			const prev = node.previousSibling;
			if (
				text.charCodeAt(1) === 0x200b &&
				next &&
				next.nodeType === Node.ELEMENT_NODE &&
				[ANCHOR, FOCUS, CURSOR].indexOf(
					(<Element>next).getAttribute(DATA_ELEMENT) || '',
				) >= 0
			) {
				return;
			}

			const parent = child.parent();

			if (
				text.charCodeAt(1) === 0x200b &&
				((!next && parent && this.isInline(parent)) ||
					(next && this.isInline(next)))
			) {
				return;
			}

			if (
				text.charCodeAt(0) === 0x200b &&
				((!prev && parent && this.isInline(parent)) ||
					(prev && this.isInline(prev)))
			) {
				return;
			}

			if (text.charCodeAt(0) === 0x200b) {
				const newNode = (<Text>node).splitText(1);
				if (newNode.previousSibling)
					newNode.parentNode?.removeChild(newNode.previousSibling);
			}
		});
	}
}

export default NodeModel;

export { Entry as NodeEntry, Event, $, getHashId, uuid };
