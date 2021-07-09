# Change

编辑器变更的相关操作

类型：`ChangeInterface`

## 构造函数

```ts
new (container: NodeInterface, options: ChangeOptions): ChangeInterface;
```

## 属性

### `rangePathBeforeCommand`

命令执行前的光标转换后的路径

```ts
rangePathBeforeCommand: Path[] | null;
```

### `event`

事件

```ts
event: ChangeEventInterface;
```

### `marks`

当前光标选区中的所有样式节点

```ts
marks: Array<NodeInterface>;
```

### `blocks`

当前光标选区中的所有块级节点

```ts
blocks: Array<NodeInterface>;
```

### `inlines`

当前光标选区中的所有行内节点

```ts
inlines: Array<NodeInterface>;
```

## 方法

### `getRange`

获取当前选区的范围

```ts
/**
 * 获取当前选区的范围
 */
getRange(): RangeInterface;
```

### `getSafeRange`

获取安全可控的光标对象

```ts
/**
 * 获取安全可控的光标对象
 * @param range 默认当前光标
 */
getSafeRange(range?: RangeInterface): RangeInterface;
```

### `select`

选中指定的范围

```ts
/**
 * 选中指定的范围
 * @param range 光标
 */
select(range: RangeInterface): ChangeInterface;
```

### `focus`

聚焦编辑器

```ts
/**
 * 聚焦编辑器
 * @param toStart true:开始位置,false:结束位置，默认为之前操作位置
 */
focus(toStart?: boolean): ChangeInterface;
```

### `blur`

取消焦点

```ts
	/**
 * 取消焦点
 */
blur(): ChangeInterface;
```

### `apply`

应用一个具有改变 dom 结构的操作

```ts
/**
 * 应用一个具有改变dom结构的操作
 * @param range 光标
 */
apply(range?: RangeInterface): void;
```

### `combinTextNode`

把当前编辑中间断的字符组合成一段不间断的字符

```ts
combinTextNode(): void;
```

### `isComposing`

是否在组合输入中

```ts
isComposing(): boolean;
```

### `isSelecting`

是否正在选择中

```ts
isSelecting(): boolean;
```

### `setValue`

设置编辑器值

```ts
/**
 * @param value 值
 * @param onParse 在转换为符合标准的编辑器值前使用根节点解析过滤
 * @param options 异步渲染卡片配置
 * */
setValue(value: string, onParse?: (node: Node) => void, options?: {
			enableAsync?: boolean;
			triggerOT?: boolean;
			callback?: (count: number) => void;
		}): void;
```

### `setHtml`

设置 html 作为编辑器值

```ts
/**
 * 设置html，会格式化为合法的编辑器值
 * @param html html
 * @param options 异步渲染卡片配置
 */
setHtml(html: string, options?: {
			enableAsync?: boolean;
			triggerOT?: boolean;
			callback?: (count: number) => void;
		}): void
```

### `getOriginValue`

获取编辑器原始值

```ts
getOriginValue(): string;
```

### `getValue`

获取编辑器值

```ts
/**
 * @param ignoreCursor 是否忽悠光标所在的记录节点
 * */
getValue(options: { ignoreCursor?: boolean }): string;
```

### `cacheRangeBeforeCommand`

在执行命令前缓存光标对象

```ts
cacheRangeBeforeCommand(): void;
```

### `getRangePathBeforeCommand`

获取命令执行前的光标转换后的路径

```ts
getRangePathBeforeCommand(): Path[] | null;
```

### `isEmpty`

当前编辑器是否是空值

```ts
isEmpty(): boolean;
```

### `destroy`

销毁

```ts
destroy(): void;
```

### `insertFragment`

插入片段

```ts
/**
 * 插入片段
 * @param fragment 片段
 * @param callback 插入后的回调函数
 */
insertFragment(fragment: DocumentFragment, callback?: () => void): void;
```

### `deleteContent`

删除内容

```ts
/**
 * 删除内容
 * @param range 光标，默认获取当前光标
 * @param isDeepMerge 删除后执行合并操作
 */
deleteContent(range?: RangeInterface, isDeepMerge?: boolean): void;
```

### `addBrAfterDelete`

删除节点，删除后如果是空段落，自动添加 BR

```ts
/**
 * 删除节点，删除后如果是空段落，自动添加 BR
 * @param node 要删除的节点
 */
addBrAfterDelete(node: NodeInterface): void;
```

### `unwrapNode`

去除当前光标最接近的 block 节点或传入的节点外层包裹

```ts
/**
 * 去除当前光标最接近的block节点或传入的节点外层包裹
 * @param node 节点
 */
unwrapNode(node?: NodeInterface): void;
```

### `mergeAfterDeletePrevNode`

删除当前光标最接近的 block 节点或传入的节点的前面一个节点后合并

```ts
/**
 * 删除当前光标最接近的block节点或传入的节点的前面一个节点后合并
 * @param node 节点
 */
mergeAfterDeletePrevNode(node?: NodeInterface): void;
```

### `focusPrevBlock`

焦点移动到当前光标最接近的 block 节点或传入的节点前一个 Block

```ts
/**
 * 焦点移动到当前光标最接近的block节点或传入的节点前一个 Block
 * @param block 节点
 * @param isRemoveEmptyBlock 如果前一个block为空是否删除，默认为否
 */
focusPrevBlock(block?: NodeInterface, isRemoveEmptyBlock?: boolean): void;
```
