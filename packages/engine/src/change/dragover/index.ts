import { RangeInterface } from '../../types/range';
import Range from '../../range';
import { EngineInterface } from '../../types/engine';
import { CardInterface } from '../../types/card';
import { DragoverOptions } from '../../types/change';
import { $ } from '../../node';
import './index.css';

class DragoverHelper {
	private x: number = 0;
	private y: number = 0;
	private doc: Document = document;
	private range: RangeInterface | undefined;
	private caretRange: RangeInterface | undefined;
	private targetCard: CardInterface | undefined;
	private caretCard: CardInterface | undefined;
	private isCardLeftRange: boolean = false;
	private engine: EngineInterface;
	private options: DragoverOptions = {
		className: 'data-drop-cursor',
	};

	constructor(engine: EngineInterface, options?: DragoverOptions) {
		this.engine = engine;
		this.options = { ...this.options, ...options };
	}

	/**
	 * 获取当前坐标点的选区
	 * @returns
	 */
	getRangeForPoint(): RangeInterface | undefined {
		// https://developer.mozilla.org/zh-CN/docs/Web/API/DocumentOrShadowRoot/caretPositionFromPoint
		// https://developer.mozilla.org/en-US/docs/Web/API/Document/caretRangeFromPoint
		const { doc, x, y } = this;
		// caretRangeFromPoint 已弃用
		if (doc.caretRangeFromPoint !== undefined) {
			const range = Range.create(this.engine, doc, { x, y });
			if (range) return range;
		}
		if (event && event['rangeParent'] !== undefined) {
			const range = Range.create(this.engine, doc);
			range.setStart(event['rangeParent'], event['rangeOffset']);
			range.collapse(true);
			return range;
		}
		return;
	}

	/**
	 * 获取卡片
	 */
	getCard() {
		return this.targetCard || this.caretCard;
	}

	/**
	 * 解析事件参数
	 * @param e 事件
	 */
	parseEvent(e: DragEvent) {
		// 文件从 Finder 拖进来，不触发 dragstart 事件
		// Card拖动，禁止浏览器行为
		// 禁止拖图进浏览器，浏览器默认打开图片文件
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
		const { card } = this.engine;

		this.x = e.clientX;
		this.y = e.clientY;
		const target = $(e.target || []);
		this.doc = target.document || document;
		this.targetCard = card.find(target);
		// 当前鼠标精确击中的Card
		this.caretRange = this.getRangeForPoint();
		this.caretCard = this.caretRange
			? card.find(this.caretRange.commonAncestorContainer)
			: undefined;
	}
	// 有选区时获得的最近Card
	getRange() {
		const { caretRange, doc, x } = this;

		const card = this.getCard();

		let cardCaretRange;

		if (card && card.root.length > 0) {
			cardCaretRange = Range.create(this.engine, doc);
			const { left, right } = card.root.getBoundingClientRect() || {
				left: 0,
				right: 0,
			};
			const centerX = (left + right) / 2;
			cardCaretRange.select(card.root.get()!);
			// 以卡中点为中心为分割线，逼近两侧可插入的区间
			if (centerX < x) {
				cardCaretRange.collapse(false);
				this.isCardLeftRange = false;
			} else {
				cardCaretRange.collapse(true);
				this.isCardLeftRange = true;
			}
		}

		this.range = cardCaretRange || caretRange;
		return this.range;
	}

	/**
	 * 获取光标位置
	 * @param width 光标宽度，默认为2
	 */
	getRect(width: number = 2) {
		const { isCardLeftRange, range } = this;

		const card = this.getCard();

		if (card && card.root.length > 0 && range) {
			if (isCardLeftRange) {
				// 如果选区在Card左侧，则向后选取一个元素，选中Card区域
				range.setEnd(
					range.commonAncestorContainer,
					range.endOffset + 1,
				);
				const { left, bottom, top } = range.getBoundingClientRect();
				range.setEnd(
					range.commonAncestorContainer,
					range.endOffset - 1,
				);
				return {
					x: left - width,
					y: top,
					height: bottom - top,
				};
			}
			// 如果选区在Card右侧，则向前选取一个元素，选中Card区域
			range.setStart(
				range.commonAncestorContainer,
				range.startOffset - 1,
			);
			const { right, top, bottom } = range.getBoundingClientRect();
			range.setStart(
				range.commonAncestorContainer,
				range.startOffset + 1,
			);
			return {
				x: right - width,
				y: top,
				height: bottom - top,
			};
		}
		// 如果Card根节点不存在，则原逻辑不变
		let rect = this.range?.getBoundingClientRect();
		if (rect?.height === 0) {
			const node = this.range?.startContainer;
			rect = (node as Element).getBoundingClientRect();
		}

		const { left, top, bottom } = rect || {};

		return {
			x: left,
			y: top,
			height: (bottom || 0) - (top || 0),
		};
	}

	getCursor() {
		const { className } = this.options;
		return $(`body > div.${className}`);
	}

	removeCursor() {
		this.getCursor().remove();
	}

	setCursor() {
		this.removeCursor();
		const { className } = this.options;
		const cursor = $(`<div class="${className}" />`);
		$(document.body).append(cursor);
	}
}

export default DragoverHelper;
