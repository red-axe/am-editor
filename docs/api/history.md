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

### `onFilter`

Monitor and filter operations stored in history

```ts
/**
* Monitoring and filtering are stored in the history stack
* @param filter true to filter and exclude, false to record in the history stack
*/
onFilter(filter: (operation: Operation) => boolean): void
```

### `onSelf`

Monitor the current change operations and decide whether to write to the history record

```ts
/**
*
* @param collect method undefined The default delay save, true save immediately, false immediately discard. Promise<boolean> blocks all subsequent operations until it returns false or true
*/
onSelf(collect: (operations: Operation[]) => Promise<boolean> | boolean | undefined): void
```

### `clear`

Delay to clear all history records

```ts
clear(): void;
```

### `saveOp`

Save the currently unmaintained operations to the stack

```ts
saveOp(): void;
```

### `handleSelfOps`

Collect local editing operations

```ts
/**
 * @param operations operation set
 * */
handleSelfOps(operations: Operation[]): void;
```

### `handleRemoteOps`

Collect remote operations (operations from other coordinators)

```ts
/**
 * @param operations operation set
 * */
handleRemoteOps(operations: Operation[]): void;
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
