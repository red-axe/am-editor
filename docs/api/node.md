# Extend Node

Expand on the `Node` node of the DOM

Type: `NodeInterface`

## Create `NodeInterface` object

Use the `$` node selector provided in the engine to instantiate the `NodeInterface` object

```ts
const { $ } = engine;
//Use CSS selector to find nodes
const content = $('.content');
//Create node
const div = $('<div></div>');
//Conversion
const p = $(document.querySelector('p'));
const target = $(event.target);
```

## Attributes

### `length`

Node node collection length

Type: `number`

### `events`

The collection of event objects of all Node nodes in the current object

Type: `EventInterface[]`

### `document`

The Document object where the current Node node is located. In the use of iframe, the document in different frames is not consistent, and there are other environments as well, so we need to follow this object.

Type: `Document | null`

### `window`

The Window object where the current Node node is located. In the use of iframes, the windows in different frames are not consistent, and the same is true in some other environments, so we need to follow this object.

Type: `Window | null`

### `context`

Context node

Type: `Context | undefined`

### `name`

Node name

Type: `string`

### `type`

Node type, consistent with `Node.nodeType` [API](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType)

Type: `number | undefined`

### `display`

Node display status

Type: `string | undefined`

### `isFragment`

Whether the Node node collection in the current object is a frame fragment

Type: `boolean`

### `[n: number]`

Node node collection, which can be accessed by subscript index

Return type: Node

## Method

### `each`

Traverse all Node nodes in the current object

```ts
/**
* Traverse
* @param {Function} callback callback function
* @return {NodeInterface} returns the current instance
*/
each(
    callback: (node: Node, index: number) => boolean | void,
): NodeInterface;
```

### `toArray`

Convert all Node nodes in the current object to an array

```ts
toArray(): Array<NodeInterface>;
```

### `isElement`

Whether the current node is Node.ELEMENT_NODE node type

```ts
isElement(): boolean;
```

### `isText`

Whether the current node is Node.TEXT_NODE node type

```ts
isText(): boolean;
```

### `isCard`

Whether the current node is a Card component

```ts
isCard(): boolean;
```

### `isBlockCard`

Whether the current node is a Card component of block type

```ts
isBlockCard(): boolean;
```

### `isInlineCard`

Whether the current node is a Card component of inline type

```ts
isInlineCard(): boolean;
```

### `isEditableCard`

Is it an editable card

```ts
isEditableCard(): boolean;
```

### `isPseudoBlockCard`

Inline card with display:block css attribute

```ts
isPseudoBlockCard(): boolean;
```

### `isRoot`

Whether it is the root node

```ts
isRoot(): boolean;
```

### `isEditable`

Whether it is an editable node

```ts
isEditable(): boolean;
```

### `inEditor`

Is it in the root node

```ts
inEditor(): boolean;
```

### `isCursor`

Whether it is a cursor marked node

```ts
isCursor(): boolean
```

### `get`

Get the current Node node

```ts
get<E extends Node>(): E | null;
```

### `eq`

Get the current index node

```ts
/**
 * Get the current index node
 * @param {number} index
 * @return {NodeInterface|undefined} NodeInterface class, or undefined
 */
eq(index: number): NodeInterface | undefined;
```

### `index`

Get the index of the parent node where the current node is located, and only count the nodes whose node type is ELEMENT_NODE

```ts
/**
 * Get the index of the parent node where the current node is located, and only calculate the node whose node type is ELEMENT_NODE
 * @return {number} return index
 */
index(): number;
```

### `parent`

Get the parent node of the current node

```ts
/**
 * Get the parent node of the current node
 * @return {NodeInterface} parent node
 */
parent(): NodeInterface | undefined;
```

### `children`

Query all child nodes of the current node

```ts
/**
 *
 * @param {Node | string} selector finder
 * @return {NodeInterface} Eligible child nodes
 */
children(selector?: string): NodeInterface;
```

### `first`

Get the first child node of the current node

```ts
/**
 * Get the first child node of the current node
 * @return {NodeInterface} NodeInterface child node
 */
first(): NodeInterface | null;
```

### `last`

Get the last child node of the current node

```ts
/**
 * Get the last child node of the current node
 * @return {NodeInterface} NodeInterface child node
 */
last(): NodeInterface | null;
```

### `prev`

Return the sibling nodes before the node (including text nodes and comment nodes)

```ts
/**
 * Return the sibling nodes before the node (including text nodes and comment nodes)
 * @return {NodeInterface} NodeInterface node
 */
prev(): NodeInterface | null;
```

### `next`

Return the sibling nodes after the node (including text nodes and comment nodes)

```ts
/**
 * Return the sibling nodes after the node (including text nodes and comment nodes)
 * @return {NodeInterface} NodeInterface node
 */
next(): NodeInterface | null;
```

### `prevElement`

Return the sibling nodes before the node (not including text nodes and comment nodes)

```ts
/**
 * Return the sibling nodes before the node (not including text nodes and comment nodes)
 * @return {NodeInterface} NodeInterface node
 */
prevElement(): NodeInterface | null;
```

### `nextElement`

Return the sibling nodes after the node (not including text nodes and comment nodes)

```ts
/**
 * Return the sibling nodes after the node (not including text nodes and comment nodes)
 * @return {NodeInterface} NodeInterface node
 */
nextElement(): NodeInterface | null;
```

### `getPath`

Returns the path of the root node where the node is located, the default root node is document.body

```ts
/**
 * Return the path of the root node where the node is located, the default root node is document.body
 * @param {Node} context root node, the default is document.body
 * @return {number} path
 */
getPath(context?: Node | NodeInterface): Array<number>;
```

### `contains`

Determine whether the node contains the node to be queried

```ts
/**
 * Determine whether the node contains the node to be queried
 * @param {NodeInterface | Node} node The node to be queried
 * @return {Boolean} Does it contain
 */
contains(node: NodeInterface | Node): boolean;
```

### `find`

Query the current node according to the querier

```ts
/**
 * Query the current node according to the querier
 * @param {String} selector finder
 * @return {NodeInterface} returns a NodeInterface instance
 */
find(selector: string): NodeInterface;
```

### closest

Query the parent node closest to the current node that meets the criteria according to the querier

```ts
/**
 * Query the parent node closest to the current node that meets the criteria according to the querier
 * @param {string} selector querier
 * @return {NodeInterface} returns a NodeInterface instance
 */
closest(
    selector: string,
    callback?: (node: Node) => Node | undefined,
): NodeInterface;
```

### `on`

Bind events to the current node

```ts
/**
 * Bind events to the current node
 * @param {String} eventType event type
 * @param {Function} listener event function
 * @return {NodeInterface} returns the current instance
 */
on(eventType: string, listener: EventListener): NodeInterface;
```

### `off`

Remove current node event

```ts
/**
 * Remove the current node event
 * @param {String} eventType event type
 * @param {Function} listener event function
 * @return {NodeInterface} returns the current instance
 */
off(eventType: string, listener: EventListener): NodeInterface;
```

### `getBoundingClientRect`

Get the position of the current node relative to the viewport

```ts
/**
 * Get the position of the current node relative to the viewport
 * @param {Object} defaultValue default value
 * @return {Object}
 * {
 * top,
 * bottom,
 * left,
 * right
 *}
 */
getBoundingClientRect(defaultValue?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
}):
    | {top: number; bottom: number; left: number; right: number}
    | undefined;
```

### `removeAllEvents`

Remove all bound events of the current node

```ts
/**
 * Remove all bound events of the current node
 * @return {NodeInterface} current NodeInterface instance
 */
removeAllEvents(): NodeInterface;
```

### `offset`

Get the offset of the current node relative to the parent node

```ts
/**
 * Get the offset of the current node relative to the parent node
 */
offset(): number;
```

### `attributes`

Get or set node attributes

```ts
/**
 * Get or set node attributes
 * @param {string|undefined} key attribute name, key is empty to get all attributes, return Map
 * @param {string|undefined} val attribute value, val is empty to get the attribute of the current key, return string|null
 * @return {NodeInterface|{[k:string]:string}} return value or current instance
 */
attributes(): {[k: string]: string };
attributes(key: {[k: string]: string }): string;
attributes(key: string, val: string | number): NodeInterface;
attributes(key: string): string;
attributes(
    key?: string | {[k: string]: string },
    val?: string | number,
): NodeInterface | {[k: string]: string} | string;
```

### `removeAttributes`

Remove node attributes

```ts
/**
 * Remove node attributes
 * @param {String} key attribute name
 * @return {NodeInterface} returns the current instance
 */
removeAttributes(key: string): NodeInterface;
```

### `hasClass`

Determine whether the node contains a certain class

```ts
/**
 * Determine whether the node contains a certain class
 * @param {String} className style name
 * @return {Boolean} Does it contain
 */
hasClass(className: string): boolean;
```

### `addClass`

Add a class to the node

```ts
/**
 *
 * @param {string} className
 * @return {NodeInterface} returns the current instance
 */
addClass(className: string): NodeInterface;
```

### `removeClass`

Remove node class

```ts
/**
 * Remove node class
 * @param {String} className
 * @return {NodeInterface} returns the current instance
 */
removeClass(className: string): NodeInterface;
```

### `css`

Get or set the node style

```ts
/**
 * Get or set the node style
 * @param {String|undefined} key style name
 * @param {String|undefined} val style value
 * @return {NodeInterface|{[k:string]:string}} return value or current instance
 */
css(): {[k: string]: string };
css(key: {[k: string]: string | number }): NodeInterface;
css(key: string): string;
css(key: string, val: string | number): NodeInterface;
css(
    key?: string | {[k: string]: string | number },
    val?: string | number,
): NodeInterface | {[k: string]: string} | string;
```

### `width`

Get node width

```ts
/**
 * Get node width
 * @return {number} width
 */
width(): number;
```

### `height`

Get node height

```ts
/**
 * Get node height
 * @return {Number} height
 */
height(): number;
```

### `html`

Get or set node html text

```ts
/**
 * Get or set node html text
 */
html(): string;
html(html: string): NodeInterface;
html(html?: string): NodeInterface | string;
```

### `text`

```ts
/**
 * Get or set the node text
 */
text(): string;
text(text: string): NodeInterface;
text(text?: string): string | NodeInterface;
```

### `show`

Set the node to display state

```ts
/**
 * Set the node to display state
 * @param {String} display display value
 * @return {NodeInterface} current instance
 */
show(display?: string): NodeInterface;
```

### `hide`

Set node to hidden state

```ts
/**
 * Set the node to hidden
 * @return {NodeInterface} current instance
 */
hide(): NodeInterface;
```

### `remove`

Remove all nodes of the current instance

```ts
/**
 * Remove all nodes of the current instance
 * @return {NodeInterface} current instance
 */
remove(): NodeInterface;
```

### `empty`

Clear all child nodes under the node, including text

```ts
/**
 * Clear all child nodes under the node
 * @return {NodeInterface} current instance
 */
empty(): NodeInterface;
```

### `equal`

Compare whether two nodes are the same, including the reference address

```ts
/**
* Compare whether two nodes are the same
* @param {NodeInterface|Node} node The node to compare
* @return {Boolean} are they the same
*/
equal(node: NodeInterface | Node): boolean;
```

### `clone`

Copy node

```ts
/**
 * Copy node
 * @param deep Whether to deep copy
 */
clone(deep?: boolean): NodeInterface;
```

### `prepend`

Insert the specified content at the beginning of the node

```ts
/**
 * Insert the specified content at the beginning of the node
 * @param {Selector} selector selector or node
 * @return {NodeInterface} current instance
 */
prepend(selector: Selector): NodeInterface;
```

### `append`

Insert the specified content at the end of the node

```ts
/**
 * Insert the specified content at the end of the node
 * @param {Selector} selector selector or node
 * @return {NodeInterface} current instance
 */
append(selector: Selector): NodeInterface;
```

### `before`

Insert a new node before the node

```ts
/**
 * Insert a new node before the node
 * @param {Selector} selector selector or node
 * @return {NodeInterface} current instance
 */
before(selector: Selector): NodeInterface;
```

### `after`

Insert content after the node

```ts
/**
 * Insert content after the node
 * @param {Selector} selector selector or node
 * @return {NodeInterface} current instance
 */
after(selector: Selector): NodeInterface;
```

### `replaceWith`

Replace node with new content

```ts
/**
 * Replace the node with new content
 * @param {Selector} selector selector or node
 * @return {NodeInterface} current instance
 */
replaceWith(selector: Selector): NodeInterface;
```

### `getRoot`

Get the root node of the editing area where the node is located

```ts
/**
 * Get the root node of the editing area where the node is located
 */
getRoot(): NodeInterface;
```

### `traverse`

Traverse all child nodes

```ts
/**
 * Traverse all child nodes
 * @param callback callback function, false: stop traversal, true: stop traversing the current node and child nodes, and continue to traverse the next sibling node
 * @param order true: order, false: reverse order, default true
 */
traverse(
    callback: (node: NodeInterface) => boolean | void,
    order?: boolean,
): void;
```

### `getChildByPath`

Get child nodes according to path

```ts
/**
 * According to the path to obtain
```
