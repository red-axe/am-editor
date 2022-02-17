import tinycolor2 from 'tinycolor2';
import { MarkInterface, NodeInterface, SchemaInterface } from '../types';
import { READY_CARD_KEY, READY_CARD_SELECTOR } from '../constants/card';
import Parser from '../parser';
import { EngineInterface } from '../types/engine';
import { $ } from '../node';

export default class Paste {
	protected source: string;
	protected engine: EngineInterface;
	protected schema: SchemaInterface;

	constructor(source: string, engine: EngineInterface) {
		this.source = source;
		this.engine = engine;
		this.schema = this.engine.schema.clone();
	}

	parser() {
		const conversion = this.engine.conversion.clone();
		this.engine.trigger('paste:schema', this.schema);
		const parser = new Parser(this.source, this.engine, (root) => {
			this.engine.trigger('paste:origin', root);
		});
		return parser.toDOM(this.schema, conversion);
	}

	getDefaultStyle() {
		const defaultStyle = {
			color: tinycolor2(this.engine.container.css('color')).toHexString(),
			'background-color': tinycolor2(
				this.engine.container.css('background-color'),
			).toHexString(),
			'font-size': this.engine.container.css('font-size'),
		};
		return defaultStyle;
	}

	elementNormalize(fragment: DocumentFragment) {
		const defaultStyle = this.getDefaultStyle();
		const defautlStyleKeys = Object.keys(defaultStyle);
		const { inline } = this.engine;
		const nodeApi = this.engine.node;
		const markApi = this.engine.mark;
		const blockApi = this.engine.block;
		const currentMarkPlugins: {
			plugin: MarkInterface | undefined;
			node: NodeInterface;
		}[] = [];
		$(fragment).traverse(
			(node) => {
				let parent = node.parent();
				// 跳过已被删除的节点
				if (!parent || node.isCard() || node.fragment === fragment) {
					return undefined;
				}
				if (node.isText()) {
					let text = node.text();
					// if (/\x20/.test(text)) {
					// 	text = text.replace(/\x20/g, ' ');
					// 	node.text(text);
					// }
					if (/\u200b/.test(text)) {
						let isRemove = true;
						const next = node.next();
						const prev = node.prev();
						const parent = node.parent();
						if (parent && nodeApi.isMark(parent, this.schema))
							isRemove = false;
						else if (
							parent &&
							nodeApi.isInline(parent, this.schema)
						)
							isRemove = false;
						else if (next && nodeApi.isInline(next, this.schema))
							isRemove = false;
						else if (prev && nodeApi.isInline(prev, this.schema))
							isRemove = false;
						if (isRemove) {
							text = text.replace(/\u200b/g, '');
							node.text(text);
						}
					}
					return undefined;
				}
				const styles = node.css();
				defautlStyleKeys.forEach((key) => {
					const value = styles[key];
					if (!value) return;
					if (
						value.toLowerCase() === defaultStyle[key].toLowerCase()
					) {
						node.css(key, '');
					}
				});
				//处理后如果不是一个有效的节点就移除包裹
				let type = this.schema.getType(node);
				if (!type) {
					nodeApi.unwrap(node);
					return undefined;
				}
				nodeApi.removeMinusStyle(node, 'text-indent');
				if (nodeApi.isList(node)) {
					node.css('padding-left', '');
				}

				let attributes: { [k: string]: string } | undefined =
					node.attributes();
				// 删除空 style 属性
				if ((attributes.style || '').trim() === '') {
					node.removeAttributes('style');
				}

				// br 换行改成正常段落
				if (type === 'block') {
					this.engine.block.brToBlock(node);
				}
				// 删除空 span
				while (node.name === 'span' && nodeApi.isEmpty(node)) {
					const children = node.children();
					if (children.length > 0) {
						break;
					}
					parent = node.parent();
					node.remove();
					if (!parent) return undefined;
					node = parent;
					parent = node.parent();
					if (!parent) return undefined;
					type = undefined;
					attributes = undefined;
				}
				if (!attributes) attributes = node.attributes();
				// 跳过Card
				if (attributes[READY_CARD_KEY]) {
					return undefined;
				}
				const nodeIsBlock = type
					? type === 'block'
					: nodeApi.isBlock(node, this.schema);
				const nodeIsVoid = nodeApi.isVoid(node, this.schema);
				let parentIsBlock = nodeApi.isBlock(parent, this.schema);
				// 删除零高度的空行
				if (
					nodeIsBlock &&
					attributes['data-type'] !== 'p' &&
					!nodeIsVoid &&
					!parentIsBlock &&
					//!node.isSolid() &&
					nodeApi.html(node) === ''
				) {
					node.remove();
					return undefined;
				}
				// 段落
				if (attributes['data-type'] === 'p') {
					node.removeAttributes('data-type');
				}
				if (nodeIsBlock && parent?.name === 'p') {
					nodeApi.unwrap(parent);
					parent = node.parent();
					if (parent?.fragment === fragment) parent = undefined;
					parentIsBlock = parent
						? nodeApi.isBlock(parent, this.schema)
						: false;
				}
				const parentIsList = parent ? nodeApi.isList(parent) : false;
				// 补齐 ul 或 ol
				if (node.name === 'li' && parent && !parentIsList) {
					const ul = $('<ul />');
					node.before(ul);
					ul.append(node);
					return undefined;
				}
				if (nodeApi.isList(node) && parent && nodeApi.isList(parent)) {
					// 分割付节点list
					const leftList: NodeInterface[] = [];
					const rightList: NodeInterface[] = [];
					let isLeft = true;
					const rootChildren = parent.children().toArray();
					let tempList = parent.clone();
					const appendToTemp = () => {
						if (tempList.children().length > 0) {
							if (isLeft) leftList.push(tempList);
							else rightList.push(tempList);
							tempList = parent!.clone();
							return true;
						}
						return false;
					};
					/**
					 * <ul><ul></ul><li></li></ul>
					 * <ul><li></li><ul></ul><li></li></ul>
					 * <ul><li></li><ul></ul></ul>
					 */
					rootChildren.forEach((child, index) => {
						if (!child) return;
						if (child.equal(node)) {
							// 最后一个位置加入到右边
							if (rootChildren.length - 1 === index) {
								appendToTemp();
								rightList.push(node);
							}
							// 在第一个位置，加入到最左边
							else if (index === 0) leftList.push(node);
							// 中间位置，先append，然后加入到左边
							else {
								appendToTemp();
								leftList.push(node);
							}
							isLeft = false;
							return;
						}
						if (child.name === 'li') {
							tempList.append(child);
							return;
						} else {
							appendToTemp();
						}
						if (isLeft) leftList.push(child);
						else rightList.push(child);
					});
					appendToTemp();
					const indent = parent.attributes('data-indent') || '0';
					node.attributes('data-indent', indent);
					this.engine.list.addIndent(node, 1);
					let prev = parent;
					leftList.forEach((childNode) => {
						const child = $(childNode);
						if (!child || child.children().length === 0) return;
						prev.after(child);
						prev = child;
					});
					rightList.forEach((childNode) => {
						const child = $(childNode);
						if (!child || child.children().length === 0) return;
						prev.after(child);
						prev = child;
					});
					parent.remove();
					return node || undefined;
				}
				// 补齐 li
				if (node.name !== 'li' && parentIsList) {
					const li = $('<li />');
					node.before(li);
					li.append(node);
					return undefined;
				}
				// <li>two<ol><li>three</li></ol>four</li>
				/**
			 * <ul>
					<li>缺少用户添加问题输入框说明/placeholder的功能</li>
					<li>缺少拖动添加功能</li>
					<li>填空式
						<ul><li>调整填空题类型（名字、电话等），如标题为空的情况下，应该自动换成对应类型的标题</li></ul>
					</li>
					<li>选择式
						<ul><li>体验优化：回车键自动添加新选项</li></ul>
					</li>
				</ul>
			 */
				if (nodeApi.isList(node) && parent?.name === 'li') {
					// li没有父节点就移除包裹
					const rootListElement = parent?.parent();
					if (!rootListElement) {
						nodeApi.unwrap(parent);
						return undefined;
					}
					// 分割付节点list
					const leftList = rootListElement.clone();
					const rightList = rootListElement.clone();
					let isLeft = true;
					const rootChildren = rootListElement.children().toArray();

					rootChildren.forEach((child) => {
						if (!child) return;
						if (child.equal(parent!)) {
							isLeft = false;
							return;
						}
						if (isLeft) leftList.append(child);
						else rightList.append(child);
					});
					const isCustomizeList = parent
						?.parent()
						?.hasClass('data-list');
					const children = parent?.children();
					let li: NodeInterface | null = null;
					let next: NodeInterface | null = null;
					children.each((child, index) => {
						const node = children.eq(index);
						if (!node || nodeApi.isEmptyWithTrim(node)) {
							return;
						}
						const isList = nodeApi.isList(node);
						const leftLast = leftList[leftList.length - 1];
						if (isList) {
							const indent =
								$(leftLast)?.attributes('data-indent') || '0';
							node.attributes('data-indent', indent);
							this.engine.list.addIndent(node, 1);
							leftList[leftList.length] = node[0];
							li = null;
							return;
						}
						if (!li) {
							li = isCustomizeList
								? $('<li class="data-list-item" />')
								: $('<li />');
							const last = $(leftLast)?.last();
							if (last) last?.after(li);
							else $(leftLast).append(li);
						}
						li.append(child);
						if (!next) {
							next = li;
						}
					});
					parent?.remove();
					let prev = rootListElement;
					leftList.each((childNode) => {
						const child = $(childNode);
						if (!child || child.children().length === 0) return;
						prev.after(child);
						prev = child;
					});
					rightList.each((childNode) => {
						const child = $(childNode);
						if (!child || child.children().length === 0) return;
						prev.after(child);
						prev = child;
					});
					rootListElement.remove();
					return (
						(next as NodeInterface | null)?.next() ||
						leftList.next() ||
						undefined
					);
				}
				// p 改成 li
				if (node.name === 'p' && parentIsList) {
					const newNode = $('<li />');
					nodeApi.replace(node, newNode);
					return newNode;
				}
				// 处理空 Block
				if (
					nodeIsBlock &&
					!nodeIsVoid &&
					nodeApi.html(node).trim() === ''
				) {
					// <p></p> to <p><br /></p>
					if (
						nodeApi.isRootBlock(node, this.schema) ||
						node.name === 'li'
					) {
						nodeApi.html(node, '<br />');
					}
				}
				// <li><p>foo</p></li>
				if (nodeIsBlock && parent?.name === 'li') {
					// <li><p><br /></p></li>
					if (
						node.children().length === 1 &&
						node.first()?.name === 'br'
					) {
						// nothing
					} else {
						node.after('<br />');
					}
					nodeApi.unwrap(node);
					return undefined;
				}
				if (
					!nodeIsBlock &&
					nodeApi.isInline(node) &&
					!node.isCard() &&
					!nodeIsVoid
				) {
					const isVoid = node
						.allChildren()
						.some((node) => nodeApi.isVoid(node, this.schema));
					if (nodeApi.isEmptyWithTrim(node) && !isVoid) node.remove();
					else inline.repairCursor(node);
				}
				// 移除两边的 BR
				nodeApi.removeSide(node);

				// 处理嵌套
				let nodeParent = parent;
				const handleBlock = (node: NodeInterface) => {
					if (
						nodeParent &&
						!nodeParent.fragment &&
						nodeApi.isBlock(node, this.schema) &&
						nodeApi.isBlock(nodeParent, this.schema) &&
						!this.schema.isAllowIn(nodeParent.name, node.name)
					) {
						const children = node.children();
						nodeApi.unwrap(node);
						children.each((_, index) => {
							handleBlock(children.eq(index)!);
						});
					}
				};
				handleBlock(node);
				// 处理block在其它非block节点下的情况
				while (
					node.length > 0 &&
					nodeParent &&
					!nodeParent.fragment &&
					nodeApi.isBlock(node, this.schema) &&
					!nodeApi.isBlock(nodeParent, this.schema)
				) {
					const nodeClone = node.clone();
					nodeApi.unwrap(node);
					nodeParent.before(nodeClone);
					nodeClone.append(nodeParent);
					node = nodeClone;
					nodeParent = node.parent();
				}
				const nodeIsMark = nodeApi.isMark(node, this.schema);
				// 处理有关mark不能嵌入到block节点内的情况
				if (node.length > 0 && nodeIsMark) {
					const block = blockApi.closest(node);
					if (!block.equal(node)) {
						const markPlugin = markApi.findPlugin(node);
						const blockPlugin = blockApi.findPlugin(block);
						if (
							markPlugin &&
							blockPlugin?.disableMark?.includes(markPlugin.name)
						) {
							const child = node.first();
							nodeApi.unwrap(node);
							return child || undefined;
						}
					}
				}
				// mark 相同的嵌套
				if (nodeIsMark) {
					const markPlugin = markApi.findPlugin(node);
					const topMarkPlugins = currentMarkPlugins.concat();
					topMarkPlugins.pop();
					if (markPlugin) {
						const plugin = topMarkPlugins.find(
							(item) =>
								item.plugin?.name === markPlugin.name &&
								item.node.length > 0,
						);
						if (plugin) {
							if (plugin.node.children().length === 1) {
								nodeApi.unwrap(plugin.node);
							} else {
								nodeApi.unwrap(node);
							}
							return;
						}
					}
				}
				// mark 按级别排序
				nodeParent = parent;
				if (
					node.length > 0 &&
					nodeParent &&
					nodeApi.isMark(nodeParent, this.schema) &&
					nodeIsMark
				) {
					const pMarkPlugin = markApi.findPlugin(nodeParent);
					const cMarkPlugin =
						currentMarkPlugins[currentMarkPlugins.length - 1]
							.plugin;
					if (
						pMarkPlugin &&
						cMarkPlugin &&
						cMarkPlugin.mergeLeval > pMarkPlugin.mergeLeval
					) {
						const cloneParent = nodeParent.clone(false);
						const childrenNodes = nodeParent.children().toArray();
						const startP = cloneParent.clone();
						const endP = cloneParent.clone();
						let isStart = true;
						let index = -1;
						childrenNodes.forEach((children, i) => {
							if (children.equal(node)) {
								const nChildren = node.children();
								cloneParent.append(nChildren);
								node.append(cloneParent);
								isStart = false;
								index = i;
							} else if (isStart) {
								startP.append(children);
							} else {
								endP.append(children);
							}
						});
						if (index > 0) {
							nodeParent.before(startP);
						}
						if (index < childrenNodes.length - 1) {
							nodeParent.after(endP);
						}
						if (index > -1) {
							nodeParent.before(node);
							nodeParent.remove();
							currentMarkPlugins.splice(
								currentMarkPlugins.length - 2,
								1,
							);
							return node;
						}
					}
				}
				return undefined;
			},
			undefined,
			undefined,
			(startNode) => {
				if (nodeApi.isMark(startNode)) {
					const plugin = markApi.findPlugin(startNode);
					startNode['is_mark'] = true;
					currentMarkPlugins.push({
						plugin,
						node: startNode,
					});
				}
			},
			(endNode) => {
				if (endNode['is_mark']) {
					currentMarkPlugins.pop();
				}
			},
		);
	}

	normalize(autoAppendCurrent: boolean = true) {
		const nodeApi = this.engine.node;
		let fragment = this.parser();
		this.elementNormalize(fragment);
		const range = this.engine.change.range.get();
		const root = range.commonAncestorNode;
		const inline = this.engine.inline.closest(root);
		if (
			root.inEditor() &&
			!inline.isCard() &&
			nodeApi.isInline(inline, this.schema)
		) {
			this.removeElementNodes($(fragment));
			return fragment;
		}
		if (
			root.inEditor() &&
			root.isText() &&
			range.startContainer === range.endContainer
		) {
			const text = root[0].nodeValue;
			const leftText = text?.substr(0, range.startOffset);
			const rightText = text?.substr(range.endOffset);
			// 光标在 [text](|) 里
			if (
				/\[.*?\]\($/.test(leftText || '') &&
				/^\)/.test(rightText || '')
			) {
				this.removeElementNodes($(fragment));
				return fragment;
			}
		}

		$(fragment).traverse((node) => {
			if (node.fragment === fragment) return;
			if (node.length > 0 && node[0].parentNode)
				this.engine.trigger('paste:each', node);
			// 删除非block节点的换行 \r\n\r\n<span
			if (node.isText()) {
				const text = node.text();
				if (/^(\r|\n)+$/.test(text)) {
					const prev = node.prev();
					const next = node.next();
					if (
						(prev && !nodeApi.isBlock(prev)) ||
						(next && !nodeApi.isBlock(next)) ||
						(prev &&
							nodeApi.isBlock(prev) &&
							next &&
							nodeApi.isBlock(next)) ||
						node.parent()?.name === 'p'
					)
						node.remove();
				}
				const match = /((\n)+)/.exec(text);
				if (match && match.index > 0 && match.index < text.length - 1) {
					const nextReg = node.get<Text>()!.splitText(match.index);
					const endReg = nextReg.splitText(match[0].length);
					node.after(nextReg);
					nextReg.after(endReg);
					if (!node.text()) node.remove();
				}
			}
			// 删除包含Card的 pre 标签
			else if (
				node.name === 'pre' &&
				node.find(READY_CARD_SELECTOR).length > 0
			) {
				nodeApi.unwrap(node);
			}
		});
		this.engine.trigger('paste:each-after', $(fragment));

		const node = nodeApi.normalize($(fragment));
		if (node.fragment) fragment = node.fragment;
		fragment.normalize();
		let fragmentNode = $(fragment);
		const first = fragmentNode.first();
		//如果光标在文本节点，并且父级节点不是根节点，移除粘贴数据的第一个节点块级节点，让其内容接在光标所在行
		const cloneRange = range
			.cloneRange()
			.shrinkToElementNode()
			.shrinkToTextNode();
		const { startNode } = cloneRange;
		if (
			autoAppendCurrent &&
			startNode.inEditor() &&
			first &&
			first.name === 'p' &&
			!(first.length === 1 && first.first()?.name === 'br') &&
			!nodeApi.isEmptyWidthChild(
				range.cloneRange().enlargeToElementNode(true, true).startNode,
			)
		) {
			nodeApi.unwrap(first);
		}
		fragmentNode = $(fragment);
		const children = fragmentNode.find('ul,ol');
		children.each((_, index) => {
			const child = children.eq(index);
			if (child && nodeApi.isList(child)) {
				this.engine.list.addStart(child);
			}
		});
		this.engine.nodeId.generateAll($(fragment), true);
		return fragment;
	}

	removeElementNodes(fragment: NodeInterface) {
		const nodes = fragment.allChildren();
		nodes.forEach((node) => {
			if (node.isElement()) {
				this.engine.node.unwrap(node);
			}
		});
	}
}
