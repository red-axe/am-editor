import copyTo from 'copy-to-clipboard';
import Parser from './parser';
import { EditorInterface, EngineInterface, ClipboardInterface } from './types';
import { RangeInterface } from './types/range';
import { isEngine, isSafari } from './utils';
import { $ } from './node';
import Range from './range';
import { NodeInterface } from './types';
import { CARD_ELEMENT_KEY, CARD_KEY, DATA_ID } from './constants';

export const isDragEvent = (
	event: DragEvent | ClipboardEvent,
): event is DragEvent => {
	return !!(<DragEvent>event).dataTransfer;
};

export default class Clipboard implements ClipboardInterface {
	private editor: EditorInterface;
	constructor(editor: EditorInterface) {
		this.editor = editor;
	}

	getData(event: DragEvent | ClipboardEvent) {
		const transfer = isDragEvent(event)
			? event.dataTransfer
			: event.clipboardData;
		let html = transfer?.getData('text/html');
		let text = transfer?.getData('text');
		let files: Array<File> = [];
		// Edge 处理
		try {
			if (transfer?.items && transfer.items.length > 0) {
				Array.from(transfer.items).forEach((item) => {
					let file = item.kind === 'file' ? item.getAsFile() : null;
					if (file !== null) {
						if (
							file.type &&
							file.type.indexOf('image/png') > -1 &&
							!file.lastModified
						) {
							file = new File([file], 'image.png', {
								type: file.type,
							});
						}
						file['ext'] = text?.split('.').pop();
					}
					if (file) files.push(file);
				});
			} else if (transfer?.files && transfer.files.length > 0) {
				files = Array.from(transfer.files);
			}
		} catch (err) {
			if (transfer?.files && transfer.files.length > 0) {
				files = Array.from(transfer.files);
			}
		}

		// 从 Mac OS Finder 复制文件
		if (html === '' && text && /^.+\.\w+$/.test(text) && files.length > 0) {
			text = ''; // 在图片上，点击右键复制
		} else if (
			text === '' &&
			html &&
			/^(<meta.+?>)?<img.+?>$/.test(html) &&
			files.length > 0
		) {
			html = ''; // 从 Excel、Numbers 复制
		} else if (
			(html || text) &&
			files.length > 0 &&
			!html?.startsWith('<img') &&
			(html || !/^https(s)?:/.test(text || ''))
		) {
			files = [];
		}
		return {
			html,
			text,
			files,
		};
	}

	write(
		event: ClipboardEvent,
		range: RangeInterface | null = null,
		callback?: (data: { html: string; text: string }) => void,
	) {
		if (!range) range = Range.from(this.editor);
		if (!range) throw 'Range is null';
		range = range.cloneRange(); //.shrinkToElementNode();
		let card = range.startNode.closest(`[${CARD_KEY}]`, (node) => {
			return $(node).isEditable()
				? undefined
				: node.parentNode || undefined;
		});
		if (card.length > 0 && !range.collapsed && range.endOffset === 0) {
			if (range.endContainer.previousSibling) {
				range.setEndAfter(range.endContainer.previousSibling);
			}
			if (
				!range.collapsed &&
				range.endOffset > 0 &&
				range.endContainer.childNodes[range.endOffset - 1] === card[0]
			) {
				const cardCenter = range.startNode.closest(
					`[${CARD_ELEMENT_KEY}="center"]`,
					(node) => {
						return $(node).isEditable()
							? undefined
							: node.parentNode || undefined;
					},
				);
				if (cardCenter.length > 0) {
					range.setEnd(
						cardCenter[0],
						cardCenter[0].childNodes.length,
					);
				} else {
					range.setEnd(card[0], card[0].childNodes.length);
				}
			}
		}
		let root = range.commonAncestorNode;
		card = root.closest(`[${CARD_KEY}]`, (node) => {
			return $(node).isEditable()
				? undefined
				: node.parentNode || undefined;
		});
		if (card.length > 0) {
			const cardCenter = root.closest(
				`[${CARD_ELEMENT_KEY}="center"]`,
				(node) => {
					return $(node).isEditable()
						? undefined
						: node.parentNode || undefined;
				},
			);
			if (cardCenter.length === 0) {
				range.select(card);
				root = range.commonAncestorNode;
			}
		}
		const nodes: Array<Node> =
			root.name === '#text' ? [document.createElement('span')] : [];
		card = root.closest(`[${CARD_KEY}]`, (node) => {
			if ($(node).isEditable()) return;
			if (node.nodeType === Node.ELEMENT_NODE) {
				const display = window
					.getComputedStyle(node as Element)
					.getPropertyValue('display');
				if (display === 'inline') {
					nodes.push(node.cloneNode());
				}
			}
			return node.parentNode || undefined;
		});
		const { node, list } = this.editor;
		const hasChildEngine =
			root.find('.am-engine-view').length > 0 ||
			root.find('.am-engine').length > 0;
		const hasParentEngine =
			root.closest('.am-engine-view').length > 0 ||
			root.closest('.am-engine').length > 0;
		if (card.length <= 0 && (hasChildEngine || hasParentEngine)) {
			event.preventDefault();
			if (range.collapsed) {
				event.clipboardData?.setData('text/html', '');
				event.clipboardData?.setData('text', '');
			} else {
				// 修复自定义列表选择范围
				let customizeStartItem: NodeInterface | undefined;
				const li = range.startNode.closest('li');

				if (li && node.isCustomize(li)) {
					const endLi = range.endNode.closest('li');
					if (
						!li.equal(endLi) ||
						(list.isLast(range) && list.isFirst(range))
					) {
						if (list.isFirst(range)) {
							const ul = li.parent();
							const index = li.getIndex();
							if (ul) range.setStart(ul, index < 0 ? 0 : index);
						} else {
							const ul = li.parent();
							// 选在列表项靠后的节点，把剩余节点拼接成完成的列表项
							const selection = range.createSelection();
							const rightNode = selection.getNode(
								li,
								'center',
								true,
							);
							selection.anchor?.remove();
							selection.focus?.remove();
							if (isEngine(this.editor))
								this.editor.change.combinText();
							if (rightNode.length > 0) {
								let isRemove = false;
								rightNode.each((_, index) => {
									const item = rightNode.eq(index);
									if (!isRemove && item?.name === 'li') {
										isRemove = true;
										return;
									}
									if (isRemove) item?.remove();
								});
								const card = li.first();
								const component = card
									? this.editor.card.find(card)
									: undefined;
								if (component) {
									customizeStartItem = rightNode;
									this.editor.list.addCardToCustomize(
										customizeStartItem,
										component.name,
										component.getValue(),
									);
									if (ul)
										node.wrap(
											customizeStartItem,
											ul?.clone(),
										);
								}
							}
						}
					}
				}
				const contents = range
					.enlargeToElementNode(true)
					.cloneContents();
				// if (customizeStartItem) {
				// 	contents.removeChild(contents.childNodes[0]);
				// 	contents.prepend(customizeStartItem[0]);
				// }
				const listMergeBlocks: NodeInterface[] = [];
				contents.querySelectorAll('li').forEach((child) => {
					const childElement = $(child);
					const dataId = childElement.attributes(DATA_ID);
					if (!dataId) return;
					const curentElement = this.editor.container
						.get<HTMLElement>()
						?.querySelector(`[${DATA_ID}=${dataId}]`);
					// 补充自定义列表丢失的卡片
					if (
						node.isCustomize(childElement) &&
						!childElement.first()?.isCard() &&
						curentElement?.firstChild
					) {
						childElement.prepend(
							node.clone(
								$(curentElement.firstChild),
								true,
								false,
							),
						);
					}
					let parent: NodeInterface | Node | null | undefined =
						curentElement?.parentElement;
					parent = parent ? $(parent.cloneNode(false)) : null;
					const childParent = child.parentElement;
					if (
						curentElement &&
						parent &&
						node.isList(parent) &&
						(!childParent || !node.isList(childParent))
					) {
						if (parent.name === 'ol') {
							// 设置复制位置的 start 属性，默认不设置
							// let start = parseInt(parent.attributes('start') || '0', 10)
							// start = $(curentElement).index() + start
							// if(start === 0) start = 1
							// parent.attributes('start', start);
							parent.removeAttributes('start');
						}
						node.wrap(child, parent);
						listMergeBlocks.push(parent);
					}
				});
				const { inner, outter } = this.setNodes(nodes);
				const listNodes: NodeInterface[] = [];
				contents.childNodes.forEach((child) => {
					const childNode = $(child);
					if (node.isList(childNode) || childNode.name === 'li') {
						listNodes.push(childNode);
					}
				});
				this.editor.nodeId.generateAll($(contents), true);
				// 合并列表
				this.editor.list.merge(listNodes);
				const parser = new Parser(contents, this.editor);
				let html = parser.toHTML(inner, outter);
				const text = new Parser(html, this.editor).toText(
					this.editor.schema,
					true,
				);
				if (callback) {
					callback({ html, text });
				}
				if (html)
					html = '<meta name="source" content="aomao" />' + html;
				event.clipboardData?.setData('text/html', html);
				event.clipboardData?.setData('text', text);
			}
		}
	}

	copy(data: Node | string, trigger: boolean = false) {
		if (typeof data === 'string') {
			return copyTo(data);
		}
		const editor = this.editor;
		const selection = window.getSelection();
		const range = selection
			? Range.from(editor, selection) || Range.create(editor)
			: Range.create(editor);
		const cloneRange = range.cloneRange();
		const block = $('<div class="am-engine-view">&#8203;</div>');
		block.css({
			position: 'fixed',
			top: 0,
			clip: 'rect(0, 0, 0, 0)',
		});
		const clera = () => {
			block.remove();
			selection?.removeAllRanges();
			selection?.addRange(cloneRange.toRange());
		};
		block.on('copy', (e: ClipboardEvent) => {
			e.stopPropagation();
			this.write(e, range);
			clera();
		});
		$(document.body).append(block);
		block.append(editor.node.clone($(data), true));
		if (trigger) {
			block.traverse((child) => {
				if (child.equal(block)) return;
				editor.trigger('copy', child);
			});
		}
		block.append($('&#8203;', null));
		const first = block.first()!;
		const end = block.last()!;
		range.select(block, true);
		range.setStartAfter(first);
		range.setEndBefore(end);
		selection?.removeAllRanges();
		selection?.addRange(range.toRange());
		let success = false;

		try {
			success = document.execCommand('copy');
			if (!success) {
				throw 'Copy failed';
			}
		} catch (err) {
			console.log('The copy command was not executed successfully ', err);
			clera();
		}
		return success;
	}

	cut() {
		const range = Range.from(this.editor);
		if (!range) return;
		const root = range.commonAncestorNode;
		(this.editor as EngineInterface).change.delete(range);
		const listElements = this.editor.node.isList(root)
			? root
			: root.find('ul,ol');
		for (let i = 0; i < listElements.length; i++) {
			const list = $(listElements[i]);
			const childs = list.find('li');
			childs.each((child) => {
				if (
					'' === (child as HTMLElement).innerText ||
					(isSafari && '\n' === (child as HTMLElement).innerText)
				) {
					child.parentNode?.removeChild(child);
				}
			});
			if (list.children().length === 0) {
				list.remove();
			}
		}
	}

	private setNodes(nodes: Array<Node>) {
		if (0 === nodes.length) return {};
		for (let i = nodes.length - 1; i > 0; i--) {
			const node = nodes[i];
			node.appendChild(nodes[i - 1]);
		}
		return {
			inner: nodes[0],
			outter: nodes[nodes.length - 1],
		};
	}
}
