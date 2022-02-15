import {
	$,
	CARD_KEY,
	EDITABLE_SELECTOR,
	isEngine,
	NodeInterface,
	Plugin,
	SchemaBlock,
	SchemaInterface,
	getDocument,
	READY_CARD_KEY,
	decodeCardValue,
	CARD_VALUE_KEY,
	transformCustomTags,
} from '@aomao/engine';
import { DATA_ID } from '@aomao/engine';
import TableComponent, { Template, Helper } from './component';
import locales from './locale';
import { TableInterface, TableOptions, TableValue } from './types';
import './index.css';
class Table<T extends TableOptions = TableOptions> extends Plugin<T> {
	static get pluginName() {
		return 'table';
	}

	init() {
		const editor = this.editor;
		if (!this.options.colMinWidth) {
			this.options.colMinWidth = 40;
		}
		if (!this.options.rowMinHeight) {
			this.options.rowMinHeight = 30;
		}
		editor.language.add(locales);
		editor.schema.add(this.schema());
		editor.conversion.add('th', 'td');
		editor.on('parse:html', (node) => this.parseHtml(node));
		editor.on('paste:each-after', (root) => this.pasteHtml(root));
		editor.on('paste:schema', (schema: SchemaInterface) =>
			this.pasteSchema(schema),
		);
		editor.on(
			'paste:markdown-check',
			(child) => !this.checkMarkdown(child)?.match,
		);
		editor.on('paste:markdown-after', (child) => this.pasteMarkdown(child));
		if (isEngine(editor)) {
			editor.change.event.onDocument(
				'copy',
				(event) => this.onCopy(event),
				0,
			);
			editor.change.event.onDocument(
				'cut',
				(event) => this.onCut(event),
				0,
			);
			editor.change.event.onDocument(
				'paste',
				(event) => this.onPaste(event),
				0,
			);
			// 过滤掉表格初始化的时候调整后的宽度作为历史记录
			const targetTableCache: Record<string, TableInterface> = {};
			editor.history.onFilter((op) => {
				if (
					op.id &&
					(('od' in op &&
						(op.od.startsWith('width') ||
							op.od === op.id ||
							op.od.startsWith('data:') ||
							/^\d+$/.test(op.od))) ||
						('oi' in op &&
							(op.oi.startsWith('width') ||
								op.oi === op.id ||
								op.oi.startsWith('data:') ||
								/^\d+$/.test(op.oi))))
				) {
					let component: TableInterface | undefined =
						targetTableCache[op.id];
					if (!component || !component.root.parent()) {
						const targetNode = $(`[${DATA_ID}="${op.id}"]`);
						delete targetTableCache[op.id];
						if (targetNode.length > 0) {
							component = editor.card.find<
								TableValue,
								TableComponent
							>(targetNode);
							//if(component && component?.name === TableComponent.cardName) targetTableCache[op.id] = component
						}
					}
					if (
						component?.name === TableComponent.cardName &&
						!component.isChanged
					) {
						op['nl'] = true;
						return true;
					}
				}
				return false;
			});
		}
	}

	onCopy(event: ClipboardEvent) {
		if (!isEngine(this.editor)) return true;
		const { change, card } = this.editor;
		const range = change.range.get();
		const component = card.find<TableValue, TableComponent>(
			range.commonAncestorNode,
			true,
		);
		if (
			component &&
			component.getSelectionNodes &&
			component.name === TableComponent.cardName
		) {
			const nodes = component.getSelectionNodes();
			if (nodes.length > 1) {
				event.preventDefault();
				component.command.copy();
				this.editor.messageSuccess(
					this.editor.language.get<string>('copy', 'success'),
				);
				return false;
			}
		}
		return true;
	}

	onCut(event: ClipboardEvent) {
		if (!isEngine(this.editor)) return true;
		const { change, card } = this.editor;
		const range = change.range.get();
		const component = card.find<TableValue, TableComponent>(
			range.commonAncestorNode,
			true,
		);
		if (
			component &&
			component.getSelectionNodes &&
			component.name === TableComponent.cardName
		) {
			const nodes = component.getSelectionNodes();
			if (nodes.length > 1) {
				event.preventDefault();
				component.command.cut();
				return false;
			}
		}
		return true;
	}

	onPaste(event: ClipboardEvent) {
		if (!isEngine(this.editor)) return true;
		const { change, card } = this.editor;
		const range = change.range.get();
		const component = card.find<TableValue, TableComponent>(
			range.commonAncestorNode,
			true,
		);
		if (
			component &&
			component.getSelectionNodes &&
			component.name === TableComponent.cardName &&
			component.command.hasCopyData()
		) {
			event.preventDefault();
			component.command.mockPaste();
			return false;
		}
		return true;
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
				allowIn: ['table'],
			},
			{
				name: 'col',
				type: 'block',
				isVoid: true,
				attributes: {
					width: '@number',
					span: '@number',
				},
				allowIn: ['colgroup'],
			},
			{
				name: 'thead',
				type: 'block',
				allowIn: ['table'],
			},
			{
				name: 'tbody',
				type: 'block',
				allowIn: ['table'],
			},
			{
				name: 'tr',
				type: 'block',
				attributes: {
					style: {
						height: '@length',
					},
				},
				allowIn: ['tbody', 'thead', 'tfoot'],
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

	pasteSchema(schema: SchemaInterface) {
		(schema.data.blocks as SchemaBlock[]).forEach((blockSchema) => {
			if (!blockSchema.allowIn) {
				blockSchema.allowIn = [];
			}
			if (blockSchema.allowIn.indexOf('td') < 0) {
				blockSchema.allowIn.push('td');
			}
		});
		schema.find((r) => r.name === 'table')[0].attributes = {
			class: ['data-table'],
			'data-table-no-border': '*',
			'data-wdith': '@length',
			style: {
				width: '@length',
				background: '@color',
				'background-color': '@color',
			},
		};
		schema.find((r) => r.name === 'tr')[0].attributes = {
			class: ['data-table'],
			'data-table-no-border': '*',
			style: {
				height: '@length',
				background: '@color',
				'background-color': '@color',
				display: '*',
			},
		};
		schema.find((r) => r.name === 'td')[0].attributes = {
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
				background: '@color',
				'vertical-align': ['top', 'middle', 'bottom'],
				valign: ['top', 'middle', 'bottom'],
			},
		};
	}

	execute(rows?: number, cols?: number): void {
		if (!isEngine(this.editor)) return;
		//可编辑子区域内不插入表格
		const { change } = this.editor;
		const range = change.range.get();
		if (range.startNode.closest(EDITABLE_SELECTOR).length > 0) return;
		//插入表格
		this.editor.card.insert<TableValue>(TableComponent.cardName, {
			rows: rows || 3,
			cols: cols || 3,
			overflow: !!this.options.overflow,
		});
	}

	convertToPX(value: string) {
		const match = /([\d\.]+)(pt|px)$/i.exec(value);
		if (match && match[2] === 'pt') {
			return (
				String(Math.round((parseInt(match[1], 10) * 96) / 72)) + 'px'
			);
		}
		return value;
	}

	pasteHtml(root: NodeInterface) {
		if (!isEngine(this.editor)) return;
		const clearWH = (
			node: NodeInterface,
			type: 'width' | 'height' = 'width',
		) => {
			const dataWidth = node.attributes('data-width');
			const width = dataWidth ? dataWidth : node.css(type);
			if (width.endsWith('%')) node.css(type, '');
			if (width.endsWith('pt')) node.css(type, this.convertToPX(width));
		};
		const tables = root.find('table');
		if (tables.length === 0) return;
		const helper = new Helper(this.editor);
		// 判断当前是在可编辑卡片内，在可编辑卡片内不嵌套表格
		const { change } = this.editor;
		const range = change.range.get();

		const clearTable = (table: NodeInterface) => {
			const thead = table.find('thead');
			const headTds = thead.find('th,td').toArray();
			headTds.forEach((td) => {
				table.before(td.children());
			});
			const trs = table.find('tr').toArray();
			trs.forEach((tr) => {
				const tds = tr.find('td').toArray();
				tds.forEach((td) => {
					if (!this.editor.node.isEmpty(td))
						table.before(td.children());
				});
			});
			const tfoot = table.find('tfoot');
			const footTds = tfoot.find('th,td').toArray();
			footTds.forEach((td) => {
				table.after(td.children());
			});
			table.remove();
		};
		const isClear = range.startNode.closest(EDITABLE_SELECTOR).length > 0;
		tables.each((_, index) => {
			let node = tables.eq(index);
			if (!node) return;
			if (isClear || node.parent()?.name === 'td') {
				clearTable(node);
				return;
			}
			let trs = node.find('tr');
			trs.each((child) => {
				const tr = $(child);
				const display = tr.css('display');
				if (display === 'none') {
					tr.remove();
				} else {
					tr.css('display', '');
				}
				// 不是td就用td标签包裹起来
				const childNodes = tr.children();
				childNodes.each((tdChild) => {
					const td = $(tdChild);
					const text = td.text();
					// 排除空格
					if (
						td.name !== 'td' &&
						['\n', '\r\n'].includes(text.trim())
					) {
						const newTd = $(`<td></td>`);
						td.before(newTd);
						newTd.append(td);
					}
				});
			});
			node = helper.normalizeTable(node);
			clearWH(node);
			clearWH(node, 'height');
			const tbody = node.find('tbody');

			// 表头放在tbody最前面
			const thead = node.find('thead');
			if (thead && thead.length > 0) tbody.prepend(thead.children());
			thead.remove();
			// 表头放在tbody最前面
			const tfoot = node.find('tfoot');
			if (tfoot && tfoot.length > 0) tbody.append(tfoot.children());
			tfoot.remove();
			const ths = node.find('th');
			ths.each((_, index) => {
				const th = ths.eq(index);
				th?.replaceWith($(`<td>${th.html()}</td>`));
			});
			const tds = node.find('td');
			let fragment = getDocument().createDocumentFragment();
			tds.each((_, index) => {
				fragment = getDocument().createDocumentFragment();
				const element = tds.eq(index);
				if (!element) return;
				clearWH(element);
				clearWH(element, 'height');
				const background = element.css('background');
				if (background) element.css('background-color', background);
				const valign = element.attributes('valign');
				if (valign) element.attributes('vertical-align', valign);
				const children = element.children();
				for (let i = 0; i < children.length; i++) {
					const child = children.eq(i);
					if (child) fragment.appendChild(child[0]);
				}
				// 对单元格内的内容标准化
				const fragmentNode = $(fragment);
				element
					?.empty()
					.append(this.editor.node.normalize(fragmentNode));
			});
			const background =
				node?.css('background') || node?.css('background-color');
			if (background) tds.css('background', background);

			trs = node.find('tr');
			let rowSpan = 1;
			trs.each((child) => {
				const tr = $(child);

				const tds = tr?.find('td');
				if (tds?.length === 0 && rowSpan < 2) {
					tr?.remove();
				}
				if (tds && tds?.length > 0) {
					const spans = tds
						.toArray()
						.map((td) => (td[0] as HTMLTableCellElement).rowSpan);
					rowSpan = Math.max(...spans);
				}

				if (tr) {
					clearWH(tr);
					clearWH(tr, 'height');
				}

				const background =
					tr?.css('background') || tr?.css('background-color');
				if (background) tds?.css('background', background);
			});
			this.editor.nodeId.generateAll(node, true);
			const children = node.allChildren();
			children.forEach((child) => {
				if (this.editor.node.isInline(child)) {
					this.editor.inline.repairCursor(child);
				}
			});
			const html = node
				.get<HTMLElement>()!
				.outerHTML.replace(/\n|\r\n/g, '')
				.replace(/>\s+</g, '><');
			this.editor.card.replaceNode<TableValue>(
				node,
				TableComponent.cardName,
				{
					html,
				},
			);
		});
	}

	parseHtml(
		root: NodeInterface,
		callback?: (node: NodeInterface, value: TableValue) => NodeInterface,
	) {
		root.find(
			`[${CARD_KEY}="${TableComponent.cardName}"],[${READY_CARD_KEY}="${TableComponent.cardName}"]`,
		).each((tableNode) => {
			const node = $(tableNode);
			let table = node.find('table');
			const value = decodeCardValue<TableValue>(
				node.attributes(CARD_VALUE_KEY),
			);
			if (table.length === 0) {
				if (!value || !value.html) return;
				// 表格值里面的卡片都是没有被转换过的，所以需要先把卡片转换过来
				table = $(transformCustomTags(value.html));
				if (table.length === 0) {
					node.remove();
					return;
				} else {
					this.editor.trigger('parse:html', table);
				}
			}
			const width = table.attributes('width') || table.css('width');
			table.css({
				outline: 'none',
				'border-collapse': 'collapse',
				width: '100%',
			});
			table.attributes('data-width', width);
			const tds = table.find('td');
			tds.each((_, index) => {
				const tdElement = tds.eq(index);
				tdElement?.css({
					'min-width': 'auto',
					'white-space': 'flat',
					'word-wrap': 'break-word',
					margin: '4px 8px',
					border: !!table.attributes('data-table-no-border')
						? '0 none'
						: '1px solid #d9d9d9',
					padding: '4px 8px',
					cursor: 'default',
					'vertical-align': tdElement.css('vertical-align') || 'top',
				});
			});
			table.find(Template.TABLE_TD_BG_CLASS).remove();
			table.find(Template.TABLE_TD_CONTENT_CLASS).each((content) => {
				this.editor.node.unwrap($(content));
			});
			if (callback) {
				table = callback(table, value);
			}
			node.replaceWith(table);
		});
	}

	getMarkdownCell(match: RegExpExecArray, count?: number) {
		const cols = match[0].split('|');
		const headeText = match[0].trim().replace(/\n/, '');
		if (headeText.endsWith('|')) cols.pop();
		if (headeText.startsWith('|')) cols.shift();
		const colNodes: Array<string> = [];
		cols.some((col) => {
			if (count !== undefined && colNodes.length === count) return true;
			colNodes.push(col);
			return false;
		});
		return colNodes;
	}

	checkMarkdown(node: NodeInterface) {
		if (
			!isEngine(this.editor) ||
			this.options.markdown === false ||
			!node.isText()
		)
			return;
		const text = node.text();
		if (!text) return;
		// 匹配 |-|-| 或者 -|- 或者 |-|- 或者 -|-|
		const reg = /\n\s*(\|?(\s*:?-+:?\s*)+\|?)+\s*(\n|$)/;
		const tbMatch = reg.exec(text);
		if (!tbMatch || tbMatch[0].indexOf('|') < 0) return;
		return {
			reg,
			match: tbMatch,
		};
	}

	pasteMarkdown(node: NodeInterface) {
		const result = this.checkMarkdown(node);
		if (!result) return;
		const { reg, match } = result;
		if (!match) return;
		const parse = (node: NodeInterface) => {
			let text = node.text();
			if (!text) return;
			const tbMatch = reg.exec(text);
			if (!tbMatch || tbMatch[0].indexOf('|') < 0) return;
			// 文本节点
			const textNode = node.clone(true).get<Text>()!;
			// 列数
			const colCount = tbMatch[0]
				.split('|')
				.filter(
					(cell) => cell.trim() !== '' && cell.includes('-'),
				).length;
			// 从匹配出分割
			const tbRegNode = textNode.splitText(tbMatch.index);
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
			const colNodes = this.getMarkdownCell(match);
			// 表头数量不等于列数，不操作
			if (colNodes.length !== colCount) return;
			const nodes: Array<string> = [];
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
				const colNodes = this.getMarkdownCell(match, colCount);
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
export type { TableValue, TableOptions };
