import {
	TableInterface,
	TableModel,
	TableSelectionInterface,
	TableSelectionArea,
	TableSelectionDragging,
	TableModelCol,
	TableModelEmptyCol,
} from '../types';
import { EventEmitter2 } from 'eventemitter2';
import {
	$,
	EditorInterface,
	NodeInterface,
	isHotkey,
	isEngine,
	EDITABLE_SELECTOR,
	isNode,
	isMobile,
	removeUnit,
} from '@aomao/engine';
import Template from './template';

class TableSelection extends EventEmitter2 implements TableSelectionInterface {
	protected editor: EditorInterface;
	protected table: TableInterface;

	tableRoot?: NodeInterface;
	colsHeader?: NodeInterface;
	rowsHeader?: NodeInterface;
	tableHeader?: NodeInterface;
	tableModel?: TableModel;
	selectArea?: TableSelectionArea;
	selectRange?: {
		type: 'left' | 'right' | 'top' | 'bottom';
		startOffset: number;
		endOffset: number;
	};
	dragging?: TableSelectionDragging;
	isShift: boolean = false;
	prevMouseDownTd?: NodeInterface;
	prevOverTd?: NodeInterface;
	highlight?: NodeInterface;
	// 第一次选中一行的行号
	beginAllRow?: number;
	// 第一次选中一列的列号
	beginAllCol?: number;

	constructor(editor: EditorInterface, table: TableInterface) {
		super();
		this.table = table;
		this.editor = editor;
	}

	init() {
		const { wrapper } = this.table;
		if (!wrapper) return;
		this.tableRoot = wrapper.find(Template.TABLE_CLASS);
		this.colsHeader = wrapper.find(Template.COLS_HEADER_CLASS);
		this.rowsHeader = wrapper.find(Template.ROWS_HEADER_CLASS);
		this.tableHeader = wrapper.find(Template.HEADER_CLASS);
		this.highlight = wrapper.find(Template.TABLE_HIGHLIGHT_CLASS);

		this.render('init');
		this.bindEvents();
	}

	render(action: string) {
		this.refreshModel();
		const { tableModel } = this;
		if (!tableModel) {
			return;
		}
		const { begin, end } = this.getSelectArea();
		if (action === 'mergeCell' || action === 'splitCell') {
			const row =
				begin.row < 0 ? 0 : Math.min(begin.row, tableModel.rows - 1);
			const col =
				begin.col < 0 ? 0 : Math.min(begin.col, tableModel.cols - 1);
			let cell = tableModel.table[row][col];
			if (this.table.helper.isEmptyModelCol(cell)) {
				cell = tableModel.table[cell.parent.row][cell.parent.col];
			}
			if (!this.table.helper.isEmptyModelCol(cell) && cell.element) {
				if (action === 'mergeCell') {
					this.clearSelect();
					this.selectCellRange(cell.element);
				}
			}
		} else if (action === 'removeRow') {
			const row =
				begin.row < 0 ? 0 : Math.min(begin.row, tableModel.rows - 1);
			const cell = tableModel.table[row][0];
			if (!this.table.helper.isEmptyModelCol(cell) && cell.element) {
				this.focusCell(cell.element);
			}
		} else if (action === 'removeCol') {
			const col =
				begin.col < 0 ? 0 : Math.min(begin.col, tableModel.cols - 1);
			const cell = tableModel.table[0][col];
			if (!this.table.helper.isEmptyModelCol(cell) && cell.element) {
				this.focusCell(cell.element);
			}
		} else {
			this.select(begin, end);
		}
		this.renderBorder();
	}

	renderBorder() {
		const { tableModel } = this;
		if (!tableModel) return;
		//this.tableRoot?.find('td.table-last-column').removeClass('table-last-column');
		//this.tableRoot?.find('td.table-last-row').removeClass('table-last-row');
		tableModel.table.forEach((cols, row) => {
			cols.forEach((cell, col) => {
				if (!this.table.helper.isEmptyModelCol(cell)) {
					if (!cell.element) return;
					let isLastCol = row === tableModel.rows - 1;
					let isLastRow = col === tableModel.cols - 1;
					if (cell.isMulti) {
						if (col + cell.colSpan === tableModel.cols)
							isLastRow = true;
						if (row + cell.rowSpan === tableModel.rows)
							isLastCol = true;
					}
					if (isLastCol) {
						if (
							!cell.element.classList.contains(
								'table-last-column',
							)
						)
							cell.element.classList.add('table-last-column');
					} else {
						if (
							cell.element.classList.contains('table-last-column')
						)
							cell.element.classList.remove('table-last-column');
					}
					if (isLastRow) {
						if (!cell.element.classList.contains('table-last-row'))
							cell.element.classList.add('table-last-row');
					} else {
						if (cell.element.classList.contains('table-last-row'))
							cell.element.classList.remove('table-last-row');
					}
				}
			});
		});
	}

	bindEvents() {
		document.addEventListener('keydown', this.onShiftKeydown);
		document.addEventListener('keyup', this.onShiftKeyup);
		this.table.wrapper
			?.on('mousedown', this.onTdMouseDown)
			.on('keydown', this.onKeydown);
	}

	unbindEvents() {
		document.removeEventListener('keydown', this.onShiftKeydown);
		document.removeEventListener('keyup', this.onShiftKeyup);
		this.table.wrapper
			?.off('mousedown', this.onTdMouseDown)
			.off('keydown', this.onKeydown);
	}

	refreshModel() {
		if (!this.tableRoot || this.tableRoot.length === 0) return;
		this.tableModel = this.table.helper.getTableModel(this.tableRoot);
	}

	each(
		fn: (
			cell: TableModelCol | TableModelEmptyCol,
			row: number,
			col: number,
		) => void,
		reverse: boolean = false,
	) {
		const { tableModel } = this;
		if (!tableModel) return;
		const { begin, end } = this.getSelectArea();
		if (begin.row < 0 || begin.col < 0) return;
		if (reverse) {
			for (let r = end.row; r > -1 && r >= begin.row; r--) {
				for (let c = end.col; c > -1 && c >= begin.col; c--) {
					const tdModel = tableModel.table[r][c];
					fn(tdModel, r, c);
				}
			}
		} else {
			for (let _r = begin.row; _r > -1 && _r <= end.row; _r++) {
				for (let _c = begin.col; _c > -1 && _c <= end.col; _c++) {
					const _tdModel = tableModel.table[_r][_c];
					fn(_tdModel, _r, _c);
				}
			}
		}
	}

	getCellPoint(td: NodeInterface) {
		if (td.name !== 'td') return [-1, -1];
		const row = td.parent()?.index();
		if (row === undefined || row < 0) return [-1, -1];
		const col = this.tableModel?.table[row]?.findIndex((cell) =>
			td.equal(
				(this.table.helper.isEmptyModelCol(cell)
					? (this.tableModel?.table[cell.parent.row][
							cell.parent.col
					  ] as TableModelCol)
					: cell
				).element!,
			),
		);
		if (col === undefined || col < 0) return [-1, -1];
		return [row, col];
	}

	getCellIndex(row: number, col: number) {
		if (!this.tableModel) return 0;
		const trModel = this.tableModel.table[row];
		let index = 0;
		for (let i = 0; i < col; i++) {
			const tdModel = trModel[i];
			if (
				!this.table.helper.isEmptyModelCol(tdModel) &&
				tdModel.element
			) {
				index++;
			}
		}
		return index;
	}

	getSingleCell() {
		if (!this.prevMouseDownTd) return null;
		return this.prevMouseDownTd;
	}

	getSingleCellPoint() {
		const td = this.getSingleCell();
		if (!td) return [-1, -1];
		return this.getCellPoint(td);
	}

	getSelectArea() {
		if (this.selectArea) return this.selectArea;
		let curPoint = this.getSingleCellPoint();
		if (!this.tableModel || curPoint[0] === -1)
			return {
				begin: { row: -1, col: -1 },
				end: { row: -1, col: -1 },
				count: 0,
				allCol: false,
				allRow: false,
			};

		const { cols, rows, table } = this.tableModel;
		let cell = table[curPoint[0]][curPoint[1]];
		if (this.table.helper.isEmptyModelCol(cell)) {
			cell = table[cell.parent.row][cell.parent.col] as TableModelCol;
			if (cell.element) curPoint = this.getCellPoint($(cell.element));
		}
		return {
			begin: { row: curPoint[0], col: curPoint[1] },
			end: { row: curPoint[0], col: curPoint[1] },
			count: curPoint[0] === -1 ? 0 : 1,
			allCol: cols === 1,
			allRow: rows === 1,
		};
	}

	selectCol(begin: number, end: number = begin) {
		if (!this.tableModel) return;
		if (this.isShift) {
			// 有全选的列
			if (this.beginAllCol) {
				if (begin < this.beginAllCol) {
					end = this.beginAllCol;
				} else {
					begin = this.beginAllCol;
				}
			} else if (this.prevMouseDownTd) {
				const [row, col] = this.getCellPoint(this.prevMouseDownTd);
				begin = col;
				this.beginAllCol = col;
			} else if (this.selectArea) {
				begin = this.selectArea.begin.col;
				if (this.tableModel) {
					const tdModel =
						this.tableModel.table[this.selectArea.begin.row][
							this.selectArea.begin.col
						];
					if (
						!this.table.helper.isEmptyModelCol(tdModel) &&
						tdModel.element
					)
						this.focusCell(tdModel.element);
				}
			}
		}
		this.select(
			{ row: 0, col: begin },
			{ row: this.tableModel.rows - 1, col: end },
		);
	}

	selectRow(begin: number, end: number = begin) {
		if (!this.tableModel) return;
		if (this.isShift) {
			// 有全选的行
			if (this.beginAllRow) {
				if (begin < this.beginAllRow) {
					end = this.beginAllRow;
				} else {
					begin = this.beginAllRow;
				}
			} else if (this.prevMouseDownTd) {
				const [row, col] = this.getCellPoint(this.prevMouseDownTd);
				begin = row;
				this.beginAllRow = row;
			} else if (this.selectArea) {
				begin = this.selectArea.begin.row;
				if (this.tableModel) {
					const tdModel =
						this.tableModel.table[this.selectArea.begin.row][
							this.selectArea.begin.col
						];
					if (
						!this.table.helper.isEmptyModelCol(tdModel) &&
						tdModel.element
					)
						this.focusCell(tdModel.element);
				}
			}
		}
		this.select(
			{ row: begin, col: 0 },
			{ row: end, col: this.tableModel.cols - 1 },
		);
	}

	selectCell(begin: NodeInterface, end: NodeInterface) {
		if (begin.name !== 'td' || end.name !== 'td') {
			return;
		}
		const beginPoint = this.getCellPoint(begin);
		const endPoint = this.getCellPoint(end);
		this.select(
			{ row: beginPoint[0], col: beginPoint[1] },
			{ row: endPoint[0], col: endPoint[1] },
		);
	}

	clearSelect() {
		this.select({ row: -1, col: -1 }, { row: -1, col: -1 });
	}

	select(
		begin: { row: number; col: number },
		end: { row: number; col: number },
	) {
		if (!this.tableModel) return;
		const isSame = begin.row === end.row && begin.col === end.col;
		let beginRow = Math.min(begin.row, end.row);
		let endRow = Math.max(begin.row, end.row);
		let beginCol = Math.min(begin.col, end.col);
		let endCol = Math.max(begin.col, end.col);

		this.tableRoot
			?.find('td[table-cell-selection]')
			.removeAttributes('table-cell-selection');

		const calc = (): Record<
			'beginCol' | 'beginRow' | 'endRow' | 'endCol',
			number
		> => {
			if (!this.tableModel)
				return {
					beginCol,
					beginRow,
					endCol,
					endRow,
				};
			for (let r = beginRow; r <= endRow; r++) {
				const row = this.tableModel.table[r];
				if (!row) continue;
				for (let c = beginCol; c <= endCol; c++) {
					const cell = row[c];
					if (!cell) continue;
					if (!this.table.helper.isEmptyModelCol(cell)) {
						if (
							c !== beginCol &&
							cell.colSpan + c - 1 === beginCol
						) {
							beginCol = c;
							return calc();
						}
						if (
							r !== beginRow &&
							cell.rowSpan + r - 1 === beginRow
						) {
							beginRow = r;
							return calc();
						}
						if (cell.rowSpan > 1 && endRow < cell.rowSpan - 1 + r) {
							endRow = cell.rowSpan - 1 + r;
							return calc();
						}
						if (cell.colSpan > 1 && endCol < cell.colSpan - 1 + c) {
							endCol = cell.colSpan - 1 + c;
							return calc();
						}
					} else {
						const parent =
							this.tableModel.table[cell.parent.row][
								cell.parent.col
							];
						if (this.table.helper.isEmptyModelCol(parent)) continue;
						if (
							parent.colSpan + cell.parent.col - 1 === beginCol &&
							cell.parent.col < beginCol
						) {
							beginCol = cell.parent.col;
							return calc();
						}
						if (
							parent.rowSpan + cell.parent.row - 1 === beginRow &&
							cell.parent.row < beginRow
						) {
							beginRow = cell.parent.row;
							return calc();
						}
						if (
							parent.rowSpan > 1 &&
							endRow < parent.rowSpan - 1 + cell.parent.row
						) {
							endRow = parent.rowSpan - 1 + cell.parent.row;
							return calc();
						}
						if (
							parent.colSpan > 1 &&
							endCol < parent.colSpan - 1 + cell.parent.col
						) {
							endCol = parent.colSpan - 1 + cell.parent.col;
							return calc();
						}
					}
				}
			}
			return {
				beginCol,
				beginRow,
				endCol,
				endRow,
			};
		};
		const result = calc();
		beginRow = result.beginRow;
		endRow = result.endRow;
		beginCol = result.beginCol;
		endCol = result.endCol;
		let count = 0;
		if (
			beginRow >= 0 &&
			beginCol >= 0 &&
			endRow < this.tableModel.rows &&
			endCol < this.tableModel.cols
		) {
			for (let r = beginRow; r <= endRow; r++) {
				for (let c = beginCol; c <= endCol; c++) {
					const row = this.tableModel.table[r];
					if (!row) continue;
					const col = row[c];
					if (!col) continue;
					if (!this.table.helper.isEmptyModelCol(col)) {
						if (!isSame && col.element) {
							$(col.element).attributes(
								'table-cell-selection',
								'true',
							);
						}
						count++;
					}
				}
			}
		}
		if (isSame && begin.row > -1 && begin.col > -1) {
			const cell = this.tableModel.table[begin.row][begin.col];
			if (
				cell &&
				!this.table.helper.isEmptyModelCol(cell) &&
				cell.element &&
				!this.prevMouseDownTd?.equal(cell.element)
			) {
				this.focusCell(cell.element);
			}
		}
		const allCol = beginCol === 0 && endCol === this.tableModel.cols - 1;
		const allRow = beginRow === 0 && endRow === this.tableModel.rows - 1;
		if (allCol && !this.beginAllRow) {
			this.beginAllRow = beginRow;
		} else if (!allCol && this.beginAllRow) {
			this.beginAllRow = undefined;
		}

		if (allRow && !this.beginAllCol) {
			this.beginAllCol = beginCol;
		} else if (!allRow && this.beginAllCol) {
			this.beginAllCol = undefined;
		}

		this.selectArea =
			count === 0 || isSame
				? undefined
				: {
						begin: { row: beginRow, col: beginCol },
						end: { row: endRow, col: endCol },
						count,
						allCol,
						allRow,
				  };
		this.emit('select', this.selectArea);
	}

	focusCell(cell: NodeInterface | Node, start: boolean = false) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change } = editor;
		if (isNode(cell)) cell = $(cell);
		const range = change.range.get();
		const editableElement = cell.find(EDITABLE_SELECTOR);
		if (editableElement.length > 0) {
			range
				.select(editableElement, true)
				.shrinkToElementNode()
				.shrinkToTextNode()
				.collapse(start);
			setTimeout(() => {
				change.range.select(range);
			}, 20);
			editableElement.get<HTMLElement>()?.focus();
			this.prevMouseDownTd = cell;
			this.selectCell(cell, cell);
		}
	}

	selectCellRange(cell: NodeInterface | Node) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		const { change } = editor;
		if (isNode(cell)) cell = $(cell);
		const range = change.range.get();
		const editableElement = cell.find(EDITABLE_SELECTOR);
		if (editableElement.length === 0) return;

		range.select(editableElement, true).shrinkToElementNode();
		const children = editableElement.children();
		const firstChildren = children.eq(0);
		if (children.length === 1 && firstChildren?.first()?.name === 'br') {
			range.collapse(false);
			change.range.select(range);
			editableElement.get<HTMLElement>()?.focus();
		} else {
			change.range.select(range);
		}
		this.prevMouseDownTd = cell;
		this.selectCell(cell, cell);
	}

	onTdMouseDown = (event: MouseEvent | TouchEvent) => {
		this.selectRange = undefined;
		const editor = this.editor;
		if (!event.target || !isEngine(editor)) return;
		const { change } = editor;
		const target = $(event.target);
		const td = target.closest('td');
		if (td.length === 0 || !td.inEditor()) return;
		const range = change.range.get();
		const [row, col] = this.getCellPoint(td);
		const isSelection = !!td.attributes('table-cell-selection');
		//shift 多选
		if (this.isShift) {
			let begin = { row: 0, col: 0 };
			if (this.prevMouseDownTd) {
				const [row, col] = this.getCellPoint(this.prevMouseDownTd);
				begin = { row, col };
			} else if (this.selectArea) {
				begin = this.selectArea.begin;
				if (this.tableModel) {
					const tdModel = this.tableModel.table[begin.row][begin.col];
					if (
						!this.table.helper.isEmptyModelCol(tdModel) &&
						tdModel.element
					)
						this.prevMouseDownTd = $(tdModel.element);
				}
			}

			this.select(begin, { row, col });
			return;
		} else {
			this.prevMouseDownTd = td;
			if (event instanceof MouseEvent && event.button !== 2)
				this.select({ row, col }, { row, col });
		}
		//点击单元格空白处，聚焦内部编辑区域
		if (
			target.name === 'td' &&
			(isSelection ||
				!range.startNode.closest('td').equal(td) ||
				!range.endNode.closest('td').equal(td))
		) {
			if (
				event instanceof MouseEvent &&
				event.button === 2 &&
				!!target.attributes('table-cell-selection')
			) {
				return;
			}
			event.preventDefault();
			this.focusCell(td);
		} else if (target.name === 'td') {
			event.preventDefault();
		}
		const next = () => {
			this.select({ row, col }, { row, col });
			this.dragging = {
				trigger: {
					element: td,
				},
			};
			this.addDragEvent();
		};
		// 右键不触发拖选
		if (event instanceof MouseEvent && event.button === 2) {
			if (!!target.attributes('table-cell-selection')) {
				event.preventDefault();
			}
			return;
		} else if (target.name === 'td') {
			const editableElement = td.find(EDITABLE_SELECTOR);
			if (editableElement.length > 0) {
				//获取到编辑器内最后一个子节点
				const block = editableElement.last();
				if (block) {
					// 不是块级卡片不处理
					if (!block.isBlockCard()) return next();
					//节点不可见不处理
					if (
						(block.get<HTMLElement>()?.offsetTop || 0) +
							(block.get<Element>()?.clientHeight || 0) >
						(event instanceof MouseEvent ? event : event.touches[0])
							.clientY
					)
						return next();
					const node = $('<p><br /></p>');
					editableElement.append(node);
					const range = editor.change.range.get();
					range.select(node, true).collapse(false);
					editor.change.apply(range);
				}
			}
		}
		next();
	};

	addDragEvent() {
		this.tableRoot?.addClass('drag-select');
		document.addEventListener(
			isMobile ? 'touchend' : 'mouseup',
			this.removeDragEvent,
			{ passive: true },
		);
		document.addEventListener(
			isMobile ? 'touchmove' : 'mousemove',
			this.onDragMove,
			{ passive: true },
		);
	}

	removeDragEvent = () => {
		this.tableRoot?.removeClass('drag-select');
		this.table.wrapper?.removeClass('drag-selecting');
		document.removeEventListener(
			isMobile ? 'touchend' : 'mouseup',
			this.removeDragEvent,
		);
		document.removeEventListener(
			isMobile ? 'touchmove' : 'mousemove',
			this.onDragMove,
		);
		this.dragging = undefined;
	};

	onDragMove = (event: MouseEvent | TouchEvent) => {
		if (!this.dragging || !event.target) return;
		const dragoverTd = $(event.target).closest('td');
		if (
			dragoverTd.length === 0 ||
			!dragoverTd.inEditor() ||
			(this.prevOverTd && dragoverTd.equal(this.prevOverTd))
		)
			return;
		this.prevOverTd = dragoverTd;
		if (!this.dragging.trigger.element.equal(dragoverTd)) {
			this.table.wrapper?.addClass('drag-selecting');
			this.selectCell(this.dragging.trigger.element, dragoverTd);
		} else {
			this.table.wrapper?.removeClass('drag-selecting');
			this.clearSelect();
		}
	};

	onShiftKeydown = (event: KeyboardEvent) => {
		if (!event.target || !this.tableModel || !isEngine(this.editor)) return;
		if (isHotkey('shift', event)) {
			this.isShift = true;
		}
	};

	onKeydown = (event: KeyboardEvent) => {
		if (!event.target || !this.tableModel || !isEngine(this.editor)) return;
		//获取单元格节点
		const td = $(event.target).closest('td');
		if (td.length === 0 || !td.inEditor()) {
			return;
		}
		//获取单元格位置
		const [row, col] = this.getCellPoint(td);
		if (row < 0 || col < 0) return;

		if (isHotkey('shift+left', event)) {
			this.selectLeft(event, td);
		} else if (isHotkey('shift+right', event)) {
			this.selectRigth(event, td);
		} else if (isHotkey('shift+up', event)) {
			this.selectUp(event, td);
		} else if (isHotkey('shift+down', event)) {
			this.selectDown(event, td);
		}
		if (isHotkey('shift', event)) {
			this.isShift = true;
		} else {
			if (this.selectRange) {
				this.isShift = false;
				this.selectRange = undefined;
			}
			if (
				isHotkey('tab', event) ||
				isHotkey('mod', event) ||
				isHotkey('opt', event) ||
				isHotkey('shift', event) ||
				event.ctrlKey ||
				event.metaKey ||
				event.shiftKey ||
				event.altKey
			)
				return;

			// 等待删除键删除后再清除选择
			setTimeout(() => {
				this.clearSelect();
			}, 50);
		}
	};

	onShiftKeyup = (event: KeyboardEvent) => {
		if (this.isShift === false && this.selectRange) {
			this.selectRange = undefined;
			this.clearSelect();
		}
		this.isShift = false;
	};

	selectLeft(event: KeyboardEvent, td: NodeInterface) {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		//获取单元格位置
		const [row, col] = this.getCellPoint(td);
		if (row < 0 || col < 0) return;
		const count = this.selectArea?.count || 0;
		//查看当前光标是否处于单元格可编辑节点的开始位置
		const range = editor.change.range.get();
		if (count === 0) {
			if (this.selectRange && this.selectRange.type === 'right') {
				if (range.endOffset !== this.selectRange.startOffset) {
					return;
				}
			}
			this.selectRange = {
				type: 'left',
				startOffset: range.startOffset,
				endOffset: range.endOffset,
			};
			const { startNode } = range;
			//光标不在开始位置，不执行操作
			if (range.startOffset !== 0) {
				return;
			}
			//如果还有上一级不执行操作
			if (startNode.prev()) return;
			//循环父级节点，要求父级节点在其开始位置
			let currentParent = startNode.parent();
			while (currentParent && !currentParent.isEditable()) {
				if (currentParent.prev()) return;
				currentParent = currentParent.parent();
			}
		}
		//总行数和列数
		const begin = this.selectArea?.begin || { row, col };
		const end = this.selectArea?.end || { row, col };
		const isLeft = begin.col !== col;
		let triggerCol = isLeft ? begin.col - 1 : end.col - 1;
		if (triggerCol < 0) return;
		event.preventDefault();
		if (triggerCol === col && count === 2) {
			triggerCol = -1;
		}
		if (isLeft) {
			this.select({ ...begin, col: triggerCol }, end);
		} else {
			this.select(begin, { ...end, col: triggerCol });
		}
	}

	selectRigth(event: KeyboardEvent, td: NodeInterface) {
		const editor = this.editor;
		if (!isEngine(editor) || !this.tableModel) return;
		event.stopPropagation();
		//获取单元格位置
		const [row, col] = this.getCellPoint(td);
		if (row < 0 || col < 0) return;
		const count = this.selectArea?.count || 0;
		//当前没有选择任何单元格的时候判断光标位置
		const range = editor.change.range.get();
		if (count === 0) {
			if (this.selectRange && this.selectRange.type === 'left') {
				if (range.startOffset !== this.selectRange.endOffset) {
					return;
				}
			}
			this.selectRange = {
				type: 'right',
				startOffset: range.startOffset,
				endOffset: range.endOffset,
			};
			//查看当前光标是否处于单元格可编辑节点的最后位置
			const { endNode } = range;
			//文本节点，光标不在最后位置，不执行操作
			if (endNode.isText() && range.endOffset !== endNode.text().length) {
				return;
			}
			//其它节点，光标不在最后位置，不执行操作
			const children = endNode.children();
			if (
				endNode.isElement() &&
				range.endOffset !== children.length &&
				endNode.last()?.name !== 'br'
			) {
				return;
			}
			//如果还有下一级不执行操作
			if (endNode.next()) return;
			//循环父级节点，要求父级节点在其末尾
			let currentParent = endNode.parent();
			while (currentParent && !currentParent.isEditable()) {
				if (currentParent.next()) return;
				currentParent = currentParent.parent();
			}
		}

		const { cols } = this.tableModel;

		const begin = this.selectArea?.begin || { row, col };
		const end = this.selectArea?.end || { row, col };
		const isLeft = begin.col !== col;

		let triggerCol = isLeft ? begin.col + 1 : end.col + 1;
		if (triggerCol > cols - 1) return;
		event.preventDefault();
		if (triggerCol === col && count === 2) {
			triggerCol = -1;
		}
		if (isLeft) {
			this.select({ ...begin, col: triggerCol }, end);
		} else this.select(begin, { ...end, col: triggerCol });
	}

	selectUp(event: KeyboardEvent, td: NodeInterface) {
		const editor = this.editor;
		if (!isEngine(editor) || !this.tableModel) return;
		//获取单元格位置
		const [row, col] = this.getCellPoint(td);
		if (row < 0 || col < 0) return;
		const count = this.selectArea?.count || 0;
		//当前没有选择任何单元格的时候判断光标位置
		const range = editor.change.range.get();
		if (count === 0) {
			if (this.selectRange && this.selectRange.type === 'bottom') {
				if (range.endOffset !== this.selectRange.startOffset) {
					return;
				}
			}
			this.selectRange = {
				type: 'top',
				startOffset: range.startOffset,
				endOffset: range.endOffset,
			};
			//查看当前光标是否处于单元格可编辑节点的开始位置
			const rangeRect = range.getBoundingClientRect();
			const tdRect = td.find(EDITABLE_SELECTOR).getBoundingClientRect();
			if (
				rangeRect.width !== 0 &&
				rangeRect.height === 0 &&
				rangeRect.top - (tdRect?.top || 0) > 10
			)
				return;
		}

		const begin = this.selectArea?.begin || { row, col };
		const end = this.selectArea?.end || { row, col };
		const isUp = begin.row !== row;

		let triggerRow = isUp ? begin.row - 1 : end.row - 1;
		event.preventDefault();
		if (triggerRow < 0) return;

		if (triggerRow === row && count === 2) {
			triggerRow = -1;
		}
		if (isUp) {
			this.select({ ...begin, row: triggerRow }, end);
		} else this.select(begin, { ...end, row: triggerRow });
	}

	selectDown(event: KeyboardEvent, td: NodeInterface) {
		const editor = this.editor;
		if (!isEngine(editor) || !this.tableModel) return;
		//获取单元格位置
		const [row, col] = this.getCellPoint(td);
		if (row < 0 || col < 0) return;
		const count = this.selectArea?.count || 0;
		//当前没有选择任何单元格的时候判断光标位置
		const range = editor.change.range.get();
		range.shrinkToElementNode();
		if (count === 0) {
			if (this.selectRange && this.selectRange.type === 'top') {
				if (range.startOffset !== this.selectRange.endOffset) {
					return;
				}
			}
			this.selectRange = {
				type: 'bottom',
				startOffset: range.startOffset,
				endOffset: range.endOffset,
			};
			//查看当前光标是否处于单元格可编辑节点的开始位置
			const rangeRect = range.getBoundingClientRect();
			const tdRect = td.find(EDITABLE_SELECTOR).getBoundingClientRect();
			if (
				rangeRect.width !== 0 &&
				rangeRect.height === 0 &&
				(tdRect?.bottom || 0) - rangeRect.bottom > 10
			)
				return;
		}

		const { rows } = this.tableModel;
		const begin = this.selectArea?.begin || { row, col };
		const end = this.selectArea?.end || { row, col };
		const isUp = begin.row !== row;

		let triggerRow = isUp ? begin.row + 1 : end.row + 1;
		if (triggerRow > rows - 1) return;
		event.preventDefault();
		if (triggerRow === row && count === 2) {
			triggerRow = -1;
		}
		if (isUp) {
			this.select({ ...begin, row: triggerRow }, end);
		} else this.select(begin, { ...end, row: triggerRow });
	}

	getSelectionHtml(all: boolean = false) {
		const { tableModel } = this;
		const { helper } = this.table;
		if (!tableModel || !this.tableRoot) return null;
		let begin = { row: 0, col: 0 };
		let end = { row: tableModel.rows - 1, col: tableModel.cols - 1 };
		if (!all) {
			const area = this.getSelectArea();
			begin = area.begin;
			end = area.end;
		}

		const colsEl = this.tableRoot.find('col');
		let cols = [];
		let tableWidth = 0;

		for (let c = begin.col; c <= end.col; c++) {
			const colElement = colsEl.eq(c)?.get<HTMLTableColElement>();
			if (!colElement) continue;
			cols.push('<col width="'.concat(colElement.width, '" />'));
			tableWidth += parseInt(colElement.width);
		}

		const colgroup = '<colgroup>'.concat(cols.join(''), '</colgroup>');
		let trHtml = [];

		for (let r = begin.row; r <= end.row; r++) {
			let tdHtml = [];
			let trHeight = undefined;
			for (let _c2 = begin.col; _c2 <= end.col; _c2++) {
				const tdModel = tableModel.table[r][_c2];
				let rowRemain = undefined;
				let colRemain = undefined;
				let tdClone = undefined;

				if (!helper.isEmptyModelCol(tdModel) && tdModel.element) {
					tdClone = tdModel.element.cloneNode(true);
					if (tdModel.element.parentElement)
						trHeight = $(tdModel.element.parentElement).css(
							'height',
						);
				}

				if (!helper.isEmptyModelCol(tdModel) && tdModel.isMulti) {
					// 合并单元格尾部被选区切断的情况，需要重新计算合并单元格的跨度
					rowRemain =
						Math.min(r + tdModel.rowSpan - 1, end.row) - r + 1;
					colRemain =
						Math.min(_c2 + tdModel.colSpan - 1, end.col) - _c2 + 1;
				}

				if (helper.isEmptyModelCol(tdModel)) {
					const parentTd =
						tableModel.table[tdModel.parent.row][
							tdModel.parent.col
						];
					// 选区中含有合并单元格的一部分时，需要补充这一部分的dom结构，这种情况只会出现在行列选择时
					// 列选择时，切断合并单元格后，第一个和父单元格同行，并在选取左测第一个列的位置，补充此单元格
					if (
						tdModel.parent.row === r &&
						tdModel.parent.col < begin.col &&
						_c2 === begin.col
					) {
						const colCut = begin.col - tdModel.parent.col;
						if (!helper.isEmptyModelCol(parentTd)) {
							colRemain = Math.min(
								parentTd.colSpan - colCut,
								end.col - begin.col + 1,
							);
							rowRemain = parentTd.rowSpan;
							tdClone = parentTd.element?.cloneNode(true);
						}
					}
					// 行选择时，切断合并单元格后，第一个和父单元格同列，并在选取上测第一个行的位置，补充此单元格
					if (
						tdModel.parent.col === _c2 &&
						tdModel.parent.row < begin.row &&
						r === begin.row
					) {
						const rowCut = begin.row - tdModel.parent.row;
						if (!helper.isEmptyModelCol(parentTd)) {
							rowRemain = Math.min(
								parentTd.rowSpan - rowCut,
								end.row - begin.row + 1,
							);
							colRemain = parentTd.colSpan;
							tdClone = parentTd.element?.cloneNode(true);
						}
					}
				}

				if (tdClone) {
					tdClone = tdClone as HTMLElement;
					if (rowRemain)
						tdClone.setAttribute('rowspan', `${rowRemain}`);
					if (colRemain)
						tdClone.setAttribute('colspan', `${colRemain}`);
					const editoableElement = tdClone.firstChild as HTMLElement;
					if (
						editoableElement.classList.contains(
							'table-main-content',
						)
					) {
						const copyNode = tdClone.cloneNode(
							false,
						) as HTMLElement;
						copyNode.innerHTML = editoableElement.innerHTML;
						tdHtml.push(copyNode.outerHTML);
					} else {
						tdHtml.push(tdClone.outerHTML);
					}
				}
			}
			const trElement = $(`<tr>${tdHtml.join('')}</tr>`);
			if (trHeight) trElement.css('height', trHeight);
			trHtml.push(trElement.get<HTMLElement>()!.outerHTML);
		}

		return `<body><meta name="aomao" content="table" /><table style="width:${tableWidth}px">${colgroup}${trHtml.join(
			'',
		)}</table></body>`;
	}

	hasMergeCell() {
		const { table, tableModel } = this;
		if (!tableModel) return false;
		const { begin, end, count } = this.getSelectArea();
		if (count !== 1) return false;
		const cell = tableModel.table[begin.row][begin.col];
		return !table.helper.isEmptyModelCol(cell) && cell.isMulti === true;
	}

	isRowSelected() {
		return !!this.selectArea && this.selectArea.allRow;
	}

	isColSelected() {
		return !!this.selectArea && this.selectArea.allCol;
	}

	isTableSelected() {
		return (
			!!this.selectArea &&
			this.selectArea.allCol &&
			this.selectArea.allRow
		);
	}

	showHighlight(area: TableSelectionArea) {
		const { helper } = this.table;
		const { tableModel } = this;
		if (!tableModel) return;

		const { begin, end, allCol, allRow } = area;
		if (begin.row < 0 || begin.col < 0) return;
		const fBeginRow = begin.row;
		const fEndRow = end.row;
		const fBeginCol = begin.col;
		const fEndCol = end.col;
		this.hideHighlight();
		const colsHeader = this.colsHeader?.find(
			Template.COLS_HEADER_ITEM_CLASS,
		);
		const rowsHeader = this.rowsHeader?.find(
			Template.ROWS_HEADER_ITEM_CLASS,
		);
		for (let row = fBeginRow; row <= fEndRow; row++) {
			for (let col = fBeginCol; col <= fEndCol; col++) {
				const cell = tableModel.table[row][col];
				if (this.table.helper.isEmptyModelCol(cell)) {
					if (begin.row > cell.parent.row)
						begin.row = cell.parent.row;
					if (begin.col >= cell.parent.col)
						begin.col = cell.parent.col;
					const parent =
						tableModel.table[cell.parent.row][cell.parent.col];
					if (!this.table.helper.isEmptyModelCol(parent)) {
						if (
							parent.rowSpan > 1 &&
							end.row < parent.rowSpan - 1 + cell.parent.row
						)
							end.row = parent.rowSpan - 1 + cell.parent.row;
						if (
							parent.colSpan > 1 &&
							end.col < parent.colSpan - 1 + cell.parent.col
						)
							end.col = parent.colSpan - 1 + cell.parent.col;
					}
				} else if (!this.table.helper.isEmptyModelCol(cell)) {
					if (cell.rowSpan > 1 && end.row < cell.rowSpan - 1 + row)
						end.row = cell.rowSpan - 1 + row;
					if (cell.colSpan > 1 && end.col < cell.colSpan - 1 + col)
						end.col = cell.colSpan - 1 + col;
				}
			}
		}

		let height: number = 0;
		let width: number = 0;
		for (let r = begin.row; r <= end.row; r++) {
			const cell = tableModel.table[r][begin.col];
			if (!helper.isEmptyModelCol(cell) && cell.element) {
				height += cell.element.offsetHeight;
				rowsHeader?.eq(r)?.addClass('active');
			}
		}

		for (let c = begin.col; c <= end.col; c++) {
			const cell = tableModel.table[begin.row][c];
			if (!helper.isEmptyModelCol(cell) && cell.element) {
				width += cell.element.offsetWidth;
				colsHeader?.eq(c)?.addClass('active');
			}
		}

		if (
			end.row === tableModel.rows - 1 &&
			end.col === tableModel.cols - 1
		) {
			this.tableHeader?.addClass('active');
		}

		const firstCell = tableModel.table[begin.row][begin.col];
		let top = 0;
		let left = 0;
		if (!helper.isEmptyModelCol(firstCell) && firstCell.element) {
			const viewport = this.tableRoot?.parent();
			const vRect = viewport?.getBoundingClientRect();
			const rect = firstCell.element.getBoundingClientRect();
			top += rect.top - (vRect?.top || 0) - 13;
			left += rect.left - (vRect?.left || 0);
		}

		const sLeft =
			removeUnit(
				this.table.wrapper?.find('.data-scrollbar')?.css('left') || '0',
			) + removeUnit(this.table.wrapper?.css('margin-left') || '0');
		left += sLeft;

		const headerHeight =
			this.colsHeader
				?.find(Template.COLS_HEADER_ITEM_CLASS)
				.get<HTMLElement>()?.offsetHeight || 0;
		top += headerHeight;

		if (height > 0 && width > 0) {
			this.highlight?.css('width', `${width}px`);
			this.highlight?.css('height', `${height}px`);
			this.highlight?.css('top', `${top}px`);
			this.highlight?.css('left', `${left}px`);
			this.highlight?.show('block');
			this.table.wrapper?.addClass('data-table-highlight');
			if (allCol) {
				this.table.wrapper?.addClass('data-table-highlight-row');
			}
			if (allRow) {
				this.table.wrapper?.addClass('data-table-highlight-col');
			}
			if (allCol && allRow) {
				this.table.wrapper?.addClass('data-table-highlight-all');
			}
		}
	}

	hideHighlight() {
		this.highlight?.hide();
		this.colsHeader?.find('.active').removeClass('active');
		this.rowsHeader?.find('.active').removeClass('active');
		this.tableHeader?.removeClass('active');
		this.table.wrapper?.removeClass('data-table-highlight');
		this.table.wrapper?.removeClass('data-table-highlight-row');
		this.table.wrapper?.removeClass('data-table-highlight-col');
		this.table.wrapper?.removeClass('data-table-highlight-all');
	}

	destroy() {
		this.unbindEvents();
	}
}

export default TableSelection;
