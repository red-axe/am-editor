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

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
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
		];
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
	): DOMRect | void {
		const backgroundRect = node.get<HTMLElement>()!.getBoundingClientRect();
		const domRect = new DOMRect(backgroundRect.x, backgroundRect.y, 0, 0);
		const { startNode, endNode } = range;
		if (startNode.name !== 'td' || endNode.name !== 'td') return;

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

	onChange() {
		if (!isEngine(this.editor)) return;
		this.editor.history.hold();
		this.conltrollBar.refresh();
		this.selection.render('change');
		const value = this.getTableValue();
		if (value && value !== this.getValue()) this.setValue(value);
	}

	didRender() {
		super.didRender();
		this.viewport = isEngine(this.editor)
			? this.wrapper?.find(Template.VIEWPORT)
			: this.wrapper;

		this.selection.init();
		this.conltrollBar.init();
		this.command.init();

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
		this.editor.card.render(tableRoot);
		const value = this.getValue();
		if (!value?.html) this.onChange();
	}

	render() {
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
			this.wrapper.find('table').addClass('data-table');
		}
		return this.wrapper;
	}
}

export default TableComponent;

export { Template };
