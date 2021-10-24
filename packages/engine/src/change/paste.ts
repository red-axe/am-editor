import tinycolor2 from 'tinycolor2';
import { NodeInterface, SchemaInterface } from '../types';
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
		const defaultStyle = [
			{
				color: tinycolor2(this.engine.container.css('color')).toHex(),
			},
			{
				'background-color': tinycolor2('white').toHex(),
			},
			{
				'font-size': this.engine.container.css('font-size'),
			},
		];
		return defaultStyle;
	}

	commonNormalize(fragment: DocumentFragment) {
		const defaultStyle = this.getDefaultStyle();
		const { inline } = this.engine;
		const nodeApi = this.engine.node;
		// 第一轮预处理，主要处理 span 节点
		$(fragment).traverse((node) => {
			// 跳过Card
			if (node.isCard() || fragment === node.fragment) {
				return;
			}
			// 删除与默认样式一样的样式
			if (node.isElement()) {
				defaultStyle.forEach((style) => {
					const key = Object.keys(style)[0];
					const defaultValue = style[key];
					let value = node.get<HTMLElement>()?.style[key];
					if (value) {
						if (/color$/.test(key)) {
							value = tinycolor2(value).toHex();
						}
						if (value === defaultValue) {
							node.css(key, '');
						}
					}
				});
				//处理后如果不是一个有效的节点就移除包裹
				if (!this.schema.getType(node)) nodeApi.unwrap(node);

				nodeApi.removeMinusStyle(node, 'text-indent');
				if (nodeApi.isList(node)) {
					node.css('padding-left', '');
				}
				// 删除空 style 属性
				if (!node.attributes('style')) {
					node.removeAttributes('style');
				}
				// 删除空 span
				let first: NodeInterface | null = null;
				if (
					node.name === 'span' &&
					Object.keys(node.attributes()).length === 0 &&
					Object.keys(node.css()).length === 0 &&
					(node.text().trim() === '' ||
						(first =
							node.first() &&
							first &&
							(nodeApi.isMark(first, this.schema) ||
								nodeApi.isBlock(first, this.schema))))
				) {
					nodeApi.unwrap(node);
					return;
				}

				// br 换行改成正常段落
				if (nodeApi.isBlock(node, this.schema)) {
					this.engine.block.brToBlock(node);
				}
			}
		});
		// 第二轮处理
		$(fragment).traverse((node) => {
			let parent = node.parent();
			// 跳过已被删除的节点
			if (!parent || node.fragment === fragment) {
				return;
			}
			// 删除 google docs 根节点
			// <b style="font-weight:normal;" id="docs-internal-guid-e0280780-7fff-85c2-f58a-6e615d93f1f2">
			if (/^docs-internal-guid-/.test(node.attributes('id'))) {
				nodeApi.unwrap(node);
				return;
			}
			// 跳过Card
			if (node.attributes(READY_CARD_KEY)) {
				return;
			}
			// 删除零高度的空行
			if (
				nodeApi.isBlock(node, this.schema) &&
				node.attributes('data-type') !== 'p' &&
				!nodeApi.isVoid(node, this.schema) &&
				!nodeApi.isBlock(parent, this.schema) &&
				//!node.isSolid() &&
				nodeApi.html(node) === ''
			) {
				node.remove();
				return;
			}
			// 段落
			if (node.attributes('data-type') === 'p') {
				node.removeAttributes('data-type');
			}
			if (nodeApi.isBlock(node, this.schema) && parent?.name === 'p') {
				nodeApi.unwrap(node);
				parent = node.parent();
			}
			// 补齐 ul 或 ol
			if (node.name === 'li' && parent && !nodeApi.isList(parent)) {
				const ul = $('<ul />');
				node.before(ul);
				ul.append(node);
				return;
			}
			// 补齐 li
			if (node.name !== 'li' && parent && nodeApi.isList(parent)) {
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
			if (node.name === 'p' && parent && nodeApi.isList(parent)) {
				nodeApi.replace(node, $('<li />'));
				return;
			}
			// 处理空 Block
			if (
				nodeApi.isBlock(node, this.schema) &&
				!nodeApi.isVoid(node, this.schema) &&
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
			if (nodeApi.isBlock(node, this.schema) && parent?.name === 'li') {
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
				nodeApi.isInline(node) &&
				!node.isCard() &&
				!nodeApi.isVoid(node, this.schema)
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
			while (
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
		this.commonNormalize(fragment);
		const range = this.engine.change.getRange();
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
			if (node.length > 0 && node.parent())
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
			}
		});
		$(fragment).traverse((node) => {
			if (node.fragment === fragment) return;
			this.engine.trigger('paste:each-after', node);
			if (node.isText()) {
				const text = node.text();
				const match = /((\n)+)/.exec(text);
				if (match && !text.endsWith('\n') && !text.startsWith('\n')) {
					const nextReg = node.get<Text>()!.splitText(match.index);
					const endReg = nextReg.splitText(match[0].length);
					node.after(nextReg);
					node.after(endReg);
				}
			}
			// 删除包含Card的 pre 标签
			if (
				node.name === 'pre' &&
				node.find(READY_CARD_SELECTOR).length > 0
			) {
				nodeApi.unwrap(node);
			}
		});

		const node = nodeApi.normalize($(fragment));
		if (node.fragment) fragment = node.fragment;
		fragment.normalize();
		let fragmentNode = $(fragment);
		const first = fragmentNode.first();
		//如果光标在文本节点，并且父级节点不是根节点，移除粘贴数据的第一个节点块级节点，让其内容接在光标所在行
		const { startNode } = range.cloneRange().shrinkToTextNode();
		const startParent = startNode.parent();
		if (
			startNode.inEditor() &&
			((startNode.isText() && !startNode.parent()?.isEditable()) ||
				(startNode.name === 'li' &&
					startParent &&
					this.engine.node.isList(startParent))) &&
			first &&
			first.name === 'p' &&
			!(first.length === 1 && first.first()?.name === 'br')
		) {
			nodeApi.unwrap(first);
		}
		fragmentNode = $(fragment);
		fragmentNode.each((_, index) => {
			const children = fragmentNode.eq(index);
			children?.find('ul,ol').each((_, index) => {
				const child = children.eq(index);
				if (child && nodeApi.isList(child)) {
					this.engine.list.addStart(child);
				}
			});
		});
		this.engine.block.generateRandomIDForDescendant(fragment, true);
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
