import { EventEmitter2 } from 'eventemitter2';
import isEqual from 'lodash/isEqual';
import { EngineInterface } from '../types/engine';
import { isTransientElementCache } from './utils';
import { RangeInterface, RangePath } from '../types/range';
import { CardType } from '../card/enum';
import RangeColoring from './range-coloring';
import { CardInterface } from '../types/card';
import { NodeInterface } from '../types/node';
import Range from '../range';
import { CollaborationMember, CursorAttribute } from './member';

export interface SelectionInterface extends EventEmitter2 {
	/**
	 * 当前光标路径
	 */
	currentRangePath?: { start: RangePath; end: RangePath };
	/**
	 * 触发选择改变
	 */
	emitSelectChange: (refreshBG?: boolean) => void;
	/**
	 * 设置用户属性
	 * @param attr
	 */
	setAttribute(
		attr: CursorAttribute,
		member: CollaborationMember,
		refreshBG?: boolean,
	): void;
	/**
	 * 移除用户属性
	 * @param uuid
	 */
	removeAttirbute(uuid: string): void;
	/**
	 * 获取用户属性
	 * @param uuid
	 */
	getAttribute(uuid: string): CursorAttribute | undefined;

	refreshAttributes(...members: CollaborationMember[]): void;

	destroy(): void;
}
const FLUSHING: WeakMap<EngineInterface, boolean> = new WeakMap();
class ModelSelection extends EventEmitter2 implements SelectionInterface {
	private engine: EngineInterface;
	private rangeColoring: RangeColoring;
	currentRangePath?: { start: RangePath; end: RangePath };
	data: Map<string, CursorAttribute> = new Map();
	member: ReturnType<typeof CollaborationMember.fromEngine>;

	constructor(engine: EngineInterface) {
		super();
		this.engine = engine;
		this.member = CollaborationMember.fromEngine(engine);
		this.rangeColoring = new RangeColoring(engine);
		engine.container.on('keyup', this.emitSelectChange);
		engine.container.on('mousedown', this.handleMouseDown);
		engine.on('scroll', this.handleScroll, {
			passive: true,
		});
		window.addEventListener('resize', this.handleResize, {
			passive: true,
		});
	}

	handleResize = () => {
		this.rangeColoring.updatePosition();
	};

	handleScroll = (node: NodeInterface) => {
		const children = this.engine.container.get<Element>()?.childNodes;
		if (!children) return;
		for (const [key, attr] of this.data) {
			if (key === this.member.getCurrent()?.uuid) continue;
			if (attr.path?.start.id) {
				const startOffset = attr.path.start.path[0];
				const child = children.item(startOffset);
				if (child && node.equal(child)) {
					this.rangeColoring.updatePosition();
					break;
				}
			}
		}
	};

	handleMouseDown = () => {
		const container = this.engine.container;
		container.off('mouseup', this.handleMouseUp);
		container.off('mousemove', this.emitSelectChange);
		container.on('mouseup', this.handleMouseUp);
		container.on('mousemove', this.emitSelectChange);
	};

	private mouseUpTimeout: NodeJS.Timeout | null = null;

	handleMouseUp = () => {
		const container = this.engine.container;
		container.off('mouseup', this.handleMouseUp);
		container.off('mousemove', this.emitSelectChange);
		if (this.mouseUpTimeout) clearTimeout(this.mouseUpTimeout);
		this.mouseUpTimeout = setTimeout(() => {
			this.emitSelectChange();
		}, 10);
	};

	getCardResizeRange(card: CardInterface) {
		if (card?.getSelectionNodes) {
			const nodes = card.getSelectionNodes();
			if (nodes.length > 0) {
				const range = Range.create(this.engine);
				range.setStart(nodes[0], 0);
				const end = nodes[nodes.length - 1];
				range.setEnd(
					end,
					end.isText()
						? end.text().length
						: end.get<Element>()?.childNodes.length || 0,
				);
				return range;
			}
		}
		return null;
	}
	private observer: ResizeObserver | null = null;
	emitSelectChange = (refreshBG = false) => {
		if (this.engine.change.isComposing()) return;
		let current = this.engine.change.range.get();
		this.observer?.disconnect();
		const card = this.engine.card.find(
			current.commonAncestorContainer,
			true,
		);
		if (card?.getSelectionNodes) {
			let newRange = this.getCardResizeRange(card);
			if (newRange) {
				current = newRange.cloneRange();
				this.observer = new ResizeObserver(() => {
					newRange = this.getCardResizeRange(card);
					if (newRange) {
						this.onSelectionChange(newRange, true, refreshBG);
					} else {
						this.observer?.disconnect();
					}
				});
				this.observer.observe(card.root.get<Element>()!);
			}
		}

		if (
			!current.commonAncestorNode.isRoot() &&
			!current.commonAncestorNode.inEditor()
		) {
			const current = this.member.getCurrent();
			if (current) this.removeAttirbute(current.uuid);
		} else {
			this.onSelectionChange(current, true, refreshBG, false);
		}
	};

	setAttribute(
		attr: CursorAttribute,
		member: CollaborationMember,
		refreshBG = false,
		showInfo = false,
	) {
		const item = this.data.get(attr.uuid);
		if (attr.force || !isEqual(item || {}, attr)) {
			this.data.set(
				attr.uuid,
				Object.assign({}, attr, { active: !item }),
			);
			const current = this.member.getCurrent();
			if (attr.uuid === current?.uuid) {
				if (!FLUSHING.get(this.engine)) {
					FLUSHING.set(this.engine, true);
					Promise.resolve().then(() => {
						FLUSHING.set(this.engine, false);
						if (refreshBG === true)
							this.rangeColoring.updatePosition();
						this.emit('change', attr);
					});
				}
			} else {
				this.rangeColoring.render(attr, member, showInfo);
			}
		}
	}

	removeAttirbute(uuid: string) {
		if (!this.data.has(uuid)) return;
		this.data.delete(uuid);
		const current = this.member.getCurrent();
		if (uuid === current?.uuid) this.emit('change', { uuid, remove: true });
		else this.rangeColoring.remove(uuid);
	}

	getAttribute(uuid: string) {
		return this.data.get(uuid);
	}

	onSelectionChange(
		range: RangeInterface,
		force = false,
		refreshBG = false,
		showInfo = false,
	) {
		const currentMember = this.member.getCurrent();
		if (!currentMember) return;
		const { card } = this.engine;
		range = range.cloneRange();
		const activeCard = card.active;
		if (activeCard && !activeCard.isEditable) {
			const center = activeCard.getCenter();
			if (isTransientElementCache(activeCard.root)) {
				const prev = activeCard.root.prev();
				if (prev) {
					range.select(prev, true).collapse(false);
				} else {
					range.setStartBefore(activeCard.root);
					range.collapse(true);
				}
			} else if (center && center.length > 0) {
				range.select(center.get()!, true);
			}
		}

		if (!activeCard && !range.collapsed) {
			const startCard = this.engine.card.find(range.startNode, true);
			if (startCard && startCard.type === CardType.BLOCK) {
				range.setStart(startCard.getCenter().parent()!, 1);
			}
			const endCard = this.engine.card.find(range.endNode, true);
			if (endCard && endCard.type === CardType.BLOCK) {
				range.setEnd(endCard.getCenter().parent()!, 1);
			}
		}
		// 显示协作信息时包含左右光标位置
		const path = range.toPath(true);
		// 用作历史记录的不包含卡片左右光标位置
		this.currentRangePath = range.toPath();
		const current = this.getAttribute(currentMember.uuid);
		this.setAttribute(
			Object.assign({}, current, {
				path,
				uuid: currentMember.uuid,
				force,
			}),
			currentMember,
			refreshBG,
			showInfo,
		);
		this.rangeColoring.updateBackgroundAlpha(range);
	}

	refreshAttributes(...members: CollaborationMember[]) {
		members.forEach((member) => {
			const attr = this.getAttribute(member.uuid);
			if (attr) {
				this.rangeColoring.render(attr, member);
			}
		});
	}

	destroy() {
		const container = this.engine.container;
		container.off('mouseup', this.handleMouseUp);
		container.off('mousemove', this.emitSelectChange);
		container.off('keyup', this.emitSelectChange);
		container.off('mousedown', this.handleMouseDown);
		this.engine.off('scroll', this.handleScroll);
		window.removeEventListener('resize', this.handleResize);
	}
}

export default ModelSelection;
