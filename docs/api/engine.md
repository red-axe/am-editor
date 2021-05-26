# Engine

Type: `EngineInterface`

## Attributes

### `options`

Options

Type: `EngineOptions`

### `readonly`

Read-only

Type: `boolean`

### `change`

Edit state

Type: `ChangeInterface`

### `typing`

Key processing

Type: `TypingInterface`

### `ot`

Co-editing related

Type: `OTInterface`

### `history`

history record

Type: `HistoryInterface`

### `request`

Network request

Type: `RequestInterface`

## Method

### `focus`

Focus on the editor

```ts
/**
 * Focus on the editor
 */
focus(): void;
```

### `isSub`

Is it a sub-editor

```ts
/**
 * Is it a sub-editor
 */
isSub(): boolean;
```

### `isFocus`

Whether the current cursor is focused on the editor

```ts
/**
 * Whether the current cursor has been focused on the editor
 */
isFocus(): boolean;
```

### `getValue`

Get editor value

```ts
/**
 * Get editor value
 * @param ignoreCursor whether to include cursor position information
 */
getValue(ignoreCursor?: boolean): string;
```

### `getValueAsync`

Get the editor value asynchronously, and will wait for the plug-in processing to complete before getting the value

```ts
/**
 * Obtain the editor value asynchronously, and wait for the plug-in processing to complete before obtaining the value
 * For example, plug-in upload is waiting, and the value will be obtained after the upload is completed.
 * @param ignoreCursor whether to include cursor position information
 */
getValueAsync(ignoreCursor?: boolean): Promise<string>;
```

### `getHtml`

Get the html of the editor

```ts
/**
 * Get the html of the editor
 */
getHtml(): string;
```

### `setValue`

Set editor value

```ts
/**
 * Set editor value
 * @param value
 */
setValue(value: string): EngineInterface;
```

### `setJsonValue`

Set the json format value, which is mainly used to synchronize with the value of the collaborative server

```ts
/**
 * Set the json format value, mainly used for collaboration
 * @param value
 */
setJsonValue(value: Array<any>): EngineInterface;
```
