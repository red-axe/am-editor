import {
	$,
	CardEntry,
	DATA_TRANSIENT_ATTRIBUTES,
	isEngine,
	MarkPlugin,
	NodeInterface,
	Parser,
	Range,
	RangeInterface,
	SchemaGlobal,
	SchemaMark,
	Selection,
	PluginOptions,
	uuid,
	EDITABLE_SELECTOR,
	CARD_SELECTOR,
	transformCustomTags,
	isView,
	View,
	EditorInterface,
	CardInterface,
} from '@aomao/engine';
import { Path } from 'sharedb';

export interface MarkRangeOptions extends PluginOptions {
	keys: Array<string>;
	hotkey?: string | Array<string>;
}

const PLUGIN_NAME = 'mark-range';

export default class<
	T extends MarkRangeOptions = MarkRangeOptions,
> extends MarkPlugin<T> {
	private range?: RangeInterface;
	private executeBySelf: boolean = false;
	private MARK_KEY = `data-mark-key`;
	private MARK_UUID = `data-mark-uuid`;
	private ids: { [key: string]: Array<string> } = {};
	private m_uuid = uuid(18, 24);

	readonly followStyle: boolean = false;

	readonly copyOnEnter: boolean = false;

	#isRevoke: boolean = false;
	#isPreview: boolean = false;
	#isApply: boolean = false;
	#isCreateting: boolean = false;
	#previewAwating?: (value: boolean) => void;

	static get pluginName() {
		return PLUGIN_NAME;
	}

	tagName = 'span';

	combineValueByWrap = true;

	getIdName(key: string) {
		return `data-${key}-id`;
	}

	getPreviewName(key: string) {
		return `data-${key}-preview`;
	}

	init() {
		super.init();
		const globals: Array<SchemaGlobal> = [];
		const optionKeys = this.options?.keys || [];
		optionKeys.forEach((key) => {
			globals.push({
				type: 'mark',
				attributes: {
					[this.getIdName(key)]: '*',
					[this.MARK_KEY]: key,
				},
			});
		});
		const editor = this.editor;
		editor.schema.add(globals);
		editor.on('beforeCommandExecute', this.onBeforeCommandExecute);
		editor.on('afterCommandExecute', this.onAfterCommandExecute);

		if (isEngine(editor)) {
			editor.on('change', this.onChange);
			editor.on('select', this.onSelectionChange);
			editor.on('parse:value', this.parseValue);
			editor.on('afterSetValue', this.onAfterSetValue);
			const keys = optionKeys.map((key) => this.getPreviewName(key));
			editor.history.onFilter((op) => {
				if (
					('od' in op || 'oi' in op) &&
					keys.includes(op.p[op.p.length - 1].toString())
				) {
					return true;
				}
				return false;
			});
			editor.history.onSelf(() => {
				if (this.#isPreview && !this.#previewAwating) {
					return new Promise<boolean>((resolve) => {
						this.#previewAwating = resolve;
						this.#isPreview = false;
					});
				} else if (this.#isRevoke && this.#previewAwating) {
					this.#previewAwating(false);
				} else if (this.#isApply && this.#previewAwating) {
					this.#previewAwating(true);
				}
				return;
			});
		} else if (isView(editor)) {
			editor.container.document?.addEventListener(
				'selectionchange',
				this.onSelectionChange,
			);
		}
	}

	onBeforeCommandExecute = (name: string) => {
		this.executeBySelf = name === PLUGIN_NAME;
	};

	onAfterCommandExecute = (name: string) => {
		this.executeBySelf = false;
	};

	onChange = (trigger: 'local' | 'remote') => {
		this.triggerChange(trigger !== 'local');
	};

	parseValue = (node: NodeInterface, atts: Record<string, string>) => {
		const key = node.attributes(this.MARK_KEY);
		if (!!key) {
			atts[DATA_TRANSIENT_ATTRIBUTES] = this.getPreviewName(key);
		}
	};

	onAfterSetValue = () => {
		const editor = this.editor;
		if (!isEngine(editor)) return;
		this.range = editor.change.range.get();
		this.ids = this.getIds();
	};

	schema() {
		const rules: Array<SchemaMark> = (this.options?.keys || []).map(
			(key) => {
				return {
					name: 'span',
					type: 'mark',
					attributes: {
						[this.MARK_KEY]: {
							required: true,
							value: key,
						},
						[this.MARK_UUID]: '*',
						[this.getIdName(key)]: '*',
					},
				};
			},
		);
		return rules;
	}
	/**
	 * 获取当前选择的标记id
	 * @param range 光标
	 * @param strict 是否严格模式
	 * @returns
	 */
	getSelectInfo(range: RangeInterface, strict?: boolean) {
		const editor = this.editor;
		const { card } = editor;
		const cloneRange = range
			.cloneRange()
			.shrinkToElementNode()
			.shrinkToTextNode();
		const { startNode, startOffset, endNode, endOffset, collapsed } =
			cloneRange;
		let startMark = startNode.closest(`[${this.MARK_KEY}]`);
		const startChild = startNode.isElement()
			? startNode.children().eq(startOffset)
			: startNode;
		let component: CardInterface | undefined;
		//如果选择是块级卡片就选择在卡片根节点
		if (startNode.type === Node.ELEMENT_NODE && startChild?.isBlockCard()) {
			startMark = startChild;
		} else {
			component = card.find(
				startMark.length == 0 && startChild ? startChild : startMark,
			);
			if (component?.queryMarks) {
				const cardMark = component
					.queryMarks(false)
					.find((mark) => !!mark.attributes(this.MARK_KEY));
				if (cardMark) startMark = cardMark;
			} else if (
				component &&
				!component.isEditable &&
				component.root.isBlockCard()
			) {
				startMark = component.root;
			}
		}
		let key = startMark.attributes(this.MARK_KEY);
		//获取节点标记ID
		const startId = startMark.attributes(this.getIdName(key));
		//设置当前选中的标记ID
		let selectId: string | undefined = !!startId ? startId : undefined;

		//不是重合状态，并且开始节点不是块级卡片
		if (
			!collapsed &&
			!!startId &&
			!startMark.isBlockCard() &&
			!component?.queryMarks
		) {
			let endMark = endNode.closest(`[${this.MARK_KEY}]`);
			const endKey = endMark.attributes(this.MARK_KEY);
			const endChild = endNode.children().eq(endOffset);
			//如果选择是块级卡片就选择在卡片根节点
			if (endNode.type === Node.ELEMENT_NODE && endChild?.isBlockCard()) {
				endMark = endChild;
			}
			const endId = endMark.attributes(this.getIdName(key));
			//需要两端都是同一类型同一个id才需要显示
			if (key === endKey && startId === endId) {
				selectId = startId;
				//严格模式，开始节点和结束节点需要在节点内的两侧
				if (strict) {
					const strictRange = Range.from(editor)?.cloneRange();
					strictRange?.setStart(startMark, 0);
					strictRange?.setEnd(
						endMark,
						endMark.isText()
							? endMark.text().length
							: endMark.get<Node>()?.childNodes.length ?? 0,
					);
					if (
						!strictRange
							?.shrinkToElementNode()
							.shrinkToTextNode()
							?.equal(cloneRange)
					)
						selectId = undefined;
				}
			} else selectId = undefined;
		}
		return selectId
			? {
					key,
					id: selectId.split(',')[0],
			  }
			: undefined;
	}
	/**
	 * 根据编号获取所有节点
	 * @param key 标记类型
	 * @param id 编号
	 * @returns
	 */
	findElements(key: string, id: string) {
		const { container } = this.editor;
		const elements: Array<NodeInterface> = [];
		container.find(`[${this.getIdName(key)}]`).each((markNode) => {
			const mark = $(markNode);
			const ids = mark.attributes(this.getIdName(key)).trim().split(',');
			if (ids.indexOf(id) > -1) elements.push(mark);
		});
		return elements;
	}
	/**
	 * 预览
	 * @param id 标记id，否则预览当前光标位置
	 */
	preview(key: string, id?: string) {
		const editor = this.editor;
		if (id) {
			const elements = this.findElements(key, id);
			elements.forEach((markNode) => {
				markNode.attributes(
					DATA_TRANSIENT_ATTRIBUTES,
					this.getPreviewName(key),
				);
				markNode.attributes(this.getPreviewName(key), 'true');
			});
		} else if (this.range) {
			this.startMutation();
			const { block, node, card } = editor;
			let range = this.range;
			//光标重合时，选择整个block块
			if (range.collapsed) {
				const blockNode = block.closest(range.startNode);
				if (!node.isBlock(blockNode)) return;
				range.select(blockNode, true);
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range.toRange());
			}
			const selectInfo = this.getSelectInfo(range, true);
			//当前光标已存在标记
			if (selectInfo && selectInfo.key === key) {
				//触发选择
				editor.trigger(`${PLUGIN_NAME}:select`, range, selectInfo);
				return;
			}
			//包裹标记预览样式
			editor.mark.wrap(
				`<${this.tagName} ${
					this.MARK_KEY
				}="${key}" ${DATA_TRANSIENT_ATTRIBUTES}="${this.getPreviewName(
					key,
				)}" ${this.MARK_UUID}="${this.m_uuid}" ${this.getPreviewName(
					key,
				)}="true" />`,
				range,
			);
			//遍历当前光标选择节点，拼接选择的文本
			let text = '';
			const subRanges = range.getSubRanges(true, false);
			subRanges.forEach((subRange) => {
				//如果是卡片，就给卡片加上预览样式
				const cardComponent = card.find(subRange.startNode);
				if (cardComponent && !cardComponent.executeMark) {
					text += `[card:${
						(cardComponent.constructor as CardEntry).cardName
					},${cardComponent.id}]`;
					if (cardComponent.root.attributes(this.getIdName(key)))
						return;
					cardComponent.root.attributes(this.MARK_KEY, key);
					cardComponent.root.attributes(
						this.getPreviewName(key),
						'true',
					);
				} else {
					text += subRange.getText();
				}
			});
			this.#isCreateting = true;
			this.#isPreview = true;
			return text;
		}
		return;
	}

	/**
	 * 应用标记样式到编辑器
	 * @param 标记类型
	 * @param id
	 */
	apply(key: string, id: string) {
		const editor = this.editor;
		//遍历预览节点
		editor.container
			.find(`[${this.getPreviewName(key)}]`)
			.each((markNode) => {
				const mark = $(markNode);
				//获取旧id
				const oldIds = mark
					.attributes(this.getIdName(key))
					.trim()
					.split(',');
				//组合新的id串
				let ids: Array<string> = [];
				if (oldIds[0] === '') oldIds.splice(0, 1);
				//范围大的id放在后面
				if (oldIds.length > 0) {
					for (let i = 0; i < oldIds.length; i++) {
						const oldId = oldIds[i];
						//判断之前旧的id对应光标位置是否包含当前节点
						const parent = markNode.parentElement;
						if (
							parent &&
							oldIds.indexOf(id) < 0 &&
							ids.indexOf(id) < 0
						) {
							const elements = this.findElements(key, oldId);
							const oldRange = Range.from(editor)?.cloneRange();
							if (!oldRange || elements.length === 0) continue;
							const oldBegin = oldRange
								.select(elements[0], true)
								.collapse(true)
								.cloneRange();
							const oldEnd = oldRange
								.select(elements[elements.length - 1], true)
								.collapse(false)
								.cloneRange();
							oldRange.setStart(
								oldBegin.startContainer,
								oldBegin.startOffset,
							);
							oldRange.setEnd(
								oldEnd.endContainer,
								oldEnd.endOffset,
							);
							const reuslt = oldRange.comparePoint(
								parent,
								mark.index(),
							);
							if (reuslt >= 0) {
								ids.push(id);
								ids = ids.concat(oldIds.slice(i));
								break;
							}
						}
						ids.push(oldId);
					}
					//未增加就驾到末尾
					if (
						ids.length === oldIds.length &&
						oldIds.indexOf(id) < 0
					) {
						ids.push(id);
					}
				} else {
					ids.push(id);
				}
				mark.attributes(
					DATA_TRANSIENT_ATTRIBUTES,
					this.getPreviewName(key),
				);
				//设置新的id串
				mark.attributes(this.getIdName(key), ids.join(','));
				mark.removeAttributes(this.getPreviewName(key));
				const editableCard = mark.closest(EDITABLE_SELECTOR);
				if (editableCard.length > 0) {
					const cardComponent = editor.card.find(editableCard, true);
					if (cardComponent && cardComponent.onChange)
						cardComponent.onChange('local', cardComponent.root);
				}
				const cardComponent = editor.card.find(mark);
				if (cardComponent && cardComponent.executeMark) {
					cardComponent.executeMark(mark.clone(), true);
				}
			});
		this.#isApply = true;
		this.#isCreateting = false;
	}
	/**
	 * 遗弃预览项
	 * @param key 标记类型
	 * @param id 编号，不传编号则遗弃所有预览项
	 */
	revoke(key: string, id?: string) {
		const editor = this.editor;
		const { node } = editor;
		let elements: Array<NodeInterface | Node> = [];
		if (id) elements = this.findElements(key, id);
		else
			elements = editor.container
				.find(`[${this.getPreviewName(key)}]`)
				.toArray();
		//遍历预览节点
		const mergeMarks: NodeInterface[] = [];
		elements.forEach((markNode) => {
			const mark = $(markNode);
			//获取旧id传
			const oldIds = mark
				.attributes(this.getIdName(key))
				.trim()
				.split(',');
			if (oldIds[0] === '') oldIds.splice(0, 1);
			//如果没有id，移除标记样式包裹
			if (oldIds.length === 0) {
				if (mark.isCard()) {
					mark.removeAttributes(this.MARK_KEY);
					mark.removeAttributes(this.getPreviewName(key));
				} else {
					node.unwrap(mark);
				}
			} else {
				//移除预览样式
				mark.removeAttributes(this.getPreviewName(key));
				mergeMarks.push(mark);
			}
		});
		if (!id && elements.length > 0 && isEngine(editor)) {
			this.#isRevoke = true;
			this.#isCreateting = false;
			if (mergeMarks.length > 0) {
				// 合并
				editor.mark.mergeMarks(mergeMarks);
			}
		}
	}
	/**
	 * 移除标识
	 * @param key 标记类型
	 * @param id 编号
	 */
	remove(key: string, id: string) {
		const editor = this.editor;
		const { node } = editor;

		const elements: Array<NodeInterface | Node> = this.findElements(
			key,
			id,
		);

		//遍历节点
		elements.forEach((markNode) => {
			const mark = $(markNode);
			//获取旧id传
			const oldIds = mark
				.attributes(this.getIdName(key))
				.trim()
				.split(',');
			if (oldIds[0] === '') oldIds.splice(0, 1);
			//移除标记样式包裹
			const editableCard = mark.closest(EDITABLE_SELECTOR);
			if (oldIds.length === 1 && !!oldIds.find((i) => i === id)) {
				if (mark.isCard()) {
					mark.removeAttributes(this.MARK_KEY);
					mark.removeAttributes(this.getIdName(key));
					mark.removeAttributes(this.getPreviewName(key));
				} else {
					node.unwrap(mark);
				}
			} else {
				//移除预览样式
				mark.removeAttributes(this.getPreviewName(key));
				//移除id
				const index = oldIds.findIndex((i) => i === id);
				oldIds.splice(index, 1);
				mark.attributes(this.getIdName(key), oldIds.join(','));
			}
			if (editableCard.length > 0) {
				const cardComponent = editor.card.find(editableCard, true);
				if (cardComponent && cardComponent.onChange)
					cardComponent.onChange('local', cardComponent.root);
			}
		});
	}

	hotkey() {
		return this.options.hotkey || '';
	}

	execute() {}

	startMutation() {
		const editor = this.editor;
		if (isEngine(editor) && editor.ot.isStopped()) {
			editor.ot.startMutation();
		}
	}

	stopMutation() {
		const editor = this.editor;
		setTimeout(() => {
			if (isEngine(editor) && editor.readonly && !editor.ot.isStopped()) {
				editor.ot.stopMutation();
			}
		}, 10);
	}

	action(key: string, action: string, ...args: any): any {
		const id = args[0];
		switch (action) {
			case 'preview':
				const reuslt = this.preview(key, id);
				return reuslt;
			case 'apply':
				if (!id) return;
				this.apply(key, id);
				this.stopMutation();
				break;
			case 'revoke':
				this.revoke(key, id);
				this.stopMutation();
				break;
			case 'find':
				if (!id) return [];
				return this.findElements(key, id);
			case 'remove':
				if (!id) return;
				this.remove(key, id);
				this.stopMutation();
				break;
			case 'filter':
				return this.filterValue(key, id);
			case 'wrap':
				const value = args[1];
				return this.wrapFromPath(key, id, value);
		}
	}

	getIds() {
		const ids: { [key: string]: Array<string> } = {};
		this.editor.container.find(`[${this.MARK_KEY}]`).each((markNode) => {
			const mark = $(markNode);
			const key = mark.attributes(this.MARK_KEY);
			const idArray = mark.attributes(this.getIdName(key)).split(',');
			idArray.forEach((id) => {
				if (!!id) {
					if (!ids[key]) ids[key] = [];
					if (ids[key].indexOf(id) < 0) ids[key].push(id);
				}
			});
		});
		return ids;
	}

	/**
	 * 光标选择改变触发
	 * @returns
	 */
	onSelectionChange = () => {
		if (this.executeBySelf) return;
		const editor = this.editor;
		const { window } = editor.container;
		const selection = window?.getSelection();

		if (!selection) return;
		const range = Range.from(editor, selection);
		if (!range) return;

		//不在编辑器内
		if (
			!$(range.getStartOffsetNode()).inEditor(editor.container) ||
			!$(range.getEndOffsetNode()).inEditor(editor.container)
		) {
			editor.trigger(`${PLUGIN_NAME}:select`, range);
			this.range = undefined;
			return;
		}

		this.triggerChange();

		const keys = this.options.keys;
		for (let k = 0; k < keys.length; k++) {
			const key = keys[k];
			const name = this.getPreviewName(key);
			const { startNode, endNode, commonAncestorNode } = range;
			const parent = commonAncestorNode.parent();
			if (
				this.#isCreateting &&
				(startNode.attributes(name) ||
					endNode.attributes(name) ||
					commonAncestorNode.attributes(name) ||
					!range.commonAncestorNode.inEditor() ||
					parent?.attributes(name))
			) {
				this.range = range;
				return;
			}
		}
		const selectInfo = this.getSelectInfo(range, true);
		editor.trigger(`${PLUGIN_NAME}:select`, range, selectInfo);
		this.range = range;
	};

	triggerChange(remote: boolean = false) {
		const editor = this.editor;
		const addIds: { [key: string]: Array<string> } = {};
		const removeIds: { [key: string]: Array<string> } = {};
		const ids = this.getIds();

		this.options.keys.forEach((key) => {
			const prevIds = this.ids[key] || [];
			const curIds = ids[key] || [];
			curIds.forEach((id) => {
				if (prevIds.indexOf(id) < 0) {
					if (!addIds[key]) addIds[key] = [];
					addIds[key].push(id);
				}
			});
			prevIds.forEach((id) => {
				if (curIds.indexOf(id) < 0) {
					if (!removeIds[key]) removeIds[key] = [];
					removeIds[key].push(id);
				}
			});
		});
		if (remote) {
			const currentElements = editor.container.find(
				`[${this.MARK_UUID}="${this.m_uuid}"]`,
			);
			currentElements.each((_, index) => {
				const child = currentElements.eq(index);
				const attributes = child?.attributes() || {};
				const key = attributes[this.MARK_KEY];
				// 如果这个元素没有被标记，并且没有创建、没有预览选项就增加预览样式
				const previewName = this.getPreviewName(key);
				if (
					key &&
					!attributes[this.getIdName(key)] &&
					!attributes[previewName]
				) {
					child!.attributes(previewName, 'true');
				}
			});
		}
		this.ids = ids;
		editor.trigger(`${PLUGIN_NAME}:change`, addIds, removeIds, ids);
	}

	/**
	 * 过滤标记样式，并返回每个样式的路径
	 * @param value 编辑器值
	 * @returns 过滤后的值和路径
	 */
	filterValue(
		key: string,
		value?: string,
	): {
		value: string;
		paths: Array<{ id: Array<string>; path: Array<Path> }>;
	} {
		const curEditor = this.editor;
		const container = curEditor.container.clone(value ? false : true);
		container.css({
			position: 'fixed',
			top: '-999px',
			width: curEditor.container.css('width') || '100%',
			clip: 'rect(0, 0, 0, 0)',
		});
		$(document.body).append(container);

		const editor: EditorInterface = new View(container, curEditor.options);

		const { node, card } = editor;
		if (value) container.html(transformCustomTags(value));
		card.render(container, undefined, false);
		const selection = container.window?.getSelection();
		const range = (
			selection
				? Range.from(editor, selection) || Range.create(editor)
				: Range.create(editor)
		).cloneRange();

		const parser = new Parser(container, editor, undefined, false);
		const { schema, conversion } = editor;
		if (!range) {
			container.remove();
			return {
				value: value ? value : parser.toValue(schema, conversion),
				paths: [],
			};
		}
		range.select(container, true).collapse(true);

		const paths: Array<{ id: Array<string>; path: Array<Path> }> = [];
		container.traverse(
			(childNode) => {
				const id = childNode.attributes(this.getIdName(key));
				if (!!id) {
					const rangeClone = range.cloneRange();

					if (childNode.isCard()) {
						const cardComponent = card.find(childNode);
						if (cardComponent && cardComponent.executeMark) {
							const idName = this.getIdName(key);
							const markNode = cardComponent.root.find(
								`[${idName}="${id}"]`,
							);
							cardComponent.executeMark(markNode.clone(), false);
						} else {
							childNode.removeAttributes(this.getIdName(key));
						}
						rangeClone.select(childNode);
					} else {
						rangeClone.select(childNode, true);
						const selection = rangeClone.createSelection();
						node.unwrap(childNode);
						selection.move();
					}
					const rangePath = rangeClone
						.shrinkToElementNode()
						.shrinkToTextNode()
						.toPath(undefined, container);
					paths.unshift({
						id: id.split(','),
						path: rangePath
							? [rangePath.start.path, rangePath.end.path]
							: [],
					});
				}
			},
			false,
			'editable',
		);
		const cardNodes = container.find(CARD_SELECTOR);
		cardNodes.each((_, index) => {
			const cardNode = cardNodes.eq(index);
			if (cardNode?.isEditableCard()) {
				const card = editor.card.find(cardNode);
				if (card) {
					const value = card.getValue();
					card.setValue(value || {});
				}
			}
		});
		value = parser.toValue(schema, conversion);
		editor.destroy();
		container.remove();
		return {
			value,
			paths,
		};
	}
	/**
	 * 从标记样式路径还原包裹编辑器值
	 * @param paths 标记样式路径
	 * @param value 编辑器值
	 * @returns
	 */
	wrapFromPath(
		key: string,
		paths: Array<{ id: Array<string>; path: Array<Path> }>,
		value?: string,
	): string {
		const curEditor = this.editor;
		const container = curEditor.container.clone(value ? false : true);
		if (value) value = Selection.removeTags(value);
		container.css({
			position: 'fixed',
			top: '-999px',
			width: curEditor.container.css('width') || '100%',
			clip: 'rect(0, 0, 0, 0)',
		});
		$(document.body).append(container);
		const editor: EditorInterface = new View(container, curEditor.options);
		const { card } = editor;
		if (value) container.html(transformCustomTags(value));
		card.render(container, undefined, false);
		const selection = container.window?.getSelection();
		const range = (
			selection
				? Range.from(editor, selection) || Range.create(editor)
				: Range.create(editor)
		).cloneRange();

		const parser = new Parser(container, editor, undefined, false);
		const { schema, conversion } = editor;
		if (!range) {
			container.remove();
			return value ? value : parser.toValue(schema, conversion);
		}

		range.select(container, true).collapse(true);

		(paths || []).forEach(({ id, path }) => {
			const pathRange = Range.fromPath(
				editor,
				{
					start: { path: path[0] as number[], id: '', bi: -1 },
					end: { path: path[1] as number[], id: '', bi: -1 },
				},
				undefined,
				container,
			);
			const elements = pathRange.findElements();
			elements.forEach((element) => {
				const node = $(element);
				if (node.isCard()) {
					const cardComponent = card.find(node);
					if (cardComponent && cardComponent.executeMark) {
						cardComponent.executeMark(
							$(
								`<${this.tagName} ${
									this.MARK_KEY
								}="${key}" ${this.getIdName(key)}="${id.join(
									',',
								)}" />`,
							),
							true,
						);
					} else {
						node.attributes(this.getIdName(key), id.join(','));
					}
				}
			});
			editor.mark.wrap(
				`<${this.tagName} ${this.MARK_KEY}="${key}" ${this.getIdName(
					key,
				)}="${id.join(',')}" />`,
				pathRange,
			);
		});
		const cardNodes = container.find(CARD_SELECTOR);
		cardNodes.each((_, index) => {
			const cardNode = cardNodes.eq(index);
			if (cardNode?.isEditableCard()) {
				const card = editor.card.find(cardNode);
				if (card) {
					const value = card.getValue();
					card.setValue(value || {});
				}
			}
		});
		value = parser.toValue(schema, conversion);
		editor.destroy();
		container.remove();
		return value;
	}

	destroy() {
		const editor = this.editor;
		editor.off('beforeCommandExecute', this.onBeforeCommandExecute);
		editor.off('afterCommandExecute', this.onAfterCommandExecute);

		if (isEngine(editor)) {
			editor.off('change', this.onChange);
			editor.off('select', this.onSelectionChange);
			editor.off('parse:value', this.parseValue);
			editor.off('afterSetValue', this.onAfterSetValue);
		} else if (isView(editor)) {
			editor.container.document?.removeEventListener(
				'selectionchange',
				this.onSelectionChange,
			);
		}
	}
}
