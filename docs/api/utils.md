# Useful methods and constants

## Constant

### `isEdge`

Edge browser

### `isChrome`

Is it a Chrome browser

### `isFirefox`

Is it a Firefox browser

### `isSafari`

Is it a Safari browser

### `isMobile`

Is it a mobile browser

### `isIos`

Is it an iOS system

### `isAndroid`

Whether it is Android

### `isMacos`

Is it a Mac OS X system

### `isWindows`

Is it a Windows system

## Method

### `isNodeEntry`

Whether it is a NodeInterface object

Accept the following types of objects

-   `string`
-   `HTMLElement`
-   `Node`
-   `Array<Node>`
-   `NodeList`
-   `NodeInterface`
-   `EventTarget`

### `isNodeList`

Is it a NodeList object

Accept the following types of objects

-   `string`
-   `HTMLElement`
-   `Node`
-   `Array<Node>`
-   `NodeList`
-   `NodeInterface`
-   `EventTarget`

### `isNode`

Is it a Node object

Accept the following types of objects

-   `string`
-   `HTMLElement`
-   `Node`
-   `Array<Node>`
-   `NodeList`
-   `NodeInterface`
-   `EventTarget`

### `isSelection`

Is it a window.Selection object

Accept the following types of objects

-   Window
-   Selection
-   Range

### `isRange`

Is it window.Range

Accept the following types of objects

-   Window
-   Selection
-   Range

### `isRangeInterface`

Whether it is a RangeInterface object extended from Range

Accept the following types of objects

-   NodeInterface
-   RangeInterface

### `isSchemaRule`

Is it an object of type `SchemaRule`

Accept the following types of objects

-   SchemaRule
-   SchemaGlobal

### `isMarkPlugin`

Is it a Mark type plugin

Accepted object: `PluginInterface`

### `isInlinePlugin`

Is it an Inline type plugin

Accepted object: `PluginInterface`

### `isBlockPlugin`

Is it a Block type plugin

Accepted object: `PluginInterface`

### `isEngine`

Is it an engine

Accepted object: `EditorInterface`

### `combinText`

Remove empty text nodes and connect adjacent text nodes

```ts
combinText(node: NodeInterface | Node): void
```

### `getTextNodes`

Get all textnode type elements in a dom element

```ts
/**
 * Get all textnode type elements in a dom element
 * @param {Node} node-dom node
 * @param {Function} filter-filter
 * @return {Array} the obtained text node
 */
getTextNodes(node: Node, filter?:(node: Node) => boolean): Array<Node>
```
