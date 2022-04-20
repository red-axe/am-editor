# NodeModel

编辑节点的相关操作

类型：`NodeModelInterface`

## 使用

```ts
new Engine(...).node
```

## 构造函数

```ts
new (editor: EditorInterface)
```

## 方法

### `isVoid`

是否是空节点

```ts
/**
 * 是否是空节点
 * @param node 节点或节点名称
 * @param schema 默认从 this.editor 中取 schema
 */
isVoid(
    node: NodeInterface | Node | string,
    schema?: SchemaInterface,
): boolean;
```

### `isMark`

是否是 mark 样式标签

```ts
/**
 * 是否是mark标签
 * @param node 节点
 */
isMark(node: NodeInterface | Node, schema?: SchemaInterface): boolean;
```

### `isInline`

是否是 inline 标签

```ts
/**
 * 是否是inline标签
 * @param node 节点
 */
isInline(node: NodeInterface | Node, schema?: SchemaInterface): boolean;
```

### `isBlock`

是否是 block 节点

```ts
/**
 * 是否是block节点
 * @param node 节点
 */
isBlock(node: NodeInterface | Node, schema?: SchemaInterface): boolean;
```

### `isNestedBlock`

判断 block 节点的子节点是否不包含 blco 节点

```ts
/**
 * 判断block节点的子节点是否不包含blco节点
 */
isNestedBlock(node: NodeInterface | Node): boolean;
```

### `isRootBlock`

判断节点是否是顶级根节点，父级为编辑器根节点，且，子级节点没有 block 节点

```ts
/**
 * 判断节点是否是顶级根节点，父级为编辑器根节点，且，子级节点没有block节点
 * @param node 节点
 * @returns
 */
isRootBlock(node: NodeInterface, schema?: SchemaInterface): boolean;
```

### `isEmpty`

判断节点下的文本是否为空

```ts
/**
 * 判断节点下的文本是否为空
 * @param node 节点
 * @param withTrim 是否 trim
 */
isEmpty(node: NodeInterface, withTrim?: boolean): boolean;
```

### `isEmptyWithTrim`

判断一个节点下的文本是否为空，或者只有空白字符

```ts
/**
 * 判断一个节点下的文本是否为空，或者只有空白字符
 * @param node 节点
 */
isEmptyWithTrim(node: NodeInterface): boolean;
```

### `isEmptyWidthChild`

判断一个节点是否为空，包括子节点

```ts
/**
 * 判断一个节点是否为空
 * @param node 节点
 */
isEmptyWidthChild(node: NodeInterface): boolean;
```

### `isList`

判断节点是否为列表节点

```ts
/**
 * 判断节点是否为列表节点
 * @param node 节点或者节点名称
 */
isList(node: NodeInterface | string | Node): boolean;
```

### `isCustomize`

判断节点是否是自定义列表

```ts
/**
 * 判断节点是否是自定义列表
 * @param node 节点
 */
isCustomize(node: NodeInterface): boolean;
```

### `unwrap`

去除节点的外层包裹

```ts
/**
 * 去除包裹
 * @param node 需要去除包裹的节点
 * @returns 返回移除外层后的所有子节点
 */
unwrap(node: NodeInterface): NodeInterface[];
```

### `wrap`

给节点外面包裹一层节点

```ts
/**
 * 包裹节点
 * @param source 需要包裹的节点
 * @param outer 包裹的外部节点
 * @param mergeSame 合并相同名称的节点样式和属性在同一个节点上
 */
wrap(
    source: NodeInterface | Node,
    outer: NodeInterface,
    mergeSame?: boolean,
): NodeInterface;
```

### `merge`

合并节点

```ts
/**
 * 合并节点
 * @param source 合并的节点
 * @param target 需要合并的节点
 * @param remove 合并后是否移除
 */
merge(source: NodeInterface, target: NodeInterface, remove?: boolean): void;
```

### `replace`

将源节点的子节点追加到目标节点，并替换源节点

```ts
/**
 * 将源节点的子节点追加到目标节点，并替换源节点
 * @param source 旧节点
 * @param target 新节点
 * @param copyId 是否复制id
 */
replace(
    source: NodeInterface,
    target: NodeInterface,
    copyId?: boolean,
): NodeInterface;
```

### `insert`

在光标位置插入一个节点

```ts
/**
 * 在光标位置插入一个节点
 * @param node 节点
 * @param range 光标
 * @param removeCurrentEmptyBlock 当前光标行是空行时是否删除
 */
insert(
    node: Node | NodeInterface,
    range?: RangeInterface,
    removeCurrentEmptyBlock?: boolean,
): RangeInterface | undefined;
```

### `insertText`

光标位置插入文本

```ts
/**
 * 光标位置插入文本
 * @param text 文本
 * @param range 光标
 */
insertText(
    text: string,
    range?: RangeInterface,
): RangeInterface | undefined;
```

### `setAttributes`

设置节点属性

```ts
/**
 * 设置节点属性
 * @param node 节点
 * @param props 属性
 */
setAttributes(node: NodeInterface, attributes: any): NodeInterface;
```

### `removeMinusStyle`

移除值为负的样式

```ts
/**
 * 移除值为负的样式
 * @param node 节点
 * @param style 样式名称
 */
removeMinusStyle(node: NodeInterface, style: string): void;
```

### `mergeChild`

合并节点下的子节点，两个相同的相邻节点的子节点，通常是 blockquote、ul、ol 标签

```ts
/**
 * 合并节点下的子节点，两个相同的相邻节点的子节点，通常是 blockquote、ul、ol 标签
 * @param node 当前节点
 */
mergeChild(node: NodeInterface): void;
```

### `removeSide`

删除节点两边标签

```ts
/**
 * 删除节点两边标签
 * @param node 节点
 * @param tagName 标签名称，默认为br标签
 */
removeSide(node: NodeInterface, tagName?: string): void;
```

### `flat`

扁平化节点，把节点修复到符合编辑器值的状态

```ts
/**
 * 整理节点
 * @param node 节点
 * @param root 根节点，默认为node节点
 */
flat(node: NodeInterface, root?: NodeInterface): void;
```

### `normalize`

标准化节点

```ts
/**
 * 标准化节点
 * @param node 节点
 */
normalize(node: NodeInterface): void;
```

### `html`

获取或设置元素节点 html 文本

```ts
/**
 * 获取或设置元素节点html文本
 * @param {string|undefined} val html文本
 * @return {NodeEntry|string} 当前实例或html文本
 */
html(node: NodeInterface): string;
html(node: NodeInterface, val: string): NodeInterface;
html(node: NodeInterface, val?: string): NodeInterface | string;
```

### `clone`

复制元素节点

```ts
/**
 * 复制元素节点
 * @param node 节点
 * @param deep 是否深度复制
 * @param copyId 是否复制data-id，默认复制
 * @return 复制后的元素节点
 */
clone(node: NodeInterface, deep?: boolean, copyId?: boolean): NodeInterface;
```

### `getBatchAppendHTML`

获取批量追加子节点后的 outerHTML

```ts
/**
 * 获取批量追加子节点后的outerHTML
 * @param nodes 节点集合
 * @param appendExp 追加的节点
 */
getBatchAppendHTML(nodes: Array<NodeInterface>, appendExp: string): string;
```

### `removeZeroWidthSpace`

移除零宽字符的占位符

```ts
/**
* 移除占位符 \u200B
* @param node 节点
*/
removeZeroWidthSpace(node: NodeInterface): void;
```
