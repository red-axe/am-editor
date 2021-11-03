# Change

Operations related to editor changes

Type: `ChangeInterface`

## Use

```ts
new Engine(...).change
```

## Constructor

```ts
new (container: NodeInterface, options: ChangeOptions): ChangeInterface;
```

## Attributes

### `rangePathBeforeCommand`

Path after cursor conversion before command execution

```ts
rangePathBeforeCommand: Path[] | null;
```

### `event`

event

```ts
event: ChangeEventInterface;
```

### `marks`

All style nodes in the current cursor selection

```ts
marks: Array<NodeInterface>;
```

### `blocks`

All block-level nodes in the current cursor selection

```ts
blocks: Array<NodeInterface>;
```

### `inlines`

All inline nodes in the current cursor selection

```ts
inlines: Array<NodeInterface>;
```

## Method

### `getRange`

Get the range of the current selection

```ts
/**
 * Get the range of the current selection
 */
getRange(): RangeInterface;
```

### `getSafeRange`

Obtain a safe and controllable cursor object

```ts
/**
 * Obtain a safe and controllable cursor object
 * @param range default current cursor
 */
getSafeRange(range?: RangeInterface): RangeInterface;
```

### `select`

Select the specified range

```ts
/**
 * Select the specified range
 * @param range cursor
 */
select(range: RangeInterface): ChangeInterface;
```

### `focus`

Focus editor

```ts
/**
 * Focus editor
 * @param toStart true: start position, false: end position, the default is the previous operation position
 */
focus(toStart?: boolean): ChangeInterface;
```

### `blur`

Cancel focus

```ts
/**
 * Cancel focus
 */
blur(): ChangeInterface;
```

### `apply`

Apply an operation that changes the dom structure

```ts
/**
 * Apply an operation that changes the dom structure
 * @param range cursor
 */
apply(range?: RangeInterface): void;
```

### `combinText`

Combine the interrupted characters in the current editing into an uninterrupted character

```ts
combinText(): void;
```

### `isComposing`

Is it in the combined input

```ts
isComposing(): boolean;
```

### `isSelecting`

Is it being selected

```ts
isSelecting(): boolean;
```

### `setValue`

Set editor value

```ts
/**
  * @param value
  * @param onParse uses root node parsing and filtering before converting to standard editor values
  * @param options Card asynchronous rendering callback
  * */
setValue(value: string, onParse?: (node: Node) => void, callback?: (count: number) => void): void;
```

### `setHtml`

Set html as editor value

```ts
/**
  * Set html, it will be formatted as a legal editor value
  * @param html html
  * @param options Card asynchronous rendering callback
  */
setHtml(html: string, , callback?: (count: number) => void): void
```

### `getOriginValue`

Get the original value of the editor

```ts
getOriginValue(): string;
```

### `getValue`

Get editor value

```ts
/**
 * @param ignoreCursor Whether to fool the record node where the cursor is located
 * */
getValue(options: {ignoreCursor?: boolean }): string;
```

### `cacheRangeBeforeCommand`

Cache the cursor object before executing the command

```ts
cacheRangeBeforeCommand(): void;
```

### `getRangePathBeforeCommand`

Get the path after the cursor conversion before the command is executed

```ts
getRangePathBeforeCommand(): Path[] | null;
```

### `isEmpty`

Whether the current editor is empty

```ts
isEmpty(): boolean;
```

### `destroy`

destroy

```ts
destroy(): void;
```

### `insert`

Insert

```ts
/**
 * Insert fragment
 * @param fragment fragment
 * @param callback callback function after insertion
 */
insert(fragment: DocumentFragment, callback?: () => void): void;
```

### `delete`

Delete content

```ts
/**
 * Delete content
 * @param range cursor, get the current cursor by default
 * @param isDeepMerge Perform merge operation after deletion
 */
delete(range?: RangeInterface, isDeepMerge?: boolean): void;
```

### `unwrap`

Remove the block node closest to the current cursor or the outer package of the incoming node

```ts
/**
 * Remove the block node closest to the current cursor or the outer package of the incoming node
 * @param node node
 */
unwrap(node?: NodeInterface): void;
```

### `mergeAfterDelete`

Delete the block node closest to the current cursor or the previous node of the incoming node and merge it

```ts
/**
 * Delete the block node closest to the current cursor or the previous node of the incoming node and merge it
 * @param node node
 */
mergeAfterDelete(node?: NodeInterface): void;
```

### `focusPrevBlock`

The focus moves to the block node closest to the current cursor or the block before the incoming node

```ts
/**
 * The focus moves to the block node closest to the current cursor or the block before the incoming node
 * @param block node
 * @param isRemoveEmptyBlock If the previous block is empty, whether to delete, the default is no
 */
focusPrevBlock(block?: NodeInterface, isRemoveEmptyBlock?: boolean): void;
```
