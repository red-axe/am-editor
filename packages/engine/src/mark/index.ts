import {
	CARD_ELEMENT_KEY,
	CARD_KEY,
	CARD_SELECTOR,
	CARD_TYPE_KEY,
	DATA_ELEMENT,
} from '../constants';
import {
	EditorInterface,
	isEngine,
	NodeInterface,
	RangeInterface,
	isNode,
} from '../types';
import { isMarkPlugin, MarkInterface, MarkModelInterface } from '../types/mark';
import { getDocument, getWindow } from '../utils';
import { Backspace } from './typing';
import { $ } from '../node';

class Mark implements MarkModelInterface {
	private editor: EditorInterface;

	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	init() {
		const editor = this.editor;
		if (isEngine(editor)) {
			//删除事件
			const backspace = new Backspace(editor);
			editor.typing
				.getHandleListener('backspace', 'keydown')
				?.on((event) => backspace.trigger(event));

			editor.on('keydown:space', (event) => this.triggerMarkdown(event));
		}
	}

	/**
	 * 解析markdown
	 * @param event 事件
	 */
	triggerMarkdown(event: KeyboardEvent) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change } = editor;
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
		return !Object.keys(editor.plugin.components).some((pluginName) => {
			const plugin = editor.plugin.components[pluginName];
			if (isMarkPlugin(plugin) && !!plugin.markdown) {
				const reuslt = plugin.triggerMarkdown(event, text, node);
				if (reuslt === false) return true;
			}
			return;
		});
	}

	/**
	 * 根据节点查找mark插件实例
	 * @param node 节点
	 */
	findPlugin(mark: NodeInterface): MarkInterface | undefined {
		const { node, plugin, schema } = this.editor;
		if (!node.isMark(mark)) return;
		let result: MarkInterface | undefined = undefined;
		Object.keys(plugin.components).some((pluginName) => {
			const markPlugin = plugin.components[pluginName];
			if (isMarkPlugin(markPlugin) && mark.name === markPlugin.tagName) {
				const schemaRule = markPlugin.schema();
				if (
					!(Array.isArray(schemaRule)
						? schemaRule.find((rule) =>
								schema.checkNode(mark, rule.attributes),
						  )
						: schema.checkNode(mark, schemaRule.attributes))
				)
					return;
				result = markPlugin;
				return true;
			}
			return;
		});
		return result;
	}
	/**
	 * 获取最近的 Mark 节点，找不到返回 node
	 */
	closest(node: NodeInterface) {
		const nodeApi = this.editor.node;
		while (node && node.parent() && !nodeApi.isBlock(node)) {
			if (node.isEditable()) break;
			if (nodeApi.isMark(node)) return node;
			const parentNode = node.parent();
			if (!parentNode) break;
			node = parentNode;
		}
		return node;
	}
	/**
	 * 获取向上第一个非 Mark 节点
	 */
	closestNotMark(node: NodeInterface) {
		while (this.editor.node.isMark(node) || node.isText()) {
			if (node.isEditable()) break;
			const parent = node.parent();
			if (!parent) break;
			node = parent;
		}
		return node;
	}
	/**
	 * 比较两个节点是否相同，包括attributes、style、class
	 * @param source 源节点
	 * @param target 目标节点
	 * @param isCompareValue 是否比较每项属性的值
	 */
	compare(
		source: NodeInterface,
		target: NodeInterface,
		isCompareValue?: boolean,
	) {
		//节点名称不一致
		if (source.name !== target.name) return false;
		//获取节点属性
		const sourceAttributes = source.attributes();
		delete sourceAttributes['style'];

		const targetAttributes = target.attributes();
		delete targetAttributes['style'];

		//获取节点样式属性
		const sourceStyles = source.css();
		const targetStyles = target.css();
		delete sourceAttributes['class'];
		delete targetAttributes['class'];

		//获取节点样式名称
		const sourceClassName = source.get<Element>()!.className.trim();
		const targetClassName = target.get<Element>()!.className.trim();
		let sourceClasses =
			sourceClassName !== '' ? sourceClassName.split(/\s+/) : [];
		let targetClasses =
			targetClassName !== '' ? targetClassName.split(/\s+/) : [];

		//样式名称可能是可变的，如data-fontsize-12和data-fontsize-14代表的是不同的值，如果不需要比较值，直接获取标签样式规则比较
		const { schema } = this.editor;
		const schemas = schema.find((rule) => rule.name === source.name);
		const compareClass = (classNames: Array<string>): string => {
			for (let i = 0; i < schemas.length; i++) {
				const schemaRule = schemas[i];
				if (
					schemaRule.attributes &&
					schema.checkValue(
						schemaRule.attributes,
						'class',
						classNames.join(' ').trim(),
					)
				) {
					return schemaRule.attributes['class'].toString();
				}
			}
			return classNames.join(' ').trim();
		};
		if (!isCompareValue) {
			sourceClasses =
				sourceClasses.length > 0 ? [compareClass(sourceClasses)] : [];
			targetClasses =
				targetClasses.length > 0 ? [compareClass(targetClasses)] : [];
		}

		//属性长度不一致
		if (
			Object.keys(sourceAttributes).length !==
			Object.keys(targetAttributes).length
		)
			return false;
		//属性名称或值不一致
		if (
			!Object.keys(sourceAttributes).every((attributesName) =>
				isCompareValue
					? sourceAttributes[attributesName] ===
					  targetAttributes[attributesName]
					: !!targetAttributes[attributesName],
			)
		)
			return false;
		//样式属性长度不一致
		if (
			Object.keys(sourceStyles).length !==
			Object.keys(targetStyles).length
		)
			return false;
		//样式属性名称或值不一致
		if (
			!Object.keys(sourceStyles).every((styleName) =>
				isCompareValue
					? sourceStyles[styleName] === targetStyles[styleName]
					: !!targetStyles[styleName],
			)
		)
			return false;
		//样式名称长度不一致
		if (sourceClasses.length !== targetClasses.length) return false;
		//样式名称不一致
		if (
			!sourceClasses.every(
				(sourceClass) => targetClasses.indexOf(sourceClass) !== -1,
			)
		)
			return false;
		return true;
	}

	/**
	 * 判断源节点是否包含目标节点的所有属性名称和样式名称
	 * @param source 源节点
	 * @param target 目标节点
	 */
	contain(source: NodeInterface, target: NodeInterface) {
		const attributes = target.attributes();
		const styles = attributes['style'] || {};
		delete attributes['style'];

		const sourceAttributes = source.attributes();
		const sourceStyles = sourceAttributes['style'] || {};
		delete sourceAttributes['style'];

		return (
			Object.keys(attributes).every((key) => !!sourceAttributes[key]) &&
			Object.keys(styles).every((key) => !sourceStyles[key])
		);
	}

	/**
	 * 去除一个节点下的所有空 Mark，通过 callback 可以设置其它条件
	 * @param root 节点
	 * @param callback 回调
	 */
	unwrapEmptyMarks(
		root: NodeInterface,
		callback?: (node: NodeInterface) => boolean,
	) {
		const { node } = this.editor;
		const children = root.allChildren();
		children.forEach((childNode) => {
			const child = $(childNode);
			if (
				node.isEmpty(child) &&
				node.isMark(child) &&
				(!callback || callback(child))
			) {
				node.unwrap(child);
			}
		});
	}
	/**
	 * 在光标重叠位置时分割，在分割时会清空父节点内容再重组，如果需要保持光标右边某节点的追踪，请传入该节点
	 * @param range 光标
	 * @param removeMark 要移除的mark空节点
	 * @param keelpNode 分割光标右侧需要保持追踪的节点
	 */
	splitOnCollapsed(
		range: RangeInterface,
		removeMark?: NodeInterface | Array<NodeInterface>,
		keelpNode?: NodeInterface | Node,
	) {
		if (!range.collapsed) return;
		//扩大光标选区
		range.enlargeFromTextNode();
		range.shrinkToElementNode();
		const { startNode } = range;
		const startParent = startNode.parent();
		//获取卡片
		const card = startNode.isCard()
			? startNode
			: startNode.closest(CARD_SELECTOR);
		const { node } = this.editor;
		if (
			(card.length === 0 ||
				card.attributes(CARD_TYPE_KEY) !== 'inline') &&
			(node.isMark(startNode) ||
				(startParent && node.isMark(startParent)))
		) {
			// 获取上面第一个非mark标签
			const parent = this.closestNotMark(startNode);
			// 插入范围的开始和结束标记
			const selection = range.createSelection();
			// 获取标记左侧节点
			const left = selection.getNode(parent, 'left');
			// 获取标记右侧节点
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
			this.unwrapEmptyMarks(left);
			this.unwrapEmptyMarks(right, (node) => {
				if (removeMark && !Array.isArray(removeMark))
					removeMark = [removeMark];
				//没有传指定的mark，那就都移除。否则比较后一致就移除
				const isUnwrap =
					!removeMark ||
					removeMark.length === 0 ||
					(!node.isCard() &&
						removeMark.some((mark) => this.compare(node, mark)));
				return isUnwrap;
			});
			// 清空原父容器，用新的内容代替
			parent.empty();
			const leftChildren = left.children();
			const leftNodes = leftChildren.toArray();
			parent.append(leftChildren);
			const rightChildren = right.children();
			const rightNodes = rightChildren.toArray();
			// 根据跟踪节点的root节点和path获取其在rightNodes中的新节点
			if (keelpRoot)
				keelpNode = rightNodes
					.find((node) => node.equal(keelpRoot!))
					?.getChildByPath(keelpPath);
			parent.append(rightChildren);
			// 找到卡片，重新设置卡片根节点的引用
			parent.find(CARD_SELECTOR).each((cardNode) => {
				const cardComponent = this.editor.card.find(cardNode);
				if (cardComponent && !cardComponent.root.equal(cardNode)) {
					cardComponent.root[0] = cardNode;
				}
			});
			let zeroWidthNode = $('\u200b', null);

			// 重新设置范围
			if (leftNodes.length === 1 && leftNodes[0].name === 'br') {
				leftNodes[0].remove();
				leftNodes.splice(0, 1);
			}
			if (rightNodes.length === 1 && rightNodes[0].name === 'br') {
				rightNodes[0].remove();
				rightNodes.splice(0, 1);
			}
			if (rightNodes.length > 0) {
				let rightContainer = rightNodes[0];
				// 右侧没文本
				if (node.isEmpty(rightContainer)) {
					let firstChild: NodeInterface | null =
						rightContainer.first();
					while (firstChild && !firstChild.isText()) {
						rightContainer = firstChild;
						firstChild = firstChild.first();
					}

					if (rightContainer.isText()) {
						rightContainer.before(zeroWidthNode);
					} else {
						rightContainer.prepend(zeroWidthNode);
					}
				}
				// 右侧有文本
				else {
					//在多层mark嵌套的情况下，要移除的mark里面还有其它mark节点，还有要移除的mark外面还有其它mark，需要将其组合起来
					let markParent = node.isMark(startNode)
						? startNode
						: startNode.parent();
					let wrapZeroNode = zeroWidthNode;
					if (removeMark && !Array.isArray(removeMark))
						removeMark = [removeMark];
					while (
						removeMark &&
						removeMark.length > 0 &&
						markParent &&
						node.isMark(markParent)
					) {
						const markClone = markParent.clone();
						//不是要移除的mark
						if (
							!removeMark.some((mark) =>
								this.compare(markClone, mark),
							)
						) {
							const isZero = zeroWidthNode.equal(wrapZeroNode);
							wrapZeroNode = node.wrap(wrapZeroNode, markClone);
							if (isZero) zeroWidthNode = wrapZeroNode.first()!;
						}
						markParent = markParent.parent();
					}
					rightContainer.before(wrapZeroNode);
				}
				range.select(zeroWidthNode).collapse(false);
			} else if (leftNodes.length > 0) {
				const leftContainer = leftNodes[leftNodes.length - 1];
				leftContainer.after(zeroWidthNode);
				range.select(zeroWidthNode).collapse(false);
			} else {
				range.select(parent, true).collapse(true);
			}
			//替换多个零宽字符为一个零宽字符
			let textWithEmpty = false;
			parent.children().each((child) => {
				const childNode = $(child);
				if (childNode.isText()) {
					const { textContent } = child;
					let text = textContent?.replace(/\u200b+/g, '\u200b') || '';
					if (textContent !== text) {
						child.textContent = text;
					}
					if (textWithEmpty) {
						//当前第二个连续零宽字符的下一个节点不能是inline节点
						const next = childNode.next();
						//当前第二个连续零宽字符没有下一个节点，并且父级节点不能为inline节点
						const parent = childNode.parent();
						if (
							((!next && parent && !node.isInline(parent)) ||
								(next && !node.isInline(next))) &&
							text.startsWith('\u200b')
						) {
							text = text.substring(1);
							if (text) child.textContent = text;
							else childNode.remove();
						} else textWithEmpty = false;
					}
					if (text.endsWith('\u200b')) textWithEmpty = true;
				} else textWithEmpty = false;
			});
			const nodeApi = node;
			//移除多余的零宽字符
			if (zeroWidthNode[0].parentNode) {
				const at = zeroWidthNode[0];
				let atText: string | null = null;
				let atTextLen: number = 0;
				const handleAt = (node: Node | null, findPrev: boolean) => {
					const getAlignNode = (node: Node) => {
						return findPrev
							? node.previousSibling
							: node.nextSibling;
					};
					while (node) {
						if (node.nodeType !== at.nodeType) return;
						const alignNode = getAlignNode(node);
						if (node.textContent === atText) {
							//inline 节点位置的零宽字符跳过
							if (
								(alignNode && nodeApi.isInline(alignNode)) ||
								(!alignNode &&
									node.parentNode &&
									nodeApi.isInline(node.parentNode))
							)
								break;
							node.parentNode?.removeChild(node);
							node = alignNode;
						} else {
							if (findPrev) {
								while (
									atText &&
									node.textContent?.endsWith(atText)
								) {
									//inline 节点位置的零宽字符跳过
									if (
										(alignNode &&
											nodeApi.isInline(alignNode)) ||
										(!alignNode &&
											node.parentNode &&
											nodeApi.isInline(node.parentNode))
									)
										break;
									node.textContent =
										node.textContent.substring(
											0,
											node.textContent.length - atTextLen,
										);
								}
							} else {
								while (
									atText &&
									node.textContent?.startsWith(atText)
								) {
									//inline 节点位置的零宽字符跳过
									if (
										(alignNode &&
											nodeApi.isInline(alignNode)) ||
										(!alignNode &&
											node.parentNode &&
											nodeApi.isInline(node.parentNode))
									)
										break;

									node.textContent =
										node.textContent.substring(
											atText.length,
										);
								}
							}
							if (node.textContent?.length !== 0) return;
							node.parentNode?.removeChild(node);
							node = alignNode;
						}
					}
				};
				if (at.nodeType === getWindow().Node.TEXT_NODE) {
					const { textContent } = at;
					atText = textContent!;
					atTextLen = atText.length;
					handleAt(at.previousSibling, true);
					handleAt(at.nextSibling, false);
				}
			}
		}
		return keelpNode;
	}
	/**
	 * 在光标位置不重合时分割
	 * @param range 光标
	 * @param removeMark 要移除的空mark节点
	 */
	splitOnExpanded(
		range: RangeInterface,
		removeMark?: NodeInterface | Array<NodeInterface>,
	) {
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
			//开始非mark标签父节点
			const startNotMarkParent = this.closestNotMark(startNode);
			//结束非mark标签父节点
			const endNotMarkParent = this.closestNotMark(endNode);
			if (!startNotMarkParent.equal(endNotMarkParent)) {
				const startRange = range.cloneRange();
				startRange.collapse(true);

				const endRange = range.cloneRange();
				endRange.collapse(false);

				//如果开始非mark标签父节点包含结束非mark标签父节点，那么分割的时候会清空 结束非mark标签父节点的内容进行重组。结束非mark标签父节点 将无非找到
				//所以需要从被包含的节点开始分割
				let keelpNode: NodeInterface | Node | undefined = undefined;
				let startOffset = startRange.startOffset;
				let endOffset = endRange.endOffset;
				//如果开始节点的父节点包含结尾父节点，会将结尾父节点删除重组，导致光标失效，需要先执行开始节点分割，并跟踪结尾节点
				if (startNotMarkParent.contains(endNotMarkParent)) {
					//先分割开始节点，并跟踪结尾节点
					keelpNode = this.splitOnCollapsed(
						startRange,
						removeMark,
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
					this.splitOnCollapsed(endRange, removeMark);
					range.setEnd(endRange.startContainer, endRange.startOffset);
				} else {
					//结尾父节点包含开始节点父节点
					//先分割结尾节点，并跟踪开始节点
					keelpNode = this.splitOnCollapsed(
						endRange,
						removeMark,
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
					this.splitOnCollapsed(startRange, removeMark);
					range.setStart(
						startRange.startContainer,
						startRange.startOffset,
					);
				}
				return;
			}
			const { node } = this.editor;
			// 节点不是样式标签，文本节点时判断父节点
			const startParent = startNode.parent();
			const startIsMark =
				node.isMark(startNode) ||
				(startParent && node.isMark(startParent));
			const endParent = endNode.parent();
			const endIsMark =
				node.isMark(endNode) || (endParent && node.isMark(endParent));
			// 不是样式标签，无需分割
			if (!startIsMark && !endIsMark) {
				return;
			}
			// 获取上面第一个非样式标签
			let { commonAncestorNode } = range;
			if (commonAncestorNode.isText()) {
				commonAncestorNode = commonAncestorNode.parent()!;
			}

			const parent = this.closestNotMark(commonAncestorNode);
			// 插入范围的开始和结束标记
			const selection = range.createSelection();
			// 子节点分别保存在两个变量

			const left = selection.getNode(parent, 'left');
			const center = selection.getNode(parent);
			const right = selection.getNode(parent, 'right');
			// 删除空标签
			this.unwrapEmptyMarks(left);
			this.unwrapEmptyMarks(right);
			// 清空原父容器，用新的内容代替
			parent.empty();
			parent.append(left.children());
			const centerChildren = center.children();
			const centerNodes = centerChildren.toArray();
			parent.append(centerChildren);
			parent.append(right.children());
			// 找到卡片，重新设置卡片根节点的引用
			parent.find(CARD_SELECTOR).each((cardNode) => {
				const cardComponent = this.editor.card.find(cardNode);
				if (cardComponent && !cardComponent.root.equal(cardNode)) {
					cardComponent.root[0] = cardNode;
				}
			});
			// 重新设置范围
			range.setStartBefore(centerNodes[0][0]);
			range.setEndAfter(centerNodes[centerNodes.length - 1][0]);
		}
	}

	/**
	 * 分割mark标签
	 * @param removeMark 需要移除的mark标签
	 */
	split(
		range?: RangeInterface,
		removeMark?: NodeInterface | Node | string | Array<NodeInterface>,
	) {
		if (!isEngine(this.editor)) return;
		const { change } = this.editor;
		const safeRange = range || change.getSafeRange();
		const doc = getDocument(safeRange.startContainer);
		if (
			typeof removeMark === 'string' ||
			(!Array.isArray(removeMark) && removeMark && isNode(removeMark))
		) {
			removeMark = $(removeMark, doc);
		}
		if (safeRange.collapsed) {
			this.splitOnCollapsed(safeRange, removeMark);
		} else {
			this.splitOnExpanded(safeRange, removeMark);
		}
		if (!range) change.apply(safeRange);
	}

	/**
	 * 在当前光标选区包裹mark标签
	 * @param mark mark标签
	 * @param both mark标签两侧节点
	 */
	wrap(mark: NodeInterface | Node | string, range?: RangeInterface) {
		const change = isEngine(this.editor) ? this.editor.change : undefined;
		if (!range && !change) return;
		const { node } = this.editor;
		const safeRange = range || change!.getSafeRange();
		const doc = getDocument(safeRange.startContainer);
		if (typeof mark === 'string' || isNode(mark)) {
			mark = $(mark, doc);
		} else mark = mark;
		if (!node.isMark(mark)) return;

		if (safeRange.collapsed) {
			if (mark.children().length === 0)
				mark.append(doc.createTextNode('\u200b'));
			//在相通插件下，值不同，插入到同级，不做嵌套
			const { startNode } = safeRange;
			const parent = startNode.parent();
			if (parent && startNode.isText() && node.isMark(parent)) {
				if (this.compare(parent, mark)) {
					this.split(safeRange, parent.clone());
				}
			}
			node.insert(mark, safeRange);
			this.merge(safeRange);
			safeRange.addOrRemoveBr();
			if (!range) change?.apply(safeRange);
			return;
		}
		this.split(safeRange);
		let { commonAncestorNode } = safeRange;

		if (commonAncestorNode.type === getWindow().Node.TEXT_NODE) {
			commonAncestorNode = commonAncestorNode.parent()!;
		}
		// 插入范围的开始和结束标记
		const selection = safeRange.createSelection();

		if (!selection.anchor && !selection.focus) {
			if (!range) change?.apply(safeRange);
			return;
		}
		// 遍历范围内的节点，添加 Mark
		let started = false;
		const nodeApi = node;
		commonAncestorNode.traverse((node) => {
			let child = $(node);
			mark = mark as NodeInterface;
			if (!child.equal(selection.anchor!)) {
				if (started) {
					if (child.equal(selection.focus!)) {
						started = false;
						return false;
					}
					if (nodeApi.isMark(child) && !child.isCard()) {
						if (!nodeApi.isEmpty(child)) {
							//找到最底层mark标签添加包裹，<strong><span style="font-size:16px">abc</span></strong> ，在 span 节点中的text再添加包裹，不在strong外添加包裹
							let targetNode = child;
							let targetChildrens = targetNode.children();
							while (
								nodeApi.isMark(targetNode) &&
								targetChildrens.length === 1
							) {
								const targetChild = targetChildrens.eq(0)!;
								if (nodeApi.isMark(targetChild)) {
									targetNode = targetChild;
									targetChildrens = targetNode.children();
								} else if (targetChild.isText()) {
									targetNode = targetChild;
								} else break;
							}
							nodeApi.removeZeroWidthSpace(targetNode);
							const parent = targetNode.parent();
							//父级和当前要包裹的节点，属性和值都相同，那就不包裹。只有属性一样，并且父节点只有一个节点那就移除父节点包裹,然后按插件情况合并值
							if (
								targetNode.isText() &&
								parent &&
								nodeApi.isMark(parent)
							) {
								if (this.compare(parent.clone(), mark, true))
									return true;
								if (parent.children().length === 1) {
									const plugin = this.findPlugin(mark);
									const curPlugin = this.findPlugin(parent);
									//插件一样，并且并表明要合并值
									if (
										plugin &&
										plugin === curPlugin &&
										plugin.combineValueByWrap === true
									) {
										nodeApi.wrap(parent, mark, true);
										return true;
									}
									//插件一样，不合并，直接移除
									else if (plugin && plugin === curPlugin)
										nodeApi.unwrap(parent);
								}
							}
							nodeApi.wrap(targetNode, mark);
							return true;
						} else if (child.name !== mark.name) {
							child.remove();
						}
					}

					if (child.isText() && !nodeApi.isEmpty(child)) {
						nodeApi.removeZeroWidthSpace(child);
						const parent = child.parent();
						//父级和当前要包裹的节点，属性和值都相同，那就不包裹。只有属性一样，并且父节点只有一个节点那就移除父节点包裹,然后按插件情况合并值
						if (parent && nodeApi.isMark(parent)) {
							if (this.compare(parent.clone(), mark, true))
								return true;
							if (parent.children().length === 1) {
								const plugin = this.findPlugin(mark);
								const curPlugin = this.findPlugin(parent);
								//插件一样，并且并表明要合并值
								if (
									plugin &&
									plugin === curPlugin &&
									plugin.combineValueByWrap === true
								) {
									nodeApi.wrap(parent, mark, true);
									return true;
								}
								//插件一样，不合并，直接移除
								else if (plugin && plugin === curPlugin)
									nodeApi.unwrap(parent);
							}
						}
						nodeApi.wrap(child, mark);
					}
				}
			} else {
				started = true;
			}
			return;
		});
		selection.move();
		this.merge(safeRange);
		if (!range) change?.apply(safeRange);
	}

	/**
	 * 合并当前选区的mark节点
	 * @param range 光标，默认当前选区光标
	 */
	merge(range?: RangeInterface): void {
		if (!isEngine(this.editor)) return;
		const { change, node } = this.editor;
		const safeRange = range || change.getSafeRange();
		const marks = this.findMarks(safeRange);
		if (marks.length === 0) {
			return;
		}

		const mergeMarks = (marks: Array<NodeInterface>) => {
			marks.forEach((mark) => {
				const prevMark = mark.prev();
				const nextMark = mark.next();

				if (prevMark && this.compare(prevMark, mark, true)) {
					const selection = safeRange
						.shrinkToElementNode()
						.createSelection();
					node.merge(prevMark, mark);
					selection.move();
					// 原来 mark 已经被移除，重新指向
					mark = prevMark;
				}

				if (nextMark && this.compare(nextMark, mark, true)) {
					const selection = safeRange
						.shrinkToElementNode()
						.createSelection();
					node.merge(mark, nextMark);
					selection.move();
				}
				//合并子级mark
				const childMarks: Array<NodeInterface> = [];
				mark.children().each((childNode) => {
					const child = $(childNode);
					if (node.isMark(child)) {
						childMarks.push(child);
					}
				});
				if (childMarks.length > 0) {
					mergeMarks(childMarks);
				}
			});
		};
		mergeMarks(marks);

		safeRange.addOrRemoveBr();
		if (!range) change.apply(safeRange);
	}
	/**
	 * 去掉mark包裹
	 * @param range 光标
	 * @param removeMark 要移除的mark标签
	 */
	unwrap(
		removeMark?: NodeInterface | Node | string | Array<NodeInterface>,
		range?: RangeInterface,
	) {
		if (!isEngine(this.editor)) return;
		const { change, node } = this.editor;
		const safeRange = range || change.getSafeRange();
		const doc = getDocument(safeRange.startContainer) || document;

		if (
			removeMark !== undefined &&
			!Array.isArray(removeMark) &&
			(typeof removeMark === 'string' || isNode(removeMark))
		) {
			removeMark = $(removeMark, doc);
		}

		this.split(safeRange, removeMark);
		if (safeRange.collapsed) {
			if (!range) change.apply(safeRange);
			return;
		}

		let ancestor = safeRange.commonAncestorNode;
		if (ancestor.type === getWindow().Node.TEXT_NODE) {
			ancestor = ancestor.parent()!;
		}

		// 插入范围的开始和结束标记
		const selection = safeRange.createSelection();
		if (!selection.has()) {
			if (!range) change.apply(safeRange);
			return;
		}
		// 遍历范围内的节点，获取目标 Mark
		const markNodes: Array<NodeInterface> = [];
		let started = false;
		ancestor.traverse((childNode) => {
			const child = $(childNode);
			if (!child.equal(selection.anchor!)) {
				if (started) {
					if (!child.equal(selection.focus!)) {
						if (
							node.isMark(child) &&
							!child.isCard() &&
							safeRange.isPointInRange(child, 0)
						) {
							markNodes.push(child);
						}
					}
				}
			} else {
				started = true;
			}
		});
		// 清除 Mark
		const nodeApi = node;
		markNodes.forEach((node) => {
			removeMark = removeMark as NodeInterface | undefined;
			if (
				!removeMark ||
				(!node.isCard() && this.compare(node, removeMark))
			) {
				nodeApi.unwrap(node);
			} else if (removeMark) {
				const styleMap = removeMark.css();
				Object.keys(styleMap).forEach((key) => {
					node.css(key, '');
				});
				//移除符合规则的class
				const removeClass = removeMark
					.get<Element>()
					?.className.split(/\s+/);
				if (removeClass) {
					const { schema } = this.editor;
					const schemas = schema.find(
						(rule) => rule.name === node.name,
					);
					for (let i = 0; i < schemas.length; i++) {
						const schemaRule = schemas[i];
						removeClass.forEach((className) => {
							className = className.trim();
							if (className === '') return;
							if (
								schemaRule.attributes &&
								schema.checkValue(
									schemaRule.attributes,
									'class',
									className,
								)
							) {
								node.removeClass(className);
							}
						});
					}
				}
			} else {
				node.removeAttributes('class');
				node.removeAttributes('style');
			}
		});
		selection.move();
		this.merge(safeRange);
		if (!range) change.apply(safeRange);
	}

	/**
	 * 光标处插入mark标签
	 * @param mark mark标签
	 * @param range 指定光标，默认为编辑器选中的光标
	 */
	insert(mark: NodeInterface | Node | string, range?: RangeInterface): void {
		if (!isEngine(this.editor)) return;
		const { change, node } = this.editor;
		const safeRange = range || change.getSafeRange();
		if (typeof mark === 'string' || isNode(mark)) {
			const doc = getDocument(safeRange.startContainer);
			mark = $(mark, doc);
		}
		// 范围为折叠状态时先删除内容
		if (!safeRange.collapsed) {
			change.deleteContent(safeRange);
		}
		// 插入新 Mark
		node.insert(mark, safeRange)
			?.addOrRemoveBr()
			.select(mark)
			.collapse(false);
		if (!range) change.apply(safeRange);
	}

	/**
	 * 查找对范围有效果的所有 Mark
	 * @param range 范围
	 */
	findMarks(range: RangeInterface) {
		const cloneRange = range.cloneRange();
		const { node } = this.editor;
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
					node.isBlock(endOffsetNode) &&
					(startNode.type !== Node.ELEMENT_NODE ||
						(!!startOffsetNode && !node.isBlock(startOffsetNode)))
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
					node.isBlock(startOffsetNode) &&
					(startNode.type !== Node.ELEMENT_NODE ||
						(startChildrenOffsetNode &&
							!node.isBlock(startChildrenOffsetNode)))
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
		if (
			sc.nodeType === getWindow().Node.ELEMENT_NODE &&
			sc.childNodes[so]
		) {
			startNode = sc.childNodes[so] || sc;
		}
		if (
			ec.nodeType === getWindow().Node.ELEMENT_NODE &&
			eo > 0 &&
			ec.childNodes[eo - 1]
		) {
			endNode = ec.childNodes[eo - 1] || sc;
		}
		// 折叠状态时，按右侧位置的方式处理
		if (range.collapsed) {
			startNode = endNode;
		}
		// 不存在时添加
		const addNode = (nodes: Array<NodeInterface>, nodeB: NodeInterface) => {
			if (!nodes.some((nodeA) => nodeA.equal(nodeB))) {
				nodes.push(nodeB);
			}
		};
		const nodeApi = node;
		// 向上寻找
		const findNodes = (node: NodeInterface) => {
			let nodes: Array<NodeInterface> = [];
			while (node) {
				if (
					node.type === getWindow().Node.ELEMENT_NODE &&
					node.isEditable()
				) {
					break;
				}
				if (
					nodeApi.isMark(node) &&
					!node.attributes(CARD_KEY) &&
					!node.attributes(CARD_ELEMENT_KEY)
				) {
					nodes.push(node);
				}
				const parent = node.parent();
				if (!parent) break;
				node = parent;
			}
			return nodes;
		};

		const nodes = findNodes($(startNode));
		if (!range.collapsed) {
			findNodes($(endNode)).forEach((nodeB) => {
				return addNode(nodes, nodeB);
			});
			if (sc !== ec) {
				let isBegin = false;
				let isEnd = false;
				range.commonAncestorNode.traverse((child) => {
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
								nodeApi.isMark(child) &&
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
	 * 从下开始往上遍历删除空 Mark，当遇到空 Block，添加 BR 标签
	 * @param node 节点
	 * @param addBr 是否添加br
	 */
	removeEmptyMarks(node: NodeInterface, addBr?: boolean) {
		if (
			node.length === 0 ||
			node.isEditable() ||
			node.isCard() ||
			node.attributes(DATA_ELEMENT)
		) {
			return;
		}
		const nodeApi = this.editor.node;
		if (!node.attributes(DATA_ELEMENT)) {
			const parent = node.parent();
			// 包含光标标签
			// <p><strong><cursor /></strong></p>
			if (
				node.children().length === 1 &&
				node.first()?.attributes(DATA_ELEMENT)
			) {
				if (nodeApi.isMark(node)) {
					node.before(node.first()!);
					node.remove();
					if (parent) this.removeEmptyMarks(parent, true);
				} else if (addBr && nodeApi.isBlock(node)) {
					node.prepend('<br />');
				}
				return;
			}

			const html = nodeApi.html(node);

			if (html === '' || html === '\u200B') {
				if (nodeApi.isMark(node)) {
					node.remove();
					if (parent) this.removeEmptyMarks(parent, true);
				} else if (addBr && nodeApi.isBlock(node)) {
					nodeApi.html(node, '<br />');
				}
			}
		}
	}
}

export default Mark;
