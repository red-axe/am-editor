import {
	ChangeRangeInterface,
	EngineInterface,
	RangeInterface,
} from '../types';
import { $ } from '../node';
import { CARD_ELEMENT_KEY, CARD_KEY, EDITABLE_SELECTOR } from '../constants';
import Range from '../range';
import { isFirefox } from '../utils';

export type ChangeRangeOptions = {
	onSelect?: (range: RangeInterface) => void;
};

class ChangeRange implements ChangeRangeInterface {
	engine: EngineInterface;
	#lastBlurRange?: RangeInterface;
	#otpions: ChangeRangeOptions;

	constructor(engine: EngineInterface, options: ChangeRangeOptions = {}) {
		this.engine = engine;
		this.#otpions = options;
	}

	setLastBlurRange(range?: RangeInterface) {
		if (range?.commonAncestorNode.inEditor()) this.#lastBlurRange = range;
		else this.#lastBlurRange = undefined;
	}

	/**
	 * 获取安全可控的光标对象
	 * @param range 默认当前光标
	 */
	toTrusty(range: RangeInterface = this.get()) {
		// 如果不在编辑器内，聚焦到编辑器
		const { commonAncestorNode } = range;
		if (
			!commonAncestorNode.isEditable() &&
			!commonAncestorNode.inEditor()
		) {
			range
				.select(this.engine.container, true)
				.shrinkToElementNode()
				.collapse(false);
		}
		//卡片
		let rangeClone = range.cloneRange();
		rangeClone.collapse(true);
		this.setCardRang(rangeClone);
		if (
			!range.startNode.equal(rangeClone.startNode) ||
			range.startOffset !== rangeClone.startOffset
		)
			range.setStart(rangeClone.startContainer, rangeClone.startOffset);

		rangeClone = range.cloneRange();
		rangeClone.collapse(false);
		this.setCardRang(rangeClone);
		if (
			!range.endNode.equal(rangeClone.endNode) ||
			range.endOffset !== rangeClone.endOffset
		)
			range.setEnd(rangeClone.endContainer, rangeClone.endOffset);

		if (range.collapsed) {
			rangeClone = range.cloneRange();
			rangeClone.enlargeFromTextNode();

			const startNode = $(rangeClone.startContainer);
			const startOffset = rangeClone.startOffset;

			if (this.engine.node.isInline(startNode) && startOffset === 0) {
				range.setStartBefore(startNode[0]);
			}
			if (
				this.engine.node.isInline(startNode) &&
				startOffset === startNode[0].childNodes.length
			) {
				range.setStartAfter(startNode[0]);
			}
			range.collapse(true);
		}
		return range;
	}

	private setCardRang(range: RangeInterface) {
		const { startNode, startOffset } = range;
		const { card } = this.engine;
		const component = card.find(startNode);
		if (component) {
			const cardCenter = component.getCenter().get();
			if (
				cardCenter &&
				(!startNode.isElement() ||
					(startNode[0].parentElement ?? startNode[0].parentNode) !==
						component.root[0] ||
					startNode.attributes(CARD_ELEMENT_KEY))
			) {
				const comparePoint = () => {
					const doc_rang = Range.create(this.engine);
					doc_rang.select(cardCenter, true);
					return doc_rang.comparePoint(startNode, startOffset) < 0;
				};

				if ('inline' === component.type) {
					range.select(component.root);
					range.collapse(comparePoint());
					return;
				}

				if (comparePoint()) {
					card.focusPrevBlock(component, range, true);
				} else {
					card.focusNextBlock(component, range, true);
				}
			}
		}
	}

	get() {
		const { container } = this.engine;
		const { window } = container;
		let range = Range.from(this.engine, window!, false);
		if (!range) {
			range = Range.create(this.engine, window!.document)
				.select(container, true)
				.shrinkToElementNode()
				.collapse(false);
		}
		return range;
	}

	select(range: RangeInterface, triggerSelect: boolean = true) {
		const { container, inline, node, change } = this.engine;
		const { window } = container;
		const selection = window?.getSelection();
		if (change.isComposing()) return;
		//折叠状态
		if (range.collapsed) {
			const { startNode, startOffset } = range;
			//如果节点下只要一个br标签，并且是<p><br /><cursor /></p>,那么选择让光标选择在 <p><cursor /><br /></p>
			if (
				((startNode.isElement() &&
					1 === startOffset &&
					1 === startNode.get<Node>()?.childNodes.length) ||
					(2 === startOffset &&
						2 === startNode.get<Node>()?.childNodes.length &&
						startNode.first()?.isCard())) &&
				'br' === startNode.last()?.name
			) {
				range.setStart(startNode, startOffset - 1);
				range.collapse(true);
			}
			// 卡片左右侧光标零宽字符节点
			if (startNode.isText()) {
				const parent = startNode.parent();
				if (
					parent?.attributes(CARD_ELEMENT_KEY) === 'right' &&
					startOffset === 0
				) {
					range.setStart(startNode, 1);
					range.collapse(true);
				} else if (
					parent?.attributes(CARD_ELEMENT_KEY) === 'left' &&
					startOffset === 1
				) {
					range.setStart(startNode, 0);
					range.collapse(true);
				}
			}
		}
		//修复inline光标
		let { startNode, endNode, startOffset, endOffset } = range
			.cloneRange()
			.shrinkToTextNode();
		const prev = startNode.prev();
		const next = endNode.next();
		//光标上一个节点是inline节点，让其选择在inline节点后的零宽字符后面
		if (
			prev &&
			!prev.isCard() &&
			!node.isVoid(prev) &&
			node.isInline(prev)
		) {
			const text = startNode.text();
			//前面是inline节点，后面是零宽字符
			if (/^\u200B/g.test(text) && startOffset === 0) {
				range.setStart(endNode, startOffset + 1);
				if (range.collapsed) range.collapse(true);
			}
		}
		//光标下一个节点是inline节点，让其选择在inline节点前面的零宽字符前面
		if (
			next &&
			!next.isCard() &&
			!node.isVoid(next) &&
			node.isInline(next)
		) {
			const text = endNode.text();
			if (/\u200B$/g.test(text) && endOffset === text.length) {
				range.setEnd(endNode, endOffset - 1);
				if (range.collapsed) range.collapse(false);
			}
		}
		//光标内侧位置
		const inlineNode = inline.closest(startNode);
		if (
			!inlineNode.isCard() &&
			node.isInline(inlineNode) &&
			!node.isVoid(inlineNode)
		) {
			//左侧
			if (
				startNode.isText() &&
				!startNode.prev() &&
				startNode.parent()?.equal(inlineNode) &&
				startOffset === 0
			) {
				const text = startNode.text();
				if (/^\u200B/g.test(text)) {
					range.setStart(startNode, startOffset + 1);
					if (range.collapsed) range.collapse(true);
				}
			}
			//右侧
			if (
				endNode.isText() &&
				!endNode.next() &&
				endNode.parent()?.equal(inlineNode)
			) {
				const text = endNode.text();
				if (endOffset === text.length && /\u200B$/g.test(text)) {
					range.setEnd(endNode, endOffset - 1);
					if (range.collapsed) range.collapse(false);
				}
			}
		}
		startNode = range.startNode;
		endNode = range.endNode;
		if (startNode.isText() || endNode.isText()) {
			const cloneRange = range.cloneRange().enlargeFromTextNode();
			startNode = cloneRange.startNode;
			endNode = cloneRange.endNode;
		}
		const startChildNodes = startNode.children();
		// 自定义列表节点选中卡片前面就让光标到卡片后面去
		if (node.isCustomize(startNode) && startOffset === 0) {
			range.setStart(startNode, 1);
		}
		if (node.isCustomize(endNode) && endOffset === 0) {
			range.setEnd(endNode, 1);
		}
		const otStopped = this.engine.model.mutation.isStopped;
		// 空节点添加br
		if (startNode.name === 'p' && !otStopped) {
			if (startChildNodes.length === 0) startNode.append('<br />');
			else if (
				!isFirefox &&
				startChildNodes.length > 1 &&
				startChildNodes[startChildNodes.length - 2].nodeName !== 'BR' &&
				startChildNodes[startChildNodes.length - 1].nodeName === 'BR'
			) {
				const br = startNode.last();
				br?.remove();
			}
		}
		if (
			!range.collapsed &&
			!otStopped &&
			endNode.name === 'p' &&
			endNode.get<Node>()?.childNodes.length === 0
		) {
			endNode.append('<br />');
		}
		const startChildren = startNode.children();
		// 列表节点没有子节点
		if (
			node.isList(startNode) &&
			!otStopped &&
			(startChildren.length === 0 || startChildren[0].nodeName === 'BR')
		) {
			const newNode = $('<p><br /></p>');
			this.engine.nodeId.create(newNode);
			startNode.before(newNode);
			startNode.remove();
			startNode = newNode;
		}
		// 空列表添加br
		if (startNode.name === 'li' && !otStopped) {
			if (node.isCustomize(startNode) && !startNode.first()?.isCard()) {
				const cardItem = startNode
					.parent()
					?.children()
					.toArray()
					.find((child) => child.first()?.isCard());
				const cardKey = cardItem?.first()?.attributes(CARD_KEY);
				if (cardKey) {
					this.engine.list.addCardToCustomize(startNode, cardKey);
				} else {
					this.engine.list.unwrapCustomize(startNode);
				}
			}
			if (startChildNodes.length === 0) {
				startNode.append('<br />');
			} else if (
				!node.isCustomize(startNode) &&
				startChildNodes.length > 1 &&
				startChildNodes[startChildNodes.length - 2].nodeName !== 'BR' &&
				startChildNodes[startChildNodes.length - 1].nodeName === 'BR'
			) {
				startNode.last()?.remove();
			} else if (
				node.isCustomize(startNode) &&
				startChildNodes.length === 1
			) {
				startNode.append('<br />');
			} else if (
				node.isCustomize(startNode) &&
				startChildNodes.length > 2 &&
				startChildNodes[startChildNodes.length - 2].nodeName !== 'BR' &&
				startChildNodes[startChildNodes.length - 1].nodeName === 'BR'
			) {
				startNode.last()?.remove();
			}
		}
		if (!range.collapsed && endNode.name === 'li' && !otStopped) {
			const endChildNodes = endNode.children();
			if (endChildNodes.length === 0) {
				endNode.append('<br />');
			} else if (
				!node.isCustomize(endNode) &&
				endChildNodes.length > 1 &&
				endChildNodes[endChildNodes.length - 2].nodeName !== 'BR' &&
				endChildNodes[endChildNodes.length - 1].nodeName === 'BR'
			) {
				startNode.last()?.remove();
			} else if (
				node.isCustomize(endNode) &&
				endChildNodes.length === 1
			) {
				endNode.append('<br />');
			} else if (
				node.isCustomize(endNode) &&
				endChildNodes.length > 2 &&
				endChildNodes[endChildNodes.length - 2].nodeName !== 'BR' &&
				endChildNodes[endChildNodes.length - 1].nodeName === 'BR'
			) {
				startNode.last()?.remove();
			}
		}

		if (
			startNode.isEditable() &&
			!otStopped &&
			startNode.get<Node>()?.childNodes.length === 0 &&
			!this.engine.model.mutation.isStopped
		) {
			startNode.html('<p><br /></p>');
		}
		//在非折叠，或者当前range对象和selection中的对象不一致的时候重新设置range
		if (
			selection &&
			(range.collapsed ||
				(selection.rangeCount > 0 &&
					!range.equal(selection.getRangeAt(0)))) &&
			range.startNode.get<Node>()?.isConnected
		) {
			selection.removeAllRanges();
			selection.addRange(range.toRange());
		}
		const { onSelect } = this.#otpions;
		if (onSelect && triggerSelect) onSelect(range);
	}

	/**
	 * 聚焦编辑器
	 * @param toStart true:开始位置,false:结束位置，默认为之前操作位置
	 */
	focus(toStart?: boolean) {
		const range = this.#lastBlurRange || this.get();
		if (toStart !== undefined) {
			range
				.select(this.engine.container, true)
				.shrinkToElementNode()
				.collapse(toStart);
		}
		this.select(range);
		const editableElement =
			range.commonAncestorNode.closest(EDITABLE_SELECTOR);
		editableElement?.get<HTMLElement>()?.focus();
		if (
			editableElement.length > 0 &&
			!this.engine.container.equal(editableElement)
		) {
			const mouseEvent = new MouseEvent('mousedown');
			this.engine.container.get<HTMLElement>()?.dispatchEvent(mouseEvent);
			setTimeout(() => {
				const mouseEvent = new MouseEvent('mouseup');
				this.engine.container
					.get<HTMLElement>()
					?.dispatchEvent(mouseEvent);
			}, 0);
		}
	}

	blur() {
		const range = this.get();
		range.commonAncestorNode
			.closest(EDITABLE_SELECTOR)
			.get<HTMLElement>()
			?.blur();
		this.engine.container.get<HTMLElement>()?.blur();
		this.engine.trigger('blur');
	}
}
export default ChangeRange;
