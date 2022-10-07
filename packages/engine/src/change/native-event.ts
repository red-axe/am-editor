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
import { convertMarkdown, createMarkdownIt, escape } from '../utils';

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
					// 卡片有样式，并且后面没有节点了
					const next = card.root.next();
					const marks = card.queryMarks ? card.queryMarks(true) : [];
					if (marks.length > 0) {
						let newNode = marks[marks.length - 1];
						newNode.append(cardRightText);
						for (let i = marks.length - 2; i >= 0; i--) {
							newNode = marks[i].append(newNode);
						}
						card.root.after(newNode);
						range.select(newNode, true).collapse(false);
					} else if (next && (next.isText() || node.isMark(next))) {
						range.select(next, true).collapse(true);
						node.insertText(cardRightText, range);
					} else {
						range.setEndAfter(card.root);
						range.collapse(false);
						node.insertText(cardRightText, range);
					}
					node.html(cardRight, '&#8203;');
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
			const { inputType } = event;
			//mark 插件禁止跟随样式时，将输入字符设置到mark标签外
			//输入光标在mark节点末尾
			if (
				startOffset === text.length &&
				event.data &&
				inputType &&
				inputType.indexOf('insert') === 0
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
				inputType &&
				inputType.indexOf('insert') === 0
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
	private prevSelection: {
		anchorNode: Node | null;
		anchorOffset: number;
		focusNode: Node | null;
		focusOffset: number;
	} | null = null;
	handleSelectionChange() {
		const { change, container, card } = this.engine;
		if (change.isComposing()) return;
		const { window } = container;
		const selection = window?.getSelection();
		if (
			this.prevSelection?.anchorNode === selection?.anchorNode &&
			this.prevSelection?.anchorOffset === selection?.anchorOffset &&
			this.prevSelection?.focusNode === selection?.focusNode &&
			this.prevSelection?.focusOffset === selection?.focusOffset
		)
			return;
		this.prevSelection = selection
			? {
					anchorNode: selection.anchorNode,
					anchorOffset: selection.anchorOffset,
					focusNode: selection.focusNode,
					focusOffset: selection.focusOffset,
			  }
			: null;
		if (selection && selection.anchorNode) {
			const range = Range.from(this.engine, selection)!;
			// 不在编辑器内不处理
			if (!range.commonAncestorNode.inEditor(container)) return;

			change.onSelect();
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
			change.onSelect(range);
			change.change();
		});

		change.event.onDocument('selectionchange', () => {
			this.handleSelectionChange();
		});
		change.event.onSelect(
			(event: any) => {
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
				change.onSelect(range);
			},
			() => {
				change.onSelectStart();
			},
			() => {
				change.onSelectEnd();
			},
		);

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
			const data = clipboard.write(event, undefined);
			if (data) {
				event.stopPropagation();
				clipboard.cut();
				change.change();
			}
		});

		const convertMD = (text: string) => {
			change.cacheRangeBeforeCommand();
			const markdown = createMarkdownIt(this.engine, 'zero');
			markdown.enable(['paragraph', 'html_inline', 'newline']);
			//.disable(['strikethrough', 'emphasis', 'link', 'image', 'table', 'code', 'blockquote', 'hr', 'list', 'heading'])
			const tokens = markdown.parse(text, {});
			if (tokens.length === 0) return;
			return convertMarkdown(this.engine, markdown, tokens);
		};

		const pasteMarkdown = async (text: string) => {
			// 先解析text
			const result = convertMD(text);
			if (result === null) return;
			const handlePaste = () => {
				this.engine.history.saveOp();
				change.cacheRangeBeforeCommand();
				this.paste(result!, this.#lastePasteRange, undefined, false);
			};
			if (this.engine.options.markdown?.mode !== 'confirm') {
				handlePaste();
				return;
			}
			// 提示是否要转换
			this.engine
				.messageConfirm(
					'markdown',
					this.engine.language.get<string>('checkMarkdown', 'title'),
				)
				.then(() => {
					handlePaste();
				})
				.catch((err) => {
					if (err) this.engine.messageError('markdown', err);
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
				const markdown = this.engine.options.markdown || {};
				if (markdown.mode !== false) {
					// 单独的链接不做解析，由 paste:each 触发执行
					if (
						!markdown.check &&
						text &&
						!/^https?:\/\/\S+$/i.test(text.trim())
					) {
						if (!text) return;
						// 没有 html，直接转换 markdown
						if (!html) {
							setTimeout(() => {
								pasteMarkdown(text);
							}, 0);
							return;
						}
						// 检测 text 中是否有markdown语法
						const rows = text.split(/\r\n|\n/) || '';
						// 所有有效的段落
						let rowCount = 0;
						// 有语法的段落
						let validCount = 0;
						let isCodeblock = false;
						// 有序列表的markdown 对比html中的有序列表节点，如果不存在节点才算作markdown
						const root = new DOMParser().parseFromString(
							html,
							'text/html',
						);
						const lis = root.querySelectorAll('li');
						const orderTexts: string[] = [];
						lis.forEach((li) => {
							const text = li.textContent ?? '';
							if (
								li.parentElement?.nodeName === 'OL' ||
								/\d\.\s+/.test(text)
							) {
								orderTexts.push(text);
							}
						});
						for (let i = 0; i < rows.length; i++) {
							const rowText = rows[i];
							if (!rowText.trim()) continue;
							if (rowText.startsWith('```')) {
								if (!isCodeblock) {
									isCodeblock = true;
									validCount++;
									rowCount++;
								} else {
									isCodeblock = false;
								}

								continue;
							}
							if (isCodeblock) continue;
							rowCount++;

							if (
								/^(#|\*|-|\+|\[ \]|\[x\]|>){1,}\s+/.test(
									rowText,
								)
							) {
								validCount++;
							} else if (/^\d\.\s+/.test(rowText)) {
								if (
									!orderTexts.includes(rowText) &&
									!orderTexts.includes(
										rowText.replace(/^\d\./, '').trim(),
									)
								) {
									validCount++;
								}
							} else if (/^(---|\*\*\*|\+\+\+)/.test(rowText)) {
								validCount++;
							} else if (
								/(\*|~|\^|_|\`|\]\(https?:\/\/)/.test(rowText)
							) {
								validCount++;
							}
						}
						if (
							validCount > 0 &&
							(rowCount === 0 || validCount / rowCount > 0.5)
						) {
							setTimeout(() => {
								pasteMarkdown(text);
							}, 0);
						}
					} else if (markdown.check) {
						markdown
							.check(text ?? '', html ?? '')
							.then((result) => {
								if (!!result) {
									pasteMarkdown(result);
								}
							});
					}
				}
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
		forceGenerateAllId = true,
	) {
		const { change } = this.engine;
		const fragment = new Paste(source, this.engine).normalize(
			forceGenerateAllId,
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
					if (
						endNode.isCard() &&
						endNode.get<Node>()?.childNodes.length === 0
					) {
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
