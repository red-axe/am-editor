# 范围标记

通过 `Selection` 可以很轻松的根据`RangeInterface`的选区在 DOM 树中创建标记，然后获取标记中间或者两侧的节点

## 构造函数

```ts
new (editor: EditorInterface, range: RangeInterface): SelectionInterface
```

## 属性

### `anchor`

选区开始位置标记节点

类型：`NodeInterface | null`

### `focus`

选区结束位置标记节点。如果 `Range` 的 collapsed 为 true，那么 focus 节点与 anchor 节点是一致的

类型：`NodeInterface | null`

## 静态方法

### `removeTags`

移除光标位置占位标签

```ts
/**
 * 移除光标位置占位标签
 * @param value 需要移除的字符串
 */
static removeTags = (value: string) => void
```

## 方法

### `has`

是否有创建好的标记

```ts
has(): boolean;
```

### `create`

创建标记

```ts
/**
 * 创建标记
 */
create(): void;
```

### `move`

设置 Range 恢复到标记位置，并删除标记

```ts
/**
 * 让Range选择标记位置，并删除标记
 */
move(): void;
```

### `getNode`

获取节点相对于标记位置的节点，获取后会移除标记

```ts
/**
 * 获取节点相对于标记位置的节点，获取后会移除标记
 * @param node 节点
 * @param position 位置
 * @param isClone 是否复制一个副本
 * @param callback 删除节点时回调，返回一个 boolean 来表示当前节点是否删除
 */
getNode(
    node: NodeInterface,
    position?: 'left' | 'center' | 'right',
    isClone?: boolean,
    callback?: (node: NodeInterface) => boolean
): NodeInterface;
```
