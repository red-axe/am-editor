# 光标

继承自 `Range`，拥有`Range`所有的方法和属性，需要了解详细属性和方法，请访问浏览器 API[Range](https://developer.mozilla.org/zh-CN/docs/Web/API/Range/Range)

类型：`RangeInterface`

## 属性

以下只列出从`Range`对象扩展出来的属性和方法

### `base`

`Range` 对象

只读

### `startNode`

光标开始位置节点，只读

类型：`NodeInterface`

### `endNode`

光标结束位置节点，只读

类型：`NodeInterface`

### `commonAncestorNode`

开始节点和结束节点所共有最近的父节点

类型：`NodeInterface`

## 静态方法

### `create`

从一个 Point 位置创建 RangeInterface 对象

Point 可以理解为鼠标指针位置的 x,y 坐标点

```ts
/**
 * 从一个 Point 位置创建 RangeInterface 对象
 */
create: (
	editor: EditorInterface,
	doc?: Document,
	point?: { x: number; y: number },
) => RangeInterface;
```

### `from`

从 Window 、Selection、Range 中创建 RangeInterface 对象

```ts
/**
 * 从 Window 、Selection、Range 中创建 RangeInterface 对象
 */
from: (
	editor: EditorInterface,
	win?: Window | globalThis.Selection | globalThis.Range,
) => RangeInterface | null;
```

### `fromPath`

把路径还原为 RangeInterface 对象

```ts
/**
 * 从路径转换为光标
 * @param path
 * @param 上下文，默认编辑器节点
 */
fromPath(path: Path[], context?: NodeInterface): RangeInterface;
```

## 方法

### `select`

让光标选中一个节点

```ts
/**
 * 选中一个节点
 * @param node 节点
 * @param contents 是否只选中内容
 */
select(node: NodeInterface | Node, contents?: boolean): RangeInterface;
```

### `getText`

获取光标选中的所有节点的文本

```ts
/**
 * 获取光标选中的文本
 */
getText(): string | null;
```

### `getClientRect`

获取光标所占的区域

```ts
/**
 * 获取光标所占的区域
 */
getClientRect(): DOMRect;
```

### `enlargeFromTextNode`

将选择标记从 TextNode 扩大到最近非 TextNode 节点

```ts
/**
 * 将选择标记从 TextNode 扩大到最近非TextNode节点
 * range 实质所选择的内容不变
 */
enlargeFromTextNode(): RangeInterface;
```

### `shrinkToTextNode`

将选择标记从非 TextNode 缩小到 TextNode 节点上，与 enlargeFromTextNode 相反

```ts
/**
 * 将选择标记从非 TextNode 缩小到TextNode节点上，与 enlargeFromTextNode 相反
 * range 实质所选择的内容不变
 */
shrinkToTextNode(): RangeInterface;
```

### `enlargeToElementNode`

扩大光标选区边界

```ts
/**
 * 扩大边界
 * <p><strong><span>[123</span>abc]</strong>def</p>
 * to
 * <p>[<strong><span>123</span>abc</strong>]def</p>
 * @param range 选区
 * @param toBlock 是否扩大到块级节点
 */
enlargeToElementNode(toBlock?: boolean): RangeInterface;
```

### `shrinkToElementNode`

缩小光标选区边界

```ts
/**
 * 缩小边界
 * <body>[<p><strong>123</strong></p>]</body>
 * to
 * <body><p><strong>[123]</strong></p></body>
 */
shrinkToElementNode(): RangeInterface;
```

### `createSelection`

创建 selectionElement，通过插入自定义 span 节点标记光标 anchor、focus 或 cursor 的位置。通过这些标记我们可以很轻松的获取到选区内的节点

更多属性和方法请查看 `SelectionInterface` API

```ts
/**
 * 创建 selectionElement，通过插入 span 节点标记位置
 */
createSelection(): SelectionInterface;
```

### `getSubRanges`

将光标选区按照文本节点和卡片节点分割为多个子选区

```ts
/**
 * 获取子选区集合
 * @param includeCard 是否包含卡片
 */
getSubRanges(includeCard?: boolean): Array<RangeInterface>;
```

### `setOffset`

让光标选择一个节点，并设置它的开始位置偏移量和结束位置偏移量

```ts
/**
 * @param node 要设置的节点
 * @param start 开始位置的偏移量
 * @param end 结束位置的偏移量
 * */
setOffset(
    node: Node | NodeInterface,
    start: number,
    end: number,
): RangeInterface;
```

### `findElements`

在光标区域中查找元素节点集合，不包括 Text 文本节点

```ts
findElements(): Array<Node>;
```

### `inCard`

查询光标是否在卡片内

```ts
inCard(): boolean;
```

### `getStartOffsetNode`

获取相对于光标开始位置节点的偏移量处的节点

```ts
getStartOffsetNode(): Node;
```

### `getEndOffsetNode`

获取相对于光标结束位置节点的偏移量处的节点

```ts
getEndOffsetNode(): Node;
```

### `containsCard`

光标区域是否包含卡片

```ts
/**
 * 是否包含卡片
 */
containsCard(): boolean;
```

### `handleBr`

在光标位置修复 Br 节点

```ts
/**
 * 输入内容时，删除浏览器生成的 BR 标签，对空 block 添加 BR
 * 删除场景
 * <p><br />foo</p>
 * <p>foo<br /></p>
 * 保留场景
 * <p><br /><br />foo</p>
 * <p>foo<br /><br /></p>
 * <p>foo<br />bar</p>
 * 添加场景
 * <p></p>
 * @param isLeft
 */
handleBr(isLeft?: boolean): RangeInterface;
```

### `getPrevNode`

获取光标开始位置前的节点

```ts
/**
 * 获取开始位置前的节点
 * <strong>foo</strong>|bar
 */
getPrevNode(): NodeInterface | undefined;
```

### `getNextNode`

获取结束位置后的节点

```ts
/**
 * 获取结束位置后的节点
 * foo|<strong>bar</strong>
 */
getNextNode(): NodeInterface | undefined;
```

### `deepCut`

剪切光标选择区域的内容。数据会在剪贴板上

```ts
/**
 * 深度剪切
 */
deepCut(): void;
```

### `equal`

对比两个光标对象范围是否相等

```ts
/**
 * 对比两个范围是否相等
 *范围
    */
equal(range: RangeInterface | globalThis.Range): boolean;
```

### `getRootBlock`

获取当前选区最近的根节点

```ts
/**
 * 获取当前选区最近的根节点
 */
getRootBlock(): NodeInterface | undefined;
```

### `filterPath`

过滤路径

```ts
/**
 * 过滤路径
 * @param includeCardCursor
 */
filterPath(includeCardCursor?: boolean): (node: Node) => boolean;
```

### `toPath`

将光标选区转换为路径

```ts
/**
 * 获取光标路径
 * @param includeCardCursor 是否包含卡片两侧光标
 */
toPath(
	includeCardCursor?: boolean,
): { start: RangePath; end: RangePath } | undefined;
```
