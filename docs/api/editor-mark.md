# MarkModel

Related operations for editing style nodes

Type: `MarkModelInterface`

## Use

```ts
new Engine(...).mark
```

## Constructor

```ts
new (editor: EditorInterface): MarkModelInterface
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

Find the mark plugin instance according to the node

```ts
/**
 * Find the mark plugin instance according to the node
 * @param node node
 */
findPlugin(node: NodeInterface): MarkInterface | undefined;
```

### `closestNotMark`

Get the first non-mark node up

```ts
/**
 * Get the first non-Mark node up
 */
closestNotMark(node: NodeInterface): NodeInterface;
```

### `compare`

Compare whether two nodes are the same, including attributes, style, class

```ts
/**
 * Compare whether two nodes are the same, including attributes, style, and class
 * @param source source node
 * @param target target node
 * @param isCompareValue Whether to compare the value of each attribute
 */
compare(
    source: NodeInterface,
    target: NodeInterface,
    isCompareValue?: boolean,
): boolean;
```

### `contain`

Determine whether the source node contains all the attributes and styles of the target node

```ts
/**
 * Determine whether the source node contains all the attributes and styles of the target node
 * @param source source node
 * @param target target node
 */
contain(source: NodeInterface, target: NodeInterface): boolean;
```

### `split`

Split mark tags

```ts
/**
 * Split mark tags
 * @param range cursor, get the current cursor by default
 * @param removeMark The empty mark tag that needs to be removed
 */
split(
    range?: RangeInterface,
    removeMark?: NodeInterface | Node | string | Array<NodeInterface>,
): void;
```

### `wrap`

Wrap the mark label in the current cursor selection

```ts
/**
 * Wrap the mark label in the current cursor selection area
 * @param mark mark tag
 * @param both mark nodes on both sides of the label
 */
wrap(mark: NodeInterface | Node | string, range?: RangeInterface): void;
```

### `unwrap`

Remove the mark package

```ts
/**
 * Remove the mark package
 * @param range cursor
 * @param removeMark the mark tag to be removed
 */
unwrap(
    removeMark?: NodeInterface | Node | string | Array<NodeInterface>,
    range?: RangeInterface,
): void;
```

### `merge`

Merge the mark node of the selection

```ts
/**
 * Merge the mark node of the selection
 * @param range cursor, the current selection cursor by default
 */
merge(range?: RangeInterface): void;
```

### `insert`

Insert the mark tag at the cursor

```ts
/**
 * Insert a mark tag at the cursor
 * @param mark mark tag
 * @param range specifies the cursor, the default is the cursor selected by the editor
 */
insert(mark: NodeInterface | Node | string, range?: RangeInterface): void;
```

### `findMarks`

Find all Marks that have an effect on the range

```ts
/**
 * Find all Marks that have an effect on the range
 * @param range
 */
findMarks(range: RangeInterface): Array<NodeInterface>;
```

### `removeEmptyMarks`

Traverse from the bottom up to delete empty Marks, when encountering empty Blocks, add BR tags

```ts
/**
 * Traverse from bottom to top to delete empty Marks, when encountering empty Blocks, add BR tags
 * @param node node
 * @param addBr whether to add br
 */
removeEmptyMarks(node: NodeInterface, addBr?: boolean): void;
```
