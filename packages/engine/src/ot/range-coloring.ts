import tinycolor2 from 'tinycolor2';
import { removeUnit, escape } from '../utils';
import { TinyCanvas } from '../utils';
import { Tooltip } from '../toolbar';
import { EngineInterface } from '../types/engine';
import { RangeInterface } from '../types/range';
import { NodeInterface } from '../types/node';
import {
	Attribute,
	CursorRect,
	Member,
	RangeColoringInterface,
} from '../types/ot';
import { DrawStyle, TinyCanvasInterface } from '../types/tiny-canvas';
import Range, { isRangeInterface } from '../range';
import { CardEntry, CardInterface } from '../types/card';
import {
	DATA_ELEMENT,
	EDITABLE_SELECTOR,
	DATA_UUID,
	DATA_COLOR,
} from '../constants';
import { $ } from '../node';

const USER_BACKGROUND_CLASS = 'ot-user-background';
const USER_CURSOR_CLASS = 'ot-user-cursor';
const USER_CURSOR_CARD_CLASS = 'ot-user-cursor-card';
const USER_MASK_CLASS = 'ot-card-mask';
const USER_CURSOR_TRIGGER_CLASS = 'ot-user-cursor-trigger';
const USER_CURSOR_TRIGGER_ACTIVE_CLASS = 'ot-user-cursor-trigger-active';

class RangeColoring implements RangeColoringInterface {
	private engine: EngineInterface;
	private root: NodeInterface;
	private hideCursorInfoTimeoutMap: {
		[k: string]: NodeJS.Timeout;
	};

	constructor(engine: EngineInterface) {
		this.engine = engine;
		this.root = engine.root;
		this.hideCursorInfoTimeoutMap = {};
	}

	destroy() {
		const body = this.engine.scrollNode ?? this.root;
		body.find(`.${USER_BACKGROUND_CLASS}`).remove();
		body.find(`.${USER_CURSOR_CLASS}`).remove();
		body.find(`.${USER_MASK_CLASS}`).remove();
	}

	getRectWithRange(node: NodeInterface, range: RangeInterface) {
		const rangeReact = range.getClientRect();
		const react = node.get<Element>()?.getBoundingClientRect();
		return new DOMRect(
			rangeReact.left - (react?.left || 0),
			rangeReact.top - (react?.top || 0),
			rangeReact.right - rangeReact.left,
			rangeReact.bottom - rangeReact.top,
		);
	}

	isWrapByRange(range: RangeInterface) {
		const clientReact = range.cloneRange().collapse(true).getClientRect();
		const clientReact1 = range.cloneRange().collapse(false).getClientRect();
		return clientReact.bottom !== clientReact1.bottom;
	}

	drawSubRang(
		node: NodeInterface,
		canvas: TinyCanvasInterface,
		range: RangeInterface,
		style: DrawStyle,
	) {
		const { startOffset, startNode, endNode } = range;
		let start = range.startOffset;
		const endOffset = range.endOffset;
		let startTop = range.getClientRect().top;
		let drawOffset = startOffset;
		while (start < endOffset) {
			range.setStart(range.commonAncestorContainer, start);
			range.setEnd(range.commonAncestorContainer, start + 1);
			const curRect = range.getClientRect();
			if (curRect.top > startTop || start === endOffset - 1) {
				range.setStart(range.commonAncestorContainer, drawOffset);
				drawOffset = start;
				startTop = curRect.top;
				const rect = this.getRectWithRange(node, range);
				canvas.clearRect(rect);
				canvas.drawRect({ ...rect.toJSON(), ...style });
			}
			start++;
		}
		range.setStart(startNode, startOffset);
		range.setEnd(endNode, endOffset);
	}

	drawBackground(
		range: RangeInterface,
		options: { uuid: string; color: string },
	) {
		const { card } = this.engine;
		const { uuid, color } = options;
		const tinyColor = tinycolor2(color);
		tinyColor.setAlpha(0.3);
		let targetCanvas: TinyCanvasInterface;
		const rgb = tinyColor.toRgbString();
		let child = (this.engine.scrollNode ?? this.root).find(
			`.${USER_BACKGROUND_CLASS}[${DATA_UUID}="${uuid}"]`,
		);
		if (child && child.length > 0) {
			child.attributes(DATA_COLOR, color.toString());
			targetCanvas = child[0]['__canvas'];
			targetCanvas.clear();
		} else {
			child = $(
				`<div class="${USER_BACKGROUND_CLASS}" ${DATA_UUID}="${uuid}" ${DATA_COLOR}="${color}" />`,
			);
			(this.engine.scrollNode ?? this.root).append(child);
			targetCanvas = new TinyCanvas({
				container: child.get<HTMLElement>()!,
			});

			child[0]['__canvas'] = targetCanvas;
		}
		child.css({
			position: 'absolute',
			top: 0,
			left: 0,
			'pointer-events': 'none',
		});
		child[0]['__range'] = range.cloneRange();
		const containerElement = this.engine.scrollNode ?? this.root;
		const parentWidth =
			containerElement.get<Element>()?.clientWidth ||
			containerElement.width();
		const parentHeight = this.root.height();
		targetCanvas.resize(parentWidth, parentHeight);
		let cardInfo = card.find(range.commonAncestorNode, true);
		//如果是卡片，并且选区不在内容模块中，而是在卡片两侧的光标位置处，就不算作卡片
		if (cardInfo && !cardInfo.isCenter(range.commonAncestorNode)) {
			cardInfo = undefined;
		}

		const fill = {
			fill: rgb,
		};

		let subRanges = range.getSubRanges();

		if (cardInfo?.isEditable && cardInfo.drawBackground) {
			const result = cardInfo.drawBackground(child, range, targetCanvas);
			if (result === false) return [range];
			if (!!result) {
				if (Array.isArray(result)) subRanges = result;
				else {
					if (result.x < 0) {
						targetCanvas.resize(
							parentWidth - result.x,
							parentHeight,
						);
						child.css('left', `${result.x}px`);
						result.x = 0;
					}
					targetCanvas.clearRect(result);
					targetCanvas.drawRect({ ...result.toJSON(), ...fill });
					return [range];
				}
			}
		} else if (cardInfo) {
			return [range];
		}

		subRanges.forEach((subRange) => {
			if (this.isWrapByRange(subRange)) {
				this.drawSubRang(child, targetCanvas, subRange, fill);
			} else {
				const rect = this.getRectWithRange(child, subRange);
				targetCanvas.clearRect(rect);
				targetCanvas.drawRect({ ...rect.toJSON(), ...fill });
			}
		});
		return subRanges;
	}

	getNodeRect(node: NodeInterface, rect: DOMRect) {
		//自定义列表项的第一个card跳过
		const parent = node.parent();
		if (
			node.isCard() &&
			parent?.hasClass(this.engine.list.CUSTOMZIE_LI_CLASS) &&
			parent?.first()?.equal(node) &&
			node.next()
		) {
			node = node.next()!;
		}

		if (node.isElement()) {
			rect = node.get<Element>()!.getBoundingClientRect();
		}

		if (node.isText()) {
			const range = Range.create(this.engine).cloneRange();
			range.select(node, true);
			rect = range.getClientRect();
		}
		return rect;
	}

	getCursorRect(
		selector: RangeInterface | NodeInterface,
		leftSpace: number = 2,
	): CursorRect {
		const parentRect = this.root
			.get<Element>()
			?.getBoundingClientRect() || {
			top: 0,
			left: 0,
		};

		if (isRangeInterface(selector)) {
			const range = selector;
			const { startNode } = range;
			range.shrinkToElementNode();
			let rect = range.getClientRect();
			if (startNode.isElement() && rect.height === 0) {
				let childNode: NodeInterface | null = $(
					startNode[0].childNodes[range.startOffset],
				);
				if (childNode && childNode.length > 0) {
					rect = this.getNodeRect(childNode, rect);
				} else {
					childNode = startNode.first();
					if (childNode && childNode.length > 0) {
						rect = this.getNodeRect(childNode, rect);
					}
				}
			}

			const top = rect.top - (parentRect.top || 0);
			const left = rect.left - (parentRect.left || 0) - leftSpace;
			const height = rect.height;
			return {
				top: top + 'px',
				left: left + 'px',
				height: height > 0 ? height + 'px' : -1,
				elementHeight: rect.height || 0,
			};
		}

		const node = selector;
		const outlineWidth = removeUnit(node.css('outline-width'));
		const rect = node.get<Element>()?.getBoundingClientRect() || {
			top: 0,
			left: 0,
			height: 0,
		};
		let top = rect.top - parentRect.top - 1;
		let left = rect.left - parentRect.left;
		if (outlineWidth) {
			top -= outlineWidth + 1;
			left -= 2;
		}
		return {
			left: left + 'px',
			top: top + 'px',
			height: 0,
			elementHeight: rect.height || 0,
		};
	}

	setCursorRect(node: NodeInterface, rect: CursorRect) {
		if (-1 !== rect.height) {
			if (0 === rect.height) {
				node.css(rect);
				node.addClass(USER_CURSOR_CARD_CLASS);
				return;
			}
			node.css(rect);
			node.removeClass(USER_CURSOR_CARD_CLASS);
		} else node.remove();
	}

	showCursorInfo(node: NodeInterface, member: Member) {
		const { uuid, color } = member;
		if (this.hideCursorInfoTimeoutMap[uuid]) {
			clearTimeout(this.hideCursorInfoTimeoutMap[uuid]);
		}

		const trigger = node.find(`.${USER_CURSOR_TRIGGER_CLASS}`);
		const bgColor = node.css('background-color');
		node.attributes('data-old-background-color', bgColor);
		trigger.addClass(`${USER_CURSOR_TRIGGER_ACTIVE_CLASS}`);
		node.css('background-color', color);
		trigger.css('background-color', color);
	}

	hideCursorInfo(node: NodeInterface) {
		const trigger = node.find(`.${USER_CURSOR_TRIGGER_CLASS}`);
		const bgColor = node.attributes('data-old-background-color');
		trigger.removeClass(`${USER_CURSOR_TRIGGER_ACTIVE_CLASS}`);
		node.css('background-color', bgColor);
		trigger.css('background-color', bgColor);
	}

	drawCursor(
		selector: RangeInterface | NodeInterface,
		member: Member,
		showInfo?: boolean,
	) {
		const { uuid, name, color } = member;
		let cursorRect = this.getCursorRect(selector);
		let childCursor = this.root.children(
			`.${USER_CURSOR_CLASS}[${DATA_UUID}="${uuid}"]`,
		);
		if (childCursor && childCursor.length > 0) {
			this.setCursorRect(childCursor, cursorRect);
		} else {
			const userCursor = `
            <div class="${USER_CURSOR_CLASS}" ${DATA_UUID}="${uuid}">
                <div class="${USER_CURSOR_TRIGGER_CLASS}">${escape(
				name || '',
			)}</div>
            </div>`;
			childCursor = $(userCursor);
			const trigger = childCursor.find(`.${USER_CURSOR_TRIGGER_CLASS}`);

			if (cursorRect.elementHeight === 0) {
				// 刚加载获取不到高度，就定时循环获取，获取次数超过50次就不再获取
				let count = 0;
				const getRect = () => {
					count++;
					cursorRect = this.getCursorRect(selector);
					if (cursorRect.elementHeight < 20 && count <= 50) {
						setTimeout(() => {
							getRect();
						}, 20);
					} else {
						this.setCursorRect(childCursor, cursorRect);
					}
				};
				getRect();
			} else {
				this.setCursorRect(childCursor, cursorRect);
			}
			childCursor.on('mouseenter', () => {
				return this.showCursorInfo(childCursor!, member);
			});
			let transitionState = true;
			childCursor.on('transitionstart', () => {
				transitionState = false;
			});

			childCursor.on('transitionend', () => {
				transitionState = true;
			});

			childCursor.on('mouseleave', () => {
				if (transitionState) {
					this.hideCursorInfo(childCursor!);
				}
			});
			childCursor.css('background-color', color);
			trigger.css('background-color', color);
			this.root.append(childCursor);
		}
		if (childCursor && childCursor[0]) {
			childCursor.css('z-index', '');
			// 如果当前有最大化的卡片，并且要画的光标不在最大化卡片内就隐藏这个光标
			const maximizeCard = this.engine.card.components.find(
				(component) => component.isMaximize,
			);
			if (maximizeCard) {
				const card = this.engine.card.closest(
					isRangeInterface(selector) ? selector.startNode : selector,
					true,
				);
				if (!card || !maximizeCard.root.equal(card)) {
					childCursor.css('z-index', 120);
				}
			}
			childCursor[0]['__target'] = isRangeInterface(selector)
				? selector.toPath(true)
				: selector;
			if (showInfo === false) return childCursor;
			this.showCursorInfo(childCursor, member);
			if (this.hideCursorInfoTimeoutMap[uuid]) {
				clearTimeout(this.hideCursorInfoTimeoutMap[uuid]);
			}
			this.hideCursorInfoTimeoutMap[uuid] = setTimeout(() => {
				this.hideCursorInfo(childCursor!);
			}, 2000);
			return childCursor;
		}
		return;
	}

	drawCard(node: NodeInterface, cursor: NodeInterface, member: Member) {
		const { language } = this.engine;
		const parentRect = this.root
			.get<Element>()
			?.getBoundingClientRect() || {
			left: 0,
			top: 0,
			width: 0,
			height: 0,
		};
		let nodeRect = node.get<Element>()?.getBoundingClientRect() || {
			left: 0,
			top: 0,
			width: 0,
			height: 0,
		};
		let mask = this.root.children(
			`.${USER_MASK_CLASS}[${DATA_UUID}="${member.uuid}"]`,
		);
		if (mask && mask.length > 0) {
			mask[0]['__node'] = node[0];
			mask.css({
				left: nodeRect.left - parentRect.left + 'px',
				top: nodeRect.top - parentRect.top + 'px',
			});
			return;
		}
		mask = $(
			`<div class="${USER_MASK_CLASS}" ${DATA_UUID}="${member.uuid}" />`,
		);
		mask[0]['__node'] = node[0];
		if (nodeRect.height === 0) {
			// 刚加载获取不到高度，就定时循环获取，获取次数超过50次就不再获取
			let count = 0;
			const getRect = () => {
				count++;
				nodeRect = node.get<Element>()?.getBoundingClientRect() || {
					left: 0,
					top: 0,
					width: 0,
					height: 0,
				};
				if (nodeRect.height < 20 && count <= 50) {
					setTimeout(() => {
						getRect();
					}, 20);
				} else {
					mask.css({
						left: nodeRect.left - parentRect.left + 'px',
						top: nodeRect.top - parentRect.top + 'px',
						width: nodeRect.width + 'px',
						height: nodeRect.height + 'px',
					});
				}
			};
			getRect();
		} else {
			mask.css({
				left: nodeRect.left - parentRect.left + 'px',
				top: nodeRect.top - parentRect.top + 'px',
				width: nodeRect.width + 'px',
				height: nodeRect.height + 'px',
			});
		}

		mask.on('mouseenter', () => {
			this.showCursorInfo(cursor, member);
			Tooltip.show(mask, language.get('card', 'lockAlert').toString(), {
				placement: 'bottomLeft',
			});
		});

		mask.on('mousemove', (event: MouseEvent) => {
			const tooltipElement = $(`div[${DATA_ELEMENT}=tooltip]`);
			tooltipElement.css({
				left: event.pageX - 16 + 'px',
				top: event.pageY + 32 + 'px',
			});
		});

		mask.on('mouseleave', () => {
			this.hideCursorInfo(cursor);
			Tooltip.hide();
		});

		mask.on('click', (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
		});

		mask.on('mousedown', (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
		});
		this.root.append(mask);
	}

	setCardSelectedByOther(card: CardInterface, member?: Member) {
		const { uuid, color } = member || {};
		if (color) {
			const tinyColor = tinycolor2(color);
			tinyColor.setAlpha(0.3);
			const rgb = tinyColor.toRgbString();
			let customNode;
			if (!card.selectedByOther) {
				customNode = card.onSelectByOther(true, {
					color,
					rgb,
				});
			}
			card.selectedByOther = uuid!;
			return customNode;
		}
		if (card.selectedByOther) {
			card.onSelectByOther(false);
		}
		card.selectedByOther = false;
	}

	setCardActivatedByOther(card: CardInterface, member?: Member) {
		if (card.isEditable) return;
		const { uuid, color } = member || {};
		if (color) {
			const tinyColor = tinycolor2(color);
			tinyColor.setAlpha(0.3);
			const rgb = tinyColor.toRgbString();
			let customNode;
			if (!card.activatedByOther) {
				customNode = card.onActivateByOther(true, {
					color,
					rgb,
				});
			}
			card.activatedByOther = uuid!;
			return customNode;
		}
		if (card.activatedByOther) {
			card.onActivateByOther(false);
		}
		card.activatedByOther = false;
	}

	drawRange(range: RangeInterface, member: Member, showInfo?: boolean) {
		const { card } = this.engine;
		const { uuid } = member;
		const { commonAncestorNode } = range;
		let cardInfo = card.find(commonAncestorNode);
		//如果是卡片，并且选区不在内容模块中，而是在卡片两侧的光标位置处，就不算作卡片
		if (cardInfo && !cardInfo.isCenter(commonAncestorNode)) {
			cardInfo = undefined;
		}
		const removeCardMasks: string[] = [];
		card.each((cardComponent) => {
			if (cardComponent.isEditable) return;
			if (!cardInfo || !cardComponent.root.equal(cardInfo.root)) {
				if (cardComponent.activatedByOther === uuid) {
					this.setCardActivatedByOther(cardComponent);
				}
				removeCardMasks.push(uuid);
			}
		});
		if (removeCardMasks.length > 0) {
			this.root
				.get<Element>()
				?.querySelectorAll(
					removeCardMasks
						.map(
							(uuid) =>
								`.${USER_MASK_CLASS}[${DATA_UUID}="${uuid}"]`,
						)
						.join(','),
				)
				?.forEach((child) => {
					child.parentNode?.removeChild(child);
					Tooltip.hide();
				});
		}
		if (cardInfo && !cardInfo.isEditable) {
			const root =
				this.setCardActivatedByOther(cardInfo, member) || cardInfo.root;
			this.root
				.find(`.${USER_CURSOR_CLASS}[${DATA_UUID}="${uuid}"]`)
				.remove();
			const collab = (cardInfo.constructor as CardEntry).collab;
			if (collab === undefined || collab === true) {
				const cursor = this.drawCursor(root, member, showInfo);
				if (cursor) this.drawCard(root, cursor, member);
				this.drawBackground(range, member);
			}
		} else {
			//可编辑卡片
			if (cardInfo) {
				this.drawBackground(range, member);
				this.root
					.find(`.${USER_CURSOR_CLASS}[${DATA_UUID}="${uuid}"]`)
					.remove();
				return;
			}
			card.each((cardComponent) => {
				const centerNode = cardComponent.getCenter();
				if (centerNode && centerNode.length > 0) {
					if (cardComponent.isEditable) {
						if (
							centerNode.contains(range.startNode) &&
							centerNode.contains(range.endNode) &&
							(range.startNode.closest(EDITABLE_SELECTOR).length >
								0 ||
								range.endNode.closest(EDITABLE_SELECTOR)
									.length > 0)
						) {
							this.setCardSelectedByOther(cardComponent);
							return;
						}
					}
					if (range.isPointInRange(centerNode.get()!, 0)) {
						this.setCardSelectedByOther(cardComponent, member);
					} else if (cardComponent.selectedByOther === uuid) {
						this.setCardSelectedByOther(cardComponent);
					}
				}
			});
			const singleCard = card.getSingleSelectedCard(range);
			if (singleCard) {
				if (singleCard.isEditable) {
					const center = singleCard.getCenter();
					if (
						center.contains(range.startNode) &&
						center.contains(range.endNode) &&
						(range.startNode.closest(EDITABLE_SELECTOR).length >
							0 ||
							range.endNode.closest(EDITABLE_SELECTOR).length > 0)
					) {
						return;
					}
				}
				const root =
					this.setCardSelectedByOther(singleCard, member) ||
					singleCard.root;
				this.drawCursor(root, member, showInfo);
			} else {
				range.shrinkToElementNode();
				const ranges = this.drawBackground(range, member);
				if (!range.collapsed) {
					ranges.forEach((sub) => {
						if (!sub.collapsed) {
							range = sub;
						}
					});
					range.shrinkToElementNode();
					range.collapse(false);
				}
				this.drawCursor(range, member, showInfo);
			}
		}
	}

	updateBackgroundPosition() {
		(this.engine.scrollNode?.get<Element>() ?? this.root.get<Element>())
			?.querySelectorAll(`.${USER_BACKGROUND_CLASS}`)
			.forEach((child) => {
				const node = $(child);
				const range = child['__range'];
				const uuid = node.attributes(DATA_UUID);
				const color = node.attributes(DATA_COLOR);
				this.drawBackground(range, {
					uuid,
					color,
				});
			});
	}

	updateCursorPosition() {
		this.root
			.get<Element>()
			?.querySelectorAll(`.${USER_CURSOR_CLASS}`)
			.forEach((child) => {
				const node = $(child);
				let target = child['__target'];
				if (!target) {
					node.remove();
					return;
				}
				if (!target.name)
					target = Range.fromPath(this.engine, target, true);
				if (
					target.startContainer ||
					0 !== $(target).closest('body').length
				) {
					const rect = this.getCursorRect(target);
					this.setCursorRect(node, rect);
				} else node.remove();
			});
	}

	updateCardPosition() {
		const parentRect = this.root
			.get<Element>()
			?.getBoundingClientRect() || {
			left: 0,
			top: 0,
		};
		this.root
			.get<Element>()
			?.querySelectorAll<HTMLElement>(`.${USER_MASK_CLASS}`)
			.forEach((child) => {
				const target: Element | undefined = child['__node'];
				if (target?.isConnected) {
					const rect = target.getBoundingClientRect();
					child.style.left = rect.left - parentRect.left + 'px';
					child.style.top = rect.top - parentRect.top + 'px';
				} else child.parentNode?.removeChild(child);
			});
	}

	updatePosition() {
		this.updateBackgroundPosition();
		this.updateCursorPosition();
		this.updateCardPosition();
	}

	updateBackgroundAlpha(range: RangeInterface) {
		const cursorRect = this.getCursorRect(range);
		this.root
			.get<Element>()
			?.querySelectorAll<HTMLElement>(`.${USER_CURSOR_CLASS}`)
			.forEach((child) => {
				const trigger = child.querySelector<HTMLElement>(
					`.${USER_CURSOR_TRIGGER_CLASS}`,
				);
				const left = child.style.left;
				const top = child.style.top;
				const bgColor = tinycolor2(child.style.backgroundColor);
				if (cursorRect.left === left && cursorRect.top === top) {
					bgColor.setAlpha(0.3);
				} else {
					bgColor.setAlpha(1);
				}
				const bgs = bgColor.toRgbString();
				child.style.backgroundColor = bgs;
				if (trigger) trigger.style.backgroundColor = bgs;
			});
	}

	render(attribute: Attribute, member: Member, showInfo?: boolean) {
		const { path, uuid, active } = attribute;
		if (path) {
			const range = Range.fromPath(this.engine, path, true);
			this.drawRange(range, member, active || showInfo);
		} else {
			this.remove(uuid);
		}
	}

	remove(uuid: string) {
		(this.engine.scrollNode?.get<Element>() ?? this.root.get<Element>())
			?.querySelectorAll(`[${DATA_UUID}="${uuid}"]`)
			.forEach((dataElement) => {
				if (dataElement.classList.contains(USER_MASK_CLASS)) {
					const target: Node | undefined = dataElement['__node'];
					const component = target
						? this.engine.card.find(target)
						: null;
					if (
						component &&
						!component.isEditable &&
						component.activatedByOther === uuid
					) {
						// 取消锁定
						this.setCardActivatedByOther(component);
					}
				}
				dataElement.parentNode?.removeChild(dataElement);
			});
		this.engine.card.each((component) => {
			if (component.isEditable || component.selectedByOther !== uuid)
				return;
			// 取消锁定
			this.setCardSelectedByOther(component);
		});
	}
}
export default RangeColoring;
