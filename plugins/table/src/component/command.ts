import {
	$,
	ClipboardData,
	DATA_ID,
	DATA_TRANSIENT_ATTRIBUTES,
	EditorInterface,
	isEngine,
	NodeInterface,
	Parser,
	removeUnit,
} from '@aomao/engine';
import { EventEmitter2 } from 'eventemitter2';
import { TableCommandInterface, TableInterface } from '../types';
import Template from './template';

class TableCommand extends EventEmitter2 implements TableCommandInterface {
	private editor: EditorInterface;
	private table: TableInterface;
	private tableCleared: boolean = false;
	private rowCleared: boolean = false;
	private colCleared: boolean = false;
	tableRoot?: NodeInterface;
	colsHeader?: NodeInterface;
	rowsHeader?: NodeInterface;
	tableHeader?: NodeInterface;
	viewport?: NodeInterface;

	constructor(editor: EditorInterface, table: TableInterface) {
		super();
		this.editor = editor;
		this.table = table;
	}

	init() {
		const { wrapper } = this.table;
		if (!wrapper) return;
		this.tableRoot = wrapper.find(Template.TABLE_CLASS);
		this.colsHeader = wrapper.find(Template.COLS_HEADER_CLASS);
		this.rowsHeader = wrapper.find(Template.ROWS_HEADER_CLASS);
		this.tableHeader = wrapper.find(Template.HEADER_CLASS);
		this.viewport = wrapper.find(Template.VIEWPORT);
	}

	insertColAt(
		index: number,
		count: number,
		isLeft?: boolean,
		widths?: number | Array<number>,
		...args: any
	) {
		const { selection, wrapper } = this.table;
		const { tableModel } = selection;
		if (!wrapper || !tableModel || !this.tableRoot) return;
		// 第一行插在前面，其他行插在后面
		const colBase = index;
		const insertMethod = isLeft ? 'after' : 'before';
		let colsHeader = wrapper.find(Template.COLS_HEADER_ITEM_CLASS);
		const baseColHeader = colsHeader.eq(colBase)?.get<HTMLElement>()!;

		const insertCol = isLeft ? colBase + 1 : colBase;
		const head = wrapper.find(Template.COLS_HEADER_CLASS);
		const table = wrapper.find(Template.TABLE_CLASS);

		if (!widths) {
			widths = baseColHeader.offsetWidth;
		}

		const containerWidth = this.table.root.width();
		const minWidth = this.table.colMinWidth;
		const colsWidths: number[] = [];
		colsHeader.each((_, index) => {
			const col = colsHeader.eq(index);
			if (col) colsWidths.push(removeUnit(col.css('width')));
		});
		if (Array.isArray(widths)) {
			for (let i = 0; i < widths.length; i++) {
				colsWidths.splice(insertCol + i, 0, widths[i]);
			}
		} else if (typeof widths === 'number') {
			for (let i = 0; i < count; i++) {
				colsWidths.splice(insertCol, 0, widths);
			}
		}
		let gridWidth = colsWidths.reduce((a, b) => a + b, 0);
		while (!this.table.enableScroll && gridWidth > containerWidth) {
			let minCount = 0;
			for (let i = 0; i < colsWidths.length; i++) {
				const w = colsWidths[i];
				if (w > minWidth) {
					colsWidths[i] = w - 1;
					gridWidth--;
					if (gridWidth <= containerWidth) break;
				} else {
					minCount++;
				}
			}
			if (minCount === colsWidths.length) break;
		}

		head.css('width', gridWidth + 'px');
		table.css('width', gridWidth + 'px');

		const colgroup = this.tableRoot.find('colgroup');
		const trs = wrapper.find('tr');
		let cols = this.tableRoot.find('col');
		const cloneNode = cols.eq(colBase)?.clone();
		if (!cloneNode) return;
		let counter = count;
		const nodeId = this.editor.nodeId;
		while (counter > 0) {
			// 插入头 和 col
			const cloneColHeader = $(baseColHeader.outerHTML);
			$(baseColHeader)[insertMethod](cloneColHeader);
			// const width = Array.isArray(widths)
			// 	? widths[count - counter]
			// 	: widths;

			// cloneColHeader.css({ width: `${width}px` });
			const insertCloneCol = cloneNode?.clone();
			insertCloneCol.removeAttributes(DATA_ID);
			// insertCloneCol.attributes('width', width);
			nodeId.create(insertCloneCol);
			const baseCol = cols[index];
			if (insertMethod === 'after') $(baseCol).after(insertCloneCol);
			else colgroup[0].insertBefore(insertCloneCol[0], baseCol);
			counter--;
		}
		// 插入了新列，需要重新获取
		colsHeader = wrapper.find(Template.COLS_HEADER_ITEM_CLASS);
		cols = this.tableRoot.find('col');
		// 设置宽度
		for (let i = 0; i < colsWidths.length; i++) {
			const width = colsWidths[i];
			colsHeader.eq(i)?.css({ width: `${width}px` });
			cols.eq(i)?.attributes('width', width);
		}

		// 插入 td
		trs.each((tr, r) => {
			const insertIndex = selection.getCellIndex(r, insertCol);
			for (let r = 0; r < count; r++) {
				const td = (tr as HTMLTableRowElement).insertCell(insertIndex);
				td.innerHTML = this.table.template.getEmptyCell();
				$(td).attributes(
					DATA_TRANSIENT_ATTRIBUTES,
					'table-cell-selection',
				);
				nodeId.generate(td);
			}
		});

		this.emit('actioned', 'insertCol', ...args);
		// 必须等插入完在选择，否则 tableModel 没更新
		if (selection.selectArea) {
			selection.selectCol(index, index + count - 1);
		}
	}

	insertCol(
		position?: 'left' | 'end' | 'right',
		count: number = 1,
		...args: any
	) {
		const { selection, wrapper } = this.table;
		const { tableModel } = selection;
		if (!wrapper || !tableModel) return;
		const selectArea = selection.getSelectArea();
		let isLeft = position === 'left';
		const isEnd = position === 'end' || !position;

		const colBars = wrapper.find(Template.COLS_HEADER_ITEM_CLASS);
		let colBase = tableModel.cols - 1;

		if (!isEnd) {
			colBase = isLeft ? selectArea.begin.col : selectArea.end.col;
		}

		let insertCol = isLeft ? colBase - 1 : colBase + 1;
		// 插入的列索引小于0，
		if (insertCol < 0) {
			insertCol = 0;
			isLeft = false;
		} else if (!isLeft && colBase === tableModel.cols - 1) {
			insertCol--;
			isLeft = true;
		}
		const width = colBars.eq(colBase)?.get<HTMLElement>()!.offsetWidth;

		this.insertColAt(insertCol, count, isLeft, width, ...args);
		if (isEnd && this.table.enableScroll) {
			const viewPort = this.viewport?.get<HTMLElement>();
			if (!viewPort) return;
			viewPort.scrollLeft = viewPort.scrollWidth - viewPort.offsetWidth;
		}
	}

	removeCol(...args: any) {
		const { selection, conltrollBar, helper } = this.table;
		const { tableModel } = selection;
		if (!tableModel || !this.tableRoot) return;
		const table = tableModel.table;
		const selectArea = { ...selection.getSelectArea() };
		if (selectArea.end.col - selectArea.begin.col === 0) {
			selection.each((cell) => {
				if (!helper.isEmptyModelCol(cell)) {
					selectArea.end.col += cell.colSpan - 1;
				}
			});
		}
		const count = selectArea.end.col - selectArea.begin.col + 1;
		const colgroup = this.tableRoot.find('colgroup');
		let trs = this.tableRoot.find('tr');
		let cols = colgroup.find('col');
		if (selectArea.allCol) {
			this.removeTable();
			return;
		}

		for (let c = selectArea.end.col; c >= selectArea.begin.col; c--) {
			conltrollBar.removeCol(c);
			cols.eq(c)?.remove();
		}

		table.forEach((trModel, r) => {
			for (
				let _c = selectArea.end.col;
				_c >= selectArea.begin.col;
				_c--
			) {
				const tdModel = trModel[_c];
				if (helper.isEmptyModelCol(tdModel)) {
					// 删除列如果在单元格内，修正单元格的 colSpan
					const parentTd =
						table[tdModel.parent.row][tdModel.parent.col];
					if (
						!helper.isEmptyModelCol(parentTd) &&
						tdModel.parent.col < selectArea.begin.col
					) {
						const colRemoved = Math.min(
							count,
							tdModel.parent.col +
								parentTd.colSpan -
								selectArea.begin.col,
						);
						if (parentTd.element) {
							(
								parentTd.element as HTMLTableDataCellElement
							).colSpan = parentTd.colSpan - colRemoved;
						}
					}
					continue;
				} else {
					if (tdModel.isMulti) {
						// 合并单元格的头部被切掉，要生成尾部单元格补充到行内
						const cutHeader =
							_c + tdModel.colSpan - 1 > selectArea.end.col;
						const cutCount = selectArea.end.col + 1 - _c;

						if (cutHeader) {
							let insertIndex = 0;

							for (let i = 0; i <= selectArea.end.col; i++) {
								if (!helper.isEmptyModelCol(trModel[i])) {
									insertIndex++;
								}
							}

							const td = trs
								.eq(r)
								?.get<HTMLTableRowElement>()
								?.insertCell(insertIndex);
							if (!td) return;
							td.setAttribute(
								DATA_TRANSIENT_ATTRIBUTES,
								'table-cell-selection',
							);
							td.innerHTML = this.table.template.getEmptyCell();
							td.colSpan = tdModel.colSpan - cutCount;
							td.rowSpan = tdModel.rowSpan;
							this.editor.nodeId.generate(td);
							//if(tdModel.element)
							//    helper.copyCss(tdModel.element, td)
						}
					}
					tdModel.element?.remove();
				}
			}
		});
		this.emit('actioned', 'removeCol', ...args);
	}

	insertColLeft(count: number = 1) {
		this.insertCol('left', count);
	}

	insertColRight(count: number = 1) {
		this.insertCol('right', count);
	}

	insertRowAt(index: number, count: number, isUp?: boolean, ...args: any) {
		const { wrapper, selection, helper } = this.table;
		const { tableModel } = selection;
		if (!wrapper || !tableModel) return;

		const insertMethod = isUp ? 'after' : 'before';
		const baseRow = index;
		const rowBars = wrapper.find(Template.ROWS_HEADER_ITEM_CLASS);
		const baseRowBar = rowBars[baseRow];
		const insertRow = isUp ? baseRow : baseRow + 1;
		let insertTdProps: Array<{ tdBase: HTMLTableCellElement }> = [];
		const trModel = tableModel.table[baseRow];
		trModel.forEach((tdModel, c) => {
			if (!helper.isEmptyModelCol(tdModel) && tdModel.isMulti) {
				if (
					!isUp &&
					tdModel.rowSpan > 1 &&
					insertRow <= baseRow + tdModel.rowSpan - 1
				) {
					(tdModel.element as HTMLTableCellElement).rowSpan =
						tdModel.rowSpan + count;
				} else {
					insertTdProps.push({
						tdBase: tdModel.element as HTMLTableCellElement,
					});
				}
				return;
			}

			if (helper.isEmptyModelCol(tdModel)) {
				const parentTd =
					tableModel.table[tdModel.parent.row][tdModel.parent.col];
				if (
					!helper.isEmptyModelCol(parentTd) &&
					tdModel.parent.row < insertRow &&
					tdModel.parent.row + parentTd.rowSpan - 1 >= insertRow
				) {
					(parentTd.element as HTMLTableCellElement).rowSpan =
						parentTd.rowSpan + count;
				} else {
					if (
						!helper.isEmptyModelCol(parentTd) &&
						tdModel.parent.row < baseRow &&
						tdModel.parent.col === c
					) {
						insertTdProps.push({
							tdBase: parentTd.element as HTMLTableCellElement,
						});
					}
				}
				return;
			}
			insertTdProps.push({
				tdBase: tdModel.element as HTMLTableCellElement,
			});
		});
		let _count = count;
		const nodeId = this.editor.nodeId;
		const _loop = () => {
			const tr = this.tableRoot
				?.get<HTMLTableElement>()
				?.insertRow(insertRow);
			if (!tr) return;
			insertTdProps.forEach((props) => {
				const td = tr.insertCell();
				td.setAttribute(
					DATA_TRANSIENT_ATTRIBUTES,
					'table-cell-selection',
				);
				td.innerHTML = this.table.template.getEmptyCell();
				td.colSpan = props.tdBase.colSpan;
			});
			$(baseRowBar)[insertMethod](
				$((baseRowBar as HTMLElement).outerHTML),
			);
			nodeId.generate(tr);
			nodeId.generateAll(tr);
			_count--;
		};

		while (_count > 0) {
			_loop();
		}

		this.emit('actioned', 'insertRow', ...args);
		// 必须等插入完在选择，否则 tableModel 没更新
		if (selection.selectArea) {
			selection.selectRow(index, index + count - 1);
		}
	}

	insertRow(
		position?: 'up' | 'end' | 'down',
		count: number = 1,
		...args: any
	) {
		const { selection, helper } = this.table;
		const { tableModel } = selection;
		if (!tableModel) return;
		const selectArea = selection.getSelectArea();
		let isUp = position === 'up';
		const isEnd = position === 'end' || !position;
		let baseRow = tableModel.rows - 1;

		if (!isEnd) {
			let rows = selectArea.end.row;
			selection.each((cell) => {
				if (!helper.isEmptyModelCol(cell)) {
					rows += cell.rowSpan - 1;
				}
			});
			baseRow = isUp ? selectArea.begin.row : rows;
		}
		let insertRow = isUp ? baseRow : baseRow;

		this.insertRowAt(insertRow, count, isUp, ...args);
	}

	insertRowUp(count: number = 1) {
		this.insertRow('up', count);
	}

	insertRowDown(count: number = 1) {
		this.insertRow('down', count);
	}

	removeRow(...args: any) {
		const { selection, conltrollBar, helper } = this.table;
		const { tableModel } = selection;
		if (!tableModel || !this.tableRoot) return;
		const table = tableModel.table;
		const selectArea = { ...selection.getSelectArea() };
		const { begin, end } = selectArea;
		// 单独选中一行，就计算是否有合并的单元格
		if (end.row - begin.row === 0) {
			selection.each((cell) => {
				if (!helper.isEmptyModelCol(cell)) {
					end.row += cell.rowSpan - 1;
				}
			});
		}

		const count = end.row - begin.row + 1;
		const trs = this.tableRoot.find('tr');

		if (selectArea.allRow) {
			this.removeTable();
			return;
		}
		// 修正 rowSpan 和 补充单元格
		const _loop = (r: number) => {
			const trModel = table[r];
			trModel.forEach((tdModel, c) => {
				if (
					!helper.isEmptyModelCol(tdModel) &&
					tdModel.isMulti &&
					tdModel.rowSpan > 1
				) {
					// 合并单元格头部被切掉，需要补充 td
					if (r + tdModel.rowSpan - 1 > end.row) {
						const insertIndex = selection.getCellIndex(
							end.row + 1,
							c,
						);
						const td = (
							trs[end.row + 1] as HTMLTableRowElement
						).insertCell(insertIndex);
						const cutCount = end.row - r + 1;
						td.setAttribute(
							DATA_TRANSIENT_ATTRIBUTES,
							'table-cell-selection',
						);
						td.innerHTML = this.table.template.getEmptyCell();
						td.colSpan = tdModel.colSpan;
						td.rowSpan = tdModel.rowSpan - cutCount;
						this.editor.nodeId.generate(td);
					}
				}

				if (helper.isEmptyModelCol(tdModel)) {
					const parentTd =
						table[tdModel.parent.row][tdModel.parent.col]; // 合并单元格尾部或中部被切掉，修正 rowSpan
					if (
						!helper.isEmptyModelCol(parentTd) &&
						tdModel.parent.row < begin.row
					) {
						const _cutCount = Math.min(
							count,
							tdModel.parent.row + parentTd.rowSpan - begin.row,
						);
						(parentTd.element as HTMLTableDataCellElement).rowSpan =
							parentTd.rowSpan - _cutCount;
					}
				}
			});
		};

		for (let r = begin.row; r <= end.row; r++) {
			_loop(r);
		}

		for (let r = end.row; r >= begin.row; r--) {
			this.tableRoot.get<HTMLTableElement>()?.deleteRow(r);
			conltrollBar.removeRow(r);
		}
		this.emit('actioned', 'removeRow', ...args);
	}

	removeTable() {
		const editor = this.editor;
		if (!isEngine(editor)) this.emit('tableRemoved');
		editor.card.remove(this.table.id);
	}

	copy(all: boolean = false) {
		const { selection, helper } = this.table;
		const areaHtml = selection.getSelectionHtml(all);
		if (!areaHtml) return;
		this.editor.clipboard.copy(areaHtml);
		helper.copyHTML(areaHtml);
	}

	mockCopy() {
		const { selection, helper } = this.table;
		const areaHtml = selection.getSelectionHtml();
		if (!areaHtml) return;
		helper.copyHTML(areaHtml);
	}

	shortcutCopy(event: ClipboardEvent) {
		const { selection, helper } = this.table;
		const areaHtml = selection.getSelectionHtml();
		if (!areaHtml) return;
		event.clipboardData?.clearData();
		event.clipboardData?.setData('text/plain', $(areaHtml).html());
		event.clipboardData?.setData('text/html', areaHtml);
		helper.copyHTML(areaHtml);
		event.preventDefault();
	}

	cut() {
		this.copy();
		this.clear();
	}

	shortcutCut(event: ClipboardEvent) {
		this.shortcutCopy(event);
		this.clear();
	}

	clear() {
		const { selection, helper } = this.table;
		const selectArea = selection.getSelectArea();

		if (selectArea.allCol && selectArea.allRow) {
			if (this.tableCleared) {
				this.removeTable();
				this.tableCleared = false;
				return;
			}
			this.tableCleared = true;
		}

		if (selectArea.allRow) {
			if (this.rowCleared) {
				this.removeRow();
				this.rowCleared = false;
				return;
			}
			this.rowCleared = true;
		}

		if (selectArea.allCol) {
			if (this.colCleared) {
				this.removeCol();
				this.colCleared = false;
				return;
			}
			this.colCleared = true;
		}

		selection.each((tdModel) => {
			if (!helper.isEmptyModelCol(tdModel) && tdModel.element) {
				tdModel.element.innerHTML = this.table.template.getEmptyCell();
			}
		});
		this.emit('actioned', 'clear');
	}

	clearFormat = () => {
		const { selection, helper } = this.table;
		const selectArea = selection.getSelectArea();
		selection.each((tdModel) => {
			if (!helper.isEmptyModelCol(tdModel) && tdModel.element) {
				tdModel.element.removeAttribute('style');
			}
		});
		this.emit('actioned', 'clearFormat');
	};

	hasCopyData = () => {
		return !!this.table.helper.getCopyData();
	};

	clearCopyData = () => {
		this.table.helper.clearCopyData();
	};

	mockPaste(...args: any) {
		const data = this.table.helper.getCopyData();
		if (!data) return;
		this.paste(data as ClipboardData, ...args);
	}

	shortcutPaste(event: ClipboardEvent) {
		event.preventDefault();
		event.stopPropagation();
		const data = this.editor.clipboard.getData(event);
		this.paste(data);
	}

	paste(data: ClipboardData, ...args: any) {
		const { selection, helper } = this.table;
		const { tableModel } = selection;
		if (!tableModel) return;
		const selectArea = selection.getSelectArea();
		const { begin, end } = selectArea;
		const isSingleTd = begin.row === end.row && begin.col === end.col;
		const { html, text } = data;
		if (!html) return;
		const editor = this.editor;
		const { schema, conversion } = editor;
		const pasteHTML = new Parser(html, editor).toValue(schema, conversion);
		const element = helper.trimBlankSpan($(pasteHTML));
		editor.nodeId.generateAll(element, true);
		if (element.name === 'table') {
			helper.normalizeTable(element);
			const pasteTableModel = helper.getTableModel(element);
			const rowCount = pasteTableModel.rows;
			const colCount = pasteTableModel.cols;
			const startCell = pasteTableModel.table[0][0];
			const row = tableModel.table[begin.row];
			if (!row) return;
			const cell = row[begin.col];
			if (
				!cell ||
				helper.isEmptyModelCol(startCell) ||
				helper.isEmptyModelCol(cell)
			)
				return;
			const { rowSpan, colSpan } = startCell;
			const isPasteSingle = rowSpan === rowCount && colSpan === colCount;

			if (isPasteSingle && !selectArea && startCell.element) {
				helper.copyTo(startCell.element, cell.element!);
				this.emit('actioned', 'paste', ...args);
				return;
			}
			// 只在选中一个非合并单元格的时候才会延伸平铺，遇到表格边界会自动增加行列
			// 若选中的是一个区域或合并单元格，则只要将区域中的单元格填充上数据即可
			if (isSingleTd) {
				if (colCount + begin.col > tableModel.cols) {
					const insertColCount =
						colCount + begin.col - tableModel.cols;
					this.insertCol('end', insertColCount, true);
				}

				if (rowCount + begin.row > tableModel.rows) {
					const insertRowCount =
						rowCount + begin.row - tableModel.rows;
					this.insertRow('end', insertRowCount, true);
				}
				// 选中和将要粘贴表格等大的区域
				selection.select(begin, {
					row: begin.row + rowCount - 1,
					col: begin.col + colCount - 1,
				});
			}

			const newArea = selection.getSelectArea();

			// 先拆分单元格，拷贝的表格中可能有合并单元格，需要重新复制合并单元格情况
			if (!args[0]) this.splitCell(true);
			selection.each((tdModel, r, c) => {
				const paste_r = (r - newArea.begin.row) % rowCount;
				const paste_c = (c - newArea.begin.col) % colCount;
				const paste_td = pasteTableModel.table[paste_r][paste_c];

				if (!paste_td) {
					return;
				}

				if (
					!helper.isEmptyModelCol(paste_td) &&
					paste_td.isMulti &&
					!helper.isEmptyModelCol(tdModel)
				) {
					const element = tdModel.element as HTMLTableCellElement;
					element.rowSpan = Math.min(
						paste_td.rowSpan,
						newArea.end.row - r + 1,
					);
					element.colSpan = Math.min(
						paste_td.colSpan,
						newArea.end.col - c + 1,
					);
					helper.copyTo(paste_td.element!, element);
					return;
				}

				if (helper.isEmptyModelCol(paste_td)) {
					if (!helper.isEmptyModelCol(tdModel)) {
						tdModel.element?.remove();
					}
					return;
				}

				if (paste_td.element) {
					if (!helper.isEmptyModelCol(tdModel) && tdModel.element)
						helper.copyTo(paste_td.element, tdModel.element);
				}
			});
		} else {
			this.mergeCell(true);
		}
		this.emit('actioned', 'paste', ...args);
	}

	mergeCell(...args: any) {
		const { selection, helper } = this.table;
		const { selectArea, tableModel } = selection;
		if (!selectArea || !tableModel) return;
		const { begin, end } = selectArea;
		const row_count = end.row - begin.row + 1;
		const col_count = end.col - begin.col + 1;
		let content: Array<string> = [];
		let mergeTd: HTMLTableCellElement | null = null;
		this.splitCell();
		selection.select(begin, end);
		selection.each((tdModel, r, c) => {
			if (helper.isEmptyModelCol(tdModel)) return;
			if (c === begin.col && r === begin.row) {
				mergeTd = tdModel.element as HTMLTableCellElement;
				mergeTd.rowSpan = row_count;
				mergeTd.colSpan = col_count;
				return;
			}

			if (tdModel.element) {
				// 空单元格里面也有 html，只有在有实际内容时才会在合并的时候将内容合并
				if (tdModel.element.innerText.trim() !== '') {
					content.unshift(
						$(tdModel.element)
							.find(Template.TABLE_TD_CONTENT_CLASS)
							.html(),
					);
				}

				tdModel.element.remove();
			}
		});
		if (mergeTd) {
			const tdNode = $(mergeTd);
			const contentNode = tdNode.find(Template.TABLE_TD_CONTENT_CLASS);
			contentNode.html(contentNode.html() + content.join(''));
			this.emit('actioned', 'mergeCell', ...args);
		}
	}

	splitCell(...args: any) {
		const { selection, helper } = this.table;
		const { tableModel } = selection;
		if (!tableModel || !this.tableRoot) return;
		let trs = this.tableRoot.find('tr');
		selection.each((cell, row, col) => {
			if (helper.isEmptyModelCol(cell)) return;
			const rows = row + cell.rowSpan;
			const cols = col + cell.colSpan;
			// 注意这里用倒序，见 selection.each 方法的最后一个参数传的时 true
			// 因为是倒序，所有空位一定先转换为 td, 这样在补齐切断的单元格时，需要考虑插入时的偏移量
			for (let r = rows - 1; r >= row; r--) {
				if (r >= trs.length) {
					this.insertRowAt(row, 1);
				}
				const tr =
					r >= trs.length ? this.tableRoot!.find('tr')[r] : trs[r];
				for (let c = cols - 1; c >= col; c--) {
					const tdModel = tableModel.table[r][c];
					if (!helper.isEmptyModelCol(tdModel) && tdModel.isMulti) {
						tdModel.element =
							tdModel.element as HTMLTableCellElement;
						tdModel.element.colSpan = 1;
						tdModel.element.rowSpan = 1;
					} else if (helper.isEmptyModelCol(tdModel)) {
						const _insertIndex2 = selection.getCellIndex(r, c);
						const _td2 = (tr as HTMLTableRowElement).insertCell(
							_insertIndex2,
						);
						this.editor.nodeId.generate(_td2);
						_td2.setAttribute(
							DATA_TRANSIENT_ATTRIBUTES,
							'table-cell-selection',
						);
						_td2.innerHTML = this.table.template.getEmptyCell();
					}
				}
			}
		});

		this.emit('actioned', 'splitCell', ...args);
	}
}

export default TableCommand;
