# Selection

With `Selection`, you can easily create a mark in the DOM tree based on the selection of `RangeInterface`, and then get the nodes in the middle or on both sides of the mark

## Constructor

```ts
new (editor: EditorInterface, range: RangeInterface): SelectionInterface
```

## Attributes

### `anchor`

Mark the node at the beginning of the selection

Type: `NodeInterface | null`

### `focus`

Mark the node at the end of the selection. If the collapsed of `Range` is true, then the focus node and the anchor node are consistent

Type: `NodeInterface | null`

## Static method

### `removeTags`

Remove cursor position placeholder label

```ts
/**
 * Remove the placeholder label at the cursor position
 * @param value The string to be removed
 */
static removeTags = (value: string) => void
```

## Method

### `has`

Is there a created mark?

```ts
has(): boolean;
```

### `create`

Create a mark

```ts
/**
 * Create mark
 */
create(): void;
```

### `move`

Set Range to return to the marked position and delete the mark

```ts
/**
 * Let Range select the mark position and delete the mark
 */
move(): void;
```

### `getNode`

Get the node relative to the marked position of the node, and the mark will be removed after acquisition

```ts
/**
* Get the node of the node relative to the marked position, and the mark will be removed after acquisition
* @param node node
* @param position
* @param isClone whether to make a copy
* @param callback Call back when deleting a node, return a boolean to indicate whether the current node is deleted
*/
getNode(
node: NodeInterface,
position?:'left' |'center' |'right',
isClone?: boolean,
         callback?: (node: NodeInterface) => boolean
): NodeInterface;
```
