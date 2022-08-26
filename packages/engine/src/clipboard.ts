import copyTo from 'copy-to-clipboard';
import { EditorInterface, EngineInterface, ClipboardInterface } from './types';
import { RangeInterface } from './types/range';
import { isEngine, isSafari } from './utils';
import { $ } from './node';
import Range from './range';
import { DATA_ELEMENT, ROOT, VIEW_CLASS_NAME } from './constants';
import Parser from './parser';

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

	write(event: ClipboardEvent, range?: RangeInterface) {
		const data = this.editor.getSelectionData(range);
		if (!data) return;
		const { html, text } = data;
		event?.preventDefault();
		event?.clipboardData?.setData(
			'text/html',
			'<meta name="source" content="aomao" />' + html,
		);
		event?.clipboardData?.setData('text', text);
		return data;
	}

	copy(data: Node | string, trigger: boolean = false) {
		if (typeof data === 'string') {
			const isHtml = /<[^>]+>/g.test(data);
			if (isHtml) {
				copyTo(data, {
					format: 'text/html',
					onCopy: (clipboardData: any) => {
						clipboardData.setData(
							'text/plain',
							new Parser(data, this.editor).toText(),
						);
					},
				});
			} else {
				copyTo(data, {
					format: 'text/plain',
				});
			}
			return true;
		}
		const editor = this.editor;
		const selection = window.getSelection();
		const range = selection
			? Range.from(editor, selection) || Range.create(editor)
			: Range.create(editor);
		const cloneRange = range.cloneRange();
		const block = $(
			`<div class="${VIEW_CLASS_NAME}" ${DATA_ELEMENT}="${ROOT}">&#8203;</div>`,
		);
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
			editor.messageError(
				'copy',
				'The copy command was not executed successfully ',
				err,
			);
			clera();
		}
		return success;
	}

	cut() {
		const editor = this.editor;
		const range = Range.from(editor);
		if (!range || !isEngine(editor)) return;
		const root = range.commonAncestorNode;
		const change = editor.change;
		change.cacheRangeBeforeCommand();
		change.delete(range);
		const listElements = editor.node.isList(root)
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
			if (list.get<Node>()?.childNodes.length === 0) {
				list.remove();
			}
		}
		change.range.select(range);
	}
}
