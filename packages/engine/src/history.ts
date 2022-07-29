import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import findLastIndex from 'lodash/findLastIndex';
import { Op } from 'sharedb';
import OTJSON from 'ot-json0';
import { Operation, TargetOp } from './types/ot';
import { decodeCardValue, random } from './utils';
import { findCardForDoc, isReverseOp, isTransientElement } from './ot/utils';
import { EngineInterface } from './types/engine';
import { HistoryInterface } from './types/history';
import { $ } from './node';
import { CARD_VALUE_KEY, DATA_ID } from './constants';

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
				ot.consumer.handleSelfOperations(undoOp.ops!);
				this.currentActionIndex--;
				isUndo = true;
			} catch (error: any) {
				this.reset();
				this.engine.messageError('history-undo', error);
			}
			if (this.engine.isEmpty()) this.engine.change.initValue();

			if (isUndo) {
				//清除操作前记录的range
				this.engine.change.getRangePathBeforeCommand();
				this.engine.ot.consumer.setRangeByPath(undoOp.startRangePath!);
				this.engine.change.change();
				this.engine.trigger('undo');
			}
			this.engine.ot.startMutation();
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
				ot.consumer.handleSelfOperations(redoOp.ops!);
				this.currentActionIndex++;
				isRedo = true;
			} catch (error: any) {
				this.reset();
				this.engine.messageError('history-redo', error);
			}

			if (isRedo) {
				// 清除操作前记录的range
				this.engine.change.getRangePathBeforeCommand();
				this.engine.ot.consumer.setRangeByPath(redoOp.rangePath!);
				this.engine.change.change();
				this.engine.trigger('redo');
			}
			this.engine.ot.startMutation();
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
			this.currentAction = {};
			// 保存成功后清除操作前记录的range
			this.engine.change.getRangePathBeforeCommand();
		}
	}

	handleSelfOps(ops: Op[]) {
		if (!this.currentAction?.self) this.saveOp();
		let isSave = false;
		ops.forEach((op) => {
			isSave = true;
			if (this.filterEvents.some((filter) => filter(op))) {
				if (this.actionOps.length > 0 && !op['nl'])
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
				if (lastOp && isReverseOp(op, lastOp)) {
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

	handleNLCardValue(op: TargetOp) {
		const key = op.p[op.p.length - 1];
		if (
			op.nl === true &&
			typeof key === 'string' &&
			key === CARD_VALUE_KEY &&
			op['oi']
		) {
			const oiVal = op['oi'];
			const newVal = decodeCardValue(oiVal);
			this.actionOps.forEach((action) => {
				action.ops?.forEach((op) => {
					if (op.p[op.p.length - 1] === CARD_VALUE_KEY && op['oi']) {
						const oldVal = decodeCardValue(op['oi']);
						if (newVal.id === oldVal.id) {
							op['oi'] = newVal;
						}
					} else if (op['li']) {
						findCardForDoc(op['li'], (attrs) => {
							const value = decodeCardValue(
								attrs[CARD_VALUE_KEY],
							);
							if (value.id === newVal.id) {
								attrs[CARD_VALUE_KEY] = oiVal;
								return true;
							}
							return false;
						});
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
		ops.forEach((op) => {
			if (!this.currentAction.ops) {
				this.currentAction.ops = [];
			}
			const lastOp =
				this.currentAction.ops[this.currentAction.ops.length - 1];
			if (lastOp && isReverseOp(op, lastOp)) {
				this.currentAction.ops.pop();
			} else {
				this.currentAction.ops.push(op);
			}
			this.actionOps.some((action, index) => {
				const affect = action.ops?.some((actionOp) => {
					return OTJSON.type.canOpAffectPath(op, actionOp.p);
				});
				if (affect) {
					// this.actionOps.splice(index, this.actionOps.length - index)
					const removeArray = [action];
					for (let i = index + 1; i < this.actionOps.length; i++) {
						const nextAction = this.actionOps[i];
						const nextAffect = nextAction.ops?.some((actionOp) => {
							return action.ops?.some((aop) =>
								OTJSON.type.canOpAffectPath(actionOp, aop.p),
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
										OTJSON.type.canOpAffectPath(
											actionOp,
											aop.p,
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

	getUndoOp(): Operation | undefined {
		const prevIndex = this.currentActionIndex - 1;
		if (this.actionOps[prevIndex]) {
			let prevOp = cloneDeep(this.actionOps[prevIndex]);
			let opIndex = findLastIndex(
				this.actionOps,
				(op) => op.id == prevOp.id,
			);
			if (opIndex !== -1) prevOp = this.actionOps[opIndex];
			else opIndex = prevIndex;
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
			} catch (error: any) {
				this.engine.messageError('history-undo-op', error);
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
			} catch (error: any) {
				this.engine.messageError('history-redo-op', error);
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
