import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import findLastIndex from 'lodash/findLastIndex';
import { decodeCardValue, getDocument, random } from './utils';
import { EngineInterface } from './types/engine';
import { HirtoryOperation, HistoryInterface } from './types/history';
import { $ } from './node';
import { CARD_VALUE_KEY, DATA_ID, EDITABLE_SELECTOR } from './constants';
import { isTransientElementCache, Operation } from './model';
import { RangePath } from './types';

const setRangeByPath = (
	engine: EngineInterface,
	path: { start: RangePath; end: RangePath },
) => {
	if (path) {
		let { start, end } = path;
		if (start && end) {
			const beginOffset = start.path[start.path.length - 1] as number;
			const endOffset = end.path[end.path.length - 1] as number;
			const startClone = start.path.slice();
			const endClone = end.path.slice();
			startClone.pop();
			endClone.pop();
			const { container, change } = engine;
			const startChild = container.getChildByPath(
						startClone,
						(child) => !isTransientElementCache($(child)),
				  );
			if (!startChild) return;
			const endChild = container.getChildByPath(
						endClone,
						(child) => !isTransientElementCache($(child)),
				  );
			if (!endChild) return;
			const getMaxOffset = (node: Node, offset: number) => {
				if (node.nodeType === getDocument().TEXT_NODE) {
					const text = node.textContent || '';
					return text.length < offset ? text.length : offset;
				} else {
					const childNodes = node.childNodes;
					return childNodes.length < offset
						? childNodes.length
						: offset;
				}
			};
			try {
				const range = change.range.get();
				if (
					startChild.nodeName === 'BR' ||
					engine.node.isVoid(startChild)
				) {
					range.select(startChild).collapse(false);
				} else {
					range.setStart(
						startChild,
						getMaxOffset(startChild, beginOffset),
					);
					range.setEnd(endChild, getMaxOffset(endChild, endOffset));
				}
				if (!range.collapsed) {
					const startCard = engine.card.find(range.startNode, true);
					const endCard = engine.card.find(range.endNode, true);
					if (
						startCard &&
						endCard &&
						startCard?.root.equal(endCard.root)
					) {
						let startEditableElement =
							range.startNode.closest(EDITABLE_SELECTOR);
						if (startEditableElement.length === 0)
							startEditableElement =
								range.startNode.find(EDITABLE_SELECTOR);
						let endEditableElement =
							range.endNode.closest(EDITABLE_SELECTOR);
						if (endEditableElement.length === 0)
							endEditableElement =
								range.endNode.find(EDITABLE_SELECTOR);
						if (
							startEditableElement.length > 0 &&
							endEditableElement.length > 0 &&
							!startEditableElement.equal(endEditableElement)
						) {
							range.collapse(true);
						}
					}
				}

				change.range.select(range);
				range.scrollRangeIntoView();
			} catch (error: any) {
				engine.messageError('history setRangeByPath', error);
			}
		}
	}
};

/**
 * 历史记录管理器
 */
class HistoryModel implements HistoryInterface {
	// 所有操作片段
	private actionOps: HirtoryOperation[] = [];
	// 引擎实例
	private engine: EngineInterface;
	// 当前还未保存的所有操作
	private currentAction: HirtoryOperation = { ops: [] };
	// 当前操作的索引
	private currentActionIndex: number = 0;
	// 监听的所有过滤事件
	private filterEvents: ((op: Operation) => boolean)[] = [];
	// 监听的所有收集本地操作的事件
	private selfEvents: ((
		ops: Operation[],
	) => Promise<boolean> | boolean | undefined)[] = [];
	// 等待监听收集本地操作的回调
	#selfWaiting?: Promise<boolean>;

	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	resetCurrentAction() {
		this.currentAction = { ops: [] };
	}

	/**
	 * 懒保存当前操作
	 */
	lazySave = debounce(() => {
		this.saveOp();
	}, 200);

	/**
	 * 重置所有操作
	 */
	reset() {
		this.actionOps = [];
		this.currentActionIndex = 0;
	}

	/**
	 * 监听过滤事件
	 * @param filter 事件
	 */
	onFilter(filter: (op: Operation) => boolean) {
		this.filterEvents.push(filter);
	}

	/**
	 * 监听收集本地操作事件
	 * @param event 事件
	 */
	onSelf(
		event: (ops: Operation[]) => Promise<boolean> | boolean | undefined,
	) {
		this.selfEvents.push(event);
	}

	/**
	 * 是否有撤销操作
	 * @returns boolean
	 */
	hasUndo() {
		return !!this.getUndoOp();
	}

	/**
	 * 是否有重做操作
	 * @returns boolean
	 */
	hasRedo() {
		return !!this.getRedoOp();
	}

	/**
	 * 执行撤销操作
	 */
	undo() {
		this.saveOp();
		const undoOp = this.getUndoOp();
		if (undoOp) {
			let isUndo = false;
			const engine = this.engine;
			const change = engine.change;
			const model = engine.model;
			model.mutation.stop();
			try {
				model.emitChange(undoOp.ops);
				model.apply(undoOp.ops);
				this.currentActionIndex--;
				isUndo = true;
			} catch (error: any) {
				this.reset();
				engine.messageError('history-undo', error);
			}
			if (engine.isEmpty()) change.initValue();

			if (isUndo) {
				//清除操作前记录的range
				change.getRangePathBeforeCommand();
				if (undoOp.startRangePath)
					setRangeByPath(engine, undoOp.startRangePath);
				change.change();
				engine.trigger('undo');
			}
			Promise.resolve().then(() => {
				model.mutation.start();
			});
		}
	}

	/**
	 * 执行重做操作
	 */
	redo() {
		this.saveOp();
		const redoOp = this.getRedoOp();
		if (redoOp) {
			let isRedo = false;
			const engine = this.engine;
			const change = engine.change;
			const model = engine.model;
			try {
				model.mutation.stop();
				model.emitChange(redoOp.ops);
				model.apply(redoOp.ops);

				this.currentActionIndex++;
				isRedo = true;
			} catch (error: any) {
				this.reset();
				engine.messageError('history-redo', error);
			}

			if (isRedo) {
				// 清除操作前记录的range
				change.getRangePathBeforeCommand();
				if (redoOp.rangePath)
					setRangeByPath(this.engine, redoOp.rangePath);
				change.change();
				engine.trigger('redo');
			}
			Promise.resolve().then(() => {
				model.mutation.start();
			});
		}
	}

	/**
	 * 清空所有历史操作
	 */
	clear() {
		setTimeout(() => {
			this.reset();
		}, 10);
	}

	saveOp() {
		if (
			this.currentAction &&
			this.currentAction.ops &&
			this.currentAction.ops.length > 0
		) {
			if (this.currentAction.self) {
				this.currentAction.rangePath = this.getCurrentRangePath();
				this.currentAction.id = random(8);
				this.actionOps.splice(this.currentActionIndex);
				this.actionOps.push(this.currentAction);
				this.currentActionIndex = this.actionOps.length;
				this.engine.trigger('historyChange');
			}
			this.resetCurrentAction();
			// 保存成功后清除操作前记录的range
			this.engine.change.getRangePathBeforeCommand();
		}
	}

	handleSelfOps(ops: Operation[]) {
		if (!this.currentAction?.self) this.saveOp();
		let isSave = false;
		ops.forEach((op) => {
			isSave = true;
			if (this.filterEvents.some((filter) => filter(op))) {
				if (this.actionOps.length > 0 && !op.undoable)
					this.actionOps[this.actionOps.length - 1].ops?.push(op);
			} else {
				this.currentAction.self = true;
				if (!this.currentAction.ops) this.currentAction.ops = [];

				if (!this.currentAction.startRangePath) {
					this.currentAction.startRangePath =
						this.getRangePathBeforeCommand();
				}
				const lastOp =
					this.currentAction.ops[this.currentAction.ops.length - 1];
				if (lastOp && Operation.isReverse(op, lastOp)) {
					this.currentAction.ops.pop();
				} else {
					this.currentAction.ops.push(op);
				}
			}
		});
		// 监听收集
		if (isSave) {
			let callback: undefined | Promise<boolean> | boolean = undefined;
			this.selfEvents.some((event) => {
				callback = event(ops);
				return callback !== undefined;
			});
			// 还有等待处理的
			if (this.#selfWaiting) return;
			if (typeof callback === 'boolean') {
				if (callback) this.saveOp();
				else {
					this.resetCurrentAction();
				}
			} else if (typeof callback === 'object') {
				this.#selfWaiting = callback;
				(callback as Promise<boolean>)
					.then((s) => {
						if (s) {
							this.saveOp();
						} else {
							this.resetCurrentAction();
						}
					})
					.finally(() => (this.#selfWaiting = undefined));
			} else if (callback === undefined) {
				this.lazySave();
			}
		}
	}

	handleNLCardValue(op: Operation) {
		if (op.undoable === true && op.type === 'set_node') {
			const { newProperties } = op;
			const value = newProperties[CARD_VALUE_KEY];
			if (!value) return;
			const newValue = decodeCardValue(value);
			this.actionOps.forEach((action) => {
				action.ops.forEach((op) => {
					if (op.type === 'set_node') {
						const { newProperties } = op;
						const value = newProperties[CARD_VALUE_KEY];
						const oldValue = decodeCardValue(value);
						if (newValue.id === oldValue.id) {
							newProperties[CARD_VALUE_KEY] = newValue;
						}
					} else if (op.type === 'insert_node') {
						const { node } = op;
						const value = node[CARD_VALUE_KEY];
						if (!value) return;
						const oldValue = decodeCardValue(value);
						if (newValue.id === oldValue.id) {
							node[CARD_VALUE_KEY] = newValue;
						}
					}
				});
			});
		}
	}

	handlePath = <T extends Array<any> | ReadonlyArray<any>>(
		path: T,
		id: string,
		bi: number,
		isOp: boolean = true,
		filter: (node: Node) => boolean = (node: Node) =>
			!isTransientElementCache($(node)),
	) => {
		const targetElement = this.engine.container.find(
			`[${DATA_ID}="${id}"]`,
		);
		if (targetElement.length > 0 && targetElement.inEditor()) {
			const newPath = targetElement.getPath(
				this.engine.container,
				targetElement.parent()?.isRoot() ? undefined : filter,
			);
			return (isOp ? newPath.map((p) => p + 2) : newPath).concat(
				path.slice(bi),
			) as T;
		}
		return path;
	};

	handleRemoteOps(ops: Operation[]) {
		if (this.currentAction.self && !this.#selfWaiting) this.saveOp();
		const range = this.engine.change.range.get();
		this.actionOps.forEach((action) => {
			if (action.rangePath) {
				const { start, end } = action.rangePath;
				if (start.id && start.bi !== undefined) {
					start.path = this.handlePath(
						start.path,
						start.id,
						start.bi,
						false,
						range.filterPath(true),
					);
				}
				if (end.id && end.bi !== undefined) {
					end.path = this.handlePath(
						end.path,
						end.id,
						end.bi,
						false,
						range.filterPath(true),
					);
				}
			}
			if (action.startRangePath) {
				const { start, end } = action.startRangePath;
				if (start.id && start.bi !== undefined) {
					start.path = this.handlePath(
						start.path,
						start.id,
						start.bi,
						false,
						range.filterPath(true),
					);
				}
				if (end.id && end.bi !== undefined) {
					end.path = this.handlePath(
						end.path,
						end.id,
						end.bi,
						false,
						range.filterPath(true),
					);
				}
			}
		});
		ops.forEach((op) => {
			if (!this.currentAction.ops) {
				this.currentAction.ops = [];
			}
			const lastOp =
				this.currentAction.ops[this.currentAction.ops.length - 1];
			if (lastOp && Operation.isReverse(op, lastOp)) {
				this.currentAction.ops.pop();
			} else {
				this.currentAction.ops.push(op);
			}
			this.actionOps.some((action, index) => {
				const affect = action.ops?.some((actionOp) => {
					return Operation.canOpAffectPath(op, actionOp.path);
				});
				if (affect) {
					// this.actionOps.splice(index, this.actionOps.length - index)
					const removeArray = [action];
					for (let i = index + 1; i < this.actionOps.length; i++) {
						const nextAction = this.actionOps[i];
						const nextAffect = nextAction.ops?.some((actionOp) => {
							return action.ops?.some((aop) =>
								Operation.canOpAffectPath(actionOp, aop.path),
							);
						});
						if (nextAffect) {
							removeArray.push(nextAction);
							let j = i + 1;
							const nextAction2 = this.actionOps[j];
							if (
								nextAction2 &&
								nextAction2.ops?.some((actionOp) => {
									return nextAction.ops?.some((aop) =>
										Operation.canOpAffectPath(
											actionOp,
											aop.path,
										),
									);
								})
							) {
								removeArray.push(nextAction2);
							}
						}
					}
					const newActionOps = this.actionOps.filter(
						(aop) =>
							removeArray.find((raop) => raop.id === aop.id) ===
							undefined,
					);
					this.actionOps = newActionOps;
					this.currentActionIndex = this.actionOps.length;
					return affect;
				}
				return false;
			});
		});
	}

	getUndoOp(): HirtoryOperation | undefined {
		const prevIndex = this.currentActionIndex - 1;
		if (this.actionOps[prevIndex]) {
			let prevOp = cloneDeep(this.actionOps[prevIndex]);
			let opIndex = findLastIndex(
				this.actionOps,
				(op) => op.id == prevOp.id,
			);
			if (opIndex !== -1) prevOp = this.actionOps[opIndex];
			else opIndex = prevIndex;
			const invertOps = prevOp.ops
				.map((op) => Operation.inverse(op))
				.reverse();

			try {
				return {
					self: true,
					ops: invertOps,
					id: prevOp.id,
					type: 'undo',
					rangePath: prevOp.rangePath,
					startRangePath: prevOp.startRangePath,
				};
			} catch (error: any) {
				this.engine.messageError('history-undo-op', error);
			}
		}
		return;
	}

	getRedoOp(): HirtoryOperation | undefined {
		const currentIndex = this.currentActionIndex;
		if (this.actionOps[currentIndex]) {
			let currentOp = cloneDeep(this.actionOps[currentIndex]);
			let invertOps: Operation[] | undefined = [];
			if (currentOp.type === 'undo') {
				invertOps = currentOp.ops
					.map((op) => Operation.inverse(op))
					.reverse();
			} else {
				invertOps = currentOp.ops;
			}
			try {
				return {
					self: true,
					ops: invertOps,
					id: currentOp.id,
					type: 'redo',
					rangePath: currentOp.rangePath,
					startRangePath: currentOp.startRangePath,
				};
			} catch (error: any) {
				this.engine.messageError('history-redo-op', error);
			}
		}
		return;
	}

	getCurrentRangePath() {
		const { model, change } = this.engine;
		const currentPath = model.selection.currentRangePath;
		return currentPath ? currentPath : change.range.get().toPath();
	}

	getRangePathBeforeCommand() {
		return (
			this.engine.change.getRangePathBeforeCommand() ||
			this.getCurrentRangePath()
		);
	}
}

export default HistoryModel;
