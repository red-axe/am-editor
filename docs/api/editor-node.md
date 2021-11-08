# NodeModel

Edit node related operations

Type: `NodeModelInterface`

## Use

```ts
new Engine(...).node
```

## Constructor

```ts
new (editor: EditorInterface)
```

## Method

### `isVoid`

Whether it is an empty node

```ts
/**
 * Is it an empty node
 * @param node node or node name
 * @param schema takes the schema from this.editor by default
 */
isVoid(
    node: NodeInterface | Node | string,
    schema?: SchemaInterface,
): boolean;
```

### `isMark`

Whether it is a mark style label

```ts
/**
 * Is it a mark tag
 * @param node node
 */
isMark(node: NodeInterface | Node, schema?: SchemaInterface): boolean;
```

### `isInline`

Is it an inline tag

```ts
/**
 * Is it an inline tag
 * @param node node
 */
isInline(node: NodeInterface | Node, schema?: SchemaInterface): boolean;
```

### `isBlock`

Is it a block node

```ts
/**
 * Is it a block node
 * @param node node
 */
isBlock(node: NodeInterface | Node, schema?: SchemaInterface): boolean;
```

### `isSimpleBlock`

Determine whether the node is a simple node of block type (child nodes do not contain blcok tags)

```ts
/**
 * Determine whether the node is a simple node of block type (child nodes do not contain blcok tags)
 */
isSimpleBlock(node: NodeInterface): boolean;
```

### `isRootBlock`

Determine whether the node is the top-level root node, the parent is the editor root node, and the child node does not have a block node

```ts
/**
 * Determine whether the node is the top-level root node, the parent is the editor root node, and the child node has no block node
 * @param node node
 * @returns
 */
isRootBlock(node: NodeInterface, schema?: SchemaInterface): boolean;
```

### `isEmpty`

Determine whether the text under the node is empty

```ts
/**
 * Determine whether the text under the node is empty
 * @param node node
 * @param withTrim is trim
 */
isEmpty(node: NodeInterface, withTrim?: boolean): boolean;
```

### `isEmptyWithTrim`

Determine whether the text under a node is empty or only white space characters

```ts
/**
 * Determine whether the text under a node is empty, or there are only blank characters
 * @param node node
 */
isEmptyWithTrim(node: NodeInterface): boolean;
```

### `isLikeEmpty`

Judge whether a node is empty, a card is not counted as an empty node

```ts
/**
 * Determine whether a node is empty
 * @param node node
 */
isLikeEmpty(node: NodeInterface): boolean;
```

### `isList`

Determine whether the node is a list node

```ts
/**
 * Determine whether the node is a list node
 * @param node node or node name
 */
isList(node: NodeInterface | string | Node): boolean;
```

### `isCustomize`

Determine whether the node is a custom list

```ts
/**
 * Determine whether the node is a custom list
 * @param node node
 */
isCustomize(node: NodeInterface): boolean;
```

### `unwrap`

Remove the outer wrapper of the node

```ts
/**
 * Remove package
 * @param node The node that needs to remove the package
 */
unwrap(node: NodeInterface): void;
```

### `wrap`

Wrap a layer of nodes outside the node

```ts
/**
 * Package node
 * @param source The node that needs to be wrapped
 * @param outer packaged external node
 * @param mergeSame merges the node styles and attributes of the same name on the same node
 */
wrap(
    source: NodeInterface | Node,
    outer: NodeInterface,
    mergeSame?: boolean,
): NodeInterface;
```

### `merge`

Merge node

```ts
/**
 * Merge nodes
 * @param source merged node
 * @param target The node that needs to be merged
 * @param remove Whether to remove after merging
 */
merge(source: NodeInterface, target: NodeInterface, remove?: boolean): void;
```

### `replace`

Append the child nodes of the source node to the target node and replace the source node

```ts
/**
 * Append the child nodes of the source node to the target node and replace the source node
 * @param source old node
 * @param target new node
 */
replace(source: NodeInterface, target: NodeInterface): NodeInterface;
```

### `insert`

Insert a node at the cursor position

```ts
/**
 * Insert a node at the cursor position
 * @param node node
 * @param range cursor
 */
insert(
    node: Node | NodeInterface,
    range?: RangeInterface,
): RangeInterface | undefined;
```

### `insertText`

Insert text at cursor position

```ts
/**
 * Insert text at the cursor position
 * @param text text
 * @param range cursor
 */
insertText(
    text: string,
    range?: RangeInterface,
): RangeInterface | undefined;
```

### `setAttributes`

Set node properties

```ts
/**
 * Set node attributes
 * @param node node
 * @param props property
 */
setAttributes(node: NodeInterface, attributes: any): NodeInterface;
```

### `removeMinusStyle`

Remove styles with negative values

```ts
/**
 * Remove styles with negative values
 * @param node node
 * @param style style name
 */
removeMinusStyle(node: NodeInterface, style: string): void;
```

### `mergeAdjacent`

The child nodes under the merged node, the child nodes of two identical adjacent nodes, usually blockquote, ul, ol tags

```ts
/**
 * The child nodes under the merged node, the child nodes of two identical adjacent nodes, usually blockquote, ul, ol tags
 * @param node current node
 */
mergeAdjacent(node: NodeInterface): void;
```

### `removeSide`

Remove the labels on both sides of the node

```ts
/**
 * Delete the labels on both sides of the node
 * @param node node
 * @param tagName tag name, the default is br tag
 */
removeSide(node: NodeInterface, tagName?: string): void;
```

### `flat`

Organize the nodes and restore the nodes to the state that meets the editor value

```ts
/**
 * Organize nodes
 * @param node node
 * @param root root node, the default is node node
 */
flat(node: NodeInterface, root?: NodeInterface): void;
```

### `normalize`

Standardized node

```ts
/**
 * Standardized node
 * @param node node
 */
normalize(node: NodeInterface): void;
```

### `html`

Get or set the html text of the element node

```ts
/**
 * Get or set the html text of the element node
 * @param {string|undefined} val html text
 * @return {NodeEntry|string} current instance or html text
 */
html(node: NodeInterface): string;
html(node: NodeInterface, val: string): NodeInterface;
html(node: NodeInterface, val?: string): NodeInterface | string;
```

### `clone`

Copy element node

```ts
/**
* Copy element node
* @param node node
* @param deep Whether to deep copy
* @param copyId whether to copy data-id, copy by default
* @return copied element node
*/
clone(node: NodeInterface, deep?: boolean, copyId?: boolean): NodeInterface;
```

### `getBatchAppendHTML`

Get outerHTML after batch appending child nodes

```ts
/**
 * Get outerHTML after batch appending child nodes
 * @param nodes node collection
 * @param appendExp appended node
 */
getBatchAppendHTML(nodes: Array<NodeInterface>, appendExp: string): string;
```
