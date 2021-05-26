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

### `hold`

在接下来的多少毫秒内的动作保持为一个历史片段

```ts
/**
 * 多少毫秒内的动作保持为一个历史片段
 * @param time 毫秒
 */
hold(time?: number): void;
```

### `releaseHold`

重置 hold

```ts
/**
 * 重置 hold
 */
releaseHold(): void;
```

### `lock`

在接下来的多少毫秒内的动作将不作为历史记录

```ts
/**
 * 多少毫秒内的动作将不作为历史记录
 * @param time 默认10毫秒
 */
lock(time?: number): void;
```

### `releaseLock`

重置 lock

```ts
/**
 * 重置 lock
 */
releaseLock(): void;
```

### `clear`

延时清除全部的历史记录

```ts
clear(): void;
```

### `startCache`

将后续操作暂时缓存，不会同步到协同服务端，不写入历史记录

```ts
/**
 * 将后续操作暂时缓存，不会同步到协同服务端，不写入历史记录
 */
startCache(): void;
```

### `submitCache`

将暂时缓存的操作提交，同步到协同服务端，写入历史记录

```ts
/**
 * 将暂时缓存的操作提交，同步到协同服务端，写入历史记录
 */
submitCache(): void;
```

### `destroyCache`

将暂时缓存的操作遗弃

```ts
/**
 * 将暂时缓存的操作遗弃
 */
destroyCache(): void;
```

### `saveOp`

把当前还未保持的操作保存到堆栈里

```ts
saveOp(): void;
```

### `collectSelfOps`

收集本地编辑的操作

```ts
/**
 * @param ops 操作集合
 * */
collectSelfOps(ops: Op[]): void;
```

### `collectRemoteOps`

收集远程的操作（来自其它协同者的操作）

```ts
/**
 * @param ops 操作集合
 * */
collectRemoteOps(ops: Op[]): void;
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
