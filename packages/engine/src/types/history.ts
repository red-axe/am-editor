import { Operation } from '../model';
import { RangePath } from './range';

export type HirtoryOperation = {
	self?: boolean;
	ops: Operation[];
	rangePath?: { start: RangePath; end: RangePath };
	startRangePath?: { start: RangePath; end: RangePath };
	id?: string;
	type?: 'undo' | 'redo';
};

export interface HistoryInterface {
	/**
	 * 重置当前历史记录
	 */
	reset(): void;
	/**
	 * 是否有可撤销操作
	 */
	hasUndo(): boolean;
	/**
	 * 是否有可恢复操作
	 */
	hasRedo(): boolean;
	/**
	 * 执行撤销操作
	 */
	undo(): void;
	/**
	 * 执行恢复操作
	 */
	redo(): void;
	/**
	 * 清除当前所有历史记录
	 */
	clear(): void;
	/**
	 * 保存一个 op 到历史记录
	 */
	saveOp(): void;
	/**
	 * 处理本地自身操作
	 * @param ops 操作集合
	 */
	handleSelfOps(ops: Operation[]): void;
	/**
	 * 处理远程操作
	 * @param ops 操作集合
	 */
	handleRemoteOps(ops: Operation[]): void;
	/**
	 * 处理更新不计入历史操作中的卡片值
	 * @param op
	 */
	handleNLCardValue(op: Operation): void;
	/**
	 * 获取最近的可撤销操作
	 */
	getUndoOp(): HirtoryOperation | undefined;
	/**
	 * 获取最近的可恢复操作
	 */
	getRedoOp(): HirtoryOperation | undefined;
	/**
	 * 获取当前光标位置路径
	 */
	getCurrentRangePath(): { start: RangePath; end: RangePath } | undefined;
	/**
	 * 获取命令执行前缓存的光标位置路径
	 */
	getRangePathBeforeCommand():
		| { start: RangePath; end: RangePath }
		| undefined;
	/**
	 * 监听过滤存入历史记录堆栈中
	 * @param filter true 过滤排除，false 记录到历史堆栈中
	 */
	onFilter(filter: (op: Operation) => boolean): void;
	/**
	 * 监听当前变更ops
	 * @param collect 方法 undefined 默认延时保存，true 立即保存，false 立即丢弃。Promise<boolean> 阻拦接下来的所有ops直到返回false或者true
	 */
	onSelf(
		collect: (ops: Operation[]) => Promise<boolean> | boolean | undefined,
	): void;
}
