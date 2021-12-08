import tinycolor2 from 'tinycolor2';
import { NodeInterface, SchemaInterface } from '../types';
import { READY_CARD_KEY, READY_CARD_SELECTOR } from '../constants/card';
import Parser from '../parser';
import { EngineInterface } from '../types/engine';
import { $ } from '../node';
import { DATA_ID } from '../constants';

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

		$(fragment).traverse((node) => {
			let parent = node.parent();
			// 跳过已被删除的节点
			if (!parent || node.isCard() || node.fragment === fragment) {
				return;
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
					else if (parent && nodeApi.isInline(parent, this.schema))
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
				return;
			}
			const styles = node.css();
			defautlStyleKeys.forEach((key) => {
				const value = styles[key];
				if (!value) return;
				if (value.toLowerCase() === defaultStyle[key].toLowerCase()) {
					node.css(key, '');
				}
			});
			//处理后如果不是一个有效的节点就移除包裹
			let type = this.schema.getType(node);
			if (!type) {
				nodeApi.unwrap(node);
				return;
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
				if (children.length > 0 && children.isElement()) {
					break;
				}
				parent = node.parent();
				node.remove();
				if (!parent) return;
				node = parent;
				parent = node.parent();
				if (!parent) return;
				type = undefined;
				attributes = undefined;
			}
			if (!attributes) attributes = node.attributes();
			// 跳过Card
			if (attributes[READY_CARD_KEY]) {
				return;
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
				return;
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
				return;
			}
			// 补齐 li
			if (node.name !== 'li' && parentIsList) {
				const li = $('<li />');
				node.before(li);
				li.append(node);
				return;
			}
			// <li>two<ol><li>three</li></ol>four</li>
			if (
				nodeApi.isList(node) &&
				parent?.name === 'li' &&
				(node.prev() || node.next())
			) {
				let li: NodeInterface | null;
				const isCustomizeList = parent?.parent()?.hasClass('data-list');
				const children = parent?.children();
				children.each((child, index) => {
					const node = children.eq(index);
					if (!node || nodeApi.isEmptyWithTrim(node)) {
						return;
					}
					const isList = nodeApi.isList(node);
					if (!li || isList) {
						li = isCustomizeList
							? $('<li class="data-list-item" />')
							: $('<li />');
						parent?.before(li);
					}
					li.append(child);
					if (isList) {
						li = null;
					}
				});
				parent?.remove();
				return;
			}
			// p 改成 li
			if (node.name === 'p' && parentIsList) {
				nodeApi.replace(node, $('<li />'));
				return;
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
				return;
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
			// mark 相同的嵌套
			nodeParent = parent;
			while (
				node.length > 0 &&
				nodeParent &&
				nodeApi.isMark(nodeParent, this.schema) &&
				nodeApi.isMark(node, this.schema)
			) {
				if (this.engine.mark.compare(nodeParent.clone(), node, true)) {
					nodeApi.unwrap(node);
					break;
				} else {
					nodeParent = nodeParent.parent();
				}
			}
		});
	}

	normalize() {
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
						(next && !nodeApi.isBlock(next))
					)
						node.remove();
				}
				const match = /((\n)+)/.exec(text);
				if (match && !text.endsWith('\n') && !text.startsWith('\n')) {
					const nextReg = node.get<Text>()!.splitText(match.index);
					const endReg = nextReg.splitText(match[0].length);
					node.after(nextReg);
					node.after(endReg);
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
			startNode.inEditor() &&
			first &&
			first.name === 'p' &&
			!(first.length === 1 && first.first()?.name === 'br')
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
