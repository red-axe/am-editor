import {
	$,
	CARD_KEY,
	EDITABLE_SELECTOR,
	isEngine,
	NodeInterface,
	Plugin,
	SchemaBlock,
	PluginOptions,
} from '@aomao/engine';
import TableComponent, { Template } from './component';
import locales from './locale';
import './index.css';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
	markdown?: boolean;
}

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
					border: !!table.attributes('data-table-no-border')
						? '0 none'
						: '1px solid #d9d9d9',
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

		const parse = (node: NodeInterface) => {
			let text = node.text();
			if (!text) return;
			// 匹配 |-|-| 或者 -|- 或者 |-|- 或者 -|-|
			let reg = /\n\s*(\|?(\s*:?-+:?\s*)+\|?)+\s*(\n|$)/;
			let tbMatch = reg.exec(text);
			if (!tbMatch || tbMatch[0].indexOf('|') < 0) return;
			// 文本节点
			let textNode = node.clone(true).get<Text>()!;
			// 列数
			const colCount = tbMatch[0]
				.split('|')
				.filter(
					(cell) => cell.trim() !== '' && cell.includes('-'),
				).length;
			// 从匹配出分割
			let tbRegNode = textNode.splitText(tbMatch.index);
			// 获取表头
			const thReg = new RegExp(
				`(\\|?([^\\|\\n]+)\\|?){${colCount},}\\s*$`,
			);
			const headRows = (textNode.textContent || '').split(/\n/);
			let match = thReg.exec(
				headRows.length > 0 ? headRows[headRows.length - 1] : '',
			);
			if (!match || match[0].indexOf('|') < 0) return;
			headRows.pop();
			textNode.splitText(headRows.join('\n').length + match.index);
			// 拼接之前的文本
			let regNode = tbRegNode.splitText(tbMatch[0].length);
			let newText = textNode.textContent || '';
			// 生成头部td
			const getCell = (match: RegExpExecArray, count?: number) => {
				const cols = match[0].split('|');
				const headeText = match[0].trim().replace(/\n/, '');
				if (headeText.endsWith('|')) cols.pop();
				if (headeText.startsWith('|')) cols.shift();
				const colNodes: Array<string> = [];
				cols.some((col) => {
					if (count !== undefined && colNodes.length === count)
						return true;
					colNodes.push(col);
					return false;
				});
				return colNodes;
			};
			const colNodes = getCell(match);
			// 表头数量不等于列数，不操作
			if (colNodes.length !== colCount) return;
			let nodes: Array<string> = [];
			nodes.push(
				`<tr>${colNodes.map((col) => `<td>${col}</td>`).join('')}</tr>`,
			);
			// 遍历剩下的行
			const tdReg = new RegExp(
				`^\\n*(\\|?([^\\|\\n]+)\\|?){1,${colCount}}(?:\\n|$)`,
			);
			while (match) {
				match = tdReg.exec(regNode.textContent || '');
				if (
					!match ||
					match[0].indexOf('|') < 0 ||
					match[0].startsWith('\n\n')
				)
					break;
				const colNodes = getCell(match, colCount);
				if (colNodes.length === 0) break;
				if (colNodes.length < colCount) {
					while (colCount - colNodes.length > 0) {
						colNodes.push('');
					}
				}
				nodes.push(
					`<tr>${colNodes
						.map((col) => `<td>${col}</td>`)
						.join('')}</tr>`,
				);
				regNode = regNode.splitText(match[0].length);
			}

			const createTable = (nodes: Array<string>) => {
				const tableNode = $(`<table>${nodes.join('')}</table>`);
				return tableNode.get<Element>()?.outerHTML;
			};
			newText += createTable(nodes) + '\n';
			newText += regNode.textContent;
			node.text(newText);
			parse(node);
		};
		parse(node);
	}
}

export default Table;

export { TableComponent };
