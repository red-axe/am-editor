import {
	HelperInterface,
	TableModel,
	TableModelCol,
	TableModelEmptyCol,
	TableOptions,
} from '../types';
import isInteger from 'lodash/isInteger';
import {
	$,
	EDITABLE_SELECTOR,
	DATA_TRANSIENT_ATTRIBUTES,
	isNode,
	NodeInterface,
	transformCustomTags,
	EditorInterface,
	isEngine,
} from '@aomao/engine';
import Template from './template';

class Helper implements HelperInterface {
	private clipboard?: {
		html: string;
		text: string;
	};

	#editor: EditorInterface;

	constructor(editor: EditorInterface) {
		this.#editor = editor;
	}

	isEmptyModelCol(
		model: TableModelCol | TableModelEmptyCol,
	): model is TableModelEmptyCol {
		return model && (model as TableModelEmptyCol).isEmpty;
	}

	/**
	 * 获取表格数据模型
	 * @param table
	 * @returns
	 */
	getTableModel(table: NodeInterface): TableModel {
		let model: Array<Array<TableModelCol | TableModelEmptyCol>> = [];
		const tableElement = table.get<HTMLTableElement>()!;
		const rows = tableElement.rows;
		const rowCount = rows?.length || 0;

		for (let r = 0; r < rowCount; r++) {
			const tr = rows[r];
			const cells = tr.cells;
			const cellCount = cells.length;

			for (let c = 0; c < cellCount; c++) {
				const td = cells[c];
				let { rowSpan, colSpan } = td;
				rowSpan = rowSpan === void 0 ? 1 : rowSpan;
				colSpan = colSpan === void 0 ? 1 : colSpan;
				const isMulti = rowSpan > 1 || colSpan > 1;
				model[r] = model[r] || [];
				// 如果当前单元格的 model 已经存在，说明是前面已经有合并单元格覆盖了当前坐标，需要往右推移
				let _c = c;
				while (model[r][_c]) {
					_c++;
				}

				model[r][_c] = {
					rowSpan: rowSpan,
					colSpan: colSpan,
					isMulti: isMulti,
					element: td,
				};

				if (isMulti) {
					// 补齐被合并的单元格占位
					let _rowCount = rowSpan;

					while (_rowCount > 0) {
						let colCount = colSpan;
						while (colCount > 0) {
							if (colCount !== 1 || _rowCount !== 1) {
								const rowIndex = r + _rowCount - 1;
								const colIndex = _c + colCount - 1;
								model[rowIndex] = model[rowIndex] || [];
								model[rowIndex][colIndex] = {
									isEmpty: true,
									parent: {
										row: r,
										col: _c,
									},
									element: null,
								};
							}
							colCount--;
						}
						_rowCount--;
					}
				}
			}
		}

		const colCounts = model.map((trModel) => {
			return trModel.length;
		});
		const MaxColCount = Math.max(...colCounts);
		model.forEach((trModel) => {
			if (trModel.length < MaxColCount) {
				let addCount = MaxColCount - trModel.length;
				while (addCount--) {
					trModel.push({
						rowSpan: 1,
						colSpan: 1,
						isShadow: true,
						element: null,
					});
				}
			}
			// 表格内有空数组项，补齐为 shadow
			for (let i = 0; i < MaxColCount; i++) {
				if (!trModel[i]) {
					trModel[i] = {
						rowSpan: 1,
						colSpan: 1,
						isShadow: true,
						element: null,
					};
				}
			}
		});
		const result = {
			rows: model.length,
			cols: MaxColCount,
			width: tableElement.offsetWidth,
			height: tableElement.offsetHeight,
			table: model,
		};
		return result;
	}
	/**
	 * 修复表格，补全丢失的单元格
	 * @param table
	 * @returns
	 */
	normalize(table: NodeInterface) {
		this.trimStartTr(table);
		this.fixNumberTr(table);
		table.addClass('data-table');
		table.attributes(DATA_TRANSIENT_ATTRIBUTES, 'class');
		// 修正表格宽度为 pt 场景
		const width = table.css('width');

		if (parseInt(width) === 0) {
			table.css('width', 'auto');
		}
		table.css('background-color', '');

		const model = this.getTableModel(table);

		// 修正列的 span 场景
		let cols = table.find('col');
		if (cols.length !== 0) {
			for (let c = cols.length - 1; c >= 0; c--) {
				const colElement = cols[c] as HTMLTableColElement;
				const _width = cols.eq(c)?.attributes('width');
				if (_width) {
					cols.eq(c)?.attributes('width', parseInt(_width));
				}

				if (colElement.span > 1) {
					let addCount = colElement.span - 1;
					while (addCount--) {
						cols[c].parentNode?.insertBefore(
							cols[c].cloneNode(),
							cols[c],
						);
					}
				}
			}
			cols = table.find('col');
			if (cols.length < model.cols) {
				const lastCol = cols.length - 1;
				let colsAddCount = model.cols - cols.length;
				while (colsAddCount--) {
					cols[0].parentNode?.appendChild(cols[lastCol].cloneNode());
				}
			}
			table.find('col').attributes('span', 1);
		} else {
			let colgroup = table.find('colgroup')[0];
			if (!colgroup) {
				colgroup = document.createElement('colgroup');
			}
			table.prepend(colgroup);
			const widths = (function (table) {
				const tr = table.find('tr')[0];
				const tds = $(tr).find('td');
				const widthArray: Array<number | undefined> = [];
				tds.each((_, index) => {
					const $td = tds.eq(index);
					if (!$td) return;
					let colWidth: string | Array<string> =
						$td.attributes('data-colwidth');
					let tdWidth: string | number = $td.attributes('width');
					const tdColSpan = ($td[0] as HTMLTableDataCellElement)
						.colSpan;
					if (colWidth) {
						colWidth = colWidth.split(',');
					} else if (tdWidth) {
						tdWidth = parseInt(tdWidth) / tdColSpan;
					}
					for (let o = 0; tdColSpan > o; o++) {
						if (colWidth && colWidth[o]) {
							widthArray.push(parseInt(colWidth[o]));
						} else if (tdWidth) {
							widthArray.push(parseInt(tdWidth.toString()));
						} else {
							widthArray.push(undefined);
						}
					}
				});
				const td = table.find('td');
				td.removeAttributes('data-colwidth');
				td.removeAttributes('width');
				return widthArray;
			})(table);
			const col = document.createElement('col');
			for (let f = 0; model.cols > f; f++) {
				const node = col.cloneNode();
				if (widths[f]) {
					(node as HTMLElement).setAttribute(
						'width',
						(widths[f] || '').toString(),
					);
				}
				colgroup.appendChild(node);
			}
		}
		// 数据模型和实际 dom 结构的行数不一致，需要寻找并补齐行
		const tableElement = table.get<HTMLTableElement>()!;
		model.table.forEach((tr, r) => {
			if (!tableElement.rows[r]) {
				tableElement.insertRow(r);
			}
			const shadow = tr.filter((td) => {
				return this.isEmptyModelCol(td) ? false : td.isShadow;
			});
			let shadowCount = shadow.length;
			while (shadowCount--) {
				if (r === 0) {
					tableElement.rows[r].insertCell(0);
				} else {
					tableElement.rows[r].insertCell();
				}
			}
		});
		// 修正行高
		const trs = table.find('tr');
		trs.each((_, index) => {
			const $tr = trs.eq(index);
			if (!$tr) return;
			let height = parseInt($tr.css('height'));
			height =
				height ||
				this.#editor.plugin.findPlugin<TableOptions>('table')?.options
					.rowMinHeight ||
				0;
			$tr.css('height', height + 'px');
		});
		//补充可编辑器区域
		const tds = table.find('td');
		tds.each((_, index) => {
			const tdNode = tds.eq(index);
			if (!tdNode) return;
			tdNode.attributes(
				DATA_TRANSIENT_ATTRIBUTES,
				'table-cell-selection',
			);
			let editableElement = tdNode.find(EDITABLE_SELECTOR);
			if (editableElement.length === 0) {
				const content = tdNode.html();
				tdNode.empty();
				tdNode.append(
					Template.EmptyCell(
						!isEngine(this.#editor) || this.#editor.readonly,
					),
				);
				editableElement = tdNode.find(EDITABLE_SELECTOR);
				editableElement.html(content);
			}
			editableElement.find('p').each((pNode) => {
				if (pNode.childNodes.length === 0) {
					pNode.appendChild(document.createElement('br'));
				}
			});
		});
		return table;
	}

	/**
	 * 过滤 table 中的首行空tr, 当表格尾部有空白单元格时，网页拷贝时头部会莫名其妙的出现一个空的Tr
	 * @param {nodeModel} table 传入的table
	 */
	trimStartTr(table: NodeInterface) {
		const tr = table.find('tr');
		const first = tr.eq(0);
		if (first && first.get<Node>()?.childNodes.length === 0) {
			first.remove();
		}
	}

	fixNumberTr(table: NodeInterface) {
		const tableElement = table.get<HTMLTableElement>()!;
		const rows = tableElement.rows;
		const rowCount = rows?.length || 0;
		let colCounts: Array<number> = [];
		let firstColCount: number = 0; // 第一列的单元格个数
		let cellCounts = []; // 每行单元格个数
		let totalCellCounts = 0; // 总单元格个数
		let emptyCounts = 0; // 跨行合并缺损的单元格
		// 已经存在一行中的 td 的最大数，最终算出来的最大列数一定要大于等于这个值
		let maxCellCounts = 0; // 在不确定是否缺少tr时，先拿到已经存在的td，和一些关键信息

		for (let r = 0; r < rowCount; r++) {
			const row = rows[r];
			const cells = row.cells;
			let cellCountThisRow = 0;

			for (let c = 0; c < cells.length; c++) {
				const { rowSpan, colSpan } = cells[c];
				totalCellCounts += rowSpan * colSpan;
				cellCountThisRow += colSpan;
				if (rowSpan > 1) {
					emptyCounts += (rowSpan - 1) * colSpan;
				}
			}
			cellCounts[r] = cellCountThisRow;
			if (r === 0) {
				firstColCount = cellCountThisRow;
			}
			maxCellCounts = Math.max(cellCountThisRow, maxCellCounts);
		}
		// number拷贝的一定是首行列数能被单元格总数整除
		const isNumber1 = isInteger(totalCellCounts / firstColCount); // number拷贝的一定是首行列数最大
		const isNumber2 = firstColCount === maxCellCounts;
		const isNumber = isNumber1 && isNumber2; // 判断是否是 number, 是因为 number 需要考虑先修复省略的 tr，否则后面修复出来就会有问题

		if (isNumber) {
			let lossCellCounts = 0;
			cellCounts.forEach((cellCount) => {
				lossCellCounts += maxCellCounts - cellCount;
			});

			if (lossCellCounts !== emptyCounts) {
				const missCellCounts = emptyCounts - lossCellCounts;
				if (isInteger(missCellCounts / maxCellCounts)) {
					let lossRowIndex = []; // 记录哪一行缺 tr

					for (let _r = 0; _r < rowCount; _r++) {
						const _row = rows[_r];
						const _cells = _row.cells;
						let realRow: number = _r + lossRowIndex.length;

						while (colCounts[realRow] === maxCellCounts) {
							lossRowIndex.push(realRow);
							realRow++;
						}

						for (let _c2 = 0; _c2 < _cells.length; _c2++) {
							const { rowSpan, colSpan } = _cells[_c2];
							if (rowSpan > 1) {
								for (let rr = 1; rr < rowSpan; rr++) {
									colCounts[realRow + rr] =
										(colCounts[realRow + rr] || 0) +
										colSpan;
								}
							}
						}
					}

					lossRowIndex.forEach((row) => {
						tableElement.insertRow(row);
					});
				}
			}
		}
	}

	// firefox 下的拖拽需要这样处理
	// clearData 是为了防止新开 tab
	// hack: 如果不 setData, firefox 不会触发拖拽事件，但设置 data 之后，又会开新 tab, 这里设置一个 firefox 不识别的 mimetype: aomao
	fixDragEvent(event: DragEvent) {
		event.dataTransfer?.clearData();
		event.dataTransfer?.setData('aomao', '');
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'all';
		}
	}

	/**
	 * 从源节点复制样式到目标节点
	 * @param from 源节点
	 * @param to 目标节点
	 */
	copyCss(from: NodeInterface | Node, to: NodeInterface | Node) {
		if (isNode(from)) from = $(from);
		if (isNode(to)) to = $(to);
		to.css('text-align', from.css('text-align'));
		to.css('vertical-align', from.css('vertical-align'));
		let tdBgColor = from.css('background-color');
		tdBgColor = tdBgColor !== 'rgba(0, 0, 0, 0)' ? tdBgColor : '#fff';
		to.css('background-color', tdBgColor);
		to.css('color', from.css('color'));
		to.css('font-weight', from.css('font-weight'));
	}

	/**
	 * 从源节点复制样式和内容到目标节点
	 * @param from 源节点
	 * @param to 目标节点
	 */
	copyTo(from: NodeInterface | Node, to: NodeInterface | Node) {
		if (isNode(from)) from = $(from);
		if (isNode(to)) to = $(to);

		let editableElement = to.find(EDITABLE_SELECTOR);
		if (editableElement.length === 0) {
			to.html(
				Template.EmptyCell(
					!isEngine(this.#editor) || this.#editor.readonly,
				),
			);
			editableElement = to.find(EDITABLE_SELECTOR);
		}
		editableElement.html(transformCustomTags(from.html()));
		if (
			to.name === 'td' &&
			to.find(Template.TABLE_TD_BG_CLASS).length === 0
		) {
			to.append($(Template.CellBG));
		}
		if (to.name === 'td') {
			to.attributes('data-transient-attributes', 'table-cell-selection');
		}
		//this.copyCss(from, to)
	}

	/**
	 * 复制html
	 * @param html HTML
	 */
	copyHTML(html: string) {
		this.clipboard = {
			html: html,
			text: $(html).get<HTMLElement>()?.innerText || '',
		};
	}
	/**
	 * 获取复制的数据
	 * @returns
	 */
	getCopyData() {
		return this.clipboard;
	}

	clearCopyData() {
		this.clipboard = undefined;
	}

	trimBlankSpan(node: NodeInterface) {
		const len = node.length;
		let nodelist = [];
		let i = 0;
		let j = len - 1;
		while (
			node[i] &&
			(node[i] as HTMLElement).tagName.toLowerCase() === 'span' &&
			(node[i] as HTMLElement).innerText.trim() === ''
		) {
			i++;
		}

		while (
			node[j] &&
			(node[j] as HTMLElement).tagName.toLowerCase() === 'span' &&
			(node[j] as HTMLElement).innerText.trim() === ''
		) {
			j--;
		}

		if (i <= j) {
			for (let k = i; k <= j; k++) {
				nodelist.push(node[k]);
			}
		}

		if (nodelist.length) {
			return $(nodelist);
		}
		return node;
	}

	/**
	 * table 结构标准化，补齐丢掉的单元格和行
	 * 场景1. number 拷贝过来的 html 中，如果这一行没有单元格，就会省掉 tr，渲染的时候会有问题
	 * 场景2. 从网页中鼠标随意选取表格中的一部分，会丢掉没有选中的单元格，需要补齐单元格
	 * @param {NodeInterface} table 表格 Dom
	 * @return {NodeInterface} 修复过的 table dom
	 */
	normalizeTable(table: NodeInterface) {
		this.trimStartTr(table);
		this.fixNumberTr(table);
		table.addClass('data-table');
		// 修正表格宽度为 pt 场景
		const width = table.css('width');

		if (parseInt(width) === 0) {
			table.css('width', 'auto');
		} else if (!width.endsWith('%')) {
			// pt 直接转为 px, 因为 col 的 width 属性是没有单位的，会直接被理解为 px, 这里 table 的 width 也直接换成 px。
			table.css('width', parseInt(width, 10) + 'px');
		} // 表格 table 标签不允许有背景色，无法设置

		table.css('background-color', '');
		const model = this.getTableModel(table);
		// 修正列的 span 场景
		let cols = table.find('col');
		if (cols.length !== 0) {
			for (let c = cols.length - 1; c >= 0; c--) {
				const colElement = cols[c] as HTMLTableColElement;
				const _width = cols.eq(c)?.attributes('width');
				if (_width && !_width.endsWith('%')) {
					const widthValue = parseInt(_width);
					if (widthValue !== NaN)
						cols.eq(c)?.attributes('width', widthValue);
				}

				if (colElement.span > 1) {
					let addCount = colElement.span - 1;
					while (addCount--) {
						cols[c].parentNode?.insertBefore(
							cols[c].cloneNode(),
							cols[c],
						);
					}
				}
			}
			cols = table.find('col');
			if (cols.length < model.cols) {
				const lastCol = cols.length - 1;
				let colsAddCount = model.cols - cols.length;
				while (colsAddCount--) {
					cols[0].parentNode?.appendChild(cols[lastCol].cloneNode());
				}
			}
			table.find('col').attributes('span', 1);
		} else {
			let colgroup = table.find('colgroup')[0];
			if (!colgroup) {
				colgroup = document.createElement('colgroup');
			}
			table.prepend(colgroup);
			const widths = (function (table) {
				const tr = table.find('tr')[0];
				const tds = $(tr).find('td');
				const widthArray: Array<number | undefined> = [];
				tds.each((_, index) => {
					const tdNode = tds.eq(index);
					if (!tdNode) return;
					let colWidth: string | Array<string> =
						tdNode.attributes('data-colwidth');
					let tdWidth: string | number = tdNode.attributes('width');
					const tdColSpan = (tdNode[0] as HTMLTableDataCellElement)
						.colSpan;
					if (colWidth) {
						colWidth = colWidth.split(',');
					} else if (tdWidth) {
						tdWidth = parseInt(tdWidth) / tdColSpan;
					}
					for (let o = 0; tdColSpan > o; o++) {
						if (colWidth && colWidth[o]) {
							widthArray.push(parseInt(colWidth[o]));
						} else if (tdWidth) {
							widthArray.push(parseInt(tdWidth.toString()));
						} else {
							widthArray.push(undefined);
						}
					}
				});
				const td = table.find('td');
				td.removeAttributes('data-colwidth');
				td.removeAttributes('width');
				return widthArray;
			})(table);
			const col = document.createElement('col');
			for (let f = 0; model.cols > f; f++) {
				const node = col.cloneNode();
				if (widths[f]) {
					(node as HTMLElement).setAttribute(
						'width',
						(widths[f] || '').toString(),
					);
				}
				colgroup.appendChild(node);
			}
		}
		// 数据模型和实际 dom 结构的行数不一致，需要寻找并补齐行
		const tableElement = table.get<HTMLTableElement>()!;
		model.table.forEach((tr, r) => {
			if (!tableElement.rows[r]) {
				tableElement.insertRow(r);
			}
			const shadow = tr.filter((td) => {
				return (td as TableModelCol).isShadow;
			});
			let shadowCount = shadow.length;
			while (shadowCount--) {
				// if (r === 0) {
				// 	tableElement.rows[r].insertCell(0);
				// } else {
				tableElement.rows[r].insertCell();
				// }
			}
		});
		// 修正行高
		const trs = table.find('tr');
		trs.each((_, index) => {
			const $tr = trs.eq(index);
			if (!$tr) return;
			let height = parseInt($tr.css('height'));
			height =
				height ||
				this.#editor.plugin.findPlugin<TableOptions>('table')?.options
					.rowMinHeight ||
				0;
			$tr.css('height', height + 'px');
		});
		return table;
	}
}

export default Helper;
