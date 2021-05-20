import { cloneDeep, debounce, findLastIndex } from 'lodash-es';
import { Op } from 'sharedb';
import OTJSON from 'ot-json0';
import { Operation } from './types/ot';
import { random } from './utils';
import {
	isCursorOp,
	isReverseOp,
	transformOp,
	transformPath,
} from './ot/utils';
import { EngineInterface } from './types/engine';
import { HistoryInterface } from './types/history';

class HistoryModel implements HistoryInterface {
	private totalOps: Array<Operation> = [];
	private actionOps: Array<Operation> = [];
	private engine: EngineInterface;
	private currentAction: Operation = {};
	private currentActionIndex: number = 0;
	private holded: boolean = false;
	private locked: boolean = false;
	private holdTimer?: NodeJS.Timeout;
	private lockTimer?: NodeJS.Timeout;

	constructor(engine: EngineInterface) {
		this.engine = engine;
	}

	lazySaveOp = debounce(() => {
		this.saveOp();
	}, 200);

	reset() {
		this.totalOps = [];
		this.actionOps = [];
		this.currentAction = {};
		this.currentActionIndex = 0;
	}

	hasUndo() {
		return !!this.getUndoOp();
	}

	hasRedo() {
		return !!this.getRedoOp();
	}

	undo() {
		this.saveOp();
		const undoOp = this.getUndoOp();
		if (undoOp) {
			let isUndo = false;
			this.engine.ot.stopMutation();
			try {
				this.engine.ot.submitOps(undoOp.ops!);
				this.engine.ot.applier.applySelfOperations(undoOp.ops!);
				const lastOp = this.totalOps[this.totalOps.length - 1];
				if (
					lastOp &&
					lastOp.uid === undoOp.uid &&
					lastOp.status !== 'undo'
				) {
					this.totalOps.pop();
				} else {
					this.totalOps.push(undoOp);
				}
				this.currentActionIndex--;
				isUndo = true;
			} catch (error) {
				this.reset();
				console.log(error);
			}
			this.engine.ot.startMutation();
			if (isUndo) {
				this.engine.ot.applier.setRangeByPath(undoOp.startRangePath!);
				this.engine.change.change();
			}
		}
	}

	redo() {
		this.saveOp();
		const redoOp = this.getRedoOp();
		if (redoOp) {
			let isRedo = false;
			this.engine.ot.stopMutation();
			try {
				this.engine.ot.submitOps(redoOp.ops!);
				this.engine.ot.applier.applySelfOperations(redoOp.ops!);
				const lastOp = this.totalOps[this.totalOps.length - 1];
				if (
					lastOp &&
					lastOp.uid === redoOp.uid &&
					lastOp.status === 'undo'
				) {
					this.totalOps.pop();
				} else {
					this.totalOps.push(redoOp);
				}
				this.currentActionIndex++;
				isRedo = true;
			} catch (error) {
				this.reset();
				console.log(error);
			}
			this.engine.ot.startMutation();
			if (isRedo) {
				this.engine.ot.applier.setRangeByPath(redoOp.rangePath!);
				this.engine.change.change();
			}
		}
	}
	/**
	 * 多少毫秒内的动作保持为一个历史片段
	 * @param time 毫秒
	 */
	hold(time: number = 10) {
		this.holded = true;
		if (this.holdTimer) clearTimeout(this.holdTimer);
		this.holdTimer = setTimeout(() => this.releaseHold(), time);
	}
	/**
	 * 多少毫秒内的动作将不作为历史记录
	 * @param time 默认10毫秒
	 */
	lock(time: number = 10) {
		this.locked = true;
		if (this.lockTimer) clearTimeout(this.lockTimer);
		this.lockTimer = setTimeout(() => this.releaseLock(), time);
	}

	releaseHold() {
		this.holded = false;
	}

	releaseLock() {
		this.locked = false;
	}

	clear() {
		setTimeout(() => {
			this.reset();
		}, 10);
	}
	/**
	 * 将后续操作暂时缓存，不会同步到协同服务端，不写入历史记录
	 */
	startCache() {
		this.engine.ot.startMutationCache();
	}
	/**
	 * 将暂时缓存的操作提交，同步到协同服务端，写入历史记录
	 */
	submitCache() {
		this.engine.ot.submitMutationCache();
	}
	/**
	 * 将暂时缓存的操作遗弃
	 */
	destroyCache() {
		this.engine.ot.destroyMutationCache();
	}

	saveOp() {
		if (
			!this.locked &&
			this.currentAction &&
			this.currentAction.ops &&
			this.currentAction.ops.length > 0
		) {
			this.totalOps.push(this.currentAction);
			if (this.currentAction.self) {
				this.currentAction.rangePath = this.getCurrentRangePath();
				this.currentAction.uid = random(8);
				this.actionOps.splice(this.currentActionIndex);
				this.actionOps.push(this.currentAction);
				this.currentActionIndex = this.actionOps.length;
				this.engine.change.change();
			}
			this.currentAction = {};
		}
	}

	collectSelfOps(ops: Op[]) {
		if (this.locked) return;
		if (!this.currentAction?.self) this.saveOp();
		let isSave = false;
		ops.forEach(op => {
			if (!isCursorOp(op)) {
				isSave = true;
				if (this.holded && this.actionOps.length > 0)
					this.actionOps[this.actionOps.length - 1].ops?.push(op);
				else {
					this.currentAction.self = true;
					if (!this.currentAction.ops) this.currentAction.ops = [];

					if (!this.currentAction.startRangePath) {
						this.currentAction.startRangePath = this.getRangePathBeforeCommand();
					}
					const lastOp = this.currentAction.ops[
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
		if (isSave) this.lazySaveOp();
	}

	collectRemoteOps(ops: Op[]) {
		if (this.currentAction.self) this.saveOp();
		ops.forEach(op => {
			if (!isCursorOp(op)) {
				if (!this.currentAction.ops) {
					this.currentAction.ops = [];
				}
				const lastOp = this.currentAction.ops[
					this.currentAction.ops.length - 1
				];
				if (lastOp && isReverseOp(op, lastOp)) {
					this.currentAction.ops.pop();
				} else {
					this.currentAction.ops.push(op);
				}
			}
		});
	}

	getUndoOp(): Operation | undefined {
		const prevIndex = this.currentActionIndex - 1;
		if (this.actionOps[prevIndex]) {
			let prevOp = cloneDeep(this.actionOps[prevIndex]);
			let opIndex = findLastIndex(
				this.totalOps,
				op => op.uid == prevOp.uid,
			);
			if (opIndex !== -1) prevOp = this.totalOps[opIndex];
			else opIndex = prevIndex;
			const invertOps = OTJSON.type.invert(prevOp.ops || []);
			const ops = this.totalOps.slice(opIndex + 1);
			try {
				const transOps = transformOp(invertOps, ops);
				if (transOps.length === 0) return;
				return {
					self: true,
					ops: transOps,
					uid: prevOp.uid,
					status: 'undo',
					rangePath: transformPath(prevOp.rangePath, ops),
					startRangePath: transformPath(prevOp.startRangePath, ops),
				};
			} catch (error) {
				console.log(error);
			}
		}
		return;
	}

	getRedoOp(): Operation | undefined {
		const currentIndex = this.currentActionIndex;
		if (this.actionOps[currentIndex]) {
			let currentOp = cloneDeep(this.actionOps[currentIndex]);
			let opIndex = findLastIndex(
				this.totalOps,
				op => op.uid === currentOp.uid,
			);
			if (opIndex !== -1) currentOp = this.totalOps[opIndex];
			else opIndex = currentIndex;
			let invertOps: Op[] | undefined = [];
			let ops: Operation[] = [];
			if (currentOp.status === 'undo') {
				invertOps = OTJSON.type.invert(currentOp.ops || []);
			} else {
				invertOps = currentOp.ops;
			}
			ops = this.totalOps.slice(opIndex + 1);
			try {
				const transOps = transformOp(invertOps || [], ops);
				if (transOps.length === 0) return;
				return {
					self: true,
					ops: transOps,
					uid: currentOp.uid,
					status: 'redo',
					rangePath: transformPath(currentOp.rangePath, ops),
					startRangePath: transformPath(
						currentOp.startRangePath,
						ops,
					),
				};
			} catch (error) {
				console.log(error);
			}
		}
		return;
	}

	getCurrentRangePath() {
		const { ot, change } = this.engine;
		const currentPath = ot.selectionData.currentRangePath;
		return currentPath.length !== 0
			? currentPath
			: change.getRange().toPath();
	}

	getRangePathBeforeCommand() {
		return (
			this.engine.change.getRangePathBeforeCommand() ||
			this.getCurrentRangePath()
		);
	}
}

export default HistoryModel;
