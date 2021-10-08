# ListModel

编辑列表节点的相关操作

类型：`ListModelInterface`

## 使用

```ts
new Engine(...).list
```

## 构造函数

```ts
new (editor: EditorInterface): ListModelInterface
```

## 属性

### `CUSTOMZIE_UL_CLASS`

只读

自定义列表样式标记

### `CUSTOMZIE_LI_CLASS`

只读

自定义列表项样式标记

### `INDENT_KEY`

只读

列表缩进 key 标记，用于获取列表缩进值

## 方法

### `init`

初始化

```ts
/**
 * 初始化
 */
init(): void;
```

### `isEmptyItem`

判断列表项节点是否为空

```ts
/**
 * 判断列表项节点是否为空
 * @param node 节点
 */
isEmptyItem(node: NodeInterface): boolean;
```

### `isSame`

判断两个节点是否是一样的 List 节点

```ts
/**
 * 判断两个节点是否是一样的List节点
 * @param sourceNode 源节点
 * @param targetNode 目标节点
 */
isSame(sourceNode: NodeInterface, targetNode: NodeInterface): boolean;
```

### `isSpecifiedType`

判断节点集合是否是指定类型的 List 列表

```ts
/**
 * 判断节点集合是否是指定类型的List列表
 * @param blocks 节点集合
 * @param name 节点标签类型
 * @param card 是否是指定的自定义列表项的卡片名称
 */
isSpecifiedType(
    blocks: Array<NodeInterface>,
    name?: 'ul' | 'ol',
    card?: string,
): boolean;
```

### `getPlugins`

获取所有 List 插件

```ts
/**
 * 获取所有List插件
 */
getPlugins(): Array<ListInterface>;
```

### `getPluginNameByNode`

根据列表节点获取列表插件名称

```ts
/**
 * 根据列表节点获取列表插件名称
 * @param block 节点
 */
getPluginNameByNode(block: NodeInterface): string;
```

### `getPluginNameByNodes`

获取一个列表节点集合所属列表插件名称

```ts
/**
 * 获取一个列表节点集合所属列表插件名称
 * @param blocks 节点集合
 */
getPluginNameByNodes(blocks: Array<NodeInterface>): string;
```

### `unwrapCustomize`

清除自定义列表节点相关属性

```ts
/**
 * 清除自定义列表节点相关属性
 * @param node 节点
 */
unwrapCustomize(node: NodeInterface): NodeInterface;
```

### `unwrap`

取消节点的列表

```ts
/**
 * 取消节点的列表
 * @param blocks 节点集合
 */
unwrap(blocks: Array<NodeInterface>): void;
```

### `normalize`

获取当前选区的修复列表后的节点集合

```ts
/**
 * 获取当前选区的修复列表后的节点集合
 */
normalize(): Array<NodeInterface>;
```

### `split`

将选中列表项列表分割出来单独作为一个列表

```ts
/**
 * 将选中列表项列表分割出来单独作为一个列表
 */
split(): void;
```

### `merge`

合并列表

```ts
/**
 * 合并列表
 * @param blocks 节点集合，默认为当前选区的blocks
 */
merge(blocks?: Array<NodeInterface>, range?: RangeInterface): void;
```

### `addStart`

给列表添加 start 序号

```ts
/**
 * 给列表添加start序号
 * @param block 列表节点
 */
addStart(block?: NodeInterface): void;
```

### `addIndent`

给列表节点增加缩进

```ts
/**
 * 给列表节点增加缩进
 * @param block 列表节点
 * @param value 缩进值
 */
addIndent(block: NodeInterface, value: number, maxValue?: number): void;
```

### `getIndent`

获取列表节点 indent 值

```ts
/**
 * 获取列表节点 indent 值
 * @param block 列表节点
 * @returns
 */
getIndent(block: NodeInterface): number;
```

### `addCardToCustomize`

为自定义列表项添加卡片节点

```ts
/**
 * 为自定义列表项添加卡片节点
 * @param node 列表节点项
 * @param cardName 卡片名称，必须是支持inline卡片类型
 * @param value 卡片值
 */
addCardToCustomize(
    node: NodeInterface | Node,
    cardName: string,
    value?: any,
): CardInterface | undefined;
```

### `addReadyCardToCustomize`

为自定义列表项添加待渲染卡片节点

```ts
/**
 * 为自定义列表项添加待渲染卡片节点
 * @param node 列表节点项
 * @param cardName 卡片名称，必须是支持inline卡片类型
 * @param value 卡片值
 */
addReadyCardToCustomize(
    node: NodeInterface | Node,
    cardName: string,
    value?: any,
): NodeInterface | undefined;
```

### `addBr`

给列表添加 BR 标签

```ts
/**
 * 给列表添加BR标签
 * @param node 列表节点项
 */
addBr(node: NodeInterface): void;
```

### `toCustomize`

将节点转换为自定义节点

```ts
/**
 * 将节点转换为自定义节点
 * @param blocks 节点
 * @param cardName 卡片名称
 * @param value 卡片值
 */
toCustomize(
    blocks: Array<NodeInterface> | NodeInterface,
    cardName: string,
    value?: any,
): Array<NodeInterface> | NodeInterface;
```

### `toNormal`

将节点转换为列表节点

```ts
/**
 * 将节点转换为列表节点
 * @param blocks 节点
 * @param tagName 列表节点名称，ul 或者 ol，默认为ul
 * @param start 有序列表开始序号
 */
toNormal(
    blocks: Array<NodeInterface> | NodeInterface,
    tagName?: 'ul' | 'ol',
    start?: number,
): Array<NodeInterface> | NodeInterface;
```

### `isFirst`

判断选中的区域是否在列表的开始

```ts
/**
 * 判断选中的区域是否在列表的开始
 * 选中的区域
 */
isFirst(range: RangeInterface): boolean;
```

### `isLast`

判断选中的区域是否在列表的末尾

```ts
/**
 * 判断选中的区域是否在列表的末尾
 */
isLast(range: RangeInterface): boolean;
```
