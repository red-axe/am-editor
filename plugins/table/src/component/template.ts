import {
	$,
	DATA_ELEMENT,
	DATA_TRANSIENT_ATTRIBUTES,
	EDITABLE,
	UI,
	transformCustomTags,
	DATA_CONTENTEDITABLE_KEY,
} from '@aomao/engine';
import {
	TableValue,
	TableMenu,
	TemplateInterface,
	TableInterface,
} from '../types';

const TABLE_WRAPPER_CLASS_NAME = 'table-wrapper';
const TABLE_OVERFLOW_CLASS_NAME = 'table-overflow';
const TABLE_CLASS_NAME = 'data-table';
const COLS_HEADER_CLASS_NAME = 'table-cols-header';
const COLS_HEADER_ITEM_CLASS_NAME = 'table-cols-header-item';
const COLS_HEADER_TRIGGER_CLASS_NAME = 'cols-trigger';
const COLS_ADDITION_HEADER_CLASS_NAME = 'cols-addition-header';
const ROWS_HEADER_CLASS_NAME = 'table-rows-header';
const ROWS_HEADER_ITEM_CLASS_NAME = 'table-rows-header-item';
const ROWS_HEADER_TRIGGER_CLASS_NAME = 'rows-trigger';
const HEADER_CLASS_NAME = 'table-header';
const MENUBAR_CLASS_NAME = 'table-menubar';
const MENUBAR_ITEM_CLASS_NAME = 'table-menubar-item';
const MENUBAR_ITEM_INPUT_CALSS_NAME = 'table-menubar-item-input';
const VIEWPORT = 'table-viewport';
const VIEWPORT_READER = 'data-table-reader';
const PLACEHOLDER_CLASS_NAME = 'table-placeholder';
const MULTI_ADDITION_CLASS_NAME = 'multi-addition';
const TABLE_HIGHLIGHT = 'table-highlight';
const ROW_DELETE_BUTTON_CLASS_NAME = 'table-row-delete-button';
const COL_DELETE_BUTTON_CLASS_NAME = 'table-col-delete-button';
const ROW_ADD_BUTTON_CLASS_NAME = 'table-row-add-button';
const ROW_ADD_BUTTON_SPLIT_CLASS_NAME = 'table-row-add-split-button';
const COL_ADD_BUTTON_CLASS_NAME = 'table-col-add-button';
const COL_ADD_BUTTON_SPLIT_CLASS_NAME = 'table-col-add-split-button';
const TABLE_TD_CONTENT_CLASS_NAME = 'table-main-content';
const TABLE_TD_BG_CLASS_NAME = 'table-main-bg';

class Template implements TemplateInterface {
	static readonly TABLE_WRAPPER_CLASS = `.${TABLE_WRAPPER_CLASS_NAME}`;
	static readonly TABLE_OVERFLOW_CLASS = `.${TABLE_OVERFLOW_CLASS_NAME}`;
	static readonly TABLE_CLASS = `.${TABLE_CLASS_NAME}`;
	static readonly COLS_HEADER_CLASS = `.${COLS_HEADER_CLASS_NAME}`;
	static readonly COLS_HEADER_ITEM_CLASS = `.${COLS_HEADER_ITEM_CLASS_NAME}`;
	static readonly COLS_HEADER_TRIGGER_CLASS = `.${COLS_HEADER_TRIGGER_CLASS_NAME}`;
	static readonly COLS_ADDITION_HEADER_CLASS = `.${COLS_ADDITION_HEADER_CLASS_NAME}`;
	static readonly ROWS_HEADER_CLASS = `.${ROWS_HEADER_CLASS_NAME}`;
	static readonly ROWS_HEADER_ITEM_CLASS = `.${ROWS_HEADER_ITEM_CLASS_NAME}`;
	static readonly ROWS_HEADER_TRIGGER_CLASS = `.${ROWS_HEADER_TRIGGER_CLASS_NAME}`;
	static readonly HEADER_CLASS = `.${HEADER_CLASS_NAME}`;
	static readonly MENUBAR_CLASS = `.${MENUBAR_CLASS_NAME}`;
	static readonly MENUBAR_ITEM_CLASS = `.${MENUBAR_ITEM_CLASS_NAME}`;
	static readonly MENUBAR_ITEM_INPUT_CALSS = `.${MENUBAR_ITEM_INPUT_CALSS_NAME}`;
	static readonly VIEWPORT = `.${VIEWPORT}`;
	static readonly VIEWPORT_READER = `.${VIEWPORT_READER}`;
	static readonly PLACEHOLDER_CLASS = `.${PLACEHOLDER_CLASS_NAME}`;
	static readonly MULTI_ADDITION_CLASS = `.${MULTI_ADDITION_CLASS_NAME}`;
	static readonly TABLE_HIGHLIGHT_CLASS = `.${TABLE_HIGHLIGHT}`;
	static readonly ROW_DELETE_BUTTON_CLASS = `.${ROW_DELETE_BUTTON_CLASS_NAME}`;
	static readonly COL_DELETE_BUTTON_CLASS = `.${COL_DELETE_BUTTON_CLASS_NAME}`;
	static readonly ROW_ADD_BUTTON_CLASS = `.${ROW_ADD_BUTTON_CLASS_NAME}`;
	static readonly COL_ADD_BUTTON_CLASS = `.${COL_ADD_BUTTON_CLASS_NAME}`;
	static readonly ROW_ADD_BUTTON_SPLIT_CLASS = `.${ROW_ADD_BUTTON_SPLIT_CLASS_NAME}`;
	static readonly COL_ADD_BUTTON_SPLIT_CLASS = `.${COL_ADD_BUTTON_SPLIT_CLASS_NAME}`;
	static readonly TABLE_TD_CONTENT_CLASS = `.${TABLE_TD_CONTENT_CLASS_NAME}`;
	static readonly TABLE_TD_BG_CLASS = `.${TABLE_TD_BG_CLASS_NAME}`;
	static readonly CellBG = `<div class="${TABLE_TD_BG_CLASS_NAME}"><div class="table-main-border-top"></div><div class="table-main-border-right"></div><div class="table-main-border-bottom"></div><div class="table-main-border-left"></div></div>`;
	isReadonly: boolean = false;
	static EmptyCell(readonly: boolean = false) {
		return `<div class="${TABLE_TD_CONTENT_CLASS_NAME}" ${DATA_TRANSIENT_ATTRIBUTES}="${DATA_CONTENTEDITABLE_KEY}" ${DATA_CONTENTEDITABLE_KEY}="${
			readonly ? 'false' : 'true'
		}" ${DATA_ELEMENT}="${EDITABLE}"><p><br /></p></div>${Template.CellBG}`;
	}
	getEmptyCell() {
		return Template.EmptyCell(this.isReadonly);
	}
	private table: TableInterface;

	constructor(table: TableInterface) {
		this.table = table;
	}

	renderRowsHeader(rows: number) {
		return (
			`<div ${DATA_ELEMENT}="${UI}" class="${ROWS_HEADER_CLASS_NAME}">` +
			`<div class="${ROW_DELETE_BUTTON_CLASS_NAME}"><span class="data-icon data-icon-delete"></span></div>` +
			`<div class="${ROW_ADD_BUTTON_CLASS_NAME}"><span class="data-icon data-icon-plus"></span><div class="${ROW_ADD_BUTTON_SPLIT_CLASS_NAME}"></div></div>` +
			`<div class="${ROWS_HEADER_ITEM_CLASS_NAME}" draggable="true">
                <div class="row-dragger">
                    <span class="data-icon data-icon-drag"></span>
                    <span class="drag-info"></span>
                </div>
                <div class="${ROWS_HEADER_TRIGGER_CLASS_NAME}"></div>
            </div>`.repeat(rows) +
			`
        </div>`
		);
	}

	renderColsHeader(cols: number) {
		return (
			`<div ${DATA_ELEMENT}="${UI}" class="${COLS_HEADER_CLASS_NAME}">` +
			`<div class="${COL_DELETE_BUTTON_CLASS_NAME}"><span class="data-icon data-icon-delete"></span></div>` +
			`<div class="${COL_ADD_BUTTON_CLASS_NAME}"><span class="data-icon data-icon-plus"></span><div class="${COL_ADD_BUTTON_SPLIT_CLASS_NAME}"></div></div>` +
			`<div class="${COLS_HEADER_ITEM_CLASS_NAME}" draggable="true">
            <div class="col-dragger">
                <span class="data-icon data-icon-drag"></span>
                <span class="drag-info"></span>
            </div>
            <div class="${COLS_HEADER_TRIGGER_CLASS_NAME}"></div>
        </div>`.repeat(cols) +
			`
    </div>`
		);
	}

	/**
	 * 用于Card渲染
	 * @param {object} value 参数
	 * @param {number} value.rows 行数
	 * @param {number} value.cols 列数
	 * @param {string} value.html html 字符串
	 * @return {string} 返回 html 字符串
	 */
	htmlEdit(
		{ rows, cols, html, noBorder, overflow }: TableValue,
		menus: TableMenu,
	): string {
		cols = cols === -Infinity ? 1 : cols;
		rows = rows === -Infinity ? 1 : rows;
		cols = cols === Infinity ? 10 : cols;
		rows = rows === Infinity ? 10 : rows;
		const tds =
			`<td ${DATA_TRANSIENT_ATTRIBUTES}="table-cell-selection">${this.getEmptyCell()}</td>`.repeat(
				cols,
			);
		const trs = `<tr>${tds}</tr>`.repeat(rows);
		const col = `<col />`.repeat(cols);
		const colgroup = `<colgroup>${col}</colgroup>`;

		const tableHighlight = `<div ${DATA_ELEMENT}="${UI}" class="${TABLE_HIGHLIGHT}"></div>`;

		let tableHeader = `<div ${DATA_ELEMENT}="${UI}" class="${HEADER_CLASS_NAME}"><div class="${HEADER_CLASS_NAME}-item"></div></div>`;

		const placeholder = `<div ${DATA_ELEMENT}="${UI}" class="${PLACEHOLDER_CLASS_NAME}"></div>`;
		let menuBar = menus.map((menu) => {
			if (menu.split) {
				return '<div class="split"></div>';
			}
			let menuContent = menu.text;
			switch (menu.action) {
				case 'insertColLeft':
				case 'insertColRight':
				case 'insertRowUp':
				case 'insertRowDown':
					menuContent =
						menuContent?.replace(
							'$data',
							`<input type='text' maxlength="3" class="${MENUBAR_ITEM_INPUT_CALSS_NAME}" />`,
						) || '';
					break;
			}
			return `<div class="${MENUBAR_ITEM_CLASS_NAME}" ${DATA_ELEMENT}="${UI}" data-action="${menu.action}">
                <span class="data-icon data-icon-table-${menu.icon}"></span>${menuContent}</div>`;
		});
		menuBar = [
			`<div ${DATA_ELEMENT}="${UI}" class="${MENUBAR_CLASS_NAME}">${menuBar.join(
				'',
			)}</div>`,
		];

		if (html) {
			const hasColGroup = html.indexOf('<colgroup') > -1;
			html = transformCustomTags(html) || html;
			if (!hasColGroup) {
				html = html?.replace(/^(<table[^>]+>)/, function (match) {
					return match + colgroup;
				});
			}
			const normalTable = this.table.helper.normalize($(html));
			const trs = normalTable.find('tr');
			rows = trs.length;
			html = normalTable.get<HTMLElement>()!.outerHTML;
		}

		const table =
			html ||
			`<table class="${TABLE_CLASS_NAME}"${
				noBorder === true ? " data-table-no-border='true'" : ''
			} ${DATA_TRANSIENT_ATTRIBUTES}="class">${colgroup}${trs}</table>`;

		return `<div ${DATA_TRANSIENT_ATTRIBUTES}="*" class="${TABLE_WRAPPER_CLASS_NAME} ${
			overflow !== false ? TABLE_OVERFLOW_CLASS_NAME : ''
		}" ${DATA_TRANSIENT_ATTRIBUTES}="*">${tableHeader}<div ${DATA_TRANSIENT_ATTRIBUTES}="*" class="${VIEWPORT}">${this.renderColsHeader(
			cols,
		)}${table}${placeholder}${tableHighlight}</div>${this.renderRowsHeader(
			rows,
		)}${menuBar}</div>`;
	}

	htmlView({ html, noBorder, overflow }: TableValue) {
		return `<div class="${TABLE_WRAPPER_CLASS_NAME} ${
			overflow !== false ? TABLE_OVERFLOW_CLASS_NAME : ''
		}"><div class="${VIEWPORT_READER}"${
			noBorder === true ? " data-table-no-border='true'" : ''
		}>${transformCustomTags(html || '')}</div></div>`;
	}
}

export default Template;
