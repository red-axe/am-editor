# 历史

编辑器的编辑历史记录

类型：`HistoryInterface`

## 构造函数

```ts
new (engine: EngineInterface): HistoryInterface
```

## 方法

### `reset`

重置历史记录，会清空所有的历史记录

```ts
reset(): void;
```

### `hasUndo`

是否有撤销操作

```ts
hasUndo(): boolean;
```

### `hasRedo`

是否有重做操作

```ts
hasRedo(): boolean;
```

### `undo`

执行撤销操作

```ts
undo(): void;
```

### `redo`

执行重做操作

```ts
redo(): void;
```

### `onFilter`

监听过滤存入历史记录的 operations

```ts
/**
* 监听过滤存入历史记录堆栈中
* @param filter true 过滤排除，false 记录到历史堆栈中
*/
onFilter(filter: (operation: Operation) => boolean): void
```

### `onSelf`

监听当前变更 ops，并决定是否写入到历史记录

```ts
/**
*
* @param collect 方法 undefined 默认延时保存，true 立即保存，false 立即丢弃。Promise<boolean> 阻拦接下来的所有ops直到返回false或者true
*/
onSelf(collect: (operations: Operation[]) => Promise<boolean> | boolean | undefined): void
```

### `clear`

延时清除全部的历史记录

```ts
clear(): void;
```

### `saveOp`

把当前还未保持的操作保存到堆栈里

```ts
saveOp(): void;
```

### `handleSelfOps`

收集本地编辑的操作

```ts
/**
 * @param operations 操作集合
 * */
handleSelfOps(operations: Operation[]): void;
```

### `handleRemoteOps`

收集远程的操作（来自其它协同者的操作）

```ts
/**
 * @param operations 操作集合
 * */
handleRemoteOps(operations: Operation[]): void;
```

### `getUndoOp`

获取当前最前位置的撤销操作

```ts
getUndoOp(): Operation | undefined;
```

### `getRedoOp`

获取当前最前位置的重做操作

```ts
getRedoOp(): Operation | undefined;
```

### `getCurrentRangePath`

获取当前光标转换后的路径

```ts
getCurrentRangePath(): Path[];
```

### `getRangePathBeforeCommand`

获取执行命令前记录的光标转换后的路径

```ts
getRangePathBeforeCommand(): Path[];
```
