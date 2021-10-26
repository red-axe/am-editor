import { Op, Path } from 'sharedb';
import { Operation } from './ot';

export interface HistoryInterface {
	reset(): void;
	hasUndo(): boolean;
	hasRedo(): boolean;
	undo(): void;
	redo(): void;
	/**
	 * 多少毫秒内的动作将不作为历史记录
	 * @param time 默认10毫秒
	 */
	lock(time?: number): void;
	/**
	 * 重置 lock
	 */
	releaseLock(): void;
	clear(): void;
	saveOp(): void;
	collectSelfOps(ops: Op[]): void;
	collectRemoteOps(ops: Op[]): void;
	getUndoOp(): Operation | undefined;
	getRedoOp(): Operation | undefined;
	getCurrentRangePath(): Path[];
	getRangePathBeforeCommand(): Path[];
}
