# MarkModel

编辑样式节点的相关操作

类型：`MarkModelInterface`

## 使用

```ts
new Engine(...).mark
```

## 构造函数

```ts
new (editor: EditorInterface): MarkModelInterface
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

根据节点查找 mark 插件实例

```ts
/**
 * 根据节点查找mark插件实例
 * @param node 节点
 */
findPlugin(node: NodeInterface): MarkInterface | undefined;
```

### `closestNotMark`

获取向上第一个非 Mark 节点

```ts
/**
 * 获取向上第一个非 Mark 节点
 */
closestNotMark(node: NodeInterface): NodeInterface;
```

### `compare`

比较两个节点是否相同，包括 attributes、style、class

```ts
/**
 * 比较两个节点是否相同，包括attributes、style、class
 * @param source 源节点
 * @param target 目标节点
 * @param isCompareValue 是否比较每项属性的值
 */
compare(
    source: NodeInterface,
    target: NodeInterface,
    isCompareValue?: boolean,
): boolean;
```

### `contain`

判断源节点是否包含目标节点的所有属性和样式

```ts
/**
 * 判断源节点是否包含目标节点的所有属性和样式
 * @param source 源节点
 * @param target 目标节点
 */
contain(source: NodeInterface, target: NodeInterface): boolean;
```

### `split`

分割 mark 标签

```ts
/**
 * 分割mark标签
 * @param range 光标，默认获取当前光标
 * @param removeMark 需要移除的空mark标签
 */
split(
    range?: RangeInterface,
    removeMark?: NodeInterface | Node | string | Array<NodeInterface>,
): void;
```

### `wrap`

在当前光标选区包裹 mark 标签

```ts
/**
 * 在当前光标选区包裹mark标签
 * @param mark mark标签
 * @param both mark标签两侧节点
 */
wrap(mark: NodeInterface | Node | string, range?: RangeInterface): void;
```

### `unwrap`

去掉 mark 包裹

```ts
/**
 * 去掉mark包裹
 * @param range 光标
 * @param removeMark 要移除的mark标签
 */
unwrap(
    removeMark?: NodeInterface | Node | string | Array<NodeInterface>,
    range?: RangeInterface,
): void;
```

### `merge`

合并选区的 mark 节点

```ts
/**
 * 合并选区的mark节点
 * @param range 光标，默认当前选区光标
 */
merge(range?: RangeInterface): void;
```

### `insert`

光标处插入 mark 标签

```ts
/**
 * 光标处插入mark标签
 * @param mark mark标签
 * @param range 指定光标，默认为编辑器选中的光标
 */
insert(mark: NodeInterface | Node | string, range?: RangeInterface): void;
```

### `findMarks`

查找对范围有效果的所有 Mark

```ts
/**
 * 查找对范围有效果的所有 Mark
 * @param range 范围
 */
findMarks(range: RangeInterface): Array<NodeInterface>;
```

### `removeEmptyMarks`

从下开始往上遍历删除空 Mark，当遇到空 Block，添加 BR 标签

```ts
/**
 * 从下开始往上遍历删除空 Mark，当遇到空 Block，添加 BR 标签
 * @param node 节点
 * @param addBr 是否添加br
 */
removeEmptyMarks(node: NodeInterface, addBr?: boolean): void;
```
