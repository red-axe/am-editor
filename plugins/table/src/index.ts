import {
	$,
	CARD_KEY,
	EDITABLE_SELECTOR,
	isEngine,
	NodeInterface,
	Plugin,
	SchemaBlock,
} from '@aomao/engine';
import TableComponent, { Template } from './component';
import locales from './locale';
import './index.css';

export type Options = {
	hotkey?: string | Array<string>;
	markdown?: boolean;
};

class Table extends Plugin<Options> {
	static get pluginName() {
		return 'table';
	}

	init() {
		const editor = this.editor;
		editor.language.add(locales);
		editor.schema.add(this.schema());
		editor.conversion.add('th', 'td');
		editor.on('paser:html', (node) => this.parseHtml(node));
		editor.on('paste:each-after', (child) => this.pasteHtml(child));
		editor.on('paste:markdown-after', (child) => this.pasteMarkdown(child));
	}

	hotkey() {
		return this.options.hotkey || '';
	}

	schema(): Array<SchemaBlock> {
		return [
			{
				name: 'table',
				type: 'block',
				attributes: {
					class: ['data-table'],
					'data-table-no-border': '*',
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
					style: {
						'background-color': '@color',
						'vertical-align': ['top', 'middle', 'bottom'],
					},
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

	pasteHtml(node: NodeInterface) {
		if (!isEngine(this.editor)) return;
		if (node.name === 'table') {
			this.editor.card.replaceNode(node, TableComponent.cardName, {
				html: node
					.get<HTMLElement>()!
					.outerHTML.replaceAll(/\n|\r\n/g, '')
					.replaceAll(/>\s+</g, '><'),
			});
		}
	}

	parseHtml(root: NodeInterface) {
		root.find(`[${CARD_KEY}=${TableComponent.cardName}`).each(
			(tableNode) => {
				const node = $(tableNode);
				const table = node.find('table');
				if (table.length === 0) {
					node.remove();
					return;
				}
				table.css({
					outline: 'none',
					'border-collapse': 'collapse',
				});
				table.find('td').css({
					'min-width': '90px',
					'font-size': '14px',
					'white-space': 'normal',
					'word-wrap': 'break-word',
					margin: '4px 8px',
					border: '1px solid #d9d9d9',
					padding: '4px 8px',
					cursor: 'default',
				});
				table.find(Template.TABLE_TD_BG_CLASS).remove();
				table.find(Template.TABLE_TD_CONTENT_CLASS).each((content) => {
					this.editor.node.unwrap($(content));
				});
				node.replaceWith(table);
			},
		);
	}

	pasteMarkdown(node: NodeInterface) {
		if (
			!isEngine(this.editor) ||
			this.options.markdown === false ||
			!node.isText()
		)
			return;

		let text = node.text();
		if (!text) return;

		const reg = /\|(?:(?:[^\|]+?)\|){2,}/;
		let match = reg.exec(text);
		if (!match) return;
		text = text.replaceAll(/\|\|/g, '|\n|');
		match = reg.exec(text);
		if (!match) return;
		const createTable = (nodes: Array<string>) => {
			const tableNode = $(`<table>${nodes.join('')}</table>`);
			return tableNode.get<Element>()?.outerHTML;
		};

		let newText = '';
		const rows = text.split(/\n|\r\n/);
		let nodes: Array<string> = [];
		rows.forEach((row) => {
			const match = /^\s*\|(?:(?:[^\|]+?)\|){2,}\s*$/.exec(row);
			if (match) {
				const cols = match[0].split('|');
				const colNodes: Array<string> = [];
				cols.forEach((col) => {
					if (col.trim().indexOf('---') === 0) return;
					colNodes.push(`<td>${col}</td>`);
				});
				if (colNodes.length === cols.length)
					nodes.push(`<tr>${colNodes.join('')}</tr>`);
			} else if (nodes.length > 0) {
				newText += createTable(nodes) + '\n' + row + '\n';
				nodes = [];
			} else {
				newText += row + '\n';
			}
		});
		if (nodes.length > 0) {
			newText += createTable(nodes) + '\n';
		}
		node.text(newText);
	}
}

export default Table;

export { TableComponent };
