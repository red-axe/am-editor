import React, { useState } from 'react';
import classnames from 'classnames-es-ts';
import './index.css';

export type Selector = {
	maxRows?: number;
	maxCols?: number;
	minRows?: number;
	minCols?: number;
	onSelect: (event: React.MouseEvent, rows: number, cols: number) => void;
};
const Selector: React.FC<Selector> = (props) => {
	const [maxRows] = useState(props.maxRows || 10);
	const [maxCols] = useState(props.maxCols || 10);
	const [minRows] = useState(props.minRows || 4);
	const [minCols] = useState(props.minCols || 4);
	const [currentRows, setCurrentRows] = useState(4);
	const [currentCols, setCurrentCols] = useState(4);
	const [selectedRows, setSelectedRows] = useState(0);
	const [selectedCols, setSelectedCols] = useState(0);

	const onSelect = (event: React.MouseEvent, rows: number, cols: number) => {
		props.onSelect(event, rows + 1, cols + 1);
	};

	const onHover = (rows: number, cols: number) => {
		const showRows = Math.max(minRows, Math.min(maxRows, rows + 2));
		const showCols = Math.max(minCols, Math.min(maxCols, cols + 2));

		setCurrentRows(showRows);
		setCurrentCols(showCols);
		setSelectedRows(rows + 1);
		setSelectedCols(cols + 1);
	};

	const renderTr = (row: number, cols: number) => {
		let tds: Array<React.ReactNode> = [];
		const _loop = (col: number) => {
			const cls = classnames({
				'data-toolbar-table-selector-td': true,
				actived: row < selectedRows && col < selectedCols,
			});
			tds.push(
				<div
					className={cls}
					key={col}
					onMouseDown={(e) => {
						e.preventDefault();
						return onSelect(e, row, col);
					}}
					onMouseOver={() => {
						return onHover(row, col);
					}}
				/>,
			);
		};

		for (let c = 0; c < cols; c++) {
			_loop(c);
		}
		return tds;
	};

	const renderTable = (rows: number, cols: number) => {
		let trs = [];
		for (var r = 0; r < rows; r++) {
			trs.push(
				<div className="data-toolbar-table-selector-tr" key={r}>
					{renderTr(r, cols)}
				</div>,
			);
		}
		return trs;
	};

	const rows = selectedRows === undefined ? 0 : selectedRows;
	const cols = selectedCols === undefined ? 0 : selectedCols;
	return (
		<div className="data-toolbar-table-selector" data-element="ui">
			{renderTable(currentRows, currentCols)}
			<div className="data-toolbar-table-selector-info">
				{rows}x{cols}
			</div>
		</div>
	);
};

export default Selector;
