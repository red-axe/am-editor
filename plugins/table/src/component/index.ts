import {
	$,
	Card,
	CardToolbarItemOptions,
	CardType,
	EDITABLE_SELECTOR,
	getComputedStyle,
	isEngine,
	isMobile,
	NodeInterface,
	Parser,
	RangeInterface,
	removeUnit,
	Scrollbar,
	SelectStyleType,
	ToolbarItemOptions,
} from '@aomao/engine';
import {
	ControllBarInterface,
	HelperInterface,
	TableCommandInterface,
	TableInterface,
	TableOptions,
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

class TableComponent<V extends TableValue = TableValue>
	extends Card<V>
	implements TableInterface<V>
{
	readonly contenteditable: string[] = [
		`div${Template.TABLE_TD_CONTENT_CLASS}`,
	];

	static get cardName() {
		return 'table';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	static get selectStyleType() {
		return SelectStyleType.BACKGROUND;
	}

	static get autoSelected() {
		return false;
	}

	static get lazyRender() {
		return true;
	}

	static colors = Palette.getColors().map((group) =>
		group.map((color) => {
			return { color, border: Palette.getStroke(color) };
		}),
	);

	colMinWidth =
		this.editor.plugin.findPlugin<TableOptions>('table')?.options
			.colMinWidth || 40;
	rowMinHeight =
		this.editor.plugin.findPlugin<TableOptions>('table')?.options
			.rowMinHeight || 35;

	wrapper?: NodeInterface;
	helper: HelperInterface = new Helper(this.editor);
	template: TemplateInterface = new Template(this);
	selection: TableSelectionInterface = new TableSelection(this.editor, this);
	conltrollBar: ControllBarInterface = new ControllBar(this.editor, this, {
		col_min_width: this.colMinWidth,
		row_min_height: this.rowMinHeight,
	});
	command: TableCommandInterface = new TableCommand(this.editor, this);
	scrollbar?: Scrollbar;
	viewport?: NodeInterface;
	colorTool?: ColorTool;
	noBorderToolButton?: NodeInterface;
	alignToolButton?: NodeInterface;
	#changeTimeout?: NodeJS.Timeout;

	init() {
		super.init();
		if (isEngine(this.editor)) {
			this.editor.on('undo', this.doChange);
			this.editor.on('redo', this.doChange);
			// tab 键选择
			if (!this.editor.event.listeners['keydown:tab'])
				this.editor.event.listeners['keydown:tab'] = [];
			this.editor.event.listeners['keydown:tab'].unshift(
				(event: KeyboardEvent) => {
					if (!isEngine(this.editor)) return;
					const { change, block, node, card } = this.editor;

					const range = change.range.get();
					const td = range.endNode.closest('td');
					if (td.length === 0) return;
					const component = card.closest(td, true);
					if (!component?.equal(this.root)) return;
					const closestBlock = block.closest(range.endNode);
					if (
						td.length > 0 &&
						(block.isLastOffset(range, 'end') ||
							(closestBlock.name !== 'li' &&
								node.isEmptyWidthChild(closestBlock)))
					) {
						let next = td.next();
						if (!next) {
							const nextRow = td.parent()?.next();
							// 最后一行，最后一列
							if (!nextRow) {
								// 新建一行
								this.command.insertRowDown();
								next =
									td
										.parent()
										?.next()
										?.find('td:first-child') || null;
							} else {
								next = nextRow.find('td:first-child') || null;
							}
						}
						if (next) {
							event.preventDefault();
							this.selection.focusCell(next);
							return false;
						}
					}
					if (td.length > 0) {
						setTimeout(() => {
							this.scrollbar?.refresh();
						}, 0);
					}
					return;
				},
			);
			// 下键选择
			this.editor.on('keydown:down', (event) => {
				if (!isEngine(this.editor)) return;
				const { change, card } = this.editor;

				const range = change.range.get();
				const td = range.endNode.closest('td');
				if (td.length === 0) return;
				const component = card.closest(td, true);
				if (!component?.equal(this.root)) return;
				const contentElement = td.find('.table-main-content');
				if (!contentElement) return;
				const tdRect = contentElement
					.get<HTMLElement>()!
					.getBoundingClientRect();
				const rangeRect = range.getBoundingClientRect();
				if (
					td.length > 0 &&
					(rangeRect.bottom === 0 ||
						tdRect.bottom - rangeRect.bottom < 10)
				) {
					const index = td.index();
					const nextRow = td.parent()?.next();
					if (nextRow) {
						let nextIndex = 0;
						let nextTd = nextRow.find('td:last-child');
						this.selection.tableModel?.table[nextRow.index()].some(
							(cell) => {
								if (
									!this.helper.isEmptyModelCol(cell) &&
									nextIndex >= index &&
									cell.element
								) {
									nextTd = $(cell.element);
									return true;
								}
								nextIndex++;
								return false;
							},
						);
						if (nextTd) {
							event.preventDefault();
							this.selection.focusCell(nextTd, true);
							return false;
						}
					} else {
						event.preventDefault();
						const cloneRange = range.cloneRange();
						const next = this.root.next();
						const cardComponent = next
							? card.find(next)
							: undefined;
						if (cardComponent?.onSelectDown) {
							cardComponent.onSelectDown(event);
						} else {
							card.focusNextBlock(this, cloneRange, false);
							change.range.select(cloneRange);
						}
						return false;
					}
				}
				if (td.length > 0) {
					setTimeout(() => {
						this.scrollbar?.refresh();
					}, 0);
				}
				return;
			});
			// 上键选择
			this.editor.on('keydown:up', (event) => {
				if (!isEngine(this.editor)) return;
				const { change, card } = this.editor;

				const range = change.range.get();
				const td = range.endNode.closest('td');
				if (td.length === 0) return;
				const component = card.closest(td, true);
				if (!component?.equal(this.root)) return;
				const contentElement = td.find('.table-main-content');
				if (!contentElement) return;
				const tdRect = contentElement
					.get<HTMLElement>()!
					.getBoundingClientRect();
				const rangeRect = range.getBoundingClientRect();
				if (
					td.length > 0 &&
					(rangeRect.top === 0 || rangeRect.top - tdRect.top < 10)
				) {
					const index = td.index();
					const prevRow = td.parent()?.prev();
					if (prevRow) {
						let prevIndex = 0;
						let prevTd = prevRow.find('td:first-child');
						this.selection.tableModel?.table[prevRow.index()].some(
							(cell) => {
								if (
									!this.helper.isEmptyModelCol(cell) &&
									prevIndex >= index &&
									cell.element
								) {
									prevTd = $(cell.element);
									return true;
								}
								prevIndex++;
								return false;
							},
						);
						if (prevTd) {
							event.preventDefault();
							this.selection.focusCell(prevTd);
							return false;
						}
					} else {
						event.preventDefault();
						const cloneRange = range.cloneRange();
						const prev = this.root.prev();
						const cardComponent = prev
							? card.find(prev)
							: undefined;
						if (cardComponent?.onSelectUp) {
							cardComponent.onSelectUp(event);
						} else {
							card.focusPrevBlock(this, cloneRange, false);
							change.range.select(cloneRange);
						}
						return false;
					}
				}
				if (td.length > 0) {
					setTimeout(() => {
						this.scrollbar?.refresh();
					}, 0);
				}
				return;
			});
			// 左键选择
			this.editor.on('keydown:left', () => {
				if (!isEngine(this.editor)) return;
				const { change, card } = this.editor;

				const range = change.range.get();
				const td = range.endNode.closest('td');
				if (td.length === 0) return;
				const component = card.closest(td, true);
				if (!component?.equal(this.root)) return;
				const contentElement = td.find('.table-main-content');
				if (!contentElement) return;
				if (td.length > 0) {
					setTimeout(() => {
						this.scrollbar?.refresh();
					}, 0);
				}
			});
			// 右键选择
			this.editor.on('keydown:right', () => {
				if (!isEngine(this.editor)) return;
				const { change, card } = this.editor;

				const range = change.range.get();
				const td = range.endNode.closest('td');
				if (td.length === 0) return;
				const component = card.closest(td, true);
				if (!component?.equal(this.root)) return;
				const contentElement = td.find('.table-main-content');
				if (!contentElement) return;
				if (td.length > 0) {
					setTimeout(() => {
						this.scrollbar?.refresh();
					}, 0);
				}
			});
		}
		if (this.colorTool) return;
		this.colorTool = new ColorTool(this.editor, this.id, {
			colors: TableComponent.colors,
			defaultColor: super.getValue()?.color,
			onChange: (color: string) => {
				this.setValue({
					color,
				} as V);
				this.conltrollBar.drawBackgroundColor(color);
			},
		});
	}

	doChange = () => {
		this.handleChange('local');
	};

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
		if (!isEngine(this.editor) || this.editor.readonly)
			return [
				{
					type: 'maximize',
				},
			];
		const language = this.editor.language.get('table');
		const funBtns: Array<ToolbarItemOptions | CardToolbarItemOptions> = [
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
					const value = super.getValue();
					if (value?.noBorder === true) {
						node.addClass('active');
					}
					this.noBorderToolButton = node;
				},
				onClick: (_, node) => {
					const value = super.getValue();
					this.setValue({
						noBorder: !value?.noBorder,
					} as V);
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
			{
				type: 'button',
				title: language['mergeCell'],
				content:
					'<span class="data-icon data-icon-merge-cells"></span>',
				disabled: this.conltrollBar.getMenuDisabled('mergeCell'),
				onClick: () => {
					this.command.mergeCell();
				},
			},
			{
				type: 'button',
				title: language['splitCell'],
				content:
					'<span class="data-icon data-icon-solit-cells"></span>',
				disabled: this.conltrollBar.getMenuDisabled('splitCell'),
				onClick: () => {
					this.command.splitCell();
				},
			},
		];
		if (this.isMaximize) return funBtns;
		const toolbars: Array<ToolbarItemOptions | CardToolbarItemOptions> = [
			{
				type: 'maximize',
			},
			{
				type: 'copy',
				onClick: () => {
					this.command.copy(true);
					this.editor.messageSuccess(
						this.editor.language.get<string>('copy', 'success'),
					);
				},
			},
			{
				type: 'delete',
			},
			{
				type: 'separator',
			},
			...funBtns,
		];
		if (removeUnit(this.wrapper?.css('margin-left') || '0') === 0) {
			toolbars.unshift({
				type: 'dnd',
			});
		}
		return toolbars;
	}

	onSelectLeft(event: KeyboardEvent) {
		const { tableModel } = this.selection;
		if (!tableModel) return;
		for (let r = tableModel.rows - 1; r >= 0; r--) {
			for (let c = tableModel.cols - 1; c >= 0; c--) {
				const cell = tableModel.table[r][c];
				if (!this.helper.isEmptyModelCol(cell) && cell.element) {
					event.preventDefault();
					this.selection.focusCell(cell.element, false);
					return false;
				}
			}
		}
		return;
	}

	onSelectRight(event: KeyboardEvent) {
		const { tableModel } = this.selection;
		if (!tableModel) return;
		for (let r = 0; r < tableModel.rows; r++) {
			for (let c = 0; c < tableModel.cols; c++) {
				const cell = tableModel.table[r][c];
				if (!this.helper.isEmptyModelCol(cell) && cell.element) {
					event.preventDefault();
					this.selection.focusCell(cell.element);
					return false;
				}
			}
		}
		return;
	}

	onSelectUp(event: KeyboardEvent) {
		const { tableModel } = this.selection;
		if (!tableModel) return;
		for (let r = tableModel.rows - 1; r >= 0; r--) {
			for (let c = 0; c < tableModel.cols; c++) {
				const cell = tableModel.table[r][c];
				if (!this.helper.isEmptyModelCol(cell) && cell.element) {
					event.preventDefault();
					this.selection.focusCell(cell.element, false);
					return false;
				}
			}
		}
		return;
	}

	onSelectDown(event: KeyboardEvent) {
		const { tableModel } = this.selection;
		if (!tableModel) return;
		for (let r = 0; r < tableModel.rows; r++) {
			for (let c = 0; c < tableModel.cols; c++) {
				const cell = tableModel.table[r][c];
				if (!this.helper.isEmptyModelCol(cell) && cell.element) {
					event.preventDefault();
					this.selection.focusCell(cell.element);
					return false;
				}
			}
		}
		return;
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

	getValue() {
		const value = super.getValue();
		if (!this.wrapper) return value;
		const tableRoot = this.wrapper.find(Template.TABLE_CLASS);
		if (!tableRoot) return value;
		const { tableModel } = this.selection;
		if (!tableModel) return value;
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
		const html = parser.toValue(schema, conversion, false, false);
		if (!isEngine(this.editor)) return { ...value, html };
		return {
			...value,
			rows,
			cols,
			height,
			width,
			html,
		} as V;
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
		const startElement = startNode.closest('td');
		const endElement = endNode.closest('td');
		if (
			startElement.name !== 'td' ||
			endElement.name !== 'td' ||
			startElement.equal(endElement)
		)
			return;

		const startRect = startElement
			.get<HTMLElement>()!
			.getBoundingClientRect();
		const vLeft =
			(this.viewport?.getBoundingClientRect()?.left || 0) +
			(this.activated ? 13 : 0);
		domRect.x = Math.max(
			startRect.left - backgroundRect.left,
			vLeft - (this.editor.root.getBoundingClientRect()?.left || 0),
		);
		domRect.y = startRect.top - backgroundRect.top;
		domRect.width = startRect.right - startRect.left;
		domRect.height = startRect.bottom - startRect.top;

		const rect = endElement.get<HTMLElement>()!.getBoundingClientRect();
		domRect.width = Math.min(
			rect.right - (startRect.left < vLeft ? vLeft : startRect.left),
			(this.viewport?.width() || 0) - (this.activated ? 13 : 0),
		);
		if (domRect.width < 0) domRect.width = 0;
		domRect.height = rect.bottom - startRect.top;
		return domRect;
	}

	activate(activated: boolean) {
		super.activate(activated);
		if (activated) {
			this.wrapper?.addClass('active');
		} else {
			this.selection.clearSelect();
			this.conltrollBar.hideContextMenu();
			this.wrapper?.removeClass('active');
		}
		this.scrollbar?.refresh();
	}

	handleChange = (trigger: 'remote' | 'local' = 'local') => {
		if (!isEngine(this.editor)) return;
		this.conltrollBar.refresh();
		this.selection.render('change');
		const oldValue = super.getValue();
		if (oldValue?.noBorder) {
			this.noBorderToolButton?.addClass('active');
		} else this.noBorderToolButton?.removeClass('active');
		if (trigger === 'local' && isEngine(this.editor)) {
			const value = this.getValue();
			if (value) this.setValue(value);
		}
	};

	onChange = (trigger: 'remote' | 'local' = 'local') => {
		if (
			isEngine(this.editor) &&
			trigger === 'local' &&
			this.editor.ot.isStopped()
		)
			return;
		if (this.#changeTimeout) clearTimeout(this.#changeTimeout);
		this.#changeTimeout = setTimeout(() => {
			this.handleChange(trigger);
			if (trigger === 'remote') {
				this.remoteRefresh();
			}
		}, 50);
	};

	maximize() {
		super.maximize();
		this.scrollbar?.refresh();
	}

	minimize() {
		super.minimize();
		this.scrollbar?.refresh();
	}

	getSelectionNodes() {
		const nodes: Array<NodeInterface> = [];
		this.selection.each((cell) => {
			if (!this.helper.isEmptyModelCol(cell) && cell.element) {
				nodes.push($(cell.element).find(EDITABLE_SELECTOR));
			}
		});
		// 如果值选中了一个单元格，并且不是拖蓝方式选中就返回空的
		if (
			nodes.length === 1 &&
			nodes[0].closest('[table-cell-selection=true]').length === 0
		)
			return [];
		return nodes;
	}

	overflow(max: number) {
		// 表格宽度
		const tableWidth = this.wrapper?.find('.data-table')?.width() || 0;
		const rootWidth = this.getCenter().width();
		// 溢出的宽度
		const overflowWidth = tableWidth - rootWidth;
		if (overflowWidth > 0 && !this.isMaximize) {
			this.wrapper?.css(
				'margin-right',
				`-${overflowWidth > max ? max : overflowWidth}px`,
			);
		} else if (overflowWidth < 0 || this.isMaximize) {
			this.wrapper?.css('margin-right', '');
		}
	}

	updateScrollbar = () => {
		if (!this.scrollbar) return;
		const hideHeight =
			(this.wrapper?.getBoundingClientRect()?.bottom || 0) -
			(this.wrapper?.getViewport().bottom || 0);
		this.wrapper?.find('.data-scrollbar-x').css({
			bottom: `${hideHeight > 0 ? hideHeight + 2 : 0}px`,
		});
	};

	isChanged: boolean = false;

	didRender() {
		super.didRender();
		this.viewport = isEngine(this.editor)
			? this.wrapper?.find(Template.VIEWPORT)
			: this.wrapper?.find(Template.VIEWPORT_READER);

		this.selection.init();
		this.conltrollBar.init();
		this.command.init();
		if (!isEngine(this.editor) || this.editor.readonly)
			this.toolbarModel?.setOffset([0, 0]);
		else this.toolbarModel?.setOffset([0, -28, 0, -6]);
		const tablePlugin = this.editor.plugin.components['table'];
		const tableOptions = tablePlugin?.options['overflow'] || {};
		if (this.viewport) {
			this.selection.refreshModel();
			const overflowLeftConfig = tableOptions['maxLeftWidth']
				? {
						onScrollX: (x: number) => {
							if (this.isMaximize) x = 0;
							const max = tableOptions['maxLeftWidth']();
							this.wrapper?.css(
								'margin-left',
								`-${x > max ? max : x}px`,
							);
							if (x > 0) {
								this.editor.root.find('.data-card-dnd').hide();
							} else {
								this.editor.root.find('.data-card-dnd').show();
							}
							return x - max;
						},
						getScrollLeft: (left: number) => {
							return (
								left -
								removeUnit(
									this.wrapper?.css('margin-left') || '0',
								)
							);
						},
						getOffsetWidth: (width: number) => {
							return (
								width +
								removeUnit(
									this.wrapper?.css('margin-left') || '0',
								)
							);
						},
				  }
				: undefined;
			this.scrollbar = new Scrollbar(
				this.viewport,
				true,
				false,
				true,
				overflowLeftConfig,
			);
			this.scrollbar.setContentNode(this.viewport.find('.data-table')!);
			this.scrollbar.on('display', (display: 'node' | 'block') => {
				if (display === 'block') {
					this.wrapper?.addClass('scrollbar-show');
				} else {
					this.wrapper?.removeClass('scrollbar-show');
				}
			});
			//this.scrollbar.disableScroll();
			let scrollbarTimeout: NodeJS.Timeout | null = null;
			const handleScrollbarChange = () => {
				if (tableOptions['maxRightWidth'])
					this.overflow(tableOptions['maxRightWidth']());
				if (scrollbarTimeout) clearTimeout(scrollbarTimeout);
				scrollbarTimeout = setTimeout(() => {
					if (isEngine(this.editor)) {
						this.editor.ot.initSelection(false);
						this.conltrollBar.refresh();
					}
				}, 20);
			};
			this.scrollbar.on('change', handleScrollbarChange);
			if (!isMobile)
				window.addEventListener('scroll', this.updateScrollbar);
			window.addEventListener('resize', this.updateScrollbar);
			if (isEngine(this.editor) && !isMobile) {
				this.editor.scrollNode?.on('scroll', this.updateScrollbar);
			}
		}
		this.selection.on('select', () => {
			this.conltrollBar.refresh();
			setTimeout(() => {
				this.isChanged = true;
			}, 200);
			if (!isEngine(this.editor)) return;
			const { selectArea, tableModel } = this.selection;
			if (selectArea && selectArea.count > 1 && tableModel) {
				this.editor.ot.updateSelection();
			}
			const align = this.selection.getSingleCell()?.css('vertical-align');
			this.updateAlignText(align as any);
			this.toolbarModel?.update();
		});

		this.conltrollBar.on('sizeChanged', () => {
			this.selection.refreshModel();
			this.onChange();
			this.scrollbar?.refresh();
		});
		this.conltrollBar.on('sizeChanging', () => {
			this.scrollbar?.refresh();
			this.editor.trigger('editor:resize');
			this.updateScrollbar();
		});
		this.command.on('actioned', (action, silence) => {
			if (action === 'paste') {
				this.editor.card.render(this.wrapper);
			}
			if (['splitCell', 'mergeCell'].includes(action)) {
				this.editor.trigger('editor:resize');
			}
			this.selection.render(action);
			this.toolbarModel?.update();
			if (!silence) {
				this.onChange();
			}
			if (tableOptions['maxRightWidth'])
				this.overflow(tableOptions['maxRightWidth']());
			this.scrollbar?.refresh();
		});

		const tableRoot = this.wrapper?.find(Template.TABLE_CLASS);
		if (!tableRoot) return;
		const value = super.getValue();
		if (!value?.html) {
			const tableValue = this.getValue();
			if (tableValue && isEngine(this.editor)) this.setValue(tableValue);
			this.onChange();
		}
		if (tableOptions['maxRightWidth'])
			this.overflow(tableOptions['maxRightWidth']());
		this.scrollbar?.refresh();
	}

	remoteRefresh() {
		if (
			!this.wrapper ||
			this.wrapper.length === 0 ||
			!this.wrapper[0].parentNode
		)
			return;
		// 重新绘制列头部和行头部
		const colsHeader = this.wrapper.find(Template.COLS_HEADER_CLASS);
		const superValue = super.getValue();
		let colItems = colsHeader.find(Template.COLS_HEADER_ITEM_CLASS);
		const colCount = colItems.length;
		if (superValue.cols > colCount) {
			colsHeader.append(
				$(
					this.template.renderColsHeader(superValue.cols - colCount),
				).children(),
			);
			colItems = colsHeader.find(Template.COLS_HEADER_ITEM_CLASS);
		} else if (superValue.cols < colCount) {
			for (let i = colCount; i > superValue.cols; i--) {
				colItems.eq(i - 1)?.remove();
			}
		}
		const table = superValue.html
			? $(superValue.html)
			: this.wrapper.find('table');
		const colElements = table.find('col').toArray();
		colElements.forEach((colElement, index) => {
			const width = colElement.attributes('width');
			colItems.eq(index)?.css('width', `${width}px`);
		});

		const rowsHeader = this.wrapper.find(Template.ROWS_HEADER_CLASS);
		let rowItems = rowsHeader.find(Template.ROWS_HEADER_ITEM_CLASS);
		const rowCount = rowItems.length;
		if (superValue.rows > rowCount) {
			rowsHeader.append(
				$(
					this.template.renderRowsHeader(superValue.rows - rowCount),
				).children(),
			);
			rowItems = rowsHeader.find(Template.ROWS_HEADER_ITEM_CLASS);
		} else if (superValue.rows < rowCount) {
			for (let i = rowCount; i > superValue.rows; i--) {
				rowItems.eq(i - 1)?.remove();
			}
		}
		const rowElements = table.find('tr').toArray();
		rowElements.forEach((rowElement, index) => {
			rowItems
				.eq(index)
				?.css(
					'height',
					removeUnit(
						getComputedStyle(rowElement.get<Element>()!, 'height'),
					),
				);
		});
		this.conltrollBar.refresh();
		this.scrollbar?.refresh();
		setTimeout(() => {
			// 找到所有可编辑节点，对没有 contenteditable 属性的节点添加contenteditable一下
			this.wrapper?.find(EDITABLE_SELECTOR).each((editableNode) => {
				const editableElement = editableNode as Element;
				if (!editableElement.hasAttribute('contenteditable')) {
					editableElement.setAttribute(
						'contenteditable',
						this.template.isReadonly ? 'false' : 'true',
					);
				}
			});
		}, 10);
	}

	render() {
		this.template.isReadonly =
			!isEngine(this.editor) || this.editor.readonly;
		// 重新渲染
		if (
			this.wrapper &&
			this.wrapper.length > 0 &&
			!!this.wrapper[0].parentNode
		) {
			this.remoteRefresh();
			return;
		}
		const value = this.getValue();
		// 第一次渲染
		if (!value) return 'Error value';
		if (value.html) {
			let table: NodeInterface | undefined = $(value.html);
			if (table && table.name !== 'table') {
				table = table.toArray().find((child) => child.name === 'table');
				if (!table) {
					value.html = `<table><tr><td>${value.html}</td></tr></table>`;
					table = $(value.html);
				} else {
					value.html = table.get<Element>()!.outerHTML;
				}
			}
			const model = this.helper.getTableModel(table);
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
		value.rows = this.wrapper.find('tr').length;
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
		this.editor.off('undo', this.doChange);
		this.editor.off('redo', this.doChange);
	}
}

export default TableComponent;

export { Template, Helper };
