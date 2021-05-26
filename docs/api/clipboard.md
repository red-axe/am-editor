# Clipboard

Clipboard related operations

Type: `ClipboardInterface`

## Constructor

```ts
new (editor: EditorInterface): CommandInterface
```

## Method

### `getData`

Get clipboard data

```ts
/**
 * Get clipboard data
 * @param event event
 */
getData(event: DragEvent | ClipboardEvent): ClipboardData;
```

### `write`

Write to clipboard

```ts
/**
 * Write to clipboard
 * @param event event
 * @param range cursor, get the current cursor position by default
 * @param callback callback
 */
write(
    event: ClipboardEvent,
    range?: RangeInterface | null,
    callback?: (data: {html: string; text: string }) => void,
): void;
```

### `cut`

Perform cut and paste operations at the current cursor position

```ts
/**
 * Perform cut and paste operations at the current cursor position
 */
cut(): void;
```

### `copy`

copy

```ts
/**
 * Copy
 * @param data The data to be copied, which can be a node or a string
 * @param trigger Whether to trigger the clipping event and notify the plug-in to process the conversion
 * @returns returns whether the copy is successful
 */
copy(data: Node | string, trigger?: boolean): boolean;
```
