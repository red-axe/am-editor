# Card

Edit card related operations

Type: `CardModelInterface`

## Use

```ts
new Engine(...).card
```

## Constructor

```ts
new (editor: EditorInterface): CardModelInterface
```

## Attributes

### `classes`

Instantiated card collection object

### `active`

Currently activated card

### `length`

The length of the instantiated card collection object

## Method

### `init`

Instantiate

```ts
/**
 * Instantiate cards
 * @param cards card collection
 */
init(cards: Array<CardEntry>): void;
```

### `add`

Add card

```ts
/**
 * Add cards
 * @param name name
 * @param clazz class
 */
add(clazz: CardEntry): void;
```

### `each`

Traverse all created cards

```ts
/**
 * Traverse all created cards
 * @param callback callback function
 */
each(callback: (card: CardInterface) => boolean | void): void;
```

### `closest`

Query the card node closest to the parent node

```ts
/**
 * Query the card node closest to the parent node
 * @param selector querier
 * @param ignoreEditable Whether to ignore editable nodes
 */
closest(
    selector: Node | NodeInterface,
    ignoreEditable?: boolean,
): NodeInterface | undefined;
```

### `find`

Find Card according to the selector

```ts
/**
 * Find Card according to the selector
 * @param selector card ID, or child node
 * @param ignoreEditable Whether to ignore editable nodes
 */
find(
    selector: NodeInterface | Node | string,
    ignoreEditable?: boolean,
): CardInterface | undefined;
```

### `findBlock`

Find Block Type Card according to the selector

```ts
/**
 * Find the Block type Card according to the selector
 * @param selector card ID, or child node
 */
findBlock(selector: Node | NodeInterface): CardInterface | undefined;
```

### `getSingleCard`

Get a single card in the cursor selection

```ts
/**
 * Get a single card
 * @param range cursor range
 */
getSingleCard(range: RangeInterface): CardInterface | undefined;
```

### `getSingleSelectedCard`

Get the card when a node is selected in the selection

```ts
/**
 * Get the card when a node is selected in the selection
 * @param rang selection
 */
getSingleSelectedCard(rang: RangeInterface): CardInterface | undefined;
```

### `insertNode`

Insert card

```ts
/**
 * Insert card
 * @param range selection
 * @param card card
 */
insertNode(range: RangeInterface, card: CardInterface): CardInterface;
```

### `removeNode`

Remove card node

```ts
/**
 * Remove card node
 * @param card card
 */
removeNode(card: CardInterface): void;
```

### `replaceNode`

Replace the specified node with the Card DOM node waiting to be created

```ts
/**
 * Replace the specified node with the Card DOM node waiting to be created
 * @param node node
 * @param name card name
 * @param value card value
 */
replaceNode(
    node: NodeInterface,
    name: string,
    value?: CardValue,
): NodeInterface;
```

### `updateNode`

Update the card to re-render

```ts
/**
 * Update the card to re-render
 * @param card card
 * @param value
 */
updateNode(card: CardInterface, value: CardValue): void;
```

### `activate`

Activate the card where the card node is located

```ts
/**
 * Activate the card where the card node is located
 * @param node node
 * @param trigger activation method
 * @param event event
 */
activate(
    node: NodeInterface,
    trigger?: CardActiveTrigger,
    event?: MouseEvent,
): void;
```

### `select`

Selected card

```ts
/**
 * Select the card
 * @param card card
 */
select(card: CardInterface): void;
```

### `focus`

Focus card

```ts
/**
 * Focus card
 * @param card card
 * @param toStart Whether to focus to the start position
 */
focus(card: CardInterface, toStart?: boolean): void;
```

### `insert`

Insert card

```ts
/**
 * Insert card
 * @param name card name
 * @param value card value
 */
insert(name: string, value?: CardValue): CardInterface;
```

### `update`

Update card

```ts
/**
 * Update card
 * @param selector card selector
 * @param value The card value to be updated
 */
update(selector: NodeInterface | Node | string, value: CardValue): void;
```

### `replace`

Replace the location of a card with another specified card to be rendered

### `replace`

Replace the location of a card with another specified card to be rendered

```ts
/**
  * Replace card
  * @param source The card to be replaced
  * @param name new card name
  * @param value New card value
  */
replace(source: CardInterface, name: string, value?: CardValue)
```

### `remove`

Remove card

```ts
/**
 * Remove card
 * @param selector card selector
 */
remove(selector: NodeInterface | Node | string): void;
```

### `create`

Create a card

```ts
/**
 * Create a card
 * @param name plugin name
 * @param options option
 */
create(
    name: string,
    options?: {
        value?: CardValue;
        root?: NodeInterface;
    },
): CardInterface;
```

### `render`

Render the card

```ts
/**
 * Render the card
 * @param container needs to re-render the node containing the card, if not passed, then render all the card nodes to be created
 */
render(container?: NodeInterface): void;
```

### `focusPrevBlock`

Focus on the previous block-level node where the card is located

```ts
/**
 * Focus on the previous block-level node where the card is located
 * @param card card
 * @param range cursor
 * @param hasModify When there is no node, whether to create an empty node and focus
 */
focusPrevBlock(card: CardInterface, range: RangeInterface, hasModify: boolean): void;
```

### `focusNextBlock`

Focus on the next block-level node where the card is located

```ts
/**
 * Focus on the next block-level node where the card is located
 * @param card card
 * @param range cursor
 * @param hasModify When there is no node, whether to create an empty node and focus
 */
focusNextBlock(card: CardInterface, range: RangeInterface, hasModify: boolean): void;
```

### `gc`

Release card

```ts
/**
 * Release card
 */
gc(): void;
```
