# BlockModel

Edit related operations of block-level nodes

Type: `BlockModelInterface`

## Use

```ts
new Engine(...).block
```

## Constructor

```ts
new (editor: EditorInterface): BlockModelInterface
```

## Method

### `init`

initialization

```ts
/**
 * Initialization
 */
init(): void;
```

### `findPlugin`

Find the block plugin instance according to the node

```ts
/**
 * Find the block plugin instance according to the node
 * @param node node
 */
findPlugin(node: NodeInterface): BlockInterface | undefined;
```

### `findTop`

Find the first-level node of the Block node. For example, div -> H2 returns H2 node

```ts
/**
 * Find the first level node of the Block node. For example, div -> H2 returns H2 node
 * @param parentNode parent node
 * @param childNode child node
 */
findTop(parentNode: NodeInterface, childNode: NodeInterface): NodeInterface;
```

### `closest`

Get the nearest block node, can not find the return node

```ts
/**
 * Get the nearest block node, the return node cannot be found
 * @param node node
 */
closest(node: NodeInterface): NodeInterface;
```

### `wrap`

Wrap a block node at the cursor position

```ts
/**
 * Wrap a block node at the cursor position
 * @param block node
 * @param range cursor
 */
wrap(block: NodeInterface | Node | string, range?: RangeInterface): void;
```

### `unwrap`

Remove the package of the block node where the cursor is located

```ts
/**
 * Remove the package of the block node where the cursor is located
 * @param block node
 * @param range cursor
 */
unwrap(block: NodeInterface | Node | string, range?: RangeInterface): void;
```

### `getSiblings`

Get the node's sibling node set relative to the cursor start position and end position

```ts
/**
 * Get the node's sibling node set relative to the cursor start position and end position
 * @param range cursor
 * @param block node
 */
getSiblings(
    range: RangeInterface,
    block: NodeInterface,
): Array<{ node: NodeInterface; position:'left' |'center' |'right' }>;
```

### `split`

Split the block node selected by the current cursor

```ts
/**
 * Split the block node selected by the current cursor
 * @param range cursor
 */
split(range?: RangeInterface): void;
```

### `insert`

Insert a block node at the current cursor position

```ts
/**
  * Insert a block node at the current cursor position
  * @param block node
  * @param range cursor
  * @param splitNode split node, the default is the block node at the beginning of the cursor
  */
insert(
     block: NodeInterface | Node | string,
     range?: RangeInterface,
     splitNode?: (node: NodeInterface) => NodeInterface,
): void;
```

### `setBlocks`

Set all block nodes where the current cursor is located as new nodes or set new attributes

```ts
/**
 * Set all block nodes where the current cursor is located as new nodes or set new attributes
 * @param block The node or node attribute that needs to be set
 * @param range cursor
 */
setBlocks(
    block: string | {[k: string]: any },
    range?: RangeInterface,
): void;
```

### `merge`

Merge blocks adjacent to the current cursor position

```ts
/**
 * Combine blocks adjacent to the current cursor position
 * @param range cursor
 */
merge(range?: RangeInterface): void;
```

### `findBlocks`

Find all blocks that have an effect on the range

```ts
/**
 * Find all blocks that have an effect on the range
 * @param range
 */
findBlocks(range: RangeInterface): Array<NodeInterface>;
```

### `isFirstOffset`

Determine whether the {Edge}Offset of the range is at the beginning of the Block

```ts
/**
 * Determine whether the {Edge}Offset of the range is at the beginning of the Block
 * @param range cursor
 * @param edge start ｜ end
 */
isFirstOffset(range: RangeInterface, edge:'start' |'end'): boolean;
```

### `isLastOffset`

Determine whether the {Edge}Offset of the range is at the last position of the Block

```ts
/**
 * Determine whether the {Edge}Offset of the range is at the last position of the Block
 * @param range cursor
 * @param edge start ｜ end
 */
isLastOffset(range: RangeInterface, edge:'start' |'end'): boolean;
```

### `getBlocks`

Get all blocks in the range

```ts
/**
 * Get all blocks in the range
 * @param range cursors
 */
getBlocks(range: RangeInterface): Array<NodeInterface>;
```

### `getLeftText`

Get the left text of Block

```ts
/**
 * Get the left text of Block
 * @param block node
 */
getLeftText(block: NodeInterface | Node): string;
```

### `removeLeftText`

Delete the left text of Block

```ts
/**
 * Delete the text on the left side of Block
 * @param block node
 */
removeLeftText(block: NodeInterface | Node): void;
```

### `getBlockByRange`

Generate the node on the left or right side of the cursor and place it in the same container as the parent node

```ts
/**
 * Generate the node on the left or right side of the cursor and place it in the same container as the parent node
 * isLeft = true: left
 * isLeft = false: the right side
 * @param {block,range,isLeft,clone,keepID} node, cursor, left or right, whether to copy, whether to keep id
 *
 */
getBlockByRange({
    block,
    range,
    isLeft,
    clone,
    keepID,
}: {
    block: NodeInterface | Node;
    range: RangeInterface;
    isLeft: boolean;
    clone?: boolean;
    keepID?: boolean;
}): NodeInterface;
```

### `normal`

Sort block-level nodes into standard editor values

```ts
/**
 * Sorting block-level nodes
 * @param node node
 * @param root root node
 */
normal(node: NodeInterface, root: NodeInterface): void;
```

### `insertEmptyBlock`

Insert an empty block node

```ts
/**
 * Insert an empty block node
 * @param range cursor position
 * @param block node
 * @returns
 */
insertEmptyBlock(range: RangeInterface, block: NodeInterface): void;
```

### `insertOrSplit`

Insert or split node at cursor position

```ts
/**
 * Insert or split a node at the cursor position
 * @param range cursor position
 * @param block node
 */
insertOrSplit(range: RangeInterface, block: NodeInterface): void;
```
