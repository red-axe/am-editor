import {
	TableInterface,
	ControllBarInterface,
	ControllDragging,
	ControllChangeSize,
	ControllOptions,
	ControllDraggingHeader,
} from '../types';
import { EventEmitter2 } from 'eventemitter2';
import {
	$,
	CardActiveTrigger,
	EditorInterface,
	getComputedStyle,
	isEngine,
	isHotkey,
	isMobile,
	NodeInterface,
	removeUnit,
} from '@aomao/engine';
import Template from './template';

class ControllBar extends EventEmitter2 implements ControllBarInterface {
	private editor: EditorInterface;
	private table: TableInterface;
	private readonly COL_MIN_WIDTH: number;
	private readonly ROW_MIN_HEIGHT: number;
	private readonly MAX_INSERT_NUM: number;
	tableRoot?: NodeInterface;
	colsHeader?: NodeInterface;
	rowsHeader?: NodeInterface;
	tableHeader?: NodeInterface;
	menuBar?: NodeInterface;

	dragging?: ControllDragging;
	draggingHeader?: ControllDraggingHeader;
	changeSize?: ControllChangeSize;

	viewport?: NodeInterface;
	placeholder?: NodeInterface;
	contextVisible: boolean = false;
	//行删除按钮
	rowDeleteButton?: NodeInterface;
	//列删除按钮
	colDeleteButton?: NodeInterface;
	//列增加按钮相关
	colAddButton?: NodeInterface;
	colAddAlign?: 'right' | 'left';
	colAddButtonSplit?: NodeInterface;
	moveColIndex: number = -1;
	hideColAddButtonTimeount?: NodeJS.Timeout;
	//行增加按钮相关
	rowAddButton?: NodeInterface;
	rowAddAlign?: 'up' | 'down';
	rowAddButtonSplit?: NodeInterface;
	moveRowIndex: number = -1;
	hideRowAddButtonTimeount?: NodeJS.Timeout;

	constructor(
		editor: EditorInterface,
		table: TableInterface,
		options: ControllOptions,
	) {
		super();
		this.table = table;
		this.editor = editor;
		this.COL_MIN_WIDTH = options.col_min_width;
		this.ROW_MIN_HEIGHT = options.row_min_height;
		this.MAX_INSERT_NUM = options.max_insert_num;
	}

	init() {
		const { wrapper } = this.table;
		if (!wrapper) return;
		this.tableRoot = wrapper.find(Template.TABLE_CLASS);
		this.colsHeader = wrapper.find(Template.COLS_HEADER_CLASS);
		this.rowsHeader = wrapper.find(Template.ROWS_HEADER_CLASS);
		this.tableHeader = wrapper.find(Template.HEADER_CLASS);
		this.viewport = wrapper.find(Template.VIEWPORT);
		this.menuBar = wrapper.find(Template.MENUBAR_CLASS);
		this.placeholder = wrapper.find(Template.PLACEHOLDER_CLASS);
		this.renderRowBars();
		this.renderColBars();
		this.bindEvents();
	}

	renderRowBars(refershSize: boolean = true) {
		const table = this.tableRoot?.get<HTMLTableElement>();
		if (!table) return;
		//行删除按钮
		this.rowDeleteButton?.removeAllEvents();
		this.rowDeleteButton = this.rowsHeader?.find(
			Template.ROW_DELETE_BUTTON_CLASS,
		);
		//行增加按钮
		this.rowAddButton?.removeAllEvents();
		this.rowAddButton = this.rowsHeader?.find(
			Template.ROW_ADD_BUTTON_CLASS,
		);
		this.rowAddButtonSplit = this.rowAddButton?.find(
			Template.ROW_ADD_BUTTON_SPLIT_CLASS,
		);
		this.rowDeleteButton
			?.on('mouseover', (event) => this.handleHighlightRow())
			.on('mouseleave', (event) => this.hideHighlight(event))
			.on('mousedown', (event: MouseEvent) => {
				event.preventDefault();
				this.table.command['removeRow']();
			});
		this.rowAddButton
			?.on('mouseenter', () => {
				if (this.hideRowAddButtonTimeount)
					clearTimeout(this.hideRowAddButtonTimeount);
				this.rowsHeader?.css('z-index', 128);
			})
			.on('mouseleave', () => {
				this.hideRowAddButtonTimeount = setTimeout(() => {
					this.rowAddButton?.hide();
					this.rowsHeader?.css('z-index', 1);
					this.moveRowIndex = -1;
				}, 200);
			})
			.on('mousedown', (event: MouseEvent) => {
				event.preventDefault();
				this.table.command.insertRowAt(
					this.moveRowIndex,
					1,
					this.rowAddAlign === 'down' ? false : true,
				);
			});
		if (refershSize) {
			const trs = table.rows;
			const end = trs?.length || 0;
			const rowBars = this.rowsHeader?.find(
				Template.ROWS_HEADER_ITEM_CLASS,
			);
			if (rowBars) {
				for (let i = 0; i < end; i++) {
					const newHeight = getComputedStyle(trs[i], 'height');
					const bar = rowBars[i] as HTMLElement | undefined;
					const oldHeight = bar?.style.height;
					if (bar && newHeight !== oldHeight)
						bar.style.height = newHeight;
				}
			}
			const rowTrigger = this.rowsHeader?.find(
				Template.ROWS_HEADER_TRIGGER_CLASS,
			);
			const tableWidth = this.tableRoot!.width();
			const wrapperWidth = this.table.wrapper?.width() || 0;
			const width = tableWidth < wrapperWidth ? tableWidth : wrapperWidth;
			const newWidth = width + (this.rowsHeader?.width() || 0) - 1;
			rowTrigger?.each((row) => {
				const oldWidth = (row as HTMLElement).style.width;
				if (oldWidth !== newWidth + 'px') {
					(row as HTMLElement).style.width = newWidth + 'px';
				}
			});
		}
	}

	renderColBars(refershSize: boolean = true) {
		const table = this.tableRoot?.get<HTMLTableElement>();
		if (!table) return;
		const tableWidth = removeUnit(getComputedStyle(table, 'width'));
		//列删除按钮
		this.colDeleteButton?.removeAllEvents();
		this.colDeleteButton = this.table.wrapper?.find(
			Template.COL_DELETE_BUTTON_CLASS,
		);
		//列增加按钮
		this.colAddButton?.removeAllEvents();
		this.colAddButton = this.colsHeader?.find(
			Template.COL_ADD_BUTTON_CLASS,
		);
		this.colAddButtonSplit = this.colAddButton?.find(
			Template.COL_ADD_BUTTON_SPLIT_CLASS,
		);

		this.colDeleteButton
			?.on('mouseover', (event) => this.handleHighlightCol())
			.on('mouseleave', (event) => this.hideHighlight(event))
			.on('mousedown', (event: MouseEvent) => {
				event.preventDefault();
				this.table.command['removeCol']();
			});

		this.colAddButton
			?.on('mouseenter', () => {
				if (this.hideColAddButtonTimeount)
					clearTimeout(this.hideColAddButtonTimeount);
			})
			.on('mouseleave', () => {
				this.hideColAddButtonTimeount = setTimeout(() => {
					this.colAddButton?.hide();
					this.moveColIndex = -1;
				}, 200);
			})
			.on('mousedown', (event: MouseEvent) => {
				event.preventDefault();
				if (this.moveColIndex > -1)
					this.table.command.insertColAt(
						this.moveColIndex,
						1,
						this.colAddAlign === 'right' ? false : true,
					);
			});
		this.tableRoot?.css('width', `${tableWidth}px`);
		this.colsHeader?.css('width', `${tableWidth}px`);

		if (refershSize) this.renderColSize();
	}

	renderColSize() {
		const table = this.tableRoot?.get<HTMLTableElement>();
		if (!table) return;
		const tableWidth = removeUnit(getComputedStyle(table, 'width'));
		const cols = this.tableRoot?.find('col');
		if (!cols) return;

		let isInit = true;

		const colWidthArray = {};
		let allColWidth = 0;
		let colIndex = 0;
		cols.each((_, i) => {
			const col = cols[i];
			const colWidth = removeUnit($(col).attributes('width'));
			if (colWidth) {
				colWidthArray[i] = colWidth;
				allColWidth += colWidth;
				isInit = false;
			} else {
				colIndex++;
			}
		});
		const colBars = this.colsHeader?.find(Template.COLS_HEADER_ITEM_CLASS);
		if (!colBars) return;
		//初始化，col的宽度为0的时候
		const { tableModel } = this.table.selection;
		if (isInit) {
			let tdWidth: Array<number> = [];
			tableModel?.table?.forEach((trModel) => {
				trModel.forEach((tdModel, c) => {
					if (
						!tdWidth[c] &&
						!this.table.helper.isEmptyModelCol(tdModel) &&
						!tdModel.isMulti &&
						tdModel.element
					) {
						tdWidth[c] = removeUnit(
							getComputedStyle(tdModel.element, 'width'),
						);
					}
				});
			});
			// 合并单元格的存在，可能出现某些列全部属于合并单元格，导致无法通过 td 的 offsetWidth 直接获得，需要把剩余的未知行求平均数
			let unkownCount = 0;
			let knownWidth = 0;
			for (let c = 0; c < cols.length; c++) {
				if (!tdWidth[c]) {
					unkownCount++;
				} else {
					knownWidth += tdWidth[c];
				}
			}
			let averageWidth = 0;
			if (unkownCount > 0) {
				averageWidth =
					Math.round(
						Math.round((tableWidth - knownWidth) / unkownCount) *
							10000,
					) / 10000;
			}
			for (let i = 0; i < cols.length; i++) {
				const width = tdWidth[i] || averageWidth;
				colBars.eq(i)?.css('width', width + 'px');
				cols.eq(i)?.attributes('width', width);
			}
		} else if (colIndex) {
			const averageWidth =
				Math.round(((tableWidth - allColWidth) / colIndex) * 10000) /
				10000;
			cols.each((_, index) => {
				const width =
					undefined === colWidthArray[index]
						? averageWidth
						: colWidthArray[index];
				colBars.eq(index)?.css('width', width + 'px');
				cols.eq(index)?.attributes('width', width);
			});
		} else {
			cols.each((_, index) => {
				const newWidth =
					Math.round(
						((tableWidth * colWidthArray[index]) / allColWidth) *
							10000,
					) / 10000;
				const bar = colBars[index] as HTMLElement | undefined;
				const oldWidth = bar?.style.width;
				if (bar && oldWidth !== newWidth + 'px')
					bar.style.width = newWidth + 'px';
			});
		}
		const colTrigger = this.colsHeader?.find(
			Template.COLS_HEADER_TRIGGER_CLASS,
		);
		const newHeight =
			(tableModel?.height || 0) + (this.colsHeader?.height() || 0);
		colTrigger?.each((col) => {
			const oldHeight = (col as HTMLElement).style.height;
			if (oldHeight !== newHeight + 'px') {
				(col as HTMLElement).style.height = newHeight + 'px';
			}
		});
	}
	/**
	 * 绑定事件
	 */
	bindEvents() {
		this.colsHeader
			?.on(
				isMobile ? 'touchstart' : 'mousedown',
				this.onMouseDownColsHeader,
			)
			.on('mouseup', this.onClickColsHeader)
			.on('dragstart', this.onDragStartColsHeader);
		this.rowsHeader
			?.on(
				isMobile ? 'touchstart' : 'mousedown',
				this.onMouseDownRowsHeader,
			)
			.on('mouseup', this.onClickRowsHeader)
			.on('dragstart', this.onDragStartRowsHeader);
		this.tableHeader?.on('mousedown', this.onClickTableHeader);
		this.table.wrapper?.on('contextmenu', (event) =>
			event.preventDefault(),
		);
		this.tableRoot?.on('contextmenu', (event) => event.preventDefault());
		this.colsHeader?.on('contextmenu', (event) => event.preventDefault());
		this.rowsHeader?.on('contextmenu', (event) => event.preventDefault());
		this.tableRoot?.on('mousedown', (event) =>
			this.onTableMouseDown(event),
		);
		this.menuBar?.on('click', (event) => this.handleClickMenu(event));
		this.menuBar?.on('mouseover', (event) => this.handleHoverMenu(event));
		this.menuBar?.on('mouseleave', (event) => this.hideHighlight(event));
		//列头部 padding 区域单击让其选中表格卡片上方的blcok
		const editor = this.editor;
		this.viewport?.on(
			isMobile ? 'touchstart' : 'mousedown',
			(event: MouseEvent) => {
				if (!event.target) return;
				const targetNode = $(event.target);
				if (
					!isEngine(editor) ||
					!event.target ||
					!this.viewport?.equal(targetNode)
				)
					return;
				event.preventDefault();
				event.stopPropagation();
				const { change } = editor;
				const range = change.range.get();
				editor.card.focusPrevBlock(this.table, range, true);
				editor.card.activate(
					range.startNode,
					CardActiveTrigger.MOUSE_DOWN,
				);
				change.range.select(range);
			},
		);
		let colMoveTimeout: NodeJS.Timeout | null = null;
		this.colsHeader
			?.on('mouseenter', () => {
				if (this.hideColAddButtonTimeount)
					clearTimeout(this.hideColAddButtonTimeount);
			})
			.on('mousemove', (event: MouseEvent) => {
				if (colMoveTimeout) clearTimeout(colMoveTimeout);
				colMoveTimeout = setTimeout(() => {
					this.onMouseMoveColsHeader(event);
				}, 200);
			})
			.on('mouseleave', (e: MouseEvent) => {
				if (colMoveTimeout) clearTimeout(colMoveTimeout);
				this.hideColAddButtonTimeount = setTimeout(() => {
					this.colAddButton?.hide();
				}, 200);
			});
		let colItemTimeout: NodeJS.Timeout | null = null;
		this.colsHeader
			?.find(Template.COLS_HEADER_ITEM_CLASS)
			.on('mouseenter', (e: MouseEvent) => {
				if (colItemTimeout) clearTimeout(colItemTimeout);
				colItemTimeout = setTimeout(() => {
					if (e.target) {
						$(e.target)
							.closest(Template.COLS_HEADER_ITEM_CLASS)
							.addClass('active');
					}
				}, 200);
			})
			.on('mouseleave', (e: MouseEvent) => {
				if (colItemTimeout) clearTimeout(colItemTimeout);
				if (e.target) {
					$(e.target)
						.closest(Template.COLS_HEADER_ITEM_CLASS)
						.removeClass('active');
				}
			});
		let colTriggerTimeout: NodeJS.Timeout | null = null;
		this.colsHeader
			?.find(Template.COLS_HEADER_TRIGGER_CLASS)
			.on('mouseenter', (e: MouseEvent) => {
				if (colTriggerTimeout) clearTimeout(colTriggerTimeout);
				const target = $(e.target || []);
				colTriggerTimeout = setTimeout(() => {
					target.addClass('active');
				}, 200);
			})
			.on('mouseleave', (e: MouseEvent) => {
				if (colTriggerTimeout) clearTimeout(colTriggerTimeout);
				if (e.target) {
					$(e.target).removeClass('active');
				}
			});
		let rowMoveTimeout: NodeJS.Timeout | null = null;
		this.rowsHeader
			?.on('mouseenter', () => {
				if (this.hideRowAddButtonTimeount)
					clearTimeout(this.hideRowAddButtonTimeount);
			})
			.on('mousemove', (event: MouseEvent) => {
				if (rowMoveTimeout) clearTimeout(rowMoveTimeout);
				rowMoveTimeout = setTimeout(() => {
					this.onMouseMoveRowsHeader(event);
					this.rowsHeader?.css('z-index', 128);
				}, 200);
			})
			.on('mouseleave', () => {
				if (rowMoveTimeout) clearTimeout(rowMoveTimeout);
				this.hideRowAddButtonTimeount = setTimeout(() => {
					this.rowsHeader?.css('z-index', '');
					this.rowAddButton?.hide();
				}, 200);
			});
		let rowItemTimeout: NodeJS.Timeout | null = null;
		this.rowsHeader
			?.find(Template.ROWS_HEADER_ITEM_CLASS)
			.on('mouseenter', (e: MouseEvent) => {
				if (rowItemTimeout) clearTimeout(rowItemTimeout);
				rowItemTimeout = setTimeout(() => {
					if (e.target) {
						$(e.target)
							.closest(Template.ROWS_HEADER_ITEM_CLASS)
							.addClass('active');
					}
				}, 200);
			})
			.on('mouseleave', (e: MouseEvent) => {
				if (rowItemTimeout) clearTimeout(rowItemTimeout);
				if (e.target) {
					$(e.target)
						.closest(Template.ROWS_HEADER_ITEM_CLASS)
						.removeClass('active');
				}
			});
		let rowTriggerTimeout: NodeJS.Timeout | null = null;
		this.rowsHeader
			?.find(Template.ROWS_HEADER_TRIGGER_CLASS)
			.on('mouseenter', (e: MouseEvent) => {
				if (rowTriggerTimeout) clearTimeout(rowTriggerTimeout);
				const target = $(e.target || []);
				rowTriggerTimeout = setTimeout(() => {
					target.addClass('active');
				}, 200);
			})
			.on('mouseleave', (e: MouseEvent) => {
				if (rowTriggerTimeout) clearTimeout(rowTriggerTimeout);
				if (e.target) {
					$(e.target).removeClass('active');
				}
			});
	}
	/**
	 * 在表格上单击
	 * @param event
	 */
	onTableMouseDown(event: MouseEvent) {
		if (!event.target) return;
		const td = $(event.target).closest('td');
		if (td.length > 0 && event.button === 2 && this.table.activated) {
			this.showContextMenu(event);
		} else {
			this.hideContextMenu();
		}
	}

	/**
	 * 鼠标在列表头上移动
	 * @param event
	 */
	onMouseMoveColsHeader(event: MouseEvent) {
		if (!event.target || !this.colAddButton || !this.colAddButtonSplit)
			return;
		const targetNode = $(event.target);
		const itemNode = targetNode.closest(Template.COLS_HEADER_ITEM_CLASS);
		if (itemNode.length === 0) return;
		const items = this.colsHeader!.find(
			Template.COLS_HEADER_ITEM_CLASS,
		).toArray();
		const width = itemNode.width();
		const buttonWidth = this.colAddButton.width();
		let left = itemNode.get<HTMLElement>()!.offsetLeft;
		const index = items.findIndex((item) => item.equal(itemNode));
		const isEnd =
			event.offsetX > width / 2 || targetNode.hasClass('cols-trigger');
		const isLast = items[items.length - 1].equal(itemNode);
		if (isEnd) {
			left += isLast ? width - buttonWidth / 2 : width;
		}
		this.colAddAlign = isEnd ? 'left' : 'right';
		this.moveColIndex = index; //+ (isEnd ? 1 : 0);
		this.colAddButton?.show('flex');
		this.colAddButton.css('left', `${left}px`);
		this.colAddButton.css('z-index', 128);
		const splitHeight =
			(this.table.selection.tableModel?.height || 0) +
			itemNode.height() +
			4;
		this.colAddButtonSplit.css('height', `${splitHeight}px`);
		this.colAddButtonSplit.css(
			'left',
			`${isLast && isEnd ? buttonWidth - 3 + 'px' : ''}`,
		);
	}

	/**
	 * 鼠标在行表头上移动
	 * @param event
	 * @returns
	 */
	onMouseMoveRowsHeader(event: MouseEvent) {
		if (!event.target || !this.rowAddButton || !this.rowAddButtonSplit)
			return;
		const targetNode = $(event.target);
		const itemNode = targetNode.closest(Template.ROWS_HEADER_ITEM_CLASS);
		if (itemNode.length === 0) return;
		const items = this.rowsHeader!.find(
			Template.ROWS_HEADER_ITEM_CLASS,
		).toArray();
		const height = itemNode.height();
		let top = itemNode.get<HTMLElement>()!.offsetTop;
		const index = items.findIndex((item) => item.equal(itemNode));
		const isEnd =
			event.offsetY > height / 2 || targetNode.hasClass('rows-trigger');
		if (isEnd) {
			top += height;
		}
		this.moveRowIndex = index; //+ (isEnd ? (index === items.length - 1 ? 0 : 1) : 0);
		this.rowAddButton.show('flex');
		this.rowAddButton.css('top', `${top}px`);
		this.rowAddAlign = isEnd ? 'down' : 'up';

		const viewportElement = this.viewport?.get<HTMLElement>()!;
		const splitWidth =
			(this.table.selection.tableModel?.width || 0) +
			itemNode.width() +
			4;
		let width = Math.min(viewportElement.offsetWidth + 4, splitWidth);
		this.rowAddButtonSplit.css('width', `${width}px`);
	}

	/**
	 * 鼠标在列头部按下
	 * @param event 事件
	 * @returns
	 */
	onMouseDownColsHeader = (event: MouseEvent | TouchEvent) => {
		const trigger = $(event.target || []).closest(
			Template.COLS_HEADER_TRIGGER_CLASS,
		);
		//不可移动状态
		if (trigger.length === 0) {
			//右键显示菜单
			if (event instanceof MouseEvent && event.button === 2) {
				this.showContextMenu(event);
			}
			return;
		}
		//开始调整列宽度
		this.startChangeCol(trigger, event);
	};
	/**
	 * 鼠标在行头部按下
	 * @param event 事件
	 * @returns
	 */
	onMouseDownRowsHeader = (event: MouseEvent | TouchEvent) => {
		const trigger = $(event.target || []).closest(
			Template.ROWS_HEADER_TRIGGER_CLASS,
		);
		//不可移动状态
		if (trigger.length === 0) {
			//右键显示菜单
			if (event instanceof MouseEvent && event.button === 2) {
				this.showContextMenu(event);
			}
			return;
		}
		//开始调整行高度
		this.startChangeRow(trigger, event);
	};
	/**
	 * 鼠标在列头部单击
	 * @param event 事件
	 */
	onClickColsHeader = (event: MouseEvent) => {
		const { selection } = this.table;
		const trigger = $(event.target || []).closest(
			Template.COLS_HEADER_TRIGGER_CLASS,
		);
		if (trigger.length > 0) return;
		const colHeader = $(event.target || []).closest(
			Template.COLS_HEADER_ITEM_CLASS,
		);
		if (colHeader.length === 0) return;
		const index = this.colsHeader
			?.find(Template.COLS_HEADER_ITEM_CLASS)
			.toArray()
			.findIndex((item) => item.equal(colHeader));
		if (index === undefined) return;
		selection.selectCol(index);
	};
	/**
	 * 鼠标在行头部单击
	 * @param event 事件
	 */
	onClickRowsHeader = (event: MouseEvent) => {
		const { selection } = this.table;
		const trigger = $(event.target || []).closest(
			Template.ROWS_HEADER_TRIGGER_CLASS,
		);
		if (trigger.length > 0) return;
		const rowHeader = $(event.target || []).closest(
			Template.ROWS_HEADER_ITEM_CLASS,
		);
		if (rowHeader.length === 0) return;
		const index = this.rowsHeader
			?.find(Template.ROWS_HEADER_ITEM_CLASS)
			.toArray()
			.findIndex((item) => item.equal(rowHeader));
		if (index === undefined) return;
		selection.selectRow(index);
	};
	/**
	 * 鼠标在表格左上角头部单击
	 * @param event 事件
	 */
	onClickTableHeader = (event: MouseEvent) => {
		event.preventDefault();
		const { selection } = this.table;
		if (this.tableHeader?.hasClass('selected')) {
			selection.clearSelect();
		} else {
			const { tableModel } = selection;
			if (!tableModel) return;
			selection.select(
				{ row: 0, col: 0 },
				{ row: tableModel.rows - 1, col: tableModel.cols - 1 },
			);
		}
	};
	/**
	 * 激活表头状态
	 * @returns
	 */
	activeHeader() {
		const selectArea = this.table.selection.getSelectArea();
		this.clearActiveStatus();
		const colBars = this.colsHeader?.find(Template.COLS_HEADER_ITEM_CLASS);
		const rowBars = this.rowsHeader?.find(Template.ROWS_HEADER_ITEM_CLASS);
		const { begin, end, allCol, allRow } = selectArea;
		if (rowBars) {
			for (let r = begin.row; r <= end.row; r++) {
				if (allCol) {
					const bar = rowBars[r] as HTMLElement | undefined;
					if (!bar?.classList.contains('selected')) {
						bar?.classList.add('selected');
					}
					if (allRow && !bar?.classList.contains('no-dragger'))
						bar?.classList.add('no-dragger');
				}
			}
		}

		if (colBars) {
			for (let c = begin.col; c <= end.col; c++) {
				if (allRow) {
					const bar = colBars[c] as HTMLElement | undefined;
					if (!bar?.classList.contains('selected')) {
						bar?.classList.add('selected');
					}
					if (allCol && !bar?.classList.contains('no-dragger'))
						bar?.classList.add('no-dragger');
				}
			}
		}
		const tableHeaderElement = this.tableHeader?.get<HTMLElement>();
		if (allCol && allRow) {
			if (!tableHeaderElement?.classList.contains('selected')) {
				tableHeaderElement?.classList.add('selected');
			}
		} else {
			if (tableHeaderElement?.classList.contains('selected')) {
				tableHeaderElement?.classList.remove('selected');
			}
		}
		//行删除按钮
		if (allCol && !allRow) {
			const tr = this.tableRoot?.find('tr').eq(begin.row);
			if (tr) {
				const top = tr.get<HTMLElement>()!.offsetTop;
				this.rowDeleteButton?.show('flex');
				this.rowDeleteButton?.css(
					'top',
					`${top - this.rowDeleteButton.height()}px`,
				);
			}
		} else {
			this.rowDeleteButton?.hide();
		}
		//列删除按钮
		if (!allCol && allRow) {
			let width = 0;
			for (let c = begin.col; c <= end.col; c++) {
				width += colBars?.eq(c)?.width() || 0;
			}
			const left =
				colBars?.eq(begin.col)?.get<HTMLElement>()?.offsetLeft || 0;

			this.colDeleteButton?.show('flex');
			this.colDeleteButton?.css('left', `${left + width / 2}px`);
		} else {
			this.colDeleteButton?.hide();
		}
	}

	/**
	 * 清楚表头活动状态
	 */
	clearActiveStatus() {
		const colBars = this.colsHeader?.find(Template.COLS_HEADER_ITEM_CLASS);
		const rowBars = this.rowsHeader?.find(Template.ROWS_HEADER_ITEM_CLASS);
		colBars?.each((bar) => {
			const barElement = bar as HTMLElement;
			if (barElement.classList.contains('selected'))
				barElement.classList.remove('selected');
			if (barElement.classList.contains('no-dragger'))
				barElement.classList.remove('no-dragger');
		});
		rowBars?.each((bar) => {
			const barElement = bar as HTMLElement;
			if (barElement.classList.contains('selected'))
				barElement.classList.remove('selected');
			if (barElement.classList.contains('no-dragger'))
				barElement.classList.remove('no-dragger');
		});
		const tableHeader = this.tableHeader?.get<HTMLElement>();
		if (tableHeader?.classList.contains('selected'))
			tableHeader.classList.remove('selected');
	}
	/**
	 * 刷新控制UI
	 */
	refresh(refershSize: boolean = true) {
		this.renderColBars(refershSize);
		this.renderRowBars(refershSize);
		this.activeHeader();
	}
	/**
	 * 开始改变列宽度
	 * @param col 列节点
	 * @param event 事件
	 */
	startChangeCol(trigger: NodeInterface, event: MouseEvent | TouchEvent) {
		event.stopPropagation();
		event.preventDefault();
		const col = trigger.parent()!;
		const colElement = col.get<HTMLTableColElement>()!;
		this.table.selection.clearSelect();
		this.dragging = {
			x:
				event instanceof MouseEvent
					? event.clientX
					: event.touches[0].clientX,
			y: -1,
		};
		const index =
			this.colsHeader
				?.find(Template.COLS_HEADER_ITEM_CLASS)
				.toArray()
				.findIndex((item) => item.equal(col)) || 0;
		this.changeSize = {
			trigger: {
				element: trigger,
				height: removeUnit(
					getComputedStyle(trigger.get<Element>()!, 'height'),
				),
				width: removeUnit(
					getComputedStyle(trigger.get<Element>()!, 'width'),
				),
			},
			element: col,
			width: removeUnit(getComputedStyle(colElement, 'width')),
			height: -1,
			index,
			table: {
				width: this.table.selection.tableModel?.width || 0,
				height: this.table.selection.tableModel?.height || 0,
			},
		};
		this.bindChangeSizeEvent();
	}
	/**
	 * 开始改变行高度
	 * @param col 列节点
	 * @param event 事件
	 */
	startChangeRow(trigger: NodeInterface, event: MouseEvent | TouchEvent) {
		event.stopPropagation();
		event.preventDefault();
		const row = trigger.parent()!;
		const rowElement = row.get<HTMLTableColElement>()!;
		this.table.selection.clearSelect();
		this.dragging = {
			x: -1,
			y:
				event instanceof MouseEvent
					? event.clientY
					: event.touches[0].clientY,
		};
		const index =
			this.rowsHeader
				?.find(Template.ROWS_HEADER_ITEM_CLASS)
				.toArray()
				.findIndex((item) => item.equal(row)) || 0;
		this.changeSize = {
			trigger: {
				element: trigger,
				height: removeUnit(
					getComputedStyle(trigger.get<Element>()!, 'height'),
				),
				width: removeUnit(
					getComputedStyle(trigger.get<Element>()!, 'width'),
				),
			},
			element: row,
			width: -1,
			height: removeUnit(getComputedStyle(rowElement, 'height')),
			index,
			table: {
				width: this.table.selection.tableModel?.width || 0,
				height: this.table.selection.tableModel?.height || 0,
			},
		};
		this.bindChangeSizeEvent();
	}
	/**
	 * 绑定改变大小事件
	 */
	bindChangeSizeEvent() {
		//添加鼠标样式
		this.colsHeader?.addClass('resize');
		this.rowsHeader?.addClass('resize');
		document.addEventListener(
			isMobile ? 'touchmove' : 'mousemove',
			this.onChangeSize,
		);
		document.addEventListener(
			isMobile ? 'touchend' : 'mouseup',
			this.onChangeSizeEnd,
		);
		if (!isMobile)
			document.addEventListener('mouseleave', this.onChangeSizeEnd);
	}
	/**
	 * 移除绑定改变不大小事件
	 */
	unbindChangeSizeEvent() {
		//添加鼠标样式
		this.colsHeader?.removeClass('resize');
		this.rowsHeader?.removeClass('resize');
		document.removeEventListener(
			isMobile ? 'touchmove' : 'mousemove',
			this.onChangeSize,
		);
		document.removeEventListener(
			isMobile ? 'touchend' : 'mouseup',
			this.onChangeSizeEnd,
		);
		if (!isMobile)
			document.removeEventListener('mouseleave', this.onChangeSizeEnd);
	}

	onChangeSize = (event: MouseEvent | TouchEvent) => {
		if (!this.dragging) return;
		if (this.dragging.y > -1) {
			this.onChangeRowHeight(event);
		} else if (this.dragging.x > -1) {
			this.onChangeColWidth(event);
		}
		this.emit('sizeChanging');
	};
	/**
	 * 列宽度改变
	 * @param event 事件
	 * @returns
	 */
	onChangeColWidth(event: MouseEvent | TouchEvent) {
		if (!this.dragging || !this.changeSize) return;
		//鼠标移动宽度
		let width =
			(event instanceof MouseEvent
				? event.clientX
				: event.touches[0].clientX) - this.dragging.x;
		//获取合法的宽度
		const colWidth = Math.max(
			this.COL_MIN_WIDTH,
			this.changeSize.width + width,
		);
		//需要移动的宽度
		width = colWidth - this.changeSize.width;
		//表格变化后的宽度
		const tableWidth = this.changeSize.table.width + width;
		this.changeSize.element.css('width', colWidth + 'px');
		const currentElement = this.changeSize.element.get<HTMLElement>()!;
		this.colsHeader?.css('width', tableWidth + 'px');
		const viewportElement = this.viewport?.get<HTMLElement>()!;
		// 拖到边界时，需要滚动表格视窗的滚动条
		const currentColRightSide =
			currentElement.offsetLeft + currentElement.offsetWidth;
		if (
			currentColRightSide - viewportElement.scrollLeft + 20 >
			viewportElement.offsetWidth
		) {
			// 拖宽单元格时，若右侧已经到边，需要滚动左侧的滚动条
			viewportElement.scrollLeft =
				currentColRightSide + 20 - viewportElement.offsetWidth;
		} else if (
			viewportElement.scrollLeft + viewportElement.offsetWidth ===
			viewportElement.scrollWidth
		) {
			// 拖窄单元格时，若右侧已经到边，需要滚动左侧的滚动条
			viewportElement.scrollLeft = Math.max(
				0,
				tableWidth + 34 - viewportElement.offsetWidth,
			);
		}
		this.clearActiveStatus();
		this.hideContextMenu();
		this.renderRowBars();
		this.renderColSplitBars(
			this.changeSize.element,
			this.changeSize.trigger.element,
		);
		//设置列头宽度
		this.tableRoot
			?.find('col')
			.eq(this.changeSize.index)
			?.attributes('width', colWidth);
		//设置表格宽度
		this.tableRoot?.css('width', `${tableWidth}px`);
	}

	onChangeRowHeight(event: MouseEvent | TouchEvent) {
		if (!this.dragging || !this.changeSize) return;
		let height =
			(event instanceof MouseEvent
				? event.clientY
				: event.touches[0].clientY) - this.dragging.y;
		const rowHeight = Math.max(
			this.ROW_MIN_HEIGHT,
			this.changeSize.height + height,
		);
		height = rowHeight - this.changeSize.height;
		this.changeSize.element.css('height', rowHeight + 'px');
		this.clearActiveStatus();
		this.hideContextMenu();
		this.renderRowSplitBars(
			this.changeSize.element,
			this.changeSize.trigger.element,
		);
		this.tableRoot
			?.find('tr')
			.eq(this.changeSize.index)
			?.css('height', `${rowHeight}px`);
	}

	renderColSplitBars(col: NodeInterface, trigger: NodeInterface) {
		const tableHeight = this.table.selection.tableModel?.height || 0;
		trigger
			.addClass('dragging')
			.css('height', `${tableHeight + col.height()}px`);
	}

	renderRowSplitBars(row: NodeInterface, trigger: NodeInterface) {
		const viewportElement = this.viewport?.get<HTMLElement>()!;
		const tableWidth = this.table.selection.tableModel?.width || 0;

		//获取table-viewport 宽度 去除 操作栏宽度
		const width = Math.min(
			viewportElement.offsetWidth - row.width(),
			tableWidth,
		);

		trigger.addClass('dragging').css('width', `${width + row.width()}px`);
	}

	onChangeSizeEnd = (event: MouseEvent | TouchEvent) => {
		if (
			event.type === 'mouseleave' &&
			this.table.getCenter().contains(event['toElement'])
		) {
			return;
		}

		if (this.dragging && this.changeSize) {
			const { width, height, element } = this.changeSize.trigger;
			element.removeClass('dragging');
			if (this.dragging.x > -1) element.css('height', `${height}px`);
			if (this.dragging.y > -1) element.css('width', `${width}px`);
			this.dragging = undefined;
			// 拖完再渲染一次，行高会受内容限制，无法拖到你想要的高度
			this.renderRowBars();
			this.emit('sizeChanged');
		}
		this.unbindChangeSizeEvent();
	};

	onDragStartColsHeader = (event: DragEvent) => {
		event.stopPropagation();
		const { selection } = this.table;
		const selectArea = selection.getSelectArea();
		if (!event.target || !selectArea.allRow) return;
		const colBar = $(event.target).closest(Template.COLS_HEADER_ITEM_CLASS);
		if (colBar.length === 0) return;
		const index = this.colsHeader
			?.find(Template.COLS_HEADER_ITEM_CLASS)
			.toArray()
			.findIndex((item) => item.equal(colBar));
		if (index === undefined) return;
		const drag_col = index;
		if (drag_col < selectArea.begin.col || drag_col > selectArea.end.col)
			return;
		this.draggingHeader = {
			element: colBar,
			minIndex: selectArea.begin.col,
			maxIndex: selectArea.end.col,
			count: selectArea.end.col - selectArea.begin.col + 1,
		};
		colBar.addClass('dragging');
		colBar
			.find('.drag-info')
			.html(
				this.editor.language
					.get<string>('table', 'draggingCol')
					.replace('$data', this.draggingHeader.count.toString()),
			);
		this.colsHeader?.addClass('dragging');
		this.table.helper.fixDragEvent(event);
		this.bindDragColEvent();
	};

	onDragStartRowsHeader = (event: DragEvent) => {
		event.stopPropagation();
		const { selection } = this.table;
		const selectArea = selection.getSelectArea();
		if (!event.target || !selectArea.allCol) return;
		const rowBar = $(event.target).closest(Template.ROWS_HEADER_ITEM_CLASS);
		if (rowBar.length === 0) return;
		const index = this.rowsHeader
			?.find(Template.ROWS_HEADER_ITEM_CLASS)
			.toArray()
			.findIndex((item) => item.equal(rowBar));
		if (index === undefined) return;
		const drag_row = index;

		if (drag_row < selectArea.begin.row || drag_row > selectArea.end.row)
			return;
		this.draggingHeader = {
			element: rowBar,
			minIndex: selectArea.begin.row,
			maxIndex: selectArea.end.row,
			count: selectArea.end.row - selectArea.begin.row + 1,
		};
		rowBar.addClass('dragging');
		rowBar
			.find('.drag-info')
			.html(
				this.editor.language
					.get<string>('table', 'draggingRow')
					.replace('$data', this.draggingHeader.count.toString()),
			);
		this.rowsHeader?.addClass('dragging');
		this.table.helper.fixDragEvent(event);
		this.bindDragRowEvent();
	};

	bindDragColEvent() {
		const { wrapper } = this.table;
		wrapper?.on('dragover', this.onDragCol);
		wrapper?.on('drop', this.onDragColEnd);
		wrapper?.on('dragend', this.onDragColEnd);
	}

	unbindDragColEvent() {
		const { wrapper } = this.table;
		const colBars = this.colsHeader?.find(Template.COLS_HEADER_ITEM_CLASS);
		colBars?.removeClass('dragging');
		this.colsHeader?.removeClass('dragging');
		wrapper?.off('dragover', this.onDragCol);
		wrapper?.off('drop', this.onDragColEnd);
		wrapper?.off('dragend', this.onDragColEnd);
	}

	bindDragRowEvent() {
		const { wrapper } = this.table;
		wrapper?.on('dragover', this.onDragRow);
		wrapper?.on('drop', this.onDragRowEnd);
		wrapper?.on('dragend', this.onDragRowEnd);
	}

	unbindDragRowEvent() {
		const { wrapper } = this.table;
		const rowBars = this.rowsHeader?.find(Template.ROWS_HEADER_ITEM_CLASS);
		rowBars?.removeClass('dragging');
		this.rowsHeader?.removeClass('dragging');
		wrapper?.off('dragover', this.onDragRow);
		wrapper?.off('drop', this.onDragRowEnd);
		wrapper?.off('dragend', this.onDragRowEnd);
	}

	showPlaceHolder(dropIndex: number, isNext?: boolean) {
		if (!this.draggingHeader) return;
		const { element, minIndex, maxIndex } = this.draggingHeader;
		if (element.closest(Template.COLS_HEADER_CLASS).length > 0) {
			if (dropIndex === this.draggingHeader.index) return;
			if (minIndex <= dropIndex && dropIndex <= maxIndex + 1) {
				delete this.draggingHeader.index;
				delete this.draggingHeader.isNext;
				this.placeholder?.css('display', 'none');
				return;
			}
			this.draggingHeader.isNext = isNext;
			this.draggingHeader.index = dropIndex;
			const colBars = this.colsHeader?.find(
				Template.COLS_HEADER_ITEM_CLASS,
			);
			if (!colBars) return;

			const left =
				this.draggingHeader.index !== colBars.length
					? colBars.eq(this.draggingHeader.index)!.get<HTMLElement>()!
							.offsetLeft + 2
					: colBars
							.eq(this.draggingHeader.index - 1)!
							.get<HTMLElement>()!.offsetLeft +
					  colBars
							.eq(this.draggingHeader.index - 1)!
							.get<HTMLElement>()!.offsetWidth +
					  2;
			const viewportElement = this.viewport?.get<HTMLElement>()!;
			const { scrollLeft, offsetWidth } = viewportElement;
			if (left < scrollLeft) {
				viewportElement.scrollLeft = left - 5;
			}
			if (left > scrollLeft + offsetWidth) {
				viewportElement.scrollLeft = left - offsetWidth + 5;
			}
			const height =
				(this.table.selection.tableModel?.height || 0) +
				colBars.height();
			const paddingTop = this.viewport?.css('padding-top');
			const paddingLeft = this.viewport?.css('padding-left') || '0';
			this.placeholder?.css('width', '2px');
			this.placeholder?.css('height', `${height}px`);
			this.placeholder?.css(
				'left',
				left - 4 + removeUnit(paddingLeft) + 'px',
			);
			this.placeholder?.css('top', paddingTop);
			this.placeholder?.css('display', 'block');
		} else if (element.closest(Template.ROWS_HEADER_CLASS).length > 0) {
			if (dropIndex === this.draggingHeader.index) return;
			if (minIndex <= dropIndex && dropIndex <= maxIndex + 1) {
				delete this.draggingHeader.index;
				delete this.draggingHeader.isNext;
				this.placeholder?.css('display', 'none');
				return;
			}
			this.draggingHeader.index = dropIndex;
			this.draggingHeader.isNext = isNext;
			const rowBars = this.rowsHeader?.find(
				Template.ROWS_HEADER_ITEM_CLASS,
			);
			if (!rowBars) return;
			const top =
				this.draggingHeader.index !== rowBars.length
					? rowBars.eq(this.draggingHeader.index)!.get<HTMLElement>()!
							.offsetTop + 2
					: rowBars
							.eq(this.draggingHeader.index - 1)!
							.get<HTMLElement>()!.offsetTop +
					  rowBars
							.eq(this.draggingHeader.index - 1)!
							.get<HTMLElement>()!.offsetHeight -
					  2;
			const width = this.table.selection.tableModel?.width || 0;
			const paddingTop = this.viewport?.css('padding-top');
			const paddingLeft = this.viewport?.css('padding-left') || '0';
			const colBars = this.colsHeader?.find(
				Template.COLS_HEADER_ITEM_CLASS,
			);
			this.placeholder?.css('height', '2px');
			this.placeholder?.css('width', `${width}px`);
			this.placeholder?.css('left', paddingLeft);
			this.placeholder?.css(
				'top',
				top +
					removeUnit(paddingTop || '0') +
					(colBars?.height() || 0) -
					2 +
					'px',
			);
			this.placeholder?.css('display', 'block');
		}
	}

	onDragCol = (event: DragEvent) => {
		event.stopPropagation();
		if (!this.draggingHeader || !event.target) return;
		if (undefined === this.dragging) {
			this.dragging = {
				x: event.offsetX,
				y: event.offsetY,
			};
		}
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		// dragover会不断的触发事件，这里做一个截流，鼠标在3像素以内不去计算
		if (Math.abs(this.dragging.x - event.offsetX) < 3) return;
		this.dragging.x = event.offsetX;
		this.draggingHeader.element.removeClass('dragging');
		const td = $(event.target).closest('td');
		const colBar = $(event.target).closest(Template.COLS_HEADER_ITEM_CLASS);
		if (td.length === 0 && colBar.length === 0) return;

		if (colBar.length > 0) {
			const index = this.colsHeader
				?.find(Template.COLS_HEADER_ITEM_CLASS)
				.toArray()
				.findIndex((item) => item.equal(colBar));
			if (index === undefined) return;
			const currentCol = index;
			const _dropCol =
				event.offsetX > colBar.get<HTMLElement>()!.offsetWidth / 2
					? currentCol + 1
					: currentCol;
			this.showPlaceHolder(_dropCol, _dropCol !== currentCol);
			return;
		}
		const colBars = this.colsHeader?.find(Template.COLS_HEADER_ITEM_CLASS);
		if (!colBars) return;
		const tdElement = td.get<HTMLTableCellElement>()!;
		const colSpan = tdElement.colSpan;
		const [row, col] = this.table.selection.getCellPoint(td);
		let dropCol = col;
		let _passWidth = 0;

		for (let i = 0; i < colSpan; i++) {
			const colElement = colBars.eq(col + i)!.get<HTMLElement>()!;
			if (_passWidth + colElement.offsetWidth / 2 > event.offsetX) {
				dropCol = col + i;
				break;
			}
			if (_passWidth + colElement.offsetWidth > event.offsetX) {
				dropCol = col + i + 1;
				break;
			}
			_passWidth += colElement.offsetWidth;
		}
		this.showPlaceHolder(dropCol, dropCol !== col);
	};

	onDragColEnd = () => {
		this.unbindDragColEvent();
		const { index, count, isNext } = this.draggingHeader || {};
		if (!this.draggingHeader || index === undefined || count === undefined)
			return;
		const { command, selection } = this.table;
		const selectArea = selection.getSelectArea();
		const colBars = this.table.wrapper?.find(
			Template.COLS_HEADER_ITEM_CLASS,
		);
		if (!colBars) return;

		let widths = [];
		for (let c = selectArea.begin.col; c <= selectArea.end.col; c++) {
			widths.push(colBars.eq(c)?.get<HTMLElement>()?.offsetWidth || 0);
		}
		command.mockCopy();
		if (selectArea.begin.col > index) {
			const targetIndex = isNext ? index - 1 : index;
			command.removeCol();
			command.insertColAt(targetIndex, count, isNext, widths, true);
			selection.selectCol(targetIndex, targetIndex + count - 1);
			command.mockPaste(true);
		} else {
			command.removeCol();
			const targetIndex = (isNext ? index - 1 : index) - count;
			command.insertColAt(targetIndex, count, isNext, widths, true);
			selection.selectCol(targetIndex + 1, targetIndex + count);
			command.mockPaste(true);
		}
		this.placeholder?.css('display', 'none');
		this.draggingHeader = undefined;
		this.dragging = undefined;
	};

	onDragRow = (event: DragEvent) => {
		event.stopPropagation();
		if (!this.draggingHeader || !event.target) return;
		if (undefined === this.dragging) {
			this.dragging = {
				x: event.offsetX,
				y: event.offsetY,
			};
		}
		// dragover会不断的触发事件，这里做一个截流，鼠标在3像素以内不去计算
		if (Math.abs(this.dragging.y - event.offsetY) < 3) return;
		this.dragging.y = event.offsetY;
		this.draggingHeader.element.removeClass('dragging');

		const td = $(event.target).closest('td');
		const rowBar = $(event.target).closest(Template.ROWS_HEADER_ITEM_CLASS);
		if (td.length === 0 && rowBar.length === 0) return;

		if (rowBar.length > 0) {
			const index = this.rowsHeader
				?.find(Template.ROWS_HEADER_ITEM_CLASS)
				.toArray()
				.findIndex((item) => item.equal(rowBar));
			if (index === undefined) return;
			const currentRow = index;
			const _dropRow =
				event.offsetY > rowBar.get<HTMLElement>()!.offsetHeight / 2
					? currentRow + 1
					: currentRow;
			this.showPlaceHolder(_dropRow, _dropRow !== currentRow);
			return;
		}
		const rowBars = this.rowsHeader?.find(Template.ROWS_HEADER_ITEM_CLASS);
		if (!rowBars) return;
		const rowSpan = td.get<HTMLTableCellElement>()!.rowSpan;
		const [row] = this.table.selection.getCellPoint(td);
		let dropRow = row;
		let _passHeight = 0;

		for (let i = 0; i < rowSpan; i++) {
			const rowElement = rowBars[row + i] as HTMLTableRowElement;
			if (_passHeight + rowElement.offsetHeight / 2 > event.offsetY) {
				dropRow = row + i;
				break;
			}
			if (_passHeight + rowElement.offsetHeight > event.offsetY) {
				dropRow = row + i + 1;
				break;
			}
			_passHeight += rowElement.offsetHeight;
		}
		this.showPlaceHolder(dropRow, dropRow !== row);
	};

	onDragRowEnd = () => {
		this.unbindDragRowEvent();
		const { index, count, isNext } = this.draggingHeader || {};
		if (!this.draggingHeader || index === undefined || count === undefined)
			return;
		const { command, selection } = this.table;
		const selectArea = selection.getSelectArea();
		const { begin, end } = selectArea;
		command.mockCopy();
		if (begin.row > index) {
			const targetIndex = isNext ? index - 1 : index;
			command.removeRow();
			command.insertRowAt(targetIndex, count, !isNext, true);
			selection.selectRow(index, index + count - 1);
			command.mockPaste(true);
		} else {
			command.removeRow();
			const targetIndex = (isNext ? index - 1 : index) - count;
			command.insertRowAt(targetIndex, count, !isNext, true);
			selection.selectRow(targetIndex + 1, targetIndex + count);
			command.mockPaste(true);
		}
		this.placeholder?.css('display', 'none');
		this.draggingHeader = undefined;
		this.dragging = undefined;
	};

	removeRow(index: number) {
		const rowsHeaderItem = this.rowsHeader?.find(
			Template.ROWS_HEADER_ITEM_CLASS,
		);
		const item = rowsHeaderItem?.eq(index)?.get<HTMLElement>();
		if (item) this.rowsHeader?.get<HTMLElement>()?.removeChild(item);
	}

	removeCol(index: number) {
		const colsHeaderItem = this.colsHeader?.find(
			Template.COLS_HEADER_ITEM_CLASS,
		);
		const headerElement = this.colsHeader?.get<HTMLElement>();
		const item = colsHeaderItem?.eq(index)?.get<HTMLElement>();
		if (!headerElement || !item) return;
		this.colsHeader?.css(
			'width',
			headerElement.offsetWidth - item.offsetWidth + 'px',
		);
		headerElement.removeChild(item);
		this.tableRoot?.css('width', this.colsHeader?.css('width'));
	}
	private menuSets = new WeakSet<Node>();
	showContextMenu(event: MouseEvent) {
		const editor = this.editor;
		if (
			!this.menuBar ||
			!event.target ||
			!this.table.wrapper ||
			!editor.scrollNode
		)
			return;
		event.preventDefault();
		const { selection } = this.table;
		const menuItems = this.menuBar.find(Template.MENUBAR_ITEM_CLASS);
		menuItems.removeClass('disabled');
		menuItems.each((menu) => {
			const menuNode = $(menu);
			const action = menuNode.attributes('data-action');
			if (this.getMenuDisabled(action)) {
				menuNode.addClass('disabled');
			} else {
				const inputNode = menuNode.find(
					`input${Template.MENUBAR_ITEM_INPUT_CALSS}`,
				);
				if (inputNode.length === 0) return;
				const inputElement = inputNode.get<HTMLInputElement>()!;
				if (!this.menuSets.has(menu)) {
					this.menuSets.add(menu);
					inputNode
						.on('blur', () => {
							inputElement.value = Math.min(
								parseInt(inputElement.value, 10) || 1,
								this.MAX_INSERT_NUM,
							).toString();
						})
						.on('keydown', (event) => {
							if (isHotkey('enter', event)) {
								this.handleTriggerMenu(menuNode);
							}
						});
					inputNode.on('mousedown', this.onMenuInputMousedown);
				}

				const selectArea = selection.getSelectArea();
				const isInsertCol =
					['insertColLeft', 'insertColRight'].indexOf(action) > -1;
				const isInsertRow =
					['insertRowUp', 'insertRowDown'].indexOf(action) > -1;
				if (isInsertCol) {
					inputElement.value = `${
						selectArea.end.col - selectArea.begin.col + 1
					}`;
				}
				if (isInsertRow) {
					inputElement.value = `${
						selectArea.end.row - selectArea.begin.row + 1
					}`;
				}
			}
		});
		const splits = this.menuBar.find('div.split');
		splits.each((splitNode) => {
			const split = $(splitNode);
			let prev = split.prev();
			while (prev) {
				if (prev.hasClass('split')) {
					split.remove();
					break;
				}
				if (!prev.hasClass('disabled')) break;
				prev = prev.prev();
			}
			if (!prev) split.remove();
		});
		const tartgetNode = $(event.target);
		let prevRect = tartgetNode.getBoundingClientRect() || {
			top: 0,
			left: 0,
		};

		let parentNode = tartgetNode.parent();
		let top = 0,
			left = 0;
		while (
			parentNode &&
			parentNode.closest(Template.TABLE_WRAPPER_CLASS).length > 0
		) {
			const rect = parentNode.getBoundingClientRect() || {
				top: 0,
				left: 0,
			};
			top += prevRect.top - rect.top;
			left += prevRect.left - rect.left;
			prevRect = rect;
			parentNode = parentNode.parent();
		}
		const wrapperRect = this.table.wrapper
			.get<HTMLElement>()!
			.getBoundingClientRect();
		const viewport = editor.scrollNode.getViewport();
		top += event.offsetY;
		const menuHeight = this.menuBar.height();
		// 底部溢出
		const allTop = wrapperRect.top + top + menuHeight + 4;
		if (allTop > viewport.bottom) {
			let diff = allTop - viewport.bottom;
			// 如果 top 溢出上边界，则调整 top 到最高 top
			if (top - diff < 0 && wrapperRect.top + top - diff < viewport.top) {
				diff = wrapperRect.top + top - viewport.top;
			}
			top -= diff;
		}
		this.menuBar.css('left', left + event.offsetX + 'px');
		this.menuBar.css('top', top + 'px');
		//绑定input事件

		this.contextVisible = true;
	}

	onMenuInputMousedown = (event: MouseEvent) => {
		event.stopPropagation();
	};

	hideContextMenu() {
		if (!this.contextVisible) {
			return;
		}
		const menuItems = this.menuBar?.find(Template.MENUBAR_ITEM_CLASS);
		menuItems?.removeClass('disabled');
		this.contextVisible = false;
		this.menuBar?.css({
			top: '-99999px',
			left: '-99999px',
		});
	}

	getMenuDisabled(action: string) {
		const { selection, command } = this.table;
		switch (action) {
			case 'cut':
			case 'copy':
				return !selection.selectArea || selection.selectArea.count <= 1;
			case 'splitCell':
				return !selection.hasMergeCell();
			case 'mergeCell':
				return !selection.selectArea;
			case 'mockPaste':
				return !command.hasCopyData();
			case 'removeCol':
			case 'insertColLeft':
			case 'insertColRight':
				return selection.isColSelected();
			case 'removeRow':
			case 'insertRowUp':
			case 'insertRowDown':
				return selection.isRowSelected();
			default:
				return false;
		}
	}

	handleClickMenu(event: MouseEvent) {
		if (!event.target) return;
		const targetNode = $(event.target);
		const menu = targetNode.closest('.table-menubar-item');
		if (menu.length === 0 || targetNode.name === 'input') return;
		event.stopPropagation();
		this.handleTriggerMenu(menu);
	}

	handleTriggerMenu(menu: NodeInterface) {
		if (!menu.hasClass('disabled')) {
			const action = menu.attributes('data-action');
			const inputNode = menu.find(
				`input${Template.MENUBAR_ITEM_INPUT_CALSS}`,
			);
			let args: undefined | number = undefined;
			if (inputNode.length > 0) {
				args = Math.min(
					parseInt(
						inputNode.get<HTMLInputElement>()?.value || '1',
						10,
					),
					this.MAX_INSERT_NUM,
				);
			}

			this.table.command[action](args);
		}
		this.hideContextMenu();
	}

	handleHoverMenu(event: MouseEvent) {
		if (!event.target) return;
		const menu = $(event.target).closest('.table-menubar-item');
		if (menu.length === 0) return;
		event.stopPropagation();

		const { selection } = this.table;

		if (!menu.hasClass('disabled')) {
			const action = menu.attributes('data-action');
			switch (action) {
				case 'removeCol':
					this.handleHighlightCol();
					break;
				case 'removeRow':
					this.handleHighlightRow();
					break;
				case 'removeTable':
					this.handleHighlightTable();
					break;
				default:
					selection.hideHighlight();
			}
		}
	}

	hideHighlight(event: MouseEvent) {
		event.stopPropagation();
		this.table.selection.hideHighlight();
	}

	handleHighlightRow = () => {
		const { selection } = this.table;
		const { tableModel } = selection;
		if (!tableModel) return;
		const selectArea = { ...selection.getSelectArea() };
		selectArea.allCol = true;
		selectArea.begin = { row: selectArea.begin.row, col: 0 };
		selectArea.end = { row: selectArea.end.row, col: tableModel.cols - 1 };
		selection.showHighlight(selectArea);
	};

	handleHighlightCol = () => {
		const { selection } = this.table;
		const { tableModel } = selection;
		if (!tableModel) return;
		const selectArea = { ...selection.getSelectArea() };
		selectArea.allRow = true;
		selectArea.begin = { row: 0, col: selectArea.begin.col };
		selectArea.end = { row: tableModel.rows - 1, col: selectArea.end.col };
		selection.showHighlight(selectArea);
	};

	handleHighlightTable = () => {
		const { selection } = this.table;
		const { tableModel } = selection;
		if (!tableModel) return;
		const selectArea = { ...selection.getSelectArea() };
		selectArea.allRow = true;
		selectArea.allCol = true;
		selectArea.begin = { row: 0, col: 0 };
		selectArea.end = { row: tableModel.rows - 1, col: tableModel.cols - 1 };
		selection.showHighlight(selectArea);
	};

	drawBackgroundColor(color?: string) {
		const { selection, helper } = this.table;
		selection.each((cell) => {
			if (!helper.isEmptyModelCol(cell) && cell.element) {
				if (!color || color === 'transparent')
					cell.element.style.removeProperty('background-color');
				else cell.element.style.backgroundColor = color;
			}
		});
	}

	setAlign(align?: 'top' | 'middle' | 'bottom') {
		const { selection, helper } = this.table;
		selection.each((cell) => {
			if (!helper.isEmptyModelCol(cell) && cell.element) {
				if (!align || align === 'top')
					cell.element.style.removeProperty('vertical-align');
				else cell.element.style.verticalAlign = align;
			}
		});
	}

	destroy() {
		this.colsHeader?.removeAllEvents();
		this.rowsHeader?.removeAllEvents();
		this.tableHeader?.removeAllEvents();
		this.table.wrapper?.removeAllEvents();
		this.tableRoot?.removeAllEvents();
		this.menuBar?.removeAllEvents();
		//列头部 padding 区域单击让其选中表格卡片上方的blcok
		this.viewport?.removeAllEvents();
		//行删除按钮
		this.rowDeleteButton?.removeAllEvents();
		//列删除按钮
		this.colDeleteButton?.removeAllEvents();
		//列增加按钮
		this.colAddButton?.removeAllEvents();
		this.colsHeader?.removeAllEvents();
		//行增加按钮
		this.rowAddButton?.removeAllEvents();

		this.rowsHeader?.removeAllEvents();
	}
}

export default ControllBar;
