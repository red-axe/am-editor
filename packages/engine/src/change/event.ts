import DragoverHelper from './dragover';
import { EventListener, NodeInterface } from '../types/node';
import isHotkey from 'is-hotkey';
import { ChangeEventInterface, ChangeEventOptions } from '../types/change';
import { CardInterface } from '../types/card';
import { EngineInterface } from '../types/engine';
import { RangeInterface } from '../types/range';
import Range from '../range';
import { CARD_CENTER_SELECTOR, CARD_ELEMENT_KEY } from '../constants/card';
import { ClipboardData } from '../types/clipboard';
import { DATA_ELEMENT, UI } from '../constants';
import { $ } from '../node';
import { isAndroid, isMobile, isSafari } from '../utils';
import { isBlockCard, isCard, isEditable, isRoot } from '../node/utils';

type GlobalEventType = 'root' | 'window' | 'container' | 'document';
class ChangeEvent implements ChangeEventInterface {
	private events: {
		[key: string]: { type: string; listener: EventListener }[];
	} = {};
	private globalEvents: {
		[key: string]: { type: string; listener: EventListener }[];
	} = {};
	private engine: EngineInterface;
	isComposing: boolean;
	isSelecting: boolean;
	private dragoverHelper: DragoverHelper;
	private options: ChangeEventOptions;
	private keydownRange: RangeInterface | null = null;

	constructor(engine: EngineInterface, options: ChangeEventOptions = {}) {
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
		let androidCustomeListComposingNode: NodeInterface | null = null;
		// 处理中文输入法状态
		// https://developer.mozilla.org/en-US-US/docs/Web/Events/compositionstart
		this.onContainer('compositionstart', (event) => {
			if (this.engine.readonly) {
				return;
			}
			if (!this.isCardInput(event)) {
				this.engine.model.mutation.startCache();
			}
			// 组合输入法缓存协同
			const { change, node, block, list } = this.engine;
			const range = change.range
				.get()
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

		const submitInput = (e: Event) => {
			if (!this.isComposing) {
				// 清理输入前插入到自定义列表的卡片后的零宽字符
				if (isAndroid && androidCustomeListComposingNode) {
					const first = androidCustomeListComposingNode.first();
					const next = first?.next();
					if (next?.isText()) {
						const text = next.text();
						if (/^\u200b/.test(text)) {
							const textNode = next.get<Text>();
							textNode?.splitText(1);
							textNode?.remove();
						}
					}
					const range = this.engine.change.range.get();
					const { startNode, startOffset } = range;
					if (range.collapsed && startNode?.isText()) {
						const text = startNode.text();
						const sufix = text.substring(startOffset);
						if (/^\u200b/.test(sufix)) {
							startNode.text(
								text.substring(0, startOffset) +
									sufix.substring(1),
							);
							range.setOffset(
								startNode,
								startOffset,
								startOffset,
							);
							this.engine.change.range.select(range);
						}
					}
					androidCustomeListComposingNode = null;
				}
				callback(e);
				// 组合输入法结束后提交协同
				this.engine.model.mutation.submitCache();
			}
		};

		this.onContainer('compositionend', (e) => {
			if (this.engine.readonly) {
				return;
			}
			this.isComposing = false;
			// 日文输入法，input 后未即时触发 compositionend 方法，这里检测如果还在突变缓存中就提交
			setTimeout(() => {
				if (this.engine.model.mutation.isCache) {
					submitInput(e);
				}
			}, 40);
		});
		//对系统工具栏操作拦截，一般针对移动端的文本上下文工具栏
		//https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
		this.onContainer('beforeinput', (event: InputEvent) => {
			if (this.engine.readonly) return;
			// safari 组合输入法会直接插入@字符，这里统一全部拦截输入@字符的时候再去触发@事件
			const { change, card, node, block, list } = this.engine;
			if (event.data === '@' && !this.isCardInput(event)) {
				// 如果没有要对 @ 字符处理的就不拦截
				const result = this.engine.trigger('keydown:at', event);
				if (result === false) {
					this.engine.model.mutation.submitCache();
					event.preventDefault();
				}
			}
			if (!change.rangePathBeforeCommand)
				change.cacheRangeBeforeCommand();
			const sourceRange = change.range.get();
			// 单独选中卡片或者selection处于卡片边缘，手动删除卡片
			const range = sourceRange
				.cloneRange()
				.shrinkToTextNode()
				.enlargeToElementNode();
			// 修复 safari 浏览器在列表首次输入组合输入法时会删除li节点
			const { startNode } = range;
			if (
				isSafari &&
				event.inputType === 'deleteCompositionText' &&
				startNode.name === 'li' &&
				startNode.length > 0 &&
				!node.isCustomize(startNode)
			) {
				const childNodes = startNode[0].childNodes;
				if (
					childNodes.length === 1 &&
					childNodes[0].nodeName !== 'BR'
				) {
					startNode.prepend('<br />');
					setTimeout(() => {
						const childNodes = startNode[0].childNodes;
						if (
							childNodes.length === 2 &&
							childNodes[0].nodeName === 'BR' &&
							childNodes[1].nodeName === 'BR'
						) {
							childNodes[0].remove();
						}
					}, 0);
				}
			}
			// 安卓在自定义列表前组合输入的时候会出现字符错乱
			// 解决：在列表下的自定义卡片后面插入一个零宽字符，等组合输入法完成后再删除
			if (
				isAndroid &&
				startNode.name === 'li' &&
				range.startOffset === 1 &&
				node.isCustomize(startNode) &&
				this.isComposing
			) {
				const first = startNode.first();
				const next = first?.next();
				const addTemp = () => {
					const zeroText = $('\u200B', null);
					first?.after(zeroText);
					range.setOffset(zeroText, 1, 1);
					change.range.select(range);
					androidCustomeListComposingNode = startNode;
				};
				if (next?.isText()) {
					const text = next.text();
					if (!/^\u200b/.test(text)) {
						addTemp();
					}
				} else {
					if (next?.name === 'br') {
						next.remove();
					}
					addTemp();
				}
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
			if (range.startNode.isRoot()) {
				const startNode = range.getStartOffsetNode();
				if (
					startNode instanceof Element &&
					isCard(startNode) &&
					!startNode.querySelector(CARD_CENTER_SELECTOR)
				) {
					card.remove(startNode);
				}
				if (!range.collapsed && range.endNode.isRoot()) {
					const endNode = range.getEndOffsetNode();
					if (
						endNode instanceof Element &&
						isCard(endNode) &&
						!endNode.querySelector(CARD_CENTER_SELECTOR)
					) {
						card.remove(endNode);
					}
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
			if (
				this.isComposing &&
				(!inputType || !inputType.includes('Composition'))
			) {
				this.engine.model.mutation.submitCache();
			}
			const commandTypes = ['format', 'history'];
			if (inputType) {
				commandTypes.forEach((type) => {
					if (inputType.indexOf(type) === 0) {
						event.preventDefault();
						const commandName = inputType
							.substring(type.length)
							.toLowerCase();
						if (this.engine.command.queryEnabled(commandName)) {
							this.engine.command.execute(commandName);
						}
					}
				});
			}
		});
		let inputTimeout: NodeJS.Timeout | null = null;
		this.onContainer('input', (event: InputEvent) => {
			if (this.engine.readonly) {
				return;
			}

			if (this.isCardInput(event)) {
				return;
			}
			if (this.engine.isEmpty()) {
				this.engine.showPlaceholder();
			} else {
				this.engine.hidePlaceholder();
			}
			const { change, card } = this.engine;
			if (
				event.target instanceof Element &&
				isEditable(event.target) &&
				card.active &&
				card.active.root.isBlockCard() &&
				!card.active.isEditable &&
				card.active.root.get<HTMLElement>()?.isContentEditable
			) {
				const range = change.range.get();
				const newBlock = $(`<p><br /></p>`);
				card.active.root.before(newBlock);
				card.remove(card.active.root);
				range.select(newBlock, true);
				change.range.select(range);
				return;
			}
			if (inputTimeout) clearTimeout(inputTimeout);

			inputTimeout = setTimeout(() => {
				submitInput(event);
			}, 10);
		});
	}

	onSelect(
		callback: EventListener,
		onStart?: EventListener,
		onEnd?: EventListener,
	) {
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
				if (onStart) onStart(event);
			},
		);
		this.onDocument(isMobile ? 'touchend' : 'mouseup', (e) => {
			if (!this.isSelecting) {
				return;
			}
			this.isSelecting = false;
			// mouseup 瞬间选择状态不会马上被取消，需要延迟
			window.setTimeout(() => {
				callback(e);
				if (onEnd) onEnd(e);
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
		this.onDocument('paste', (e) => {
			const range = this.engine.change.range.get();
			if (!this.engine.container.contains(range.commonAncestorNode))
				return;
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
					top: '-99999px',
					right: '-99999px',
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

	onDocument(eventType: string, listener: EventListener, index?: number) {
		this.addEvent('document', eventType, listener, index);
	}

	onWindow(eventType: string, listener: EventListener, index?: number) {
		this.addEvent('window', eventType, listener, index);
	}

	onContainer(
		eventType: string,
		listener: EventListener,
		index?: number,
	): void {
		this.addEvent('container', eventType, listener, index);
	}

	onRoot(eventType: string, listener: EventListener, index?: number): void {
		this.addEvent('root', eventType, listener, index);
	}

	addEvent(
		type: GlobalEventType,
		eventType: string,
		listener: EventListener,
		index?: number,
	) {
		if (!this.globalEvents[type]) {
			this.globalEvents[type] = [];
		}
		if (
			!this.globalEvents[type].find((event) => event.type === eventType)
		) {
			const globalListener = (...args: any) => {
				const listeners = this.events[type].filter(
					(event) => event.type === eventType,
				);
				let result;
				for (let i = 0; i < listeners.length; i++) {
					result = listeners[i].listener(...args);

					if (result === false) {
						break;
					}
				}

				return result;
			};
			switch (type) {
				case 'container':
					this.engine.container.on(eventType, globalListener);
					break;
				case 'root':
					this.engine.root.on(eventType, globalListener);
					break;
				case 'document':
					document.addEventListener(eventType, globalListener);
					break;
				case 'window':
					window.addEventListener(eventType, globalListener);
					break;
			}
			this.globalEvents[type].push({
				type: eventType,
				listener: globalListener,
			});
		}
		if (!this.events[type]) this.events[type] = [];
		if (index !== undefined) {
			this.events[type].splice(index, 0, { type: eventType, listener });
		} else {
			this.events[type].push({ type: eventType, listener });
		}
	}

	destroy() {
		Object.keys(this.globalEvents).forEach((type) => {
			const events = this.globalEvents[type];
			events.forEach((event) => {
				if (type === 'window') {
					window.removeEventListener(event.type, event.listener);
				} else if (type === 'document') {
					document.removeEventListener(event.type, event.listener);
				} else if (type === 'container') {
					this.engine.container.off(event.type, event.listener);
				} else if (type === 'root') {
					this.engine.root.off(event.type, event.listener);
				}
			});
		});
	}
}

export default ChangeEvent;
