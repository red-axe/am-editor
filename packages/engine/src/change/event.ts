import DragoverHelper from './dragover';
import $ from '../node';
import { EventListener, NodeInterface } from '../types/node';
import isHotkey from 'is-hotkey';
import { ChangeEventInterface, ChangeEventOptions } from '../types/change';
import { CardInterface } from '../types/card';
import { EngineInterface } from '../types/engine';
import { RangeInterface } from '../types/range';
import Range from '../range';
import { CARD_ELEMENT_KEY } from '../constants/card';
import { ClipboardData } from '../types/clipboard';

class ChangeEvent implements ChangeEventInterface {
	private events: Array<{
		type: string;
		eventType: string;
		listener: EventListener;
		rewrite?: boolean;
	}>;
	private engine: EngineInterface;
	isComposing: boolean;
	isSelecting: boolean;
	private dragoverHelper: DragoverHelper;
	private options: ChangeEventOptions;
	private keydownRange: RangeInterface | null = null;

	constructor(engine: EngineInterface, options: ChangeEventOptions = {}) {
		this.events = [];
		this.engine = engine;
		// 中文输入状态
		this.isComposing = false;
		// 选择范围状态
		this.isSelecting = false;
		this.dragoverHelper = new DragoverHelper(engine);
		this.options = options;
	}

	// return true：焦点在Card里的其它输入框
	// return false：焦点在编辑区域，触发 change、select 事件
	isCardInput(e: Event) {
		let node = e.target ? $(e.target as Node) : null;
		while (node) {
			if (node.isRoot()) {
				return false;
			}
			if (node.attr(CARD_ELEMENT_KEY) === 'center') {
				return true;
			}
			if (node.hasClass('card-toolbar')) {
				return true;
			}
			const parent = node.parent();
			if (!parent) break;
			node = parent;
		}
		return false;
	}

	onInput(callback: EventListener) {
		const { bindInput } = this.options;
		if (bindInput && !bindInput()) return;
		// 处理中文输入法状态
		// https://developer.mozilla.org/en-US/docs/Web/Events/compositionstart
		this.onContainer('compositionstart', () => {
			if (this.engine.readonly) {
				return;
			}
			this.isComposing = true;
		});
		this.onContainer('compositionend', () => {
			if (this.engine.readonly) {
				return;
			}
			this.isComposing = false;
		});
		this.onContainer('input', (e: Event) => {
			if (this.engine.readonly) {
				return;
			}

			if (this.isCardInput(e)) {
				return;
			}

			window.setTimeout(() => {
				if (!this.isComposing) {
					callback(e);
				}
			}, 10);
		});
	}

	onSelect(callback: EventListener) {
		const { bindSelect } = this.options;
		if (bindSelect && !bindSelect()) return;
		// 模拟 selection change 事件
		this.onContainer('mousedown', e => {
			if (this.isCardInput(e)) {
				return;
			}
			this.isSelecting = true;
		});
		this.onDocument('mouseup', e => {
			if (!this.isSelecting) {
				return;
			}
			this.isSelecting = false;
			// mouseup 瞬间选择状态不会马上被取消，需要延迟
			window.setTimeout(() => {
				return callback(e);
			}, 10);
		});
		this.onContainer('keydown', () => {
			const range = Range.from();
			this.keydownRange = range;
		});
		// 补齐通过键盘选中的情况
		this.onContainer('keyup', e => {
			if (this.engine.readonly) {
				return;
			}

			if (this.isCardInput(e)) {
				return;
			}
			// command + 方向键不会触发 keyup 事件，所以先用 e.key === 'Meta' 代替 isHotkey('mod+方向键',e)
			if (
				isHotkey('left', e) ||
				isHotkey('right', e) ||
				isHotkey('up', e) ||
				isHotkey('down', e) ||
				e.key === 'Meta' ||
				isHotkey('shift+left', e) ||
				isHotkey('shift+right', e) ||
				isHotkey('shift+up', e) ||
				isHotkey('shift+down', e) ||
				isHotkey('ctrl+b', e) ||
				isHotkey('ctrl+f', e) ||
				isHotkey('ctrl+n', e) ||
				isHotkey('ctrl+p', e) ||
				isHotkey('ctrl+a', e) ||
				isHotkey('ctrl+e', e) ||
				isHotkey('home', e) ||
				isHotkey('end', e)
			) {
				const range = Range.from();
				if (
					this.keydownRange &&
					range &&
					range.equal(this.keydownRange)
				)
					return;
				if (!this.isComposing) {
					callback(e);
				}
			}
		});
	}

	onPaste(
		callback: (data: ClipboardData & { isPasteText: boolean }) => void,
	) {
		const { bindPaste } = this.options;
		if (bindPaste && !bindPaste()) return;
		let isPasteText = false;
		this.onContainer('keydown', e => {
			if (this.engine.readonly) {
				return;
			}

			if (
				!isHotkey('mod', e) ||
				!isHotkey('shift', e) ||
				!isHotkey('v', e)
			) {
				isPasteText = false;
			}

			if (isHotkey('mod+shift+v', e) || isHotkey('mod+alt+shift+v', e)) {
				isPasteText = true;
			}
		});
		// https://developer.mozilla.org/en-US/docs/Web/Events/paste
		this.onContainer('paste', e => {
			if (this.engine.readonly) {
				return;
			}

			if (this.isCardInput(e)) {
				return;
			}

			e.preventDefault();
			const data = this.engine.clipboard.getData(e);
			const dataIsPasteText = isPasteText;
			isPasteText = false;
			callback({
				...data,
				isPasteText: dataIsPasteText,
			});
		});
	}

	onDrop(
		callback: (params: {
			event: DragEvent;
			range?: RangeInterface;
			card?: CardInterface;
			files: Array<File>;
		}) => void,
	) {
		const { bindDrop } = this.options;
		if (bindDrop && !bindDrop()) return;

		let cardComponet: CardInterface | undefined;
		let dragImage: NodeInterface | undefined;
		let dropRange: RangeInterface | undefined;

		this.onContainer('dragstart', (e: DragEvent) => {
			this.dragoverHelper.setCursor();
			// 拖动Card
			cardComponet = this.engine.card.find($(e.target || []));

			if (cardComponet) {
				cardComponet.toolbar?.hideCardToolbar();
				// https://kryogenix.org/code/browser/custom-drag-image.html
				dragImage = cardComponet.find('img.data-drag-image');

				if (dragImage.length > 0) {
					dragImage = dragImage.clone();
				} else {
					dragImage = $('<div class="data-drag-image" />');
					const cardRootElement = cardComponet.root.get<Element>();
					if (cardRootElement) {
						dragImage.css({
							width: cardRootElement.clientWidth + 'px',
							height: cardRootElement.clientHeight + 'px',
						});
					}
				}

				dragImage.css({
					position: 'absolute',
					top: '-10000px',
					right: '-10000px',
				});
				$(document.body).append(dragImage);
				e.dataTransfer?.setDragImage(dragImage[0] as Element, 0, 0);
			}
		});
		this.onContainer('dragover', (e: DragEvent) => {
			const { dragoverHelper } = this;
			const cursor = dragoverHelper.getCursor();
			if (cursor.length !== 0) {
				dragoverHelper.parseEvent(e);
				dropRange = dragoverHelper.getRange();
				const rect = dragoverHelper.getRect();
				cursor.css({
					height: rect.height + 'px',
					top: Math.round(window.pageYOffset + (rect.y || 0)) + 'px',
					left: Math.round(window.pageXOffset + (rect.x || 0)) + 'px',
				});
			} else this.dragoverHelper.setCursor();
		});
		this.onContainer('dragleave', () => {
			this.dragoverHelper.removeCursor();
		});
		this.onContainer('dragend', () => {
			this.dragoverHelper.removeCursor();
			if (dragImage) {
				dragImage.remove();
				dragImage = undefined;
			}
		});
		this.onContainer('drop', (e: DragEvent) => {
			// 禁止拖图进浏览器，浏览器默认打开图片文件
			e.preventDefault();

			if (cardComponet) {
				cardComponet.toolbar?.showCardToolbar();
			}

			this.dragoverHelper.removeCursor();
			if (dragImage) {
				dragImage.remove();
				dragImage = undefined;
			}

			const transfer = e.dataTransfer;
			let files: Array<File> = [];
			// Edge 兼容性处理
			try {
				if (transfer && transfer.items && transfer.items.length > 0) {
					Array.from(transfer.items).forEach(item => {
						if (item.kind === 'file') {
							const file = item.getAsFile();
							if (file) files.push(file);
						}
					});
				} else if (
					transfer &&
					transfer.files &&
					transfer.files.length > 0
				) {
					files = Array.from(transfer.files);
				}
			} catch (err) {
				if (transfer && transfer.files && transfer.files.length > 0) {
					files = Array.from(transfer.files);
				}
			}

			const data = {
				event: e,
				range: dropRange,
				card: cardComponet,
				files,
			};
			callback(data);
			cardComponet = undefined;
		});
	}

	onDocument(eventType: string, listener: EventListener, rewrite?: boolean) {
		document.addEventListener(eventType, listener, rewrite);
		this.events.push({
			type: 'document',
			eventType,
			listener,
			rewrite,
		});
	}

	onWindow(eventType: string, listener: EventListener, rewrite?: boolean) {
		window.addEventListener(eventType, listener, rewrite);
		this.events.push({
			type: 'window',
			eventType,
			listener,
			rewrite,
		});
	}

	onContainer(eventType: string, listener: EventListener): void {
		const { bindContainer } = this.options;
		if (bindContainer) {
			bindContainer(eventType, listener);
			this.events.push({
				type: 'container',
				eventType,
				listener,
				rewrite: false,
			});
		}
	}

	destroy() {
		this.events.forEach(item => {
			if (item.type === 'window') {
				window.removeEventListener(
					item.eventType,
					item.listener,
					item.rewrite,
				);
			}

			if (item.type === 'document') {
				document.removeEventListener(
					item.eventType,
					item.listener,
					item.rewrite,
				);
			}

			if (item.type === 'container') {
				const { unbindContainer } = this.options;
				if (unbindContainer)
					unbindContainer(item.eventType, item.listener);
			}
		});
	}
}

export default ChangeEvent;
