# Change

编辑器变更的相关操作

类型：`ChangeInterface`

## 使用

```ts
new Engine(...).change
```

## 构造函数

```ts
new (container: NodeInterface, options: ChangeOptions): ChangeInterface;
```

## 属性

### `rangePathBeforeCommand`

命令执行前的光标转换后的路径

```ts
rangePathBeforeCommand?: { start: RangePath; end: RangePath };
```

### `event`

事件

```ts
event: ChangeEventInterface;
```

### `range`

Range 对象

```ts
range: ChangeRangeInterface;
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

### `onChange`

编辑器值改变触发

```ts
/**
 * 编辑器值改变触发
 */
onChange: (trigger: 'remote' | 'local' | 'both') => void;
```

### `onSelect`

编辑器中光标改变触发

```ts
/**
 * 编辑器中光标改变触发
 */
onSelect: () => void;
```

### `onSetValue`

```ts
/**
 * 设置编辑器值后触发
 */
onSetValue: () => void;
```

### `change`

触发一个编辑器值改变事件

```ts
/**
 * 触发一个编辑器值改变事件
 * @param isRemote 是否是远程操作
 * @param node 触发后变更的节点
 */
change(isRemote?: boolean, node?: Array<NodeInterface>): void;
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

### `combinText`

把当前编辑中间断的字符组合成一段不间断的字符

```ts
combinText(): void;
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

### `initValue`

初始化一个编辑器空值

```ts
/**
 * 初始化一个编辑器空值
 * @param range
 */
initValue(range?: RangeInterface): void;
```

### `setValue`

设置编辑器值

```ts
/**
 * 给编辑器设置一个值
 * @param value 值
 * @param onParse 解析回调
 * @param callback 渲染完成后回调
 */
setValue(
	value: string,
	onParse?: (node: NodeInterface) => void,
	callback?: (count: number) => void,
): void;
```

### `setHtml`

设置 html 作为编辑器值，会走粘贴事件及解析，可监听 paste:each 事件拦截自定义处理每个节点

```ts
/**
 * 设置html，会格式化为合法的编辑器值
 * @param html html
 * @param callback 异步渲染卡片后回调
 */
setHtml(html: string, callback?: (count: number) => void): void;

```

### `setMarkdown`

设置 markdown，会格式化为合法的编辑器值

会走粘贴 markdown 事件，可在 markdown-it 和 markdown-token 事件中拦截自定义处理

```ts
/**
 * 设置markdown，会格式化为合法的编辑器值
 * @param text markdown文本
 * @param callback 异步渲染卡片后回调
 */
setMarkdown(text: string, callback?: (count: number) => void): void;
```

### `getOriginValue`

获取编辑器原始值

```ts
/**
 * 获取指定容器的值
 * @param container 指定容器的，默认为编辑器根节点
 */
getOriginValue(container?: NodeInterface): string;
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

### `insert`

插入 Fragment

```ts
/**
 * 插入片段
 * @param fragment 片段
 * @param range 光标位置，默认当前光标位置
 * @param callback 插入后的回调函数
 * @param followActiveMark 删除后空标签是否跟随当前激活的mark样式
 */
insert(
	fragment: DocumentFragment,
	range?: RangeInterface,
	callback?: (range: RangeInterface) => void,
	followActiveMark?: boolean,
): void;
```

### `paste`

在当前光标位置粘贴一段 html

```ts
/**
 * 在当前光标位置粘贴一段html
 * @param html html
 * @param range 光标位置
 * @param callback 卡片渲染回调
 */
paste(
	html: string,
	range?: RangeInterface,
	callback?: (count: number) => void,
): void;
```

### `delete`

删除内容

```ts
/**
 * 删除内容
 * @param range 光标，默认获取当前光标
 * @param isDeepMerge 删除后是否合并
 * @param followActiveMark 删除后空标签是否跟随当前激活的mark样式
 */
delete(
	range?: RangeInterface,
	isDeepMerge?: boolean,
	followActiveMark?: boolean,
): void;
```

### `unwrap`

去除当前光标最接近的 block 节点或传入的节点外层包裹

```ts
/**
 * 去除当前光标最接近的block节点或传入的节点外层包裹
 * @param node 节点
 */
unwrap(node?: NodeInterface): void;
```

### `mergeAfterDelete`

删除当前光标最接近的 block 节点或传入的节点的前面一个节点后合并

```ts
/**
 * 删除当前光标最接近的block节点或传入的节点的前面一个节点后合并
 * @param node 节点
 */
mergeAfterDelete(node?: NodeInterface): void;
```

### `destroy`

销毁

```ts
destroy(): void;
```
