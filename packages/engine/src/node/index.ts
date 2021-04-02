import Entry from './entry';
import Event from './event';
import {
	isNode,
	isNodeEntry,
	NodeInterface,
	NodeModelInterface,
	isNodeList,
	EditorInterface,
	NodeEntry,
	PluginEntry,
	SchemaBlock,
} from '../types';
import {
	ANCHOR,
	CARD_KEY,
	CARD_SELECTOR,
	CURSOR,
	DATA_ELEMENT,
	FOCUS,
	READY_CARD_KEY,
	READY_CARD_SELECTOR,
} from '../constants';
import { getStyleMap, getWindow } from '../utils';

class NodeModel implements NodeModelInterface {
	private editor: EditorInterface;
	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	isVoid(node: NodeInterface | Node | string) {
		const { schema } = this.editor;
		let name = typeof node === 'string' ? node : '';
		if (isNode(node)) name = node.nodeName.toLowerCase();
		else if (isNodeEntry(node)) name = node.name;
		return schema
			.find(rule => rule.name === name)
			.some(rule => rule.isVoid);
	}

	isMark(node: NodeInterface | Node) {
		const { schema, $ } = this.editor;
		if (isNode(node)) node = $(node);
		return schema.check(node, 'mark');
	}

	/**
	 * 是否是inline标签
	 * @param node 节点
	 */
	isInline(node: NodeInterface | Node) {
		const { schema, $ } = this.editor;
		if (isNode(node)) node = $(node);
		return schema.check(node, 'inline');
	}

	/**
	 * 是否是块级节点
	 * @param node 节点
	 */
	isBlock(node: NodeInterface | Node): boolean {
		const { schema, $ } = this.editor;
		if (isNode(node)) node = $(node);
		return schema.check(node, 'block');
	}

	/**
	 * 判断当前节点是否为block类型的简单节点（子节点不包含blcok标签）
	 */
	isSimpleBlock(node: NodeInterface) {
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
	isRootBlock(node: NodeInterface) {
		if (!node.parent()?.isRoot()) return false;
		if (!this.isSimpleBlock(node)) return false;
		//并且规则上不可以设置子节点
		return this.editor.schema
			.find(schema => schema.name === node.name)
			.every(
				schema => this.editor.schema.closest(schema.name) === node.name,
			);
	}
	/**
	 * 判断节点下的文本是否为空
	 * @param withTrim 是否 trim
	 */
	isEmpty(node: NodeInterface, withTrim?: boolean) {
		if (node.isElement()) {
			//卡片不为空
			if (
				node.attributes(CARD_KEY) ||
				node.find(CARD_SELECTOR).length > 0
			) {
				return false;
			}
			//只读卡片不为空
			if (
				node.attributes(READY_CARD_KEY) ||
				node.find(READY_CARD_SELECTOR).length > 0
			) {
				return false;
			}
			//非br节点的空节点不为空
			if (node.name !== 'br' && this.isVoid(node)) {
				return false;
			}
			//多个br节点不为空
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

	isLikeEmpty(node: NodeInterface) {
		if (node.length === 0) return true;
		const { childNodes } = node[0];
		if (childNodes.length === 0) return true;
		for (let i = 0; i < childNodes.length; i++) {
			const child = childNodes[i];
			if (child.nodeType === getWindow().Node.TEXT_NODE) {
				if (child['data'].replace(/\u200b/g, '') !== '') return false;
			} else if (child.nodeType === getWindow().Node.ELEMENT_NODE) {
				if ((child as Element).hasAttribute(CARD_KEY)) return false;
				if (!this.isLikeEmpty(this.editor.$(child))) {
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
		switch (node.name) {
			case 'li':
				return node.hasClass(this.editor.list.CUSTOMZIE_LI_CLASS);

			case 'ul':
				return node.hasClass(this.editor.list.CUSTOMZIE_UL_CLASS);

			default:
				return false;
		}
	}
	/**
	 * 获取节点所属类型
	 * @param node 节点
	 * @returns
	 */
	getType(node: NodeInterface | Node): 'mark' | 'block' | 'inline' | void {
		if (this.isMark(node)) return 'mark';
		if (this.isBlock(node)) return 'block';
		if (this.isInline(node)) return 'inline';
	}
	/**
	 * 去除包裹
	 * @param node 需要去除包裹的节点
	 */
	unwrap(node: NodeInterface) {
		let child = node.first();
		while (child) {
			const next = child.next();
			node.before(child);
			child = next;
		}
		node.remove();
	}
	/**
	 * 包裹节点
	 * @param source 需要包裹的节点
	 * @param outer 包裹的外部节点
	 */
	wrap(source: NodeInterface | Node, outer: NodeInterface) {
		const { $ } = this.editor;
		if (isNode(source)) source = $(source);
		outer = this.editor.node.clone(outer, false);
		// 文本节点
		if (source.isText()) {
			outer.append(this.editor.node.clone(source, false));
			return source.replaceWith(outer);
		}

		// 包裹样式节点
		if (this.isMark(outer)) {
			//合并样式
			const outerClone = this.editor.node.clone(outer, false);
			if (source.name === outer.name) {
				const attrs = source.attributes();
				delete attrs.style;
				Object.keys(attrs).forEach(key => {
					if (!outer.attributes(key))
						outer.attributes(key, attrs[key]);
				});

				const styles = source.css();
				Object.keys(styles).forEach(key => {
					if (!outer.css(key)) outer.css(key, styles[key]);
				});
				outer.append(this.editor.node.clone(source, true).children());
			} else {
				outer.append(this.editor.node.clone(source, true));
			}

			const children = outer.allChildren();
			children.forEach(node => {
				const child = $(node);
				if (
					!child.isText() &&
					this.isMark(child) &&
					this.editor.mark.compare(child, outerClone)
				) {
					this.unwrap(child);
				}
			});
			return source.replaceWith(outer);
		}
		// 其它情况
		const shadowNode = this.editor.node.clone(source, false);
		source.after(shadowNode);
		outer.append(source);
		return shadowNode.replaceWith(outer);
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
			return;
		}
		const { $ } = this.editor;
		let mergedNode = target;
		const toIsList = ['ul', 'ol'].includes(source.name);
		const fromIsList = ['ul', 'ol'].includes(target.name);
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
		//被合并的节点最后一个子节点为br，则移除
		const toNodeLast = source.last();
		let child = target.first();
		const plugins = this.editor.block.findPlugin(source);
		//循环追加
		while (child) {
			const next = child.next();
			plugins.forEach(plugin => {
				const markPlugins = this.editor.mark.findPlugin(child!);
				if (
					plugin.disableMark &&
					markPlugins.some(
						markPlugin =>
							plugin.disableMark!.indexOf(
								(markPlugin.constructor as PluginEntry)
									.pluginName,
							) > -1,
					)
				) {
					this.editor.node.unwrap(child!);
				}
			});
			//追加到要合并的列表中
			source.append(child);
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
	}

	/**
	 * 将源节点的子节点追加到目标节点，并替换源节点
	 * @param source 旧节点
	 * @param target 新节点
	 */
	replace(source: NodeInterface, target: NodeInterface) {
		const clone = this.editor.node.clone(target, false);
		let childNode = source.first();

		while (childNode) {
			const nextNode = childNode.next();
			clone.append(childNode);
			childNode = nextNode;
		}

		return source.replaceWith(clone);
	}

	/**
	 * 设置节点属性
	 * @param node 节点
	 * @param props 属性
	 */
	setAttributes(node: NodeInterface, attributes: any) {
		let { style, ...attrs } = attributes;
		Object.keys(attrs).forEach(key => {
			if (key === 'className') {
				const value = attrs[key];
				if (Array.isArray(value)) {
					value.forEach(name => node.addClass(name));
				} else node.addClass(value);
			} else node.attributes(key, attrs[key].toString());
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
	}

	/**
	 * 移除值为负的样式
	 * @param node 节点
	 * @param style 样式名称
	 */
	removeMinusStyle(node: NodeInterface, style: string) {
		if (this.isBlock(node)) {
			const val = parseInt(node.css(style), 10) || 0;
			if (val < 0) node.css(style, '');
		}
	}

	/**
	 * 合并节点下的子节点，两个相同的相邻节点的子节点
	 * @param node 当前节点
	 */
	mergeAdjacent(node: NodeInterface) {
		const topTags = this.editor.schema.getAllowInTags();
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
					!this.editor.node.isList(childDom)) ||
					(this.editor.node.isList(childDom) &&
						this.editor.list.isSame(childDom, nextNode)))
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
				this.mergeAdjacent(childDom);
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
			firstNode &&
			firstNode.name === tagName &&
			node.children().length > 1
		) {
			firstNode.remove();
		}
		// 删除最后一个 BR
		const lastNode = node.last();
		if (
			lastNode &&
			lastNode.name === tagName &&
			node.children().length > 1
		) {
			lastNode.remove();
		}
	}
	/**
	 * 整理节点
	 * @param node 节点
	 * @param root 根节点
	 */
	flatten(node: NodeInterface, root: NodeInterface = node) {
		const { $ } = this.editor;
		//第一个子节点
		let childNode = node.first();
		const rootElement = root.isFragment
			? root.get()?.parentNode
			: root.get();
		const tempNode = node.isFragment
			? $('<p />')
			: this.editor.node.clone(node, false);
		while (childNode) {
			//获取下一个兄弟节点
			let nextNode = childNode.next();
			//如果当前子节点是块级的Card组件或者是表格，或者是简单的block
			if (childNode.isBlockCard() || this.isSimpleBlock(childNode))
				this.editor.block.flatten(childNode, $(rootElement || []));
			//如果当前是块级标签，递归循环
			else if (this.isBlock(childNode))
				this.flatten(childNode, $(rootElement || []));
			else {
				const cloneNode = this.editor.node.clone(tempNode, false);
				const isLI = 'li' === cloneNode.name;
				childNode.before(cloneNode);
				while (childNode) {
					nextNode = childNode.next();
					const isBR = 'br' === childNode.name && !isLI;
					cloneNode.append(childNode);
					if (isBR || !nextNode || this.isBlock(nextNode)) break;
					childNode = nextNode;
				}
				this.removeSide(cloneNode);
				this.editor.block.flatten(cloneNode, $(rootElement || []));
			}
			childNode = nextNode;
		}
		//如果没有子节点了，就移除当前这个节点
		childNode = node.first();
		if (!childNode) node.remove();
	}

	/**
	 * 标准化节点
	 * @param node 节点
	 */
	normalize(node: NodeInterface) {
		this.flatten(node);
		this.mergeAdjacent(node);
	}
	/**
	 * 修复节点两侧零宽字符占位
	 * @param node 节点
	 */
	repairBoth(node: NodeInterface | Node) {
		const { $ } = this.editor;
		if (isNode(node)) node = $(node);
		if (node.parent() && !this.isVoid(node)) {
			const zeroNode = $('\u200b', null);
			const prev = node.prev();
			const prevText = prev?.text() || '';
			if (!prev || !/\u200B$/g.test(prevText)) {
				if (prev && prev.isText()) {
					prev.text(prevText + '\u200b');
				} else {
					node.before(this.editor.node.clone(zeroNode, true));
				}
			} else if (
				prev &&
				prev.isText() &&
				/\u200B\u200B$/g.test(prevText)
			) {
				prev.text(prevText.substr(0, prevText.length - 1));
			}

			const next = node.next();
			if (
				!next ||
				(next && next.name !== 'br' && !/^\u200B/g.test(next.text()))
			) {
				if (next && next.isText()) {
					next.text('\u200b' + next.text());
				} else {
					node.after(this.editor.node.clone(zeroNode, true));
				}
			}
		}
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

		node.each(node => {
			const element = <Element>node;
			element.innerHTML = val;
			this.editor.block.generateRandomIDForDescendant(element);
		});
		return node;
	}

	/**
	 * 复制元素节点
	 * @param {boolean} deep 是否深度复制
	 * @return 复制后的元素节点
	 */
	clone(node: NodeInterface, deep?: boolean): NodeInterface {
		const nodes: Array<Node> = [];
		node.each(node => {
			const cloneNode = node.cloneNode(deep);
			this.editor.block.generateRandomIDForDescendant(cloneNode, true);
			if (this.editor.block.needMarkDataID(cloneNode.nodeName)) {
				this.editor.block.generateRandomID(cloneNode as Element, true);
			}
			nodes.push(cloneNode);
		});
		return this.editor.$(nodes);
	}

	/**
	 * 获取批量追加子节点后的outerHTML
	 * @param nodes 节点集合
	 * @param appendExp 追加的节点
	 */
	getBatchAppendHTML(nodes: Array<NodeInterface>, appendExp: string) {
		if (nodes.length === 0) return appendExp;
		let appendNode = this.editor.$(appendExp);
		nodes.forEach(node => {
			node = node.clone(false);
			node.append(appendNode);
			appendNode = node;
		});
		return appendNode.get<Element>()?.outerHTML || '';
	}
}

export default NodeModel;

export { Entry as NodeEntry, Event };
