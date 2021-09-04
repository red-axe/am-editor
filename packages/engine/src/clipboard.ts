import copyTo from 'copy-to-clipboard';
import Parser from './parser';
import { ClipboardInterface } from './types/clipboard';
import { EditorInterface, EngineInterface } from './types/engine';
import { RangeInterface } from './types/range';
import { getDocument, getWindow, isSafari } from './utils';
import { $ } from './node';
import Range from './range';
import { NodeInterface } from './types';

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
		// Edge 兼容性处理
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
		range = range.cloneRange().shrinkToElementNode();
		let card = range.startNode.closest('[data-card-key]', (node) => {
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
					'[data-card-element="center"]',
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
		card = root.closest('[data-card-key]', (node) => {
			return $(node).isEditable()
				? undefined
				: node.parentNode || undefined;
		});
		if (card.length > 0) {
			const cardCenter = root.closest(
				'[data-card-element="center"]',
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
		card = root.closest('[data-card-key]', (node) => {
			if ($(node).isEditable()) return;
			if (node.nodeType === getWindow().Node.ELEMENT_NODE) {
				const display = window
					.getComputedStyle(node as Element)
					.getPropertyValue('display');
				if (display === 'inline') {
					nodes.push(node.cloneNode());
				}
			}
			return node.parentNode || undefined;
		});
		const { node, block } = this.editor;
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
				if (range.startNode.isText()) {
					const li = range.startNode.closest('li');

					if (li && node.isCustomize(li)) {
						const endLi = range.endNode.closest('li');
						console.log(
							!li.equal(endLi),
							block.isLastOffset(range, 'end'),
						);
						if (
							!li.equal(endLi) ||
							block.isLastOffset(range, 'end')
						) {
							const ul = li.parent();
							if (ul) range.setStart(ul, li.getIndex());
						}
					}
				}
				const contents = range.cloneContents();
				const listMergeBlocks: NodeInterface[] = [];
				contents.childNodes.forEach((child) => {
					let childElement = $(child);
					if (childElement.name !== 'li') return;

					const dataId = childElement.attributes('data-id');
					if (!dataId) return;
					let parent: NodeInterface | Node | null | undefined =
						document.querySelector(
							`[data-id=${dataId}]`,
						)?.parentElement;
					parent = parent ? $(parent.cloneNode(false)) : null;
					if (parent && node.isList(parent)) {
						parent.removeAttributes('start');
						node.wrap(child, parent);
						listMergeBlocks.push(parent);
					}
				});
				const { inner, outter } = this.setNodes(nodes);
				const parser = new Parser(contents, this.editor);
				let { html, text } = parser.toHTML(inner, outter);
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
		block.on('copy', (e) => {
			this.write(e);
		});
		$(document.body).append(block);
		block.append(editor.node.clone($(data), true));
		if (trigger) {
			block.allChildren().forEach((child) => {
				editor.trigger('copy', $(child));
			});
		}
		block.append($('&#8203;', null));
		range.select(block, true);
		selection?.removeAllRanges();
		selection?.addRange(range.toRange());
		let success = false;

		try {
			success = document.execCommand('copy');
			if (!success) {
				throw 'copy command was unsuccessful';
			}
		} catch (err) {
			console.log('unable to copy using execCommand: ', err);
		} finally {
			block.remove();
			selection?.removeAllRanges();
			selection?.addRange(cloneRange.toRange());
		}
		return success;
	}

	cut() {
		const range = Range.from(this.editor);
		if (!range) return;
		const root = range.commonAncestorNode;
		(this.editor as EngineInterface).change.deleteContent(range);
		const listElements =
			-1 !== ['ul', 'ol'].indexOf(root.name) ? root : root.find('ul,ol');
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
