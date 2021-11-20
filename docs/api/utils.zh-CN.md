# 实用方法和常量

## 常量

### `isEdge`

否是 Edge 浏览器

### `isChrome`

是否是 Chrome 浏览器

### `isFirefox`

是否是 Firefox 浏览器

### `isSafari`

是否是 Safari 浏览器

### `isMobile`

是否是 手机浏览器

### `isIos`

是否是 iOS 系统

### `isAndroid`

是否是 安卓系统

### `isMacos`

是否是 Mac OS X 系统

### `isWindows`

是否是 Windows 系统

## 方法

### `isNodeEntry`

是否是 NodeInterface 对象

接受以下类型对象

-   `string`
-   `HTMLElement`
-   `Node`
-   `Array<Node>`
-   `NodeList`
-   `NodeInterface`
-   `EventTarget`

### `isNodeList`

是否是 NodeList 对象

接受以下类型对象

-   `string`
-   `HTMLElement`
-   `Node`
-   `Array<Node>`
-   `NodeList`
-   `NodeInterface`
-   `EventTarget`

### `isNode`

是否是 Node 对象

接受以下类型对象

-   `string`
-   `HTMLElement`
-   `Node`
-   `Array<Node>`
-   `NodeList`
-   `NodeInterface`
-   `EventTarget`

### `isSelection`

是否是 window.Selection 对象

接受以下类型对象

-   Window
-   Selection
-   Range

### `isRange`

是否是 window.Range

接受以下类型对象

-   Window
-   Selection
-   Range

### `isRangeInterface`

是否是从 Range 扩展的 RangeInterface 对象

接受以下类型对象

-   NodeInterface
-   RangeInterface

### `isSchemaRule`

是否是 `SchemaRule` 类型对象

接受以下类型对象

-   SchemaRule
-   SchemaGlobal

### `isMarkPlugin`

是否是 Mark 类型插件

接受对象：`PluginInterface`

### `isInlinePlugin`

是否是 Inline 类型插件

接受对象：`PluginInterface`

### `isBlockPlugin`

是否是 Block 类型插件

接受对象：`PluginInterface`

### `isEngine`

是否是引擎

接受对象：`EditorInterface`

### `combinText`

移除空的文本节点，并连接相邻的文本节点

```ts
combinText(node: NodeInterface | Node): void
```

### `getTextNodes`

获取一个 dom 元素内所有的 textnode 类型的元素

```ts
/**
 * 获取一个 dom 元素内所有的 textnode 类型的元素
 * @param  {Node} node - dom节点
 * @param  {Function} filter - 过滤器
 * @return {Array} 获取的文本节点
 */
getTextNodes(node: Node, filter?:(node: Node) => boolean): Array<Node>
```
