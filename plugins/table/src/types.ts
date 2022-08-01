import { EditorInterface } from '@aomao/engine';
import {
	CardInterface,
	CardToolbarItemOptions,
	CardValue,
	ClipboardData,
	NodeInterface,
	PluginOptions,
	ToolbarItemOptions,
} from '@aomao/engine';
import { EventEmitter2 } from 'eventemitter2';

export interface HelperInterface {
	isEmptyModelCol(
		model: TableModelCol | TableModelEmptyCol,
	): model is TableModelEmptyCol;
	/**
	 * 提取表格数据模型，由于合并单元格的存在，html 结构不利于操作
	 * @param {NativeNode} table 表格原生对象
	 * @return {(tdModel[])[]} result 一个二维数组
	 * [
	 *  [tdModel, tdModel...],
	 *  [tdModel, tdModel...],
	 *  ...
	 * ]
	 * @tdModel:
	 *  {
	 *    isMulti: {boolean} 合并的单元格
	 *    isEmpty: {boolean} 为 true 时表示被合并单元格覆盖到的占位
	 *    isShadow: {boolean} 为 true 时表示这是一个补充的单元格，html拷贝的时候会出现遗漏单元格，这里需要补充上
	 *    parent: {row, col} 标记占位格的父单元格的坐标位置
	 *    element: {NativeNode} 指针作用，指向对应的 td
	 *    rowSpan: {number} 单元格的 rowSpan
	 *    colSpan: {number} 单元格的 colSpan
	 *  }
	 */
	getTableModel(table: NodeInterface): TableModel;

	/**
	 * table 结构标准化，补齐丢掉的单元格和行
	 * 场景1. number 拷贝过来的 html 中，如果这一行没有单元格，就会省掉 tr，渲染的时候会有问题
	 * 场景2. 从网页中鼠标随意选取表格中的一部分，会丢掉没有选中的单元格，需要补齐单元格
	 * @param {nativeNode} table 表格 Dom
	 * @return {nativeNode} 修复过的 table dom
	 */
	normalize(table: NodeInterface): NodeInterface;

	/**
	 * firefox 下的拖拽需要这样处理
	 * clearData 是为了防止新开 tab
	 * hack: 如果不 setData, firefox 不会触发拖拽事件，但设置 data 之后，又会开新 tab, 这里设置一个 firefox 不识别的 mimetype: aomao
	 * @param event
	 */
	fixDragEvent(event: DragEvent): void;

	/**
	 * 从源节点复制样式到目标节点
	 * @param from 源节点
	 * @param to 目标节点
	 */
	copyCss(from: NodeInterface | Node, to: NodeInterface | Node): void;

	/**
	 * 从源节点复制样式和内容到目标节点
	 * @param from 源节点
	 * @param to 目标节点
	 */
	copyTo(from: NodeInterface | Node, to: NodeInterface | Node): void;

	/**
	 * 复制html
	 * @param html HTML
	 */
	copyHTML(html: string): void;

	/**
	 * 获取复制的数据
	 * @returns
	 */
	getCopyData(): { html: string; text: string } | undefined;
	/**
	 * 清除复制的数据
	 */
	clearCopyData(): void;

	trimBlankSpan(node: NodeInterface): NodeInterface;

	/**
	 * table 结构标准化，补齐丢掉的单元格和行
	 * 场景1. number 拷贝过来的 html 中，如果这一行没有单元格，就会省掉 tr，渲染的时候会有问题
	 * 场景2. 从网页中鼠标随意选取表格中的一部分，会丢掉没有选中的单元格，需要补齐单元格
	 * @param {NodeInterface} table 表格 Dom
	 * @return {NodeInterface} 修复过的 table dom
	 */
	normalizeTable(table: NodeInterface): NodeInterface;
}

export interface TemplateInterface {
	/**
	 * 是否只读
	 */
	isReadonly: boolean;
	/**
	 * 用于Card渲染
	 * @param {object} value 参数
	 * @param {number} value.rows 行数
	 * @param {number} value.cols 列数
	 * @param {string} value.html html 字符串
	 * @return {string} 返回 html 字符串
	 */
	htmlEdit(value: TableValue, menus: TableMenu): string;
	/**
	 * 阅读模式渲染
	 * @param value
	 */
	htmlView(value: TableValue): string;
	/**
	 * 获取空的单元格模版
	 */
	getEmptyCell(): string;
	/**
	 * 获取指定行数的行 header
	 * @param rows
	 */
	renderRowsHeader(rows: number): string;
	/**
	 * 获取指定列数的列 header
	 * @param cols
	 */
	renderColsHeader(cols: number): string;
}

export interface TableValue extends CardValue {
	id: string;
	rows: number;
	cols: number;
	width?: number;
	height?: number;
	html?: string;
	color?: string;
	noBorder?: boolean;
	overflow?: boolean;
}

export type TableMenuItem = {
	action?: string;
	icon?: string;
	text?: string;
	split?: true;
};

export type TableMenu = Array<TableMenuItem>;

export type TableModelCol = {
	isShadow?: boolean;
	rowSpan: number;
	colSpan: number;
	isMulti?: boolean;
	element: HTMLTableColElement | HTMLTableDataCellElement | null;
};

export type TableModelEmptyCol = {
	isEmpty: true;
	parent: {
		row: number;
		col: number;
	};
};

export type TableModel = {
	rows: number;
	cols: number;
	width: number;
	height: number;
	table: Array<Array<TableModelCol | TableModelEmptyCol>>;
};

export interface TableInterface<V extends TableValue = TableValue>
	extends CardInterface<V> {
	wrapper?: NodeInterface;
	helper: HelperInterface;
	template: TemplateInterface;
	selection: TableSelectionInterface;
	conltrollBar: ControllBarInterface;
	command: TableCommandInterface;
	colMinWidth: number;
	rowMinHeight: number;
	/**
	 * 渲染
	 */
	render(): string | NodeInterface | void;
}

export interface TableOptions extends PluginOptions {
	hotkey?: string | Array<string>;
	overflow?: {
		maxLeftWidth?: () => number;
		maxRightWidth?: () => number;
	};
	colMinWidth?: number;
	rowMinHeight?: number;
	/**最大插入行、列 */
	maxInsertNum?: number;
	markdown?: boolean;
	cardToolbars?: (
		items: (ToolbarItemOptions | CardToolbarItemOptions)[],
		editor: EditorInterface,
	) => (ToolbarItemOptions | CardToolbarItemOptions)[];
}

export type ControllOptions = {
	col_min_width: number;
	row_min_height: number;
	/**最大插入行、列 数 */
	max_insert_num: number;
};

export type ControllDragging = {
	x: number;
	y: number;
};

export type ControllDraggingHeader = {
	element: NodeInterface;
	minIndex: number;
	maxIndex: number;
	count: number;
	index?: number;
	isNext?: boolean;
};

export type ControllChangeSize = {
	trigger: {
		element: NodeInterface;
		height: number;
		width: number;
	};
	width: number;
	height: number;
	element: NodeInterface;
	index: number;
	table: {
		width: number;
		height: number;
	};
};

export interface ControllBarInterface extends EventEmitter2 {
	/**
	 * 拖动参数
	 */
	dragging?: ControllDragging;
	/**
	 * 拖动行列头部
	 */
	draggingHeader?: ControllDraggingHeader;
	/**
	 * 调整大小参数
	 */
	changeSize?: ControllChangeSize;

	init(): void;

	refresh(refershSize?: boolean): void;

	renderRowBars(refershSize?: boolean): void;

	renderColBars(refershSize?: boolean): void;

	removeRow(index: number): void;

	removeCol(index: number): void;

	showContextMenu(event: MouseEvent): void;

	hideContextMenu(): void;

	drawBackgroundColor(color?: string): void;

	setAlign(align?: 'top' | 'middle' | 'bottom'): void;

	getMenuDisabled(action: string): boolean;

	destroy(): void;
}

export interface TableCommandInterface extends EventEmitter2 {
	init(): void;

	insertColAt(
		index: number,
		count: number,
		isLeft?: boolean,
		widths?: number | Array<number>,
		...args: any
	): void;

	insertCol(
		position?: 'left' | 'end' | 'right',
		count?: number,
		...args: any
	): void;

	removeCol(...args: any): void;

	insertColLeft(): void;

	insertColRight(): void;

	insertRowAt(
		index: number,
		count: number,
		isUp?: boolean,
		...args: any
	): void;

	insertRow(
		position?: 'up' | 'end' | 'down',
		count?: number,
		...args: any
	): void;

	insertRowUp(): void;

	insertRowDown(): void;

	removeRow(...args: any): void;

	removeTable(): void;

	copy(all?: boolean): void;

	mockCopy(): void;

	/**
	 * 清除复制的数据
	 */
	clearCopyData(): void;

	shortcutCopy(event: ClipboardEvent): void;

	cut(): void;

	shortcutCut(event: ClipboardEvent): void;

	clear(): void;

	mockPaste(...args: any): void;

	shortcutPaste(event: ClipboardEvent): void;

	paste(data: ClipboardData, ...args: any): void;

	mergeCell(...args: any): void;

	splitCell(...args: any): void;

	hasCopyData(): boolean;
}

export type TableSelectionArea = {
	begin: { row: number; col: number };
	end: { row: number; col: number };
	count: number;
	allCol: boolean;
	allRow: boolean;
};

export type TableSelectionDragging = {
	trigger: {
		element: NodeInterface;
	};
};

export interface TableSelectionInterface extends EventEmitter2 {
	tableModel?: TableModel;

	selectArea?: TableSelectionArea;

	init(): void;

	render(action: string): void;

	each(
		fn: (
			cell: TableModelCol | TableModelEmptyCol,
			row: number,
			col: number,
		) => void,
		reverse?: boolean,
	): void;

	refreshModel(): void;

	getCellPoint(td: NodeInterface): Array<number>;

	getCellIndex(row: number, col: number): number;

	getSingleCell(): NodeInterface | null;

	getSingleCellPoint(): Array<number>;

	getSelectArea(): TableSelectionArea;

	selectCol(begin: number, end?: number): void;

	selectRow(begin: number, end?: number): void;

	select(
		start: { row: number; col: number },
		end: { row: number; col: number },
	): void;

	clearSelect(): void;

	getSelectionHtml(all?: boolean): string | null;

	hasMergeCell(): boolean;

	isRowSelected(): boolean;

	isColSelected(): boolean;

	isTableSelected(): boolean;

	showHighlight(area: TableSelectionArea): void;

	hideHighlight(): void;

	focusCell(cell: NodeInterface | Node, start?: boolean): void;

	selectCellRange(cell: NodeInterface | Node): void;

	destroy(): void;
}
