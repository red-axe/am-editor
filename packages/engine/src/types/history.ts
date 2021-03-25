import { Op, Path } from 'sharedb';
import { Operation } from './ot';

export interface HistoryInterface {
	reset(): void;
	hasUndo(): boolean;
	hasRedo(): boolean;
	undo(): void;
	redo(): void;
	hold(time?: number): void;
	release(): void;
	clear(): void;
	saveOp(): void;
	collectSelfOps(ops: Op[]): void;
	collectRemoteOps(ops: Op[]): void;
	getUndoOp(): Operation | undefined;
	getRedoOp(): Operation | undefined;
	getCurrentRangePath(): Path[];
	getRangePathBeforeCommand(): Path[];
}
