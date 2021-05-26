# History

Editor's edit history

Type: `HistoryInterface`

## Constructor

```ts
new (engine: EngineInterface): HistoryInterface
```

## Method

### `reset`

Reset history, it will clear all history

```ts
reset(): void;
```

### `hasUndo`

Is there an undo operation

```ts
hasUndo(): boolean;
```

### `hasRedo`

Is there a redo operation

```ts
hasRedo(): boolean;
```

### `undo`

Perform undo operation

```ts
undo(): void;
```

### `redo`

Perform redo operation

```ts
redo(): void;
```

### `hold`

The action in the next milliseconds remains as a historical segment

```ts
/**
 * How many milliseconds the action remains as a historical segment
 * @param time milliseconds
 */
hold(time?: number): void;
```

### `releaseHold`

Reset hold

```ts
/**
 * Reset hold
 */
releaseHold(): void;
```

### `lock`

Actions in the next few milliseconds will not be recorded as history

```ts
/**
 * How many milliseconds actions will not be recorded as history
 * @param time defaults to 10 milliseconds
 */
lock(time?: number): void;
```

### `releaseLock`

Reset lock

```ts
/**
 * Reset lock
 */
releaseLock(): void;
```

### `clear`

Delay to clear all history records

```ts
clear(): void;
```

### `startCache`

Cache subsequent operations temporarily, will not be synchronized to the collaborative server, and will not be written to history

```ts
/**
 * The subsequent operations are temporarily cached, and will not be synchronized to the collaborative server, and history will not be written
 */
startCache(): void;
```

### `submitCache`

Submit temporarily cached operations, synchronize them to the collaborative server, and write historical records

```ts
/**
 * Submit temporarily cached operations, synchronize them to the collaborative server, and write historical records
 */
submitCache(): void;
```

### `destroyCache`

Abandon temporarily cached operations

```ts
/**
 * Abandon temporarily cached operations
 */
destroyCache(): void;
```

### `saveOp`

Save the currently unmaintained operations to the stack

```ts
saveOp(): void;
```

### `collectSelfOps`

Collect local editing operations

```ts
/**
 * @param ops operation set
 * */
collectSelfOps(ops: Op[]): void;
```

### `collectRemoteOps`

Collect remote operations (operations from other coordinators)

```ts
/**
 * @param ops operation set
 * */
collectRemoteOps(ops: Op[]): void;
```

### `getUndoOp`

Get the undo operation of the current top position

```ts
getUndoOp(): Operation | undefined;
```

### `getRedoOp`

Get the redo operation of the current top position

```ts
getRedoOp(): Operation | undefined;
```

### `getCurrentRangePath`

Get the converted path of the current cursor

```ts
getCurrentRangePath(): Path[];
```

### `getRangePathBeforeCommand`

Get the converted path of the cursor recorded before executing the command

```ts
getRangePathBeforeCommand(): Path[];
```
