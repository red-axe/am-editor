# Range

Inherited from `Range`, has all the methods and attributes of `Range`, if you need to know the detailed attributes and methods, please visit the browser API [Range](https://developer.mozilla.org/zh-CN/docs/Web/ API/Range/Range)

Type: `RangeInterface`

## Attributes

The following only lists the properties and methods extended from the `Range` object

### `base`

`Range` object

Read only

### `startNode`

The node where the range starts, read-only

Type: `NodeInterface`

### `endNode`

Node at the end of the range, read-only

Type: `NodeInterface`

### `commonAncestorNode`

The nearest parent node shared by the start node and the end node

Type: `NodeInterface`

## Static method

### `create`

Create a RangeInterface object from a Point position

Point can be understood as the x,y coordinate point of the mouse pointer position

```ts
/**
 * Create a RangeInterface object from a Point position
 */
create: (
	editor: EditorInterface,
	doc?: Document,
	point?: { x: number; y: number },
) => RangeInterface;
```

### `from`

Create RangeInterface objects from Window, Selection, Range

```ts
/**
 * Create RangeInterface objects from Window, Selection, Range
 */
from: (
	editor: EditorInterface,
	win?: Window | globalThis.Selection | globalThis.Range,
) => RangeInterface | null;
```

### `fromPath`

Restore the path to a RangeInterface object

```ts
/**
 * Convert from path to range
 * @param path
 * @param context, the default editor node
 */
fromPath(path: Path[], context?: NodeInterface): RangeInterface;
```

## Method

### `select`

Let the range select a node

```ts
/**
 * Select a node
 * @param node node
 * @param contents whether only selected contents
 */
select(node: NodeInterface | Node, contents?: boolean): RangeInterface;
```

### `getText`

Get the text of all nodes selected by the range

```ts
/**
 * Get the text selected by the range
 */
getText(): string | null;
```

### `getClientRect`

Get the area occupied by the range

```ts
/**
 * Get the area occupied by the range
 */
getClientRect(): DOMRect;
```

### `enlargeFromTextNode`

Extend the selection marker from the TextNode to the nearest non-TextNode node

```ts
/**
 * Expand the selection mark from TextNode to the nearest non-TextNode node
 * The selected content of the range remains unchanged
 */
enlargeFromTextNode(): RangeInterface;
```

### `shrinkToTextNode`

Reduce the selection marker from a non-TextNode to a TextNode node, as opposed to enlargeFromTextNode

```ts
/**
 * Reduce the selection marker from a non-TextNode to a TextNode node, as opposed to enlargeFromTextNode
 * The selected content of the range remains unchanged
 */
shrinkToTextNode(): RangeInterface;
```

### `enlargeToElementNode`

Extend the range selection boundary

```ts
/**
 * Expand the border
 * <p><strong><span>[123</span>abc]</strong>def</p>
 * to
 * <p>[<strong><span>123</span>abc</strong>]def</p>
 * @param range selection
 * @param toBlock whether to expand to block-level nodes
 */
enlargeToElementNode(toBlock?: boolean): RangeInterface;
```

### `shrinkToElementNode`

Shrink the range selection boundary

```ts
/**
 * Reduce the border
 * <body>[<p><strong>123</strong></p>]</body>
 * to
 * <body><p><strong>[123]</strong></p></body>
 */
shrinkToElementNode(): RangeInterface;
```

### `createSelection`

Create selectionElement and mark the position of the range, focus or range by inserting a custom span node. Through these marks, we can easily get the nodes in the selection area

For more properties and methods, please see the `SelectionInterface` API

```ts
/**
 * Create selectionElement, mark the position by inserting a span node
 */
createSelection(): SelectionInterface;
```

### `getSubRanges`

Split the range selection into multiple sub-selections according to text nodes and card nodes

```ts
/**
 * Get a collection of sub-selections
 * @param includeCard whether to include the card
 */
getSubRanges(includeCard?: boolean): Array<RangeInterface>;
```

### `setOffset`

Let the range select a node and set its start position offset and end position offset

```ts
/**
 * @param node The node to be set
 * @param start the offset of the starting position
 * @param end The offset of the end position
 * */
setOffset(
    node: Node | NodeInterface,
    start: number,
    end: number,
): RangeInterface;
```

### `findElements`

Find a collection of element nodes in the range area, excluding Text text nodes

```ts
findElements(): Array<Node>;
```

### `inCard`

Query whether the range is in the card

```ts
inCard(): boolean;
```

### `getStartOffsetNode`

Get the node at the offset relative to the node at the beginning of the range

```ts
getStartOffsetNode(): Node;
```

### `getEndOffsetNode`

Get the node at the offset relative to the node at the end of the range

```ts
getEndOffsetNode(): Node;
```

### `containsCard`

Whether the range area contains a card

```ts
/**
 * Whether to include a card
 */
containsCard(): boolean;
```

### `handleBr`

Repair the Br node at the range position

```ts
/**
 * When entering content, delete the BR tag generated by the browser, and add BR to the empty block
 * Delete scene
 * <p><br />foo</p>
 * <p>foo<br /></p>
 * Keep the scene
 * <p><br /><br />foo</p>
 * <p>foo<br /><br /></p>
 * <p>foo<br />bar</p>
 * Add scene
 * <p></p>
 * @param isLeft
 */
handleBr(isLeft?: boolean): RangeInterface;
```

### `getPrevNode`

Get the node before the range start position

```ts
/**
 * Get the node before the start position
 * <strong>foo</strong>|bar
 */
getPrevNode(): NodeInterface | undefined;
```

### `getNextNode`

Get the node after the end position

```ts
/**
 * Get the node after the end position
 * foo|<strong>bar</strong>
 */
getNextNode(): NodeInterface | undefined;
```

### `deepCut`

Cut the contents of the area selected by the range. Data will be on the clipboard

```ts
/**
 * Deep cut
 */
deepCut(): void;
```

### `equal`

Compare whether the range of two range objects are equal

```ts
/**
 * Compare whether the two ranges are equal
 *range
    */
equal(range: RangeInterface | globalThis.Range): boolean;
```

### `getRootBlock`

Get the nearest root node of the current selection

```ts
/**
 * Get the nearest root node of the current selection
 */
getRootBlock(): NodeInterface | undefined;
```

### `filterPath`

Filter path

```ts
/**
  * Filter path
  * @param includeCardCursor
  */
filterPath(includeCardCursor?: boolean): (node: Node) => boolean;
```

### `toPath`

Convert cursor selection to path

```ts
/**
  * Get the cursor path
  * @param includeCardCursor whether to include the cursor on both sides of the card
  */
toPath(
includeCardCursor?: boolean,
): {start: RangePath; end: RangePath} | undefined;
```
