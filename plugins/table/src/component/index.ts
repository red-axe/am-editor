import {
	$,
	Card,
	CardToolbarItemOptions,
	CardType,
	EDITABLE_SELECTOR,
	isEngine,
	NodeInterface,
	Parser,
	RangeInterface,
	Scrollbar,
	ToolbarItemOptions,
} from '@aomao/engine';
import {
	ControllBarInterface,
	HelperInterface,
	TableCommandInterface,
	TableInterface,
	TableSelectionInterface,
	TableValue,
	TemplateInterface,
} from '../types';
import Helper from './helper';
import Template from './template';
import menuData from './menu';
import ControllBar from './controllbar';
import TableSelection from './selection';
import TableCommand from './command';
import { ColorTool, Palette } from './toolbar';

class TableComponent extends Card<TableValue> implements TableInterface {
	readonly contenteditable: string[] = [
		`div${Template.TABLE_TD_CONTENT_CLASS}`,
	];

	static get cardName() {
		return 'table';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	static get selectStyleType(): 'background' {
		return 'background';
	}

	static colors = Palette.getColors().map((group) =>
		group.map((color) => {
			return { color, border: Palette.getStroke(color) };
		}),
	);

	wrapper?: NodeInterface;
	helper: HelperInterface = new Helper();
	template: TemplateInterface = new Template(this);
	selection: TableSelectionInterface = new TableSelection(this.editor, this);
	conltrollBar: ControllBarInterface = new ControllBar(this.editor, this, {
		col_min_width: 40,
		row_min_height: 33,
	});
	command: TableCommandInterface = new TableCommand(this.editor, this);
	scrollbar?: Scrollbar;
	viewport?: NodeInterface;
	colorTool?: ColorTool;
	noBorderToolButton?: NodeInterface;
	alignToolButton?: NodeInterface;

	init() {
		super.init();
		if (isEngine(this.editor)) {
			this.editor.on('undo', this.onChange);
			this.editor.on('redo', this.onChange);
		}
		if (this.colorTool) return;
		this.colorTool = new ColorTool(this.editor, this.id, {
			colors: TableComponent.colors,
			defaultColor: this.getValue()?.color,
			onChange: (color: string) => {
				this.setValue({
					color,
				});
				this.conltrollBar.drawBackgroundColor(color);
			},
		});
	}

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
		if (!isEngine(this.editor) || this.editor.readonly)
			return [
				{
					type: 'maximize',
				},
			];
		const language = this.editor.language.get('table');
		return [
			{
				type: 'dnd',
			},
			{
				type: 'maximize',
			},
			{
				type: 'copy',
			},
			{
				type: 'delete',
			},
			{
				type: 'separator',
			},
			{
				type: 'node',
				title: this.editor.language.get<string>(
					'table',
					'color',
					'title',
				),
				node: this.colorTool!.getButton(),
			},
			{
				type: 'button',
				title: language['noBorder'],
				content: '<span class="data-icon data-icon-no-border"></span>',
				didMount: (node) => {
					const value = this.getValue();
					if (value?.noBorder === true) {
						node.addClass('active');
					}
					this.noBorderToolButton = node;
				},
				onClick: (_, node) => {
					const value = this.getValue();
					this.setValue({
						noBorder: !value?.noBorder,
					});
					const table = this.wrapper?.find('.data-table');
					if (value?.noBorder === true) {
						table?.removeAttributes('data-table-no-border');
						node.removeClass('active');
					} else {
						table?.attributes('data-table-no-border', 'true');
						node.addClass('active');
					}
				},
			},
			{
				type: 'dropdown',
				content: '<span class="data-icon data-icon-align-top" />',
				title: language['verticalAlign']['title'],
				didMount: (node) => {
					this.alignToolButton = node.find('.data-toolbar-btn');
				},
				items: [
					{
						type: 'button',
						content: `<span class="data-icon data-icon-align-top"></span> ${language['verticalAlign']['top']}`,
						onClick: (event: MouseEvent) =>
							this.updateAlign(event, 'top'),
					},
					{
						type: 'button',
						content: `<span class="data-icon data-icon-align-middle"></span> ${language['verticalAlign']['middle']}`,
						onClick: (event: MouseEvent) =>
							this.updateAlign(event, 'middle'),
					},
					{
						type: 'button',
						content: `<span class="data-icon data-icon-align-bottom"></span> ${language['verticalAlign']['bottom']}`,
						onClick: (event: MouseEvent) =>
							this.updateAlign(event, 'bottom'),
					},
				],
			},
		];
	}

	updateAlign(event: MouseEvent, align: 'top' | 'middle' | 'bottom' = 'top') {
		event.preventDefault();
		this.conltrollBar.setAlign(align);
		this.updateAlignText(align);
	}

	updateAlignText(align: 'top' | 'middle' | 'bottom' = 'top') {
		const alignHtml = `<span class="data-icon data-icon-align-${align}"></span>`;
		this.alignToolButton?.html(alignHtml);
	}

	getTableValue() {
		if (!this.wrapper) return;
		const tableRoot = this.wrapper.find(Template.TABLE_CLASS);
		if (!tableRoot) return;
		const { tableModel } = this.selection;
		if (!tableModel) return;
		const { schema, conversion } = this.editor;
		const container = $('<div></div>');
		container.append(tableRoot.clone(true));
		const parser = new Parser(container, this.editor, (node) => {
			node.find(Template.TABLE_TD_BG_CLASS).remove();
			node.find(EDITABLE_SELECTOR).each((root) => {
				this.editor.node.unwrap($(root));
			});
		});
		const { rows, cols, height, width } = tableModel;
		const html = parser.toValue(schema, conversion, false, true);
		return {
			rows,
			cols,
			height,
			width,
			html,
		};
	}

	updateBackgroundSelection?(range: RangeInterface): void {
		const { selectArea, tableModel } = this.selection;
		if (selectArea && selectArea.count > 1 && tableModel) {
			const { begin, end } = selectArea;
			const startModel = tableModel.table[begin.row][begin.col];
			if (
				!this.helper.isEmptyModelCol(startModel) &&
				startModel.element
			) {
				range.setStart(startModel.element, 0);
			}
			const endModel = tableModel.table[end.row][end.col];
			if (!this.helper.isEmptyModelCol(endModel) && endModel.element) {
				range.setEnd(endModel.element, 0);
			}
		}
	}

	drawBackground?(
		node: NodeInterface,
		range: RangeInterface,
	): DOMRect | void | false | RangeInterface[] {
		const backgroundRect = node.get<HTMLElement>()!.getBoundingClientRect();
		const domRect = new DOMRect(backgroundRect.x, backgroundRect.y, 0, 0);
		const { startNode, endNode } = range;
		if (startNode.name !== 'td' || endNode.name !== 'td') return [range];

		const startRect = startNode.get<HTMLElement>()!.getBoundingClientRect();

		domRect.x = startRect.left - backgroundRect.left;
		domRect.y = startRect.top - backgroundRect.top;
		domRect.width = startRect.right - startRect.left;
		domRect.height = startRect.bottom - startRect.top;

		const rect = endNode.get<HTMLElement>()!.getBoundingClientRect();
		domRect.width = rect.right - startRect.left;
		domRect.height = rect.bottom - startRect.top;
		return domRect;
	}

	activate(activated: boolean) {
		super.activate(activated);
		if (activated) this.wrapper?.addClass('active');
		else {
			this.selection.clearSelect();
			this.conltrollBar.hideContextMenu();
			this.wrapper?.removeClass('active');
		}
		this.scrollbar?.refresh();
	}

	onChange = () => {
		if (!isEngine(this.editor)) return;
		this.editor.history.hold();
		this.conltrollBar.refresh();
		this.selection.render('change');
		const value = this.getTableValue();
		const oldValue = this.getValue();
		if (value && value !== oldValue) {
			if (oldValue?.noBorder) {
				this.noBorderToolButton?.addClass('active');
			} else this.noBorderToolButton?.removeClass('active');
			this.setValue(value);
			this.scrollbar?.refresh();
		}
	};

	maximize() {
		super.maximize();
		this.scrollbar?.refresh();
	}

	minimize() {
		super.minimize();
		this.scrollbar?.refresh();
	}

	didRender() {
		super.didRender();
		this.viewport = isEngine(this.editor)
			? this.wrapper?.find(Template.VIEWPORT)
			: this.wrapper;

		this.selection.init();
		this.conltrollBar.init();
		this.command.init();
		if (!isEngine(this.editor) || this.editor.readonly)
			this.toolbarModel?.setOffset([0, 0]);
		else this.toolbarModel?.setOffset([0, -28, 0, -6]);
		if (this.viewport) {
			this.scrollbar = new Scrollbar(this.viewport, true, false, true);
			this.scrollbar.on('display', (display: 'node' | 'block') => {
				if (display === 'block') {
					this.wrapper?.addClass('scrollbar-show');
				} else {
					this.wrapper?.removeClass('scrollbar-show');
				}
			});
		}
		this.scrollbar?.refresh();
		this.selection.on('select', () => {
			this.conltrollBar.refresh();
			if (!isEngine(this.editor)) return;
			const { selectArea, tableModel } = this.selection;
			if (selectArea && selectArea.count > 1 && tableModel) {
				this.editor.ot.updateSelectionData();
			}
			const align = this.selection.getSingleCell()?.css('vertical-align');
			this.updateAlignText(align as any);
		});

		this.conltrollBar.on('sizeChanged', () => {
			this.selection.refreshModel();
			this.scrollbar?.refresh();
			this.onChange();
		});
		this.command.on('actioned', (action, silence) => {
			if (action === 'paste') {
				this.editor.card.render(this.wrapper);
			}
			this.selection.render(action);
			this.scrollbar?.refresh();
			if (!silence) {
				this.onChange();
			}
		});

		const tableRoot = this.wrapper?.find(Template.TABLE_CLASS);
		if (!tableRoot) return;
		const value = this.getValue();
		if (!value?.html) this.onChange();
	}

	render() {
		Template.isReadonly = !isEngine(this.editor) || this.editor.readonly;
		if (this.wrapper) return;
		const value = this.getValue();
		if (!value) return 'Error value';
		if (value.html) {
			const model = this.helper.getTableModel($(value.html));
			value.rows = model.rows;
			value.cols = model.cols;
		}
		//渲染卡片
		this.wrapper = isEngine(this.editor)
			? $(
					this.template.htmlEdit(
						value,
						menuData(this.editor.language.get('table')),
					),
			  )
			: $(this.template.htmlView(value));
		if (!isEngine(this.editor)) {
			this.wrapper
				.find('table')
				.addClass('data-table')
				.addClass('data-table-view');
		}
		if (value.width)
			this.wrapper.find('table').css('width', `${value.width}px`);
		return this.wrapper;
	}

	destroy() {
		super.destroy();
		this.scrollbar?.destroy();
		this.command.removeAllListeners();
		this.selection.removeAllListeners();
		this.selection.destroy();
		this.conltrollBar.removeAllListeners();
		this.conltrollBar.destroy();
		this.editor.off('undo', this.onChange);
		this.editor.off('redo', this.onChange);
	}
}

export default TableComponent;

export { Template };
