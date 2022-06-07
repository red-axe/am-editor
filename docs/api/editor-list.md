# ListModel

Related operations for editing list nodes

Type: `ListModelInterface`

## Use

```ts
new Engine(...).list
```

## Constructor

```ts
new (editor: EditorInterface): ListModelInterface
```

## Attributes

### `CUSTOMZIE_UL_CLASS`

Read only

Custom list style markup

### `CUSTOMZIE_LI_CLASS`

Read only

Custom list item style mark

### `INDENT_KEY`

Read only

List indentation key tag, used to get the list indentation value

## Method

### `init`

initialization

```ts
/**
 * Initialization
 */
init(): void;
```

### `isEmptyItem`

Determine whether the list item node is empty

```ts
/**
 * Determine whether the list item node is empty
 * @param node node
 */
isEmptyItem(node: NodeInterface): boolean;
```

### `isSame`

Determine whether two nodes are the same List node

```ts
/**
 * Determine whether two nodes are the same List node
 * @param sourceNode source node
 * @param targetNode target node
 */
isSame(sourceNode: NodeInterface, targetNode: NodeInterface): boolean;
```

### `isSpecifiedType`

Determine whether the node set is a List list of the specified type

```ts
/**
 * Determine whether the node collection is a List list of the specified type
 * @param blocks node collection
 * @param name node label type
 * @param card is the card name of the specified custom list item
 */
isSpecifiedType(
    blocks: Array<NodeInterface>,
    name?:'ul' |'ol',
    card?: string,
): boolean;
```

### `getPlugins`

Get all List plugins

```ts
/**
 * Get all List plugins
 */
getPlugins(): Array<ListInterface>;
```

### `getPluginNameByNode`

Get the name of the list plugin according to the list node

```ts
/**
 * Get the name of the list plugin according to the list node
 * @param block node
 */
getPluginNameByNode(block: NodeInterface): string;
```

### `getPluginNameByNodes`

Get the name of the list plugin that a list node collection belongs

```ts
/**
 * Get the name of the list plugin to which a list node collection belongs
 * @param blocks node collection
 */
getPluginNameByNodes(blocks: Array<NodeInterface>): string;
```

### `unwrapCustomize`

Clear the related attributes of the custom list node

```ts
/**
 * Clear the related attributes of the custom list node
 * @param node node
 */
unwrapCustomize(node: NodeInterface): NodeInterface;
```

### `unwrap`

Cancel the list of nodes

```ts
/**
 * Cancel the list of nodes
 * @param blocks node collection
 */
unwrap(blocks: Array<NodeInterface>): void;
```

### `normalize`

Get the node collection after the repair list of the current selection

```ts
/**
 * Get the node collection after the repair list of the current selection
 */
normalize(): Array<NodeInterface>;
```

### `split`

Split the list of selected items into a single list

```ts
/**
 * Split the list of selected items into a single list
 */
split(): void;
```

### `merge`

Merge list

```ts
/**
 * Consolidated list
 * @param blocks node collection, the default is the blocks of the current selection
 */
merge(blocks?: Array<NodeInterface>, range?: RangeInterface): void;
```

### `addStart`

Add the start number to the list

```ts
/**
 * Add the start number to the list
 * @param block list node
 */
addStart(block?: NodeInterface): void;
```

### `addIndent`

Add indentation to list nodes

```ts
/**
 * Add indentation to list nodes
 * @param block list node
 * @param value indentation value
 */
addIndent(block: NodeInterface, value: number, maxValue?: number): void;
```

### `getIndent`

Get the indent value of the list node

```ts
/**
 * Get the indent value of the list node
 * @param block list node
 * @returns
 */
getIndent(block: NodeInterface): number;
```

### `addCardToCustomize`

Add card nodes to custom list items

```ts
/**
 * Add card nodes for custom list items
 * @param node list node item
 * @param cardName card name, must support inline card type
 * @param value card value
 */
addCardToCustomize(
    node: NodeInterface | Node,
    cardName: string,
    value?: any,
): CardInterface | undefined;
```

### `addReadyCardToCustomize`

Add a card node to be rendered for the custom list item

```ts
/**
 * Add a card node to be rendered for the custom list item
 * @param node list node item
 * @param cardName card name, must support inline card type
 * @param value card value
 */
addReadyCardToCustomize(
    node: NodeInterface | Node,
    cardName: string,
    value?: any,
): NodeInterface | undefined;
```

### `addBr`

Add the BR tag to the list

```ts
/**
 * Add the BR tag to the list
 * @param node list node item
 */
addBr(node: NodeInterface): void;
```

### `toCustomize`

Convert node to custom node

```ts
/**
 * Convert nodes to custom nodes
 * @param blocks node
 * @param cardName card name
 * @param value card value
 */
toCustomize(
    blocks: Array<NodeInterface> | NodeInterface,
    cardName: string,
    value?: any,
): Array<NodeInterface> | NodeInterface;
```

### `toNormal`

Convert node to list node

```ts
/**
 * Convert a node to a list node
 * @param blocks node
 * @param tagName list node name, ul or ol, the default is ul
 * @param start the start number of the ordered list
 */
toNormal(
    blocks: Array<NodeInterface> | NodeInterface,
    tagName?:'ul' |'ol',
    start?: number,
): Array<NodeInterface> | NodeInterface;
```

### `isFirst`

Determine whether the selected area is at the beginning of the list

```ts
/**
 * Determine whether the selected area is at the beginning of the list
 * Selected area
 */
isFirst(range: RangeInterface): boolean;
```

### `isLast`

Determine whether the selected area is at the end of the list

```ts
/**
 * Determine whether the selected area is at the end of the list
 */
isLast(range: RangeInterface): boolean;
```
