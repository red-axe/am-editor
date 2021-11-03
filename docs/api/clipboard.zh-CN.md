# 剪贴板

剪贴板相关操作

类型：`ClipboardInterface`

## 构造函数

```ts
new (editor: EditorInterface): CommandInterface
```

## 方法

### `getData`

获取剪贴板数据

```ts
/**
 * 获取剪贴板数据
 * @param event 事件
 */
getData(event: DragEvent | ClipboardEvent): ClipboardData;
```

### `write`

写入剪贴板

```ts
/**
 * 写入剪贴板
 * @param event 事件
 * @param range 光标，默认获取当前光标位置
 * @param callback 回调
 */
write(
    event: ClipboardEvent,
    range?: RangeInterface | null,
    callback?: (data: { html: string; text: string }) => void,
): void;
```

### `cut`

在当前光标位置执行剪贴操作

```ts
/**
 * 在当前光标位置执行剪贴操作
 */
cut(): void;
```

### `copy`

复制

```ts
/**
 * 复制
 * @param data 要复制的数据，可以是节点或者字符串
 * @param trigger 是否触发剪贴事件，通知插件处理转换
 * @returns 返回是否复制成功
 */
copy(data: Node | string, trigger?: boolean): boolean;
```
