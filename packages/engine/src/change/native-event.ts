import { isHotkey } from 'is-hotkey';
import {
	CARD_LEFT_SELECTOR,
	CARD_LOADING_KEY,
	CARD_RIGHT_SELECTOR,
	CARD_SELECTOR,
	DATA_ELEMENT,
	DATA_ID,
	EDITABLE,
	READY_CARD_KEY,
	READY_CARD_SELECTOR,
	ROOT,
	ROOT_SELECTOR,
	UI_SELECTOR,
} from '../constants';
import {
	CardEntry,
	EngineInterface,
	NodeInterface,
	RangeInterface,
} from '../types';
import Range from '../range';
import { $ } from '../node';
import Parser, { TextParser } from '../parser';
import Paste from './paste';
import { CardActiveTrigger, CardType } from '../card/enum';
import { escape } from '../utils';

class NativeEvent {
	engine: EngineInterface;
	#lastePasteRange?: RangeInterface;

	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	repairInput(event: InputEvent, range: RangeInterface) {
		const { commonAncestorNode } = range;
		const card = this.engine.card.find(commonAncestorNode);
		const { node, mark, change } = this.engine;
		if (card && card.type === CardType.INLINE) {
			if (card.isLeftCursor(commonAncestorNode)) {
				const cardLeft = commonAncestorNode.closest(CARD_LEFT_SELECTOR);
				let cardLeftText = cardLeft.text().replace(/\u200B/g, '');
				if (cardLeftText) {
					cardLeftText = escape(cardLeftText);
					range.setStartBefore(card.root);
					range.collapse(true);
					node.html(cardLeft, '&#8203;');
					node.insertText(cardLeftText, range);
					change.apply(range);
				}
			} else if (card.isRightCursor(commonAncestorNode)) {
				const cardRight =
					commonAncestorNode.closest(CARD_RIGHT_SELECTOR);
				let cardRightText = cardRight.text().replace(/\u200B/g, '');
				if (cardRightText) {
					cardRightText = escape(cardRightText);
					range.setEndAfter(card.root);
					range.collapse(false);
					node.html(cardRight, '&#8203;');
					node.insertText(cardRightText, range);
					change.apply(range);
				}
			} else change.range.toTrusty(range);
		}

		let { startNode, startOffset } = range.cloneRange().shrinkToTextNode();
		const parent = startNode.parent();
		//输入时删除mark标签内零宽字符。
		if (startNode.isText() && parent && node.isMark(parent)) {
			let textNode = startNode.get<Text>()!;
			let text = startNode.text();

			//mark 插件禁止跟随样式时，将输入字符设置到mark标签外
			//输入光标在mark节点末尾
			if (
				startOffset === text.length &&
				event.data &&
				event.inputType.indexOf('insert') === 0
			) {
				let markParent: NodeInterface | undefined = parent;
				let markTops: Array<NodeInterface> = [];
				//循环查找
				while (markParent && node.isMark(markParent)) {
					const markPlugin = mark.findPlugin(markParent);
					//插件禁止跟随
					if (markPlugin && !markPlugin.followStyle) {
						markTops.push(markParent);
					}
					markParent = markParent.parent();
					//如果还有位于下方的同级节点，并且父级节点也是mark节点，说明当前光标不在末尾了
					const markParentP = markParent?.parent();
					if (
						markParent?.next() &&
						markParentP &&
						node.isMark(markParentP)
					) {
						break;
					}
				}
				//查看下一个节点是否是紧紧挨着的相同样式如果有，那就继续跟随样式
				const startNext = startNode.next();
				markTops.forEach((markTop, index) => {
					//第一种：<em>abc<cursor /></em><em>123</em> 或者 <em>abc<cursor /></em><strong><em>123</em></strong> 继续跟随
					//第二种：<span><strong><em>abc<cursor /></em></strong><em>123</em><span> 或者 <strong><em>abc<cursor /></em></strong><strong><em>123</em></strong> 继续跟随
					//第三种: <span><strong>abc<cursor /><em>123</em></strong></span> 继续跟随

					//是开始节点所在的mark节点，如果开始节点后面有节点就继续跟随
					if (parent.equal(markTop) && startNext) {
						markTops.splice(index, 1);
						return;
					}
					let next = markTop.next();
					let curNode: NodeInterface | undefined = markTop;
					//循环找到下一个节点，如果没有下一级节点，从父级节点查找父级的下一级。如果有下一级节点，并且父节点
					while (!next && curNode) {
						//找到父节点
						const parent: NodeInterface | undefined =
							curNode.parent();
						//如果父节点是块级节点，就不找了
						if (parent && node.isBlock(parent)) break;
						//找到父级节点的下一级
						next = parent?.next() || null;
						curNode = parent;
					}
					let first = next;
					while (first && !first.isText()) {
						if (
							node.isMark(first) &&
							mark.compare(first, markTop)
						) {
							markTops.splice(index, 1);
							break;
						}
						first = first.first();
					}
				});
				if (markTops.length > 0) {
					const lastText = textNode.splitText(
						text.length - event.data.length,
					);
					lastText.remove();
					if (node.isEmpty(parent)) parent.remove();
					mark.unwrap(markTops.map((mark) => mark.clone()));
					node.insertText(
						text.substr(text.length - event.data.length),
					);
					mark.merge();
					range = change.range.get().cloneRange().shrinkToTextNode();
					startNode = range.startNode;
					startOffset = range.startOffset;
					textNode = startNode.get<Text>()!;
					text = startNode.text();
				}
			}
			//输入光标在mark节点开始位置
			else if (
				event.data &&
				startOffset === event.data.length &&
				event.inputType.indexOf('insert') === 0
			) {
				let markParent: NodeInterface | undefined = parent;
				let markTops: Array<NodeInterface> = [];
				//循环查找
				while (markParent && node.isMark(markParent)) {
					const markPlugin = mark.findPlugin(markParent);
					//插件禁止跟随
					if (markPlugin && !markPlugin.followStyle) {
						markTops.push(markParent);
					}
					markParent = markParent.parent();
					//如果还有位于下方的同级节点，并且父级节点也是mark节点，说明当前光标不在末尾了
					const markParentP = markParent?.parent();
					if (
						markParent?.prev() &&
						markParentP &&
						node.isMark(markParentP)
					) {
						break;
					}
				}
				//查看上一个节点是否是紧紧挨着的相同样式如果有，那就继续跟随样式
				const startPrev = startNode.prev();
				markTops.forEach((markTop, index) => {
					//第一种：<em>abc</em><em><cursor />123</em> 或者 <em>abc</em><strong><em><cursor />123</em></strong> 继续跟随
					//第二种：<span><strong><em>abc</em></strong><em><cursor />123</em><span> 或者 <strong><em>abc</em></strong><strong><em><cursor />123</em></strong> 继续跟随
					//第三种: <span><strong><em>123</em><cursor />abc</strong></span> 继续跟随

					//是开始节点所在的mark节点，如果开始节点后面有节点就继续跟随
					if (parent.equal(markTop) && startPrev) {
						markTops.splice(index, 1);
						return;
					}
					let prev = markTop.prev();
					let curNode: NodeInterface | undefined = markTop;
					//循环找到上一个节点，如果没有上一级节点，从父级节点查找父级的上一级。如果有上一级节点，并且父节点
					while (!prev && curNode) {
						//找到父节点
						const parent: NodeInterface | undefined =
							curNode.parent();
						//如果父节点是块级节点，就不找了
						if (parent && node.isBlock(parent)) break;
						//找到父级节点的下一级
						prev = parent?.prev() || null;
						curNode = parent;
					}
					let last = prev;
					while (last && !last.isText()) {
						if (node.isMark(last) && mark.compare(last, markTop)) {
							markTops.splice(index, 1);
							break;
						}
						last = last.last();
					}
				});
				if (markTops.length > 0) {
					textNode.splitText(event.data.length);
					textNode.remove();
					if (node.isEmpty(parent)) parent.remove();
					mark.unwrap(markTops.map((mark) => mark.clone()));
					node.insertText(event.data === '' ? '\xa0' : event.data);
					mark.merge();
					range = change.range.get().cloneRange().shrinkToTextNode();
					startNode = range.startNode;
					startOffset = range.startOffset;
					textNode = startNode.get<Text>()!;
					text = startNode.text();
				}
			}
			//输入时删除mark标签内零宽字符。
			if (text.length > 0 && /^\u200B$/g.test(text.substr(0, 1))) {
				textNode.splitText(1);
				textNode.remove();
			}
		}
		//输入时删除mark标签外最后的零宽字符
		const prev = startNode.prev();
		if (startNode.isText() && prev && node.isMark(prev)) {
			const textNode = startNode.get<Text>()!;
			const text = startNode.text();
			if (text.length > 0 && /^\u200B$/g.test(text.substr(0, 1))) {
				textNode.splitText(1);
				textNode.remove();
			}
		}
	}

	handleSelectionChange() {
		const { change, container, card } = this.engine;
		if (change.isComposing()) return;
		const { window } = container;
		const selection = window?.getSelection();

		if (selection && selection.anchorNode) {
			const range = Range.from(this.engine, selection)!;
			// 判断当前光标是否包含卡片或者在卡片内部
			let containsCard =
				range.containsCard() ||
				(range.commonAncestorNode.closest(CARD_SELECTOR).length > 0 &&
					range.startNode.closest(
						`${CARD_LEFT_SELECTOR},${CARD_RIGHT_SELECTOR},${UI_SELECTOR}`,
					).length === 0);

			let isSingle = range.collapsed;
			if (!isSingle) {
				const { startNode, endNode, startOffset, endOffset } = range;
				const startElement =
					startNode.isElement() && !startNode.isCard()
						? startNode.children().eq(startOffset)
						: startNode;
				const endElement =
					endNode.isElement() && !endNode.isCard()
						? endNode.children().eq(endOffset - 1)
						: endNode;
				if (
					startElement &&
					endElement &&
					startElement.isCard() &&
					startElement.equal(endElement)
				) {
					isSingle = true;
				}
			}
			card.each((card) => {
				const center = card.getCenter();
				if (center && center.length > 0) {
					let isSelect = selection.containsNode
						? selection.containsNode(center[0])
						: false;
					if (!isSelect && containsCard && selection.focusNode) {
						const focusCard = this.engine.card.find(
							selection.focusNode,
						);
						if (focusCard) {
							isSingle =
								!selection.anchorNode ||
								focusCard.root.contains(selection.anchorNode);
							if (isSingle && card.root.equal(focusCard.root)) {
								isSelect = true;
							}
						}
						// 找到一次其它的就不需要再去比对了
						if (isSelect && isSingle) containsCard = false;
					}
					const { autoSelected } = card.constructor as CardEntry;
					card.select(
						isSelect && (!isSingle || autoSelected !== false),
					);
				}
			});
		}
	}

	init() {
		const { change, card, clipboard } = this.engine;

		change.event.onInput((event: InputEvent) => {
			const range = change.range.get();
			this.repairInput(event, range);
			change.range.select(range);
			change.onSelect();
			change.change();
		});
		let selectionChangeTimeout: NodeJS.Timeout | undefined = undefined;
		change.event.onDocument('selectionchange', () => {
			if (selectionChangeTimeout) clearTimeout(selectionChangeTimeout);
			selectionChangeTimeout = setTimeout(
				() => this.handleSelectionChange(),
				50,
			);
		});
		change.event.onSelect((event: any) => {
			const range = change.range.get();
			if (range.startNode.closest(ROOT_SELECTOR).length === 0) return;
			if (range.collapsed && range.containsCard()) {
				change.range.toTrusty(range);
			}
			change.range.select(range);
			// 方向键选择不触发 card 激活
			if (
				!isHotkey('shift+left', event) &&
				!isHotkey('shift+right', event) &&
				!isHotkey('shift+up', event) &&
				!isHotkey('shift+down', event)
			) {
				card.activate(range.commonAncestorNode);
			}
			change.onSelect();
		});

		change.event.onDocument('mousedown', (e: MouseEvent) => {
			if (!e.target) return;
			const targetNode = $(e.target);
			// 点击元素已被移除
			if (targetNode.closest('body').length === 0) {
				return;
			}
			// 阅读模式节点
			if (targetNode.closest('.am-view').length > 0) {
				return;
			}
			// 工具栏、侧边栏、内嵌工具栏的点击
			let node: NodeInterface | undefined = targetNode;
			while (node) {
				const attrValue = node.attributes(DATA_ELEMENT);
				if (attrValue && [ROOT, EDITABLE].indexOf(attrValue) < 0) {
					return;
				}
				node = node.parent();
			}
			card.activate(targetNode, CardActiveTrigger.MOUSE_DOWN, e);
		});

		change.event.onDocument('copy', (event) => {
			const range = change.range.get();
			if (!this.engine.container.contains(range.commonAncestorNode))
				return;
			clipboard.write(event);
		});

		change.event.onDocument('cut', (event) => {
			const range = change.range.get();
			if (
				!this.engine.container.contains(range.commonAncestorNode) ||
				this.engine.readonly
			)
				return;
			event.stopPropagation();
			const data = clipboard.write(event, undefined);
			if (data) {
				clipboard.cut();
				change.change();
			}
		});

		const parserMarkdown = (text: string) => {
			const textNode = $(document.createTextNode(text));
			const result = this.engine.trigger(
				'paste:markdown-check',
				textNode,
			);
			return {
				node: textNode,
				result,
			};
		};

		const pasteMarkdown = async (html: string, text: string) => {
			// 先解析text
			let { node, result } = parserMarkdown(text);
			// 没有 markdown，尝试解析 html
			if (result !== false) {
				// 先解析html
				let parser = new Parser(html, this.engine);
				const schema = this.engine.schema.clone();
				//转换Text，没那么严格，加入以下规则，以免被过滤掉，并且 div后面会加换行符
				schema.add([
					{
						name: 'span',
						type: 'mark',
					},
					{
						name: 'div',
						type: 'block',
					},
				]);
				// 不遍历卡片，不对 ol 节点格式化，以免复制列表就去提示检测到markdown
				let parserText = parser.toText(schema, false, false);
				// html中没有解析到文本
				if (!parserText) {
					parser = new Parser(text, this.engine);
					parserText = parser.toText(schema);
				}
				const htmlResult = parserMarkdown(parserText);
				node = htmlResult.node;
				result = htmlResult.result;
			}
			if (result !== false) return;
			// 提示是否要转换
			this.engine
				.messageConfirm(
					this.engine.language.get<string>('checkMarkdown', 'title'),
				)
				.then(() => {
					change.cacheRangeBeforeCommand();
					this.engine.trigger('paste:markdown-before', node);
					this.engine.trigger('paste:markdown', node);
					this.engine.trigger('paste:markdown-after', node);

					node.get<Text>()?.normalize();
					this.paste(
						node.text(),
						this.#lastePasteRange,
						undefined,
						false,
					);
				})
				.catch((err) => {
					if (err) this.engine.messageError(err);
				});
		};

		change.event.onPaste((data) => {
			const { html, text, files, isPasteText } = data;
			let source = '';
			if (files.length === 0) {
				// 纯文本粘贴
				if (isPasteText) {
					let value = '';
					if (text) value = text;
					else if (html)
						value = new Parser(html, this.engine).toText();
					source = new TextParser(value).toHTML();
				} else {
					// 富文本粘贴
					if (
						html &&
						html.indexOf('<meta name="source" content="aomao" />') >
							-1
					) {
						source = html;
					} else if (
						text &&
						/^https?:\/\/\S+$/.test(text.toLowerCase().trim())
					) {
						const value = escape(text);
						source = `<a href="${value}" target="_blank">${value}</a>`;
					} else if (html) {
						source = html;
					} else if (text) {
						source = new TextParser(text).toHTML();
					}
				}
			}
			if (this.engine.trigger('paste:event', data, source) === false)
				return;
			if (files.length === 0) {
				change.cacheRangeBeforeCommand();
				this.paste(source);
				setTimeout(() => {
					// 如果 text 和 html 都有，就解析 text
					pasteMarkdown(source, text || '');
				}, 200);
			}
		});

		const canInsert = (range?: RangeInterface) => {
			// 找不到目标位置
			// TODO: 临时解决，如果 drop Range 在Card里则不触发
			return !range || card.closest(range.commonAncestorContainer);
		};

		change.event.onDrop(({ event, range, card, files }) => {
			if (card) {
				event.preventDefault();
				if (canInsert(range)) return;
				const cardEntry = card.constructor as CardEntry;
				const cardName = cardEntry.cardName;
				const cardValue = card.getValue();
				this.engine.card.remove(card.root);
				change.range.select(range!);
				this.engine.card.insert(cardName, cardValue);
			}
			if (files.length > 0) {
				event.preventDefault();
				if (canInsert(range)) return;
				change.range.select(range!);
				this.engine.trigger('drop:files', files);
			}
		});
	}

	paste(
		source: string,
		range?: RangeInterface,
		callback?: (count: number) => void,
		followActiveMark: boolean = true,
		insert?: (
			fragment: DocumentFragment,
			range?: RangeInterface,
			callback?: (range: RangeInterface) => void,
			followActiveMark?: boolean,
		) => void,
	) {
		const { change } = this.engine;
		const fragment = new Paste(source, this.engine).normalize(
			insert === undefined,
		);
		this.engine.trigger('paste:before', fragment);
		if (insert) insert(fragment, range, undefined, followActiveMark);
		else
			change.insert(
				fragment,
				range,
				(range) => {
					this.engine.trigger('paste:insert', range);
					const cloneRange = range.cloneRange();
					const { endNode } = cloneRange;
					let cardId = '';
					if (endNode.isCard() && endNode.children().length === 0) {
						cloneRange.setEndAfter(endNode);
						cardId = endNode.attributes(DATA_ID);
					}
					this.#lastePasteRange = cloneRange;
					range.collapse(false);
					// 卡片会出现未渲染的情况，选中在卡片后面
					const card = range.startNode.closest(
						`${CARD_SELECTOR},${READY_CARD_SELECTOR}`,
					);
					if (card.length > 0) {
						const attributes = card.attributes();
						if (
							attributes[CARD_LOADING_KEY] ||
							attributes[READY_CARD_KEY]
						) {
							range.setStartAfter(card);
						}
					}
					const selection = range.createSelection();
					this.engine.card.render(undefined, (count) => {
						selection.move();
						if (cardId) {
							const newCard = this.engine.container.find(
								`[data-id="${cardId}"]`,
							);
							if (newCard.length > 0) {
								cloneRange.setEndAfter(newCard);
								this.#lastePasteRange = cloneRange;
							}
						}
						range.scrollRangeIntoView();
						change.range.select(range);
						if (callback) {
							callback(count);
						}
						this.engine.trigger('paste:after');
					});
				},
				followActiveMark,
			);
	}
}

export default NativeEvent;
