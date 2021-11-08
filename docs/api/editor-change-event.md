# Change events

Related events in editor changes

Type: `ChangeEventInterface`

## Constructor

```ts
new (engine: EngineInterface, options: ChangeEventOptions = {}): ChangeEventInterface;
```

## Attributes

### `isComposing`

Whether to combine input

### `isSelecting`

Is it being selected

## Method

### `isCardInput`

Is it entered in the card

```ts
isCardInput(e: Event): boolean;
```

### `onInput`

Input event

```ts
onInput(callback: (event?: Event) => void): void;
```

### `onSelect`

Cursor selection event

```ts
onSelect(callback: (event?: Event) => void): void;
```

### `onPaste`

Paste event

```ts
onPaste(
    callback: (data: ClipboardData & {isPasteText: boolean }) => void,
): void;
```

### `onDrop`

Drag event

```ts
onDrop(
    callback: (params: {
        event: DragEvent;
        range?: RangeInterface;
        card?: CardInterface;
        files: Array<File | null>;
    }) => void,
): void;
```

### `onDocument`

Bind the document event

```ts
onDocument(
    eventType: string,
    listener: EventListener,
    index?: number
): void;
```

### `onWindow`

Bind window events

```ts
onWindow(
    eventType: string,
    listener: EventListener,
    index?: number
): void;
```

### `onContainer`

Binding editor container node event

```ts
onContainer(eventType: string, listener: EventListener, index?: number): void;
```

### `onRoot`

Binding editor root node event

```ts
onRoot(eventType: string, listener: EventListener, index?: number): void;
```

### `destroy`

destroy

```ts
destroy(): void;
```
