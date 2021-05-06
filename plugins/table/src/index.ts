import {
	EDITABLE_SELECTOR,
	isEngine,
	Plugin,
	SchemaBlock,
} from '@aomao/engine';
import TableComponent from './component';
import locales from './locale';
import './index.css';

class Table extends Plugin {
	static get pluginName() {
		return 'table';
	}

	init() {
		this.editor.language.add(locales);
		this.editor.schema.add(this.schema());
	}

	schema(): Array<SchemaBlock> {
		return [
			{
				name: 'table',
				type: 'block',
				attributes: {
					class: 'data-table',
					style: {
						width: '@length',
					},
				},
			},
			{
				name: 'colgroup',
				type: 'block',
			},
			{
				name: 'col',
				type: 'block',
				attributes: {
					width: '@number',
					span: '@number',
				},
				allowIn: ['colgroup'],
			},
			{
				name: 'thead',
				type: 'block',
			},
			{
				name: 'tbody',
				type: 'block',
			},
			{
				name: 'tr',
				type: 'block',
				attributes: {
					style: {
						height: '@length',
					},
				},
				allowIn: ['tbody'],
			},
			{
				name: 'td',
				type: 'block',
				attributes: {
					colspan: '@number',
					rowspan: '@number',
					class: [
						'table-last-column',
						'table-last-row',
						'table-last-column',
						'table-cell-selection',
					],
				},
				allowIn: ['tr'],
			},
			{
				name: 'th',
				type: 'block',
				attributes: {
					colspan: '@number',
					rowspan: '@number',
				},
				allowIn: ['tr'],
			},
		];
	}

	execute(rows?: number, cols?: number): void {
		if (!isEngine(this.editor)) return;
		//可编辑子区域内不插入表格
		const { change } = this.editor;
		const range = change.getRange();
		if (range.startNode.closest(EDITABLE_SELECTOR).length > 0) return;
		//插入表格
		this.editor.card.insert(TableComponent.cardName, {
			rows: rows || 3,
			cols: cols || 3,
		});
	}
}

export default Table;

export { TableComponent };
