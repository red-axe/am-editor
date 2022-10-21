import {
	$,
	Card,
	CardToolbarItemOptions,
	CardType,
	closest,
	DATA_CONTENTEDITABLE_KEY,
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
	maxInsertNum =
		this.editor.plugin.findPlugin<TableOptions>('table')?.options
			.maxInsertNum || 30;
	wrapper?: NodeInterface;
	helper: HelperInterface = new Helper(this.editor);
	template: TemplateInterface = new Template(this);
	selection: TableSelectionInterface = new TableSelection(this.editor, this);
	conltrollBar: ControllBarInterface = new ControllBar(this.editor, this, {
		col_min_width: this.colMinWidth,
		row_min_height: this.rowMinHeight,
		max_insert_num: this.maxInsertNum,
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
		const editor = this.editor;
		if (isEngine(editor)) {
			// tab 键选择
			if (!editor.event.listeners['keydown:tab'])
				editor.event.listeners['keydown:tab'] = [];
			editor.event.listeners['keydown:tab'].unshift(
				(event: KeyboardEvent) => {
					if (!isEngine(editor) || editor.readonly) return;
					const { change, block, node, card } = editor;

					const range = change.range.get();
					const td = range.endNode.closest('td');
					if (td.length === 0 || !td.inEditor()) return;
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
			editor.on('keydown:down', (event) => {
				if (!isEngine(editor) || editor.readonly) return;
				const { change, card } = editor;

				const range = change.range.get();
				const td = range.endNode.closest('td');
				if (td.length === 0 || !td.inEditor()) return;
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
			editor.on('keydown:up', (event) => {
				if (!isEngine(editor) || editor.readonly) return;
				const { change, card } = editor;

				const range = change.range.get();
				const td = range.endNode.closest('td');
				if (td.length === 0 || !td.inEditor()) return;
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
			editor.on('keydown:left', () => {
				if (!isEngine(editor) || editor.readonly) return;
				const { change, card } = editor;

				const range = change.range.get();
				const td = range.endNode.closest('td');
				if (td.length === 0 || !td.inEditor()) return;
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
			editor.on('keydown:right', () => {
				if (!isEngine(editor) || editor.readonly) return;
				const { change, card } = editor;

				const range = change.range.get();
				const td = range.endNode.closest('td');
				if (td.length === 0 || !td.inEditor()) return;
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
		this.colorTool = new ColorTool(editor, this.id, {
			colors: TableComponent.colors,
			defaultColor: super.getValue()?.color,
			onChange: (color: string) => {
				this.conltrollBar.drawBackgroundColor(color);
				const value = this.getValue();
				this.setValue({ ...value, color });
			},
		});
	}

	doChange = () => {
		this.remoteRefresh();
		this.handleChange('local');
	};

	toolbar(): (ToolbarItemOptions | CardToolbarItemOptions)[] {
		const editor = this.editor;
		const getItems = (): (
			| ToolbarItemOptions
			| CardToolbarItemOptions
		)[] => {
			if (!isEngine(editor) || editor.readonly)
				return [
					{
						key: 'maximize',
						type: 'maximize',
					},
				];
			const language = editor.language.get('table');
			const funBtns: Array<ToolbarItemOptions | CardToolbarItemOptions> =
				[
					{
						key: 'color',
						type: 'node',
						title: editor.language.get<string>(
							'table',
							'color',
							'title',
						),
						node: this.colorTool!.getButton(),
					},
					{
						key: 'border',
						type: 'button',
						title: super.getValue()?.noBorder
							? language['showBorder']
							: language['noBorder'],
						content:
							'<span class="data-icon data-icon-no-border"></span>',
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
								table?.attributes(
									'data-table-no-border',
									'true',
								);
								node.addClass('active');
							}
						},
					},
					{
						key: 'align',
						type: 'dropdown',
						content:
							'<span class="data-icon data-icon-align-top" />',
						title: language['verticalAlign']['title'],
						didMount: (node) => {
							this.alignToolButton =
								node.find('.data-toolbar-btn');
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
						key: 'merge',
						type: 'button',
						title: language['mergeCell'],
						content:
							'<span class="data-icon data-icon-merge-cells"></span>',
						disabled:
							this.conltrollBar.getMenuDisabled('mergeCell'),
						onClick: () => {
							this.command.mergeCell();
						},
					},
					{
						key: 'split',
						type: 'button',
						title: language['splitCell'],
						content:
							'<span class="data-icon data-icon-solit-cells"></span>',
						disabled:
							this.conltrollBar.getMenuDisabled('splitCell'),
						onClick: () => {
							this.command.splitCell();
						},
					},
				];
			if (this.isMaximize) return funBtns;
			const toolbars: Array<ToolbarItemOptions | CardToolbarItemOptions> =
				[
					{
						key: 'maximize',
						type: 'maximize',
					},
					{
						key: 'copy',
						type: 'copy',
						onClick: () => {
							this.command.copy(true);
							editor.messageSuccess(
								'copy',
								editor.language.get<string>('copy', 'success'),
							);
						},
					},
					{
						key: 'delete',
						type: 'delete',
					},
					{
						key: 'separator',
						type: 'separator',
					},
					...funBtns,
				];
			if (removeUnit(this.wrapper?.css('margin-left') || '0') === 0) {
				toolbars.unshift({
					key: 'dnd',
					type: 'dnd',
				});
			}
			return toolbars;
		};
		const options =
			editor.plugin.findPlugin<TableOptions>('table')?.options;
		if (options?.cardToolbars) {
			return options.cardToolbars(getItems(), this.editor);
		}
		return getItems();
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
		this.onChange('local');
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
		const editor = this.editor;
		const { schema, conversion } = editor;
		const container = $('<div></div>');
		container.append(tableRoot.clone(true));
		const parser = new Parser(container, editor, (node) => {
			node.find(Template.TABLE_TD_BG_CLASS).remove();
			node.find(EDITABLE_SELECTOR).each((root) => {
				editor.node.unwrap($(root));
			});
		});
		const { rows, cols, height, width } = tableModel;
		const html = parser.toValue(schema, conversion, false, false);
		if (!isEngine(editor)) return { ...value, html };
		return {
			...value,
			rows,
			cols,
			height,
			width,
			html,
		} as V;
	}

	drawBackground?(
		node: NodeInterface,
		range: RangeInterface,
	): DOMRect | void | false | RangeInterface[] {
		const backgroundRect = node.get<HTMLElement>()!.getBoundingClientRect();
		const domRect = new DOMRect(backgroundRect.x, backgroundRect.y, 0, 0);
		const { startContainer, endContainer } = range;
		const startElement = closest(startContainer, 'td');
		const endElement = closest(endContainer, 'td');
		if (
			!(startElement instanceof Element) ||
			!(endElement instanceof Element) ||
			startElement.nodeName !== 'TD' ||
			endElement?.nodeName !== 'TD' ||
			startElement === endElement
		)
			return;

		const startRect = startElement.getBoundingClientRect();
		const endRect = endElement.getBoundingClientRect();
		const viewportRect = this.viewport?.getBoundingClientRect();
		const vLeft = (viewportRect?.left || 0) + (this.activated ? 13 : 0);
		domRect.x = Math.max(
			startRect.left - backgroundRect.left,
			vLeft - (this.editor.root.getBoundingClientRect()?.left || 0),
		);
		domRect.y = startRect.top - backgroundRect.top;
		domRect.width =
			(viewportRect
				? Math.min(endRect.right, viewportRect.right)
				: endRect.right) - startRect.left;
		domRect.height = startRect.bottom - startRect.top;
		if (domRect.width < 0) domRect.width = 0;
		domRect.height = endRect.bottom - startRect.top;
		return domRect;
	}

	activate(activated: boolean) {
		super.activate(activated);
		if (activated) {
			this.conltrollBar.refresh();
			this.wrapper?.addClass('active');
		} else {
			this.selection.clearSelect();
			this.conltrollBar.hideContextMenu();
			this.wrapper?.removeClass('active');
		}
		this.scrollbar?.refresh();
	}

	handleChange = (trigger: 'remote' | 'local' = 'local') => {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		this.conltrollBar.refresh();
		this.selection.render('change');
		const oldValue = super.getValue();
		if (oldValue?.noBorder) {
			this.noBorderToolButton?.addClass('active');
		} else this.noBorderToolButton?.removeClass('active');
		if (trigger === 'local' && isEngine(editor)) {
			const value = this.getValue();
			if (value) this.setValue(value);
		}
	};

	onChange = (trigger: 'remote' | 'local' = 'local') => {
		const editor = this.editor;
		if (isEngine(editor) && trigger === 'local' && editor.ot.isStopped())
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
		const { editor } = this;
		if (isEngine(editor) && !isMobile) {
			this.getCenter().on('scroll', this.updateScrollbar, {
				passive: true,
			});
		}
	}

	minimize() {
		super.minimize();
		this.scrollbar?.refresh();
		this.getCenter().off('scroll', this.updateScrollbar);
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

	initScrollbar() {
		if (!this.viewport) return;
		const editor = this.editor;
		const tablePlugin = editor.plugin.findPlugin<TableOptions>('table');
		const tableOptions = tablePlugin?.options.overflow || {};
		const overflowLeftConfig = tableOptions.maxLeftWidth
			? {
					onScrollX: (x: number) => {
						if (this.isMaximize) x = 0;
						const max = tableOptions.maxLeftWidth!();
						this.wrapper?.css(
							'margin-left',
							`-${x > max ? max : x}px`,
						);
						if (x > 0) {
							editor.root.find('.data-card-dnd').hide();
						} else {
							editor.root.find('.data-card-dnd').show();
						}
						return x - max;
					},
					getScrollLeft: (left: number) => {
						return (
							left -
							removeUnit(this.wrapper?.css('margin-left') || '0')
						);
					},
					getOffsetWidth: (width: number) => {
						return (
							width +
							removeUnit(this.wrapper?.css('margin-left') || '0')
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
		let prevScrollData = {
			x: 0,
			y: 0,
		};
		const handleScrollbarChange = ({ x, y }: Record<string, number>) => {
			if (tableOptions['maxRightWidth'])
				this.overflow(tableOptions['maxRightWidth']());
			if (prevScrollData.x === x && prevScrollData.y === y) return;
			prevScrollData = {
				x,
				y,
			};

			if (isEngine(editor)) {
				editor.trigger('scroll', this.root, { x, y });
				this.conltrollBar.refresh();
			}
		};
		this.scrollbar.on('change', handleScrollbarChange);
		if (!isMobile)
			window.addEventListener('scroll', this.updateScrollbar, {
				passive: true,
			});
		window.addEventListener('resize', this.updateScrollbar);
		if (isEngine(editor) && !isMobile) {
			editor.scrollNode?.on('scroll', this.updateScrollbar, {
				passive: true,
			});
		}
	}

	didRender() {
		super.didRender();
		const editor = this.editor;
		editor.on('undo', this.doChange);
		editor.on('redo', this.doChange);
		this.viewport = isEngine(editor)
			? this.wrapper?.find(Template.VIEWPORT)
			: this.wrapper?.find(Template.VIEWPORT_READER);

		this.selection.init();
		this.conltrollBar.init();
		this.command.init();
		if (!isEngine(editor) || editor.readonly)
			this.toolbarModel?.setOffset([0, 0]);
		else this.toolbarModel?.setOffset([13, -28, 0, -6]);
		const tablePlugin = editor.plugin.findPlugin<TableOptions>('table');
		const tableOptions = tablePlugin?.options.overflow || {};
		if (this.viewport) {
			this.selection.refreshModel();
			setTimeout(() => {
				this.initScrollbar();
			}, 0);
		}
		this.selection.on('select', () => {
			this.conltrollBar.refresh(false);
			if (!isEngine(editor)) return;
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
			editor.trigger('editor:resize');
			this.updateScrollbar();
		});
		this.command.on('actioned', (action, silence) => {
			if (action === 'paste') {
				editor.card.render(this.wrapper);
			}
			if (['splitCell', 'mergeCell'].includes(action)) {
				editor.trigger('editor:resize');
			}
			this.selection.render(action);
			this.toolbarModel?.update();
			if (!silence) {
				this.onChange();
			}
			if (tableOptions.maxRightWidth)
				this.overflow(tableOptions.maxRightWidth());
			this.scrollbar?.refresh();
		});

		const tableRoot = this.wrapper?.find(Template.TABLE_CLASS);
		if (!tableRoot) return;
		const value = super.getValue();
		if (!value?.html) {
			const tableValue = this.getValue();
			if (tableValue && isEngine(editor)) this.setValue(tableValue);
			this.onChange();
		}
		if (tableOptions.maxRightWidth)
			this.overflow(tableOptions.maxRightWidth());
	}
	private remoteRefreshTimeout: NodeJS.Timeout | null = null;

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
				).find(Template.COLS_HEADER_ITEM_CLASS),
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
			const width =
				colElement.attributes('width') || colElement.css('width');
			colItems
				.eq(index)
				?.css(
					'width',
					`${Math.max(parseInt(width), this.colMinWidth)}px`,
				);
		});

		const rowsHeader = this.wrapper.find(Template.ROWS_HEADER_CLASS);
		let rowItems = rowsHeader.find(Template.ROWS_HEADER_ITEM_CLASS);
		const rowCount = rowItems.length;
		if (superValue.rows > rowCount) {
			rowsHeader.append(
				$(
					this.template.renderRowsHeader(superValue.rows - rowCount),
				).find(Template.ROWS_HEADER_ITEM_CLASS),
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
					Math.max(
						parseInt(rowElement.css('width')),
						this.rowMinHeight,
					),
				);
		});
		// this.conltrollBar.refresh();
		this.scrollbar?.refresh();
		if (this.remoteRefreshTimeout) clearTimeout(this.remoteRefreshTimeout);
		this.remoteRefreshTimeout = setTimeout(() => {
			// 找到所有可编辑节点，对没有 contenteditable 属性的节点添加contenteditable一下
			this.wrapper?.find(EDITABLE_SELECTOR).each((editableNode) => {
				const editableElement = editableNode as Element;
				if (!editableElement.hasAttribute(DATA_CONTENTEDITABLE_KEY)) {
					editableElement.setAttribute(
						DATA_CONTENTEDITABLE_KEY,
						this.template.isReadonly ? 'false' : 'true',
					);
				}
			});
		}, 10);
	}

	render() {
		const editor = this.editor;
		this.template.isReadonly = !isEngine(editor) || editor.readonly;
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
		this.wrapper = isEngine(editor)
			? $(
					this.template.htmlEdit(
						value,
						menuData(editor.language.get('table')),
					),
			  )
			: $(this.template.htmlView(value));
		if (!isEngine(editor)) {
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
		const editor = this.editor;
		window.removeEventListener('scroll', this.updateScrollbar);
		window.removeEventListener('resize', this.updateScrollbar);
		editor.scrollNode?.off('scroll', this.updateScrollbar);
		this.scrollbar?.destroy();
		this.command.removeAllListeners();
		const selection = this.selection;
		selection.removeAllListeners();
		selection.destroy();
		const bar = this.conltrollBar;
		bar.removeAllListeners();
		bar.destroy();
		editor.off('undo', this.doChange);
		editor.off('redo', this.doChange);
	}
}

export default TableComponent;

export { Template, Helper };
