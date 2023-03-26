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
	DATA_ID,
} from '@aomao/engine';
import type MarkdownIt from 'markdown-it';
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
		editor.on('parse:html', this.parseHtml);
		editor.on('paste:each', this.pasteEach);
		editor.on('paste:each-after', this.pasteHtml);
		editor.on('paste:schema', this.pasteSchema);
		if (isEngine(editor)) {
			this.editor.on('markdown-it', this.markdownIt);
			editor.change.event.onDocument('copy', this.onCopy, 0);
			editor.change.event.onDocument('cut', this.onCut, 0);
			editor.change.event.onDocument('paste', this.onPaste, 0);
		}
	}

	onCopy = (event: ClipboardEvent) => {
		const editor = this.editor;
		if (!isEngine(editor)) return true;
		const { change, card } = editor;
		const range = change.range.get();
		const component = card.find<TableValue, TableComponent>(
			range.commonAncestorNode,
			true,
		);
		if (
			component &&
			component.name === TableComponent.cardName &&
			!component.isCursor(range.startNode)
		) {
			const nodes = component.getSelectionNodes();
			if (nodes.length > 1) {
				event.preventDefault();
				component.command.copy();
				editor.messageSuccess(
					'copy',
					editor.language.get<string>('copy', 'success'),
				);
				return false;
			}
		}
		return true;
	};

	onCut = (event: ClipboardEvent) => {
		const editor = this.editor;
		if (!isEngine(editor) || editor.readonly) return true;
		const { change, card } = editor;
		const range = change.range.get();
		const component = card.find<TableValue, TableComponent>(
			range.commonAncestorNode,
			true,
		);
		if (
			component &&
			component.name === TableComponent.cardName &&
			!component.isCursor(range.startNode)
		) {
			const nodes = component.getSelectionNodes();
			if (nodes.length > 1) {
				event.preventDefault();
				component.command.cut();
				return false;
			}
		}
		return true;
	};

	onPaste = (event: ClipboardEvent) => {
		const editor = this.editor;
		if (!isEngine(editor) || editor.readonly) return true;
		const { change, card } = editor;
		const range = change.range.get();
		const component = card.find<TableValue, TableComponent>(
			range.commonAncestorNode,
			true,
		);
		if (
			component &&
			component.name === TableComponent.cardName &&
			!component.isCursor(range.startNode)
		) {
			const data = editor.clipboard.getData(event);
			if (
				!data ||
				!/<meta\s+name="aomao"\s+content="table"\s{0,}\/?>/gi.test(
					data.html || '',
				)
			) {
				return true;
			}
			event.preventDefault();
			component.command.paste(data);
			return false;
		}
		return true;
	};

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

	pasteSchema = (schema: SchemaInterface) => {
		(schema.data.blocks as SchemaBlock[]).forEach((blockSchema) => {
			if (!blockSchema.allowIn) {
				blockSchema.allowIn = [];
			}
			if (blockSchema.allowIn.indexOf('td') < 0) {
				blockSchema.allowIn.push('td');
			}
		});
		const table = schema.find((r) => r.name === 'table')[0];
		table.attributes = {
			class: ['data-table'],
			'data-table-no-border': '*',
			'data-width': '@length',
			style: {
				width: '@length',
				background: '@color',
				'background-color': '@color',
			},
		};
		const allowIn = (table as SchemaBlock).allowIn;
		if (!allowIn) {
			(table as SchemaBlock).allowIn = ['div'];
		} else {
			allowIn.push('div');
		}
		schema.find((r) => r.name === 'div')[0].attributes = {
			class: { required: true, value: ['editor-table-wrapper'] },
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
	};

	execute(rows?: number, cols?: number): void {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		//可编辑子区域内不插入表格
		const { change } = editor;
		const range = change.range.get();
		if (range.startNode.closest(EDITABLE_SELECTOR).length > 0) return;
		//插入表格
		editor.card.insert<TableValue>(TableComponent.cardName, {
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

	pasteEach = (node: NodeInterface) => {
		if (
			node.name === 'div' &&
			node.hasClass('editor-table-wrapper') &&
			node.first()?.name === 'table'
		) {
			this.editor.node.unwrap(node);
		}
	};

	pasteHtml = (root: NodeInterface) => {
		const editor = this.editor;
		if (!isEngine(editor)) return;
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
		const helper = new Helper(editor);
		// 判断当前是在可编辑卡片内，在可编辑卡片内不嵌套表格
		const { change } = editor;
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
					if (!editor.node.isEmpty(td)) table.before(td.children());
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
					const childTable = td.find('table');
					if (childTable.length > 0) {
						childTable.after(
							document.createTextNode(childTable.text()),
						);
						childTable.remove();
					}
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
			const dataWidth = node.attributes('data-width');
			if (dataWidth) node.css('width', dataWidth);
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
				for (let i = 0, len = children.length; i < len; i++) {
					const child = children.eq(i);
					// 移除单元格第一个和最后一个换行符，word 里面粘贴会存在，导致空行
					if ((i === 0 || i === len - 1) && child?.isText()) {
						const text = child.text();
						if (/^\n(\s)*$/.test(text)) {
							continue;
						}
					}
					if (child) fragment.appendChild(child[0]);
				}
				// 对单元格内的内容标准化
				const fragmentNode = $(fragment);
				element?.empty().append(editor.node.normalize(fragmentNode));
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
			editor.nodeId.generateAll(node, true);
			const children = node.allChildren();
			children.forEach((child) => {
				if (editor.node.isInline(child)) {
					editor.inline.repairCursor(child);
				}
			});
			const html = node
				.get<HTMLElement>()!
				.outerHTML.replace(/\n|\r\n/g, '')
				.replace(/>\s+</g, '><');
			editor.card.replaceNode<TableValue>(node, TableComponent.cardName, {
				html,
			});
			node.remove();
		});
	};

	parseHtml = (
		root: NodeInterface,
		callback?: (node: NodeInterface, value: TableValue) => NodeInterface,
	) => {
		const editor = this.editor;
		const results: NodeInterface[] = [];
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
					editor.trigger('parse:html', table);
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
				editor.node.unwrap($(content));
			});
			if (callback) {
				table = callback(table, value);
			}

			//添加table的容器id; table 添加外部包裹div;用于table过长导致 文本溢出
			const tableId = table.attributes('data-id') + '-table';
			table = $(
				`<div class="editor-table-wrapper" style='width:100%;overflow:auto;'  data-id='${tableId}'  data-table-no-border='${!!table.attributes(
					'data-table-no-border',
				)}'>`,
			).append(table);

			node.replaceWith(table);
			results.push(table);
		});
		return results;
	};

	markdownIt = (mardown: MarkdownIt) => {
		if (this.options.markdown !== false) {
			mardown.enable('table');
		}
	};

	destroy() {
		const editor = this.editor;
		editor.off('parse:html', this.parseHtml);
		editor.off('paste:each-after', this.pasteHtml);
		editor.off('paste:schema', this.pasteSchema);
		editor.off('markdown-it', this.markdownIt);
	}
}

export default Table;

export { TableComponent };
export type { TableValue, TableOptions };
