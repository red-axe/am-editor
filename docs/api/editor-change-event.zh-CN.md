# 变更中的事件

编辑器变更中的相关事件

类型：`ChangeEventInterface`

## 构造函数

```ts
new (engine: EngineInterface, options: ChangeEventOptions = {}): ChangeEventInterface;
```

## 属性

### `isComposing`

是否组合输入中

### `isSelecting`

是否正在选择中

## 方法

### `isCardInput`

是否是在卡片输入

```ts
isCardInput(e: Event): boolean;
```

### `onInput`

输入事件

```ts
onInput(callback: (event?: Event) => void): void;
```

### `onSelect`

光标选择事件

```ts
onSelect(callback: (event?: Event) => void): void;
```

### `onPaste`

粘贴事件

```ts
onPaste(
    callback: (data: ClipboardData & { isPasteText: boolean }) => void,
): void;
```

### `onDrop`

拖动事件

```ts
onDrop(
    callback: (params: {
        event: DragEvent;
        range?: RangeInterface;
        card?: CardInterface;
        files: Array<File | null>;
    }) => void,
): void;
```

### `onDocument`

绑定事件到 document 中

```ts
onDocument(
    eventType: string,
    listener: EventListener,
    index?: number,
): void;
```

### `onWindow`

绑定 window 事件

```ts
onWindow(
    eventType: string,
    listener: EventListener,
    index?: number
): void;
```

### `onContainer`

绑定编辑器根节点事件

```ts
onContainer(eventType: string, listener: EventListener, index?: number): void;
```

### `onRoot`

绑定事件到编辑器根节点中

```ts
onRoot(eventType: string, listener: EventListener, index?: number): void;
```

### `destroy`

销毁

```ts
destroy(): void;
```
