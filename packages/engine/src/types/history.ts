import { Op, Path } from 'sharedb';
import { Operation } from './ot';

export interface HistoryInterface {
	reset(): void;
	hasUndo(): boolean;
	hasRedo(): boolean;
	undo(): void;
	redo(): void;
	/**
	 * 多少毫秒内的动作保持为一个历史片段
	 * @param time 毫秒
	 */
	hold(time?: number): void;
	/**
	 * 重置 hold
	 */
	releaseHold(): void;
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
	/**
	 * 将后续操作暂时缓存，不会同步到协同服务端，不写入历史记录
	 */
	startCache(): void;
	/**
	 * 将暂时缓存的操作提交，同步到协同服务端，写入历史记录
	 */
	submitCache(): void;
	/**
	 * 将暂时缓存的操作遗弃
	 */
	destroyCache(): void;
	saveOp(): void;
	collectSelfOps(ops: Op[]): void;
	collectRemoteOps(ops: Op[]): void;
	getUndoOp(): Operation | undefined;
	getRedoOp(): Operation | undefined;
	getCurrentRangePath(): Path[];
	getRangePathBeforeCommand(): Path[];
}
