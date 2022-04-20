# BlockModel

编辑块级节点的相关操作

类型：`BlockModelInterface`

通过引擎实例获取命令实例：

```ts
engine.block;
```

## 使用

```ts
new Engine(...).block
```

## 构造函数

```ts
new (editor: EditorInterface): BlockModelInterface
```

## 方法

### `init`

初始化

```ts
/**
 * 初始化
 */
init(): void;
```

### `findPlugin`

根据节点查找 block 插件实例

```ts
/**
 * 根据节点查找block插件实例
 * @param node 节点
 */
findPlugin(node: NodeInterface): BlockInterface | undefined;
```

### `findTop`

查找 Block 节点的一级节点。如 div -> H2 返回 H2 节点

```ts
/**
 * 查找Block节点的一级节点。如 div -> H2 返回 H2节点
 * @param parentNode 父节点
 * @param childNode 子节点
 */
findTop(parentNode: NodeInterface, childNode: NodeInterface): NodeInterface;
```

### `closest`

获取最近的 block 节点，找不到返回 node

```ts
/**
 * 获取最近的block节点，找不到返回 node
 * @param node 节点
 * @param callback 回调，可判断是否找到
 */
closest(
    node: NodeInterface,
    callback?: (node: NodeInterface) => boolean,
): NodeInterface;
```

### `wrap`

在光标位置包裹一个 block 节点

```ts
/**
 * 在光标位置包裹一个block节点
 * @param block 节点
 * @param range 光标
 */
wrap(block: NodeInterface | Node | string, range?: RangeInterface): void;
```

### `unwrap`

移除光标所在 block 节点包裹

```ts
/**
 * 移除光标所在block节点包裹
 * @param block 节点
 * @param range 光标
 */
unwrap(block: NodeInterface | Node | string, range?: RangeInterface): void;
```

### `getSiblings`

获取节点相对于光标开始位置、结束位置下的兄弟节点集合

```ts
/**
 * 获取节点相对于光标开始位置、结束位置下的兄弟节点集合
 * @param range 光标
 * @param block 节点
 */
getSiblings(
    range: RangeInterface,
    block: NodeInterface,
): Array<{ node: NodeInterface; position: 'left' | 'center' | 'right' }>;
```

### `split`

分割当前光标选中的 block 节点

```ts
/**
 * 分割当前光标选中的block节点
 * @param range 光标
 * @returns 返回分割后的节点
 */
split(range?: RangeInterface): NodeInterface | undefined;
```

### `insert`

在当前光标位置插入 block 节点

```ts
/**
 * 在当前光标位置插入block节点
 * @param block 节点
 * @param range 光标
 * @param splitNode 分割节点，默认为光标开始位置的block节点
 * @param removeCurrentEmptyBlock 是否移除当前空的block节点
 */
insert(
    block: NodeInterface | Node | string,
    range?: RangeInterface,
    splitNode?: (node: NodeInterface) => NodeInterface,
    removeCurrentEmptyBlock?: boolean,
): void;
```

### `setBlocks`

设置当前光标所在的所有 block 节点为新的节点或设置新属性

```ts
/**
 * 设置当前光标所在的所有block节点为新的节点或设置新属性
 * @param block 需要设置的节点或者节点属性
 * @param range 光标
 */
setBlocks(
    block: string | { [k: string]: any },
    range?: RangeInterface,
): void;
```

### `merge`

合并当前光标位置相邻的 block

```ts
/**
 * 合并当前光标位置相邻的block
 * @param range 光标
 */
merge(range?: RangeInterface): void;
```

### `findBlocks`

查找对范围有效果的所有 Block

```ts
/**
 * 查找对范围有效果的所有 Block
 * @param range 范围
 */
findBlocks(range: RangeInterface): Array<NodeInterface>;
```

### `isFirstOffset`

判断范围的 {Edge}Offset 是否在 Block 的开始位置

```ts
/**
 * 判断范围的 {Edge}Offset 是否在 Block 的开始位置
 * @param range 光标
 * @param edge start ｜ end
 */
isFirstOffset(range: RangeInterface, edge: 'start' | 'end'): boolean;
```

### `isLastOffset`

判断范围的 {Edge}Offset 是否在 Block 的最后位置

```ts
/**
 * 判断范围的 {Edge}Offset 是否在 Block 的最后位置
 * @param range 光标
 * @param edge start ｜ end
 */
isLastOffset(range: RangeInterface, edge: 'start' | 'end'): boolean;
```

### `getBlocks`

获取范围内的所有 Block

```ts
/**
 * 获取范围内的所有 Block
 * @param range  光标s
 */
getBlocks(range: RangeInterface): Array<NodeInterface>;
```

### `getLeftText`

获取 Block 左侧文本

```ts
/**
 * 获取 Block 左侧文本
 * @param block 节点
 */
getLeftText(block: NodeInterface | Node): string;
```

### `removeLeftText`

删除 Block 左侧文本

```ts
/**
 * 删除 Block 左侧文本
 * @param block 节点
 */
removeLeftText(block: NodeInterface | Node): void;
```

### `getBlockByRange`

生成 cursor 左侧或右侧的节点，放在一个和父节点一样的容器里

```ts
/**
 * 生成 cursor 左侧或右侧的节点，放在一个和父节点一样的容器里
 * isLeft = true：左侧
 * isLeft = false：右侧
 * @param {block,range,isLeft,clone,keepID} 节点，光标，左侧或右侧, 是否复制，是否保持id
 *
 */
getBlockByRange({
    block,
    range,
    isLeft,
    clone,
    keepID,
}: {
    block: NodeInterface | Node;
    range: RangeInterface;
    isLeft: boolean;
    clone?: boolean;
    keepID?: boolean;
}): NodeInterface;
```

### `normal`

整理块级节点为符合标准的编辑器值

```ts
/**
 * 整理块级节点
 * @param node 节点
 * @param root 根节点
 */
normal(node: NodeInterface, root: NodeInterface): void;
```

### `insertEmptyBlock`

插入一个空的 block 节点

```ts
/**
 * 插入一个空的block节点
 * @param range 光标所在位置
 * @param block 节点
 * @returns
 */
insertEmptyBlock(range: RangeInterface, block: NodeInterface): void;
```

### `insertOrSplit`

在光标位置插入或分割节点

```ts
/**
 * 在光标位置插入或分割节点
 * @param range 光标所在位置
 * @param block 节点
 */
insertOrSplit(range: RangeInterface, block: NodeInterface): void;
```
