import DragoverHelper from './dragover';
import { EventListener, NodeInterface } from '../types/node';
import isHotkey from 'is-hotkey';
import { ChangeEventInterface, ChangeEventOptions } from '../types/change';
import { CardInterface } from '../types/card';
import { EngineInterface } from '../types/engine';
import { RangeInterface } from '../types/range';
import Range from '../range';
import { CARD_ELEMENT_KEY } from '../constants/card';
import { ClipboardData } from '../types/clipboard';
import { DATA_ELEMENT, UI } from '../constants';
import { $ } from '../node';
import { isMobile, isSafari } from '../utils';

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
			if (node.isEditable()) {
				return false;
			}
			if (node.attributes(CARD_ELEMENT_KEY) === 'center') {
				return true;
			}
			if (node.attributes(DATA_ELEMENT) === UI) {
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
		// https://developer.mozilla.org/en-US-US/docs/Web/Events/compositionstart
		this.onContainer('compositionstart', (event) => {
			if (this.engine.readonly) {
				return;
			}
			if (!this.isCardInput(event)) {
				this.engine.ot.startMutationCache();
			}
			// 组合输入法缓存协同
			const { change, node, block, list } = this.engine;
			const range = change
				.getRange()
				.cloneRange()
				.shrinkToTextNode()
				.enlargeToElementNode();
			// 如果光标在自定义列表项节点前输入先自定义删除，不然排版不对
			if (!range.collapsed) {
				const startBlock = block.closest(range.startNode);
				const endBlock = block.closest(range.endNode);
				if (
					(node.isCustomize(startBlock) ||
						node.isCustomize(endBlock)) &&
					!startBlock.equal(endBlock)
				) {
					list.backspaceEvent?.trigger(new KeyboardEvent(''));
				}
			}
			this.isComposing = true;
		});
		this.onContainer('compositionend', () => {
			if (this.engine.readonly) {
				return;
			}
			this.isComposing = false;
		});
		//对系统工具栏操作拦截，一般针对移动端的文本上下文工具栏
		//https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
		this.onContainer('beforeinput', (event: InputEvent) => {
			if (this.engine.readonly) return;
			const { change, card, node, block, list } = this.engine;
			if (!change.rangePathBeforeCommand)
				change.cacheRangeBeforeCommand();
			// 单独选中卡片或者selection处于卡片边缘，手动删除卡片
			const range = change
				.getRange()
				.cloneRange()
				.shrinkToTextNode()
				.enlargeToElementNode();
			// 修复 safari 浏览器在列表首次输入组合输入法时会删除li节点
			const { startNode } = range;
			if (
				isSafari &&
				startNode.name === 'li' &&
				!node.isCustomize(startNode)
			) {
				if (startNode.first()?.name !== 'br')
					startNode.prepend('<br />');
			}

			if (!range.collapsed) {
				if (
					range.commonAncestorNode.attributes(CARD_ELEMENT_KEY) ===
					'body'
				)
					card.remove(range.commonAncestorNode);
				else {
					if (range.startNode.attributes(CARD_ELEMENT_KEY) === 'body')
						card.remove(range.startNode);
					if (range.endNode.attributes(CARD_ELEMENT_KEY) === 'body')
						card.remove(range.endNode);
				}
			}
			// 如果光标在自定义列表项节点前输入先自定义删除，不然排版不对
			if (!range.collapsed && !this.isComposing) {
				const startBlock = block.closest(range.startNode);
				const endBlock = block.closest(range.endNode);
				if (
					(node.isCustomize(startBlock) ||
						node.isCustomize(endBlock)) &&
					!startBlock.equal(endBlock)
				) {
					list.backspaceEvent?.trigger(new KeyboardEvent(''));
					node.insertText(event.data || '');
				}
			}
			const { inputType } = event;
			// 在组合输入法未正常执行结束命令插入就先提交协同
			if (this.isComposing && !inputType.includes('Composition')) {
				this.engine.ot.submitMutationCache();
			}
			const commandTypes = ['format', 'history'];
			commandTypes.forEach((type) => {
				if (inputType.indexOf(type) === 0) {
					event.preventDefault();
					const commandName = inputType
						.substring(type.length)
						.toLowerCase();
					this.engine.command.execute(commandName);
				}
			});
		});
		let inputTimeout: NodeJS.Timeout | null = null;
		this.onContainer('input', (e: Event) => {
			if (this.engine.readonly) {
				return;
			}

			if (this.isCardInput(e)) {
				return;
			}

			if (inputTimeout) clearTimeout(inputTimeout);
			inputTimeout = setTimeout(() => {
				if (!this.isComposing) {
					callback(e);
					// 组合输入法结束后提交协同
					this.engine.ot.submitMutationCache();
				}
			}, 10);
		});
	}

	onSelect(callback: EventListener) {
		const { bindSelect } = this.options;
		if (bindSelect && !bindSelect()) return;
		// 模拟 selection change 事件
		this.onContainer(
			isMobile ? 'touchstart' : 'mousedown',
			(event: MouseEvent | TouchEvent) => {
				if (this.isCardInput(event)) {
					return;
				}
				this.isSelecting = true;
			},
		);
		this.onDocument(isMobile ? 'touchend' : 'mouseup', (e) => {
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
			const range = Range.from(this.engine);
			this.keydownRange = range;
		});
		// 补齐通过键盘选中的情况
		this.onContainer('keyup', (e) => {
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
				const range = Range.from(this.engine);
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
		this.onContainer('keydown', (e) => {
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
		// https://developer.mozilla.org/en-US-US/docs/Web/Events/paste
		this.onContainer('paste', (e) => {
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

		const dragStart = (e: DragEvent) => {
			if (!e.target || this.engine.readonly) return;
			e.stopPropagation();
			this.dragoverHelper.setCursor();
			const targetNode = $(e.target);
			// 拖动Card
			const dragCardTrigger = targetNode.attributes('drag-card-trigger');
			cardComponet = this.engine.card.find(
				!!dragCardTrigger ? dragCardTrigger : targetNode,
			);

			if (cardComponet) {
				cardComponet.toolbarModel?.hideCardToolbar();
				// https://kryogenix.org/code/browser/custom-drag-image.html
				dragImage = cardComponet.find('img.data-drag-image');

				if (dragImage.length > 0) {
					dragImage = this.engine.node.clone(dragImage);
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
		};
		this.onRoot('dragstart', dragStart);
		this.onContainer('dragstart', dragStart);
		this.onContainer('dragover', (e: DragEvent) => {
			if (this.engine.readonly) return;
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
			if (this.engine.readonly) return;
			// 禁止拖图进浏览器，浏览器默认打开图片文件
			e.preventDefault();

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
					Array.from(transfer.items).forEach((item) => {
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
		this.engine.container.on(eventType, listener);
		this.events.push({
			type: 'container',
			eventType,
			listener,
			rewrite: false,
		});
	}

	onRoot(eventType: string, listener: EventListener): void {
		this.engine.root.on(eventType, listener);
		this.events.push({
			type: 'root',
			eventType,
			listener,
			rewrite: false,
		});
	}

	destroy() {
		this.events.forEach((item) => {
			if (item.type === 'window') {
				window.removeEventListener(
					item.eventType,
					item.listener,
					item.rewrite,
				);
			} else if (item.type === 'document') {
				document.removeEventListener(
					item.eventType,
					item.listener,
					item.rewrite,
				);
			} else if (item.type === 'container') {
				this.engine.container.off(item.eventType, item.listener);
			} else if (item.type === 'root') {
				this.engine.root.off(item.eventType, item.listener);
			}
		});
	}
}

export default ChangeEvent;
