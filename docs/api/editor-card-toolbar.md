# Toolbar

Card toolbar

Type: `CardToolbarInterface`

## Constructor

```ts
new (editor: EditorInterface, card: CardInterface): CardToolbarInterface
```

## Method

### `create`

Create card toolbar

```ts
/**
 * Toolbar for creating cards
 */
create(): void;
```

### `hide`

Hide toolbar, including dnd

```ts
/**
* Hide toolbar, including dnd
*/
hide(): void;
```

### `show`

Show toolbar, including dnd

```ts
/**
 * Display toolbar, including dnd
 * @param event mouse event, used for positioning
 */
show(event?: MouseEvent): void;
```

### `hideCardToolbar`

Only hide the toolbar of the card, not including dnd

```ts
/**
 * Only hide the toolbar of the card, not including dnd
 */
hideCardToolbar(): void;
```

### `showCardToolbar`

Only show the toolbar of the card, not including dnd

```ts
/**
 * Only display the toolbar of the card, not including dnd
 * @param event mouse event, used for positioning
 */
showCardToolbar(event?: MouseEvent): void;
```

### `getContainer`

Get toolbar container

```ts
/**
 * Get the toolbar container
 */
getContainer(): NodeInterface | undefined;
```
