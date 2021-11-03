import { cloneDeep, debounce } from 'lodash-es';
import { Op } from 'sharedb';
import OTJSON from 'ot-json0';
import { Operation, TargetOp } from './types/ot';
import { random } from './utils';
import { isCursorOp, isReverseOp, isTransientElement } from './ot/utils';
import { EngineInterface } from './types/engine';
import { HistoryInterface } from './types/history';
import { $ } from './node';
import { DATA_ID } from './constants';

/**
 * 历史记录管理器
 */
class HistoryModel implements HistoryInterface {
	// 所有操作片段
	private actionOps: Array<Operation> = [];
	// 引擎实例
	private engine: EngineInterface;
	// 当前还未保存的所有操作
	private currentAction: Operation = {};
	// 当前操作的索引
	private currentActionIndex: number = 0;
	private remoteOps: TargetOp[] = [];
	// 监听的所有过滤事件
	private filterEvents: ((op: Op) => boolean)[] = [];
	// 监听的所有收集本地操作的事件
	private selfEvents: ((
		ops: Op[],
	) => Promise<boolean> | boolean | undefined)[] = [];
	// 等待监听收集本地操作的回调
	#selfWaiting?: Promise<boolean>;

	constructor(engine: EngineInterface) {
		this.engine = engine;
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
		this.currentAction = {};
		this.currentActionIndex = 0;
	}

	/**
	 * 监听过滤事件
	 * @param filter 事件
	 */
	onFilter(filter: (op: Op) => boolean) {
		this.filterEvents.push(filter);
	}

	/**
	 * 监听收集本地操作事件
	 * @param event 事件
	 */
	onSelf(event: (ops: Op[]) => Promise<boolean> | boolean | undefined) {
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
			this.engine.ot.stopMutation();
			try {
				const { ot } = this.engine;
				ot.submitOps(undoOp.ops || []);
				const applyNodes = ot.consumer.handleSelfOperations(
					undoOp.ops!,
				);
				ot.consumer.handleIndex(undoOp.ops || [], applyNodes);
				this.currentActionIndex--;
				isUndo = true;
			} catch (error) {
				this.reset();
				console.error(error);
			}
			if (this.engine.isEmpty()) this.engine.change.initValue();
			this.engine.ot.startMutation();
			if (isUndo) {
				//清除操作前记录的range
				this.engine.change.getRangePathBeforeCommand();
				this.engine.ot.consumer.setRangeByPath(undoOp.startRangePath!);
				this.engine.change.change();
				this.engine.trigger('undo');
			}
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
			this.engine.ot.stopMutation();
			try {
				const { ot } = this.engine;
				ot.submitOps(redoOp.ops || []);
				const applyNodes = ot.consumer.handleSelfOperations(
					redoOp.ops!,
				);
				ot.consumer.handleIndex(redoOp.ops || [], applyNodes);
				this.currentActionIndex++;
				isRedo = true;
			} catch (error) {
				this.reset();
				console.error(error);
			}
			this.engine.ot.startMutation();
			if (isRedo) {
				// 清除操作前记录的range
				this.engine.change.getRangePathBeforeCommand();
				this.engine.ot.consumer.setRangeByPath(redoOp.rangePath!);
				this.engine.change.change();
				this.engine.trigger('redo');
			}
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
				this.currentAction.remoteOps = this.remoteOps;
				this.actionOps.splice(this.currentActionIndex);
				this.actionOps.push(this.currentAction);
				this.remoteOps = [];
				this.currentActionIndex = this.actionOps.length;
				this.engine.change.change();
			}
			this.currentAction = {};
			// 保存成功后清除操作前记录的range
			this.engine.change.getRangePathBeforeCommand();
		}
	}

	handleSelfOps(ops: Op[]) {
		if (!this.currentAction?.self && ops.some((op) => !isCursorOp(op)))
			this.saveOp();
		let isSave = false;
		ops.forEach((op) => {
			if (!isCursorOp(op)) {
				isSave = true;
				if (this.filterEvents.some((filter) => filter(op))) {
					if (this.actionOps.length > 0)
						this.actionOps[this.actionOps.length - 1].ops?.push(op);
				} else {
					this.currentAction.self = true;
					if (!this.currentAction.ops) this.currentAction.ops = [];

					if (!this.currentAction.startRangePath) {
						this.currentAction.startRangePath =
							this.getRangePathBeforeCommand();
					}
					const lastOp =
						this.currentAction.ops[
							this.currentAction.ops.length - 1
						];
					if (lastOp && isReverseOp(op, lastOp)) {
						this.currentAction.ops.pop();
					} else {
						this.currentAction.ops.push(op);
					}
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
					this.currentAction = {};
				}
			} else if (typeof callback === 'object') {
				this.#selfWaiting = callback;
				(callback as Promise<boolean>)
					.then((s) => {
						if (s) {
							this.saveOp();
						} else {
							this.currentAction = {};
						}
					})
					.finally(() => (this.#selfWaiting = undefined));
			} else if (callback === undefined) {
				this.lazySave();
			}
		}
	}

	handlePath = <T extends Array<any> | ReadonlyArray<any>>(
		path: T,
		id: string,
		bi: number,
		isOp: boolean = true,
		filter: (node: Node) => boolean = (node: Node) =>
			!isTransientElement($(node)),
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

	handleRemoteOps(ops: TargetOp[]) {
		if (this.currentAction.self && !this.#selfWaiting) this.saveOp();
		const range = this.engine.change.range.get();
		this.actionOps.forEach((action) => {
			action.ops?.forEach((op) => {
				if (op.id && op.bi !== undefined) {
					op.p = this.handlePath(op.p, op.id, op.bi);
				}
			});
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
		const redoOps = this.actionOps[this.currentActionIndex]
			? this.actionOps.slice(this.currentActionIndex)
			: [];
		const undoOps = this.actionOps[this.currentActionIndex - 1]
			? this.actionOps.slice(0, this.currentActionIndex)
			: [];
		ops = ops.filter((o) => !isCursorOp(o));
		ops.forEach((op) => {
			if (isCursorOp(op)) return;
			this.remoteOps.push(op);
			if (this.actionOps.length > 0) {
				// 在一个block中有操作，远程的操作索引小于撤销中的索引或者深度大于撤销中的索引，那就移除所有的撤销操作，
				const isRemove = (historyOps: Operation[]) => {
					return historyOps.some((uAction) => {
						const actionRemove = uAction.ops?.some((uOp) => {
							// 操作目标的block节点一致
							if (uOp.id === op.id) {
								const uPath = uOp.p.slice(uOp.bi);
								const path = op.p.slice(op.bi);
								// 远程操作比undo操作目标索引小或者一致
								if (
									uPath.some((p, index) => path[index] < p) ||
									isReverseOp(op, uOp)
								) {
									return true;
								}
							}
							// 里面有删除，反转后执行就是插入操作，插入需要索引，如果远程操作的 ld 或者 li 的path长度与 uOp的长度相等并且小于等于就要删除撤销
							else if ('ld' in uOp) {
								if (
									op.p[0] < uOp.p[0] &&
									op.p.length === 1 &&
									uOp.p.length === 1
								) {
									return true;
								}
								if (
									(op.p[0] === uOp.p[0] &&
										op.p.length > 1 &&
										uOp.p.some(
											(p, index) =>
												op.p[index] === undefined ||
												op.p[index] < p,
										)) ||
									isReverseOp(op, uOp)
								)
									return true;
							}
							return false;
						});

						return actionRemove;
					});
				};
				if ('li' in op || 'ld' in op || 'sd' in op || 'si' in op) {
					if (isRemove(undoOps)) {
						this.actionOps.splice(
							this.currentActionIndex - 1,
							undoOps.length,
						);
						this.currentActionIndex -= undoOps.length;
					}
					if (isRemove(redoOps)) {
						this.actionOps.splice(this.currentActionIndex);
						this.currentActionIndex--;
					}
				}
			}
		});
	}

	getUndoOp(): Operation | undefined {
		const prevIndex = this.currentActionIndex - 1;
		if (this.actionOps[prevIndex]) {
			const prevOp = cloneDeep(this.actionOps[prevIndex]);
			const invertOps = OTJSON.type.invert(prevOp.ops || []);
			invertOps.forEach((op, index) => {
				const pOp = (prevOp.ops || [])[invertOps.length - index - 1];
				op['id'] = pOp.id;
				op['bi'] = pOp.bi;
			});
			try {
				return {
					self: true,
					ops: invertOps,
					id: prevOp.id,
					type: 'undo',
					rangePath: prevOp.rangePath,
					startRangePath: prevOp.startRangePath,
				};
			} catch (error) {
				console.error(error);
			}
		}
		return;
	}

	getRedoOp(): Operation | undefined {
		const currentIndex = this.currentActionIndex;
		if (this.actionOps[currentIndex]) {
			let currentOp = cloneDeep(this.actionOps[currentIndex]);
			let invertOps: Op[] | undefined = [];
			if (currentOp.type === 'undo') {
				// ops 倒置会丢失 id 和 bi
				invertOps = OTJSON.type.invert(currentOp.ops || []);
				// 重新赋值 id 和 bi
				invertOps.forEach((op, index) => {
					const pOp = (currentOp.ops || [])[
						invertOps!.length - index - 1
					];
					op['id'] = pOp.id;
					op['bi'] = pOp.bi;
				});
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
			} catch (error) {
				console.error(error);
			}
		}
		return;
	}

	getCurrentRangePath() {
		const { ot, change } = this.engine;
		const currentPath = ot.selection.currentRangePath;
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
