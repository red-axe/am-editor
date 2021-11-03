# InlineModel

编辑行内节点的相关操作

类型：`InlineModelInterface`

## 使用

```ts
new Engine(...).inline
```

## 构造函数

```ts
new (editor: EditorInterface): InlineModelInterface
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

### `closest`

获取最近的 Inline 节点，找不到返回 node

```ts
/**
 * 获取最近的 Inline 节点，找不到返回 node
 */
closest(node: NodeInterface): NodeInterface;
```

### `closestNotInline`

获取向上第一个非 Inline 节点

```ts
/**
 * 获取向上第一个非 Inline 节点
 */
closestNotInline(node: NodeInterface): NodeInterface;
```

### `wrap`

给当前光标节点添加 inline 包裹

```ts
/**
 * 给当前光标节点添加inline包裹
 * @param inline inline标签
 * @param range 光标，默认获取当前光标
 */
wrap(inline: NodeInterface | Node | string, range?: RangeInterface): void;
```

### `unwrap`

移除 inline 包裹

```ts
/**
 * 移除inline包裹
 * @param range 光标，默认当前编辑器光标,或者需要移除的inline节点
 */
unwrap(range?: RangeInterface | NodeInterface): void;
```

### `insert`

插入 inline 标签

```ts
/**
 * 插入inline标签
 * @param inline inline标签
 * @param range 光标
 */
insert(inline: NodeInterface | Node | string, range?: RangeInterface): void;
```

### `split`

分割 inline 标签

```ts
/**
 * 分割inline标签
 * @param range 光标，默认获取当前光标
 */
split(range?: RangeInterface): void;
```

### `findInlines`

获取光标范围内的所有 inline 标签

```ts
/**
 * 获取光标范围内的所有 inline 标签
 * @param range 光标
 */
findInlines(range: RangeInterface): Array<NodeInterface>;
```

### `repairCursor`

修复 inline 节点光标占位符

```ts
/**
 * 修复inline节点光标占位符
 * @param node inlne 节点
 */
repairCursor(node: NodeInterface | Node): void;
```

### `repairRange`

修复光标选区位置，&#8203;<a>&#8203;<anchor />acde<focus />&#8203;</a>&#8203; -><anchor />&#8203;<a>&#8203;acde&#8203;</a>&#8203;<focus />

```ts
/**
 * 修复光标选区位置，&#8203;<a>&#8203;<anchor />acde<focus />&#8203;</a>&#8203; -><anchor />&#8203;<a>&#8203;acde&#8203;</a>&#8203;<focus />
 * 否则在ot中，可能无法正确的应用inline节点两边&#8203;的更改
 */
repairRange(range?: RangeInterface): RangeInterface;
```
