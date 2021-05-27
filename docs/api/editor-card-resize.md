# Resize

A tool that can adjust the size of the card content area

Type: `ResizeInterface`

## Constructor

```ts
new (editor: EditorInterface, card: CardInterface): ResizeInterface
```

## Method

### `create`

Create and bind events

```ts
/**
 * Create and bind events
 * @param options optional
 */
create(options: ResizeCreateOptions): void;
```

### `render`

Rendering tools

```ts
/**
 * Render
 * The target node rendered by @param container, the default is the root node of the current card
 * @param minHeight minimum height, default 80px
 */
render(container?: NodeInterface, minHeight?: number): void;
```

### `dragStart`

Pull start

```ts
/**
 * Pull to start
 * @param event event
 */
dragStart(event: MouseEvent): void;
```

### `dragMove`

Pulling moving

```ts
/**
 * Pulling and moving
 * @param event event
 */
dragMove(event: MouseEvent): void;
```

### `dragEnd`

Pull over

```ts
/**
 * Pull end
 */
dragEnd(event: MouseEvent): void;
```

### `show`

Show off

```ts
/**
 * Show
 */
show(): void;
```

### `hide`

hide

```ts
/**
 * Hide
 */
hide(): void;
```

### `destroy`

Logout

```ts
/**
 * Logout
 */
destroy(): void;
```
