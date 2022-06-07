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
  * @param start is the start position of the focus, the default is true, false is the focus to the end position
  */
focus(start?: boolean): void;
```

### `blur`

Unfocus

```ts
/**
  * Make the editor lose focus
  */
blur(): void;
```

### `isFocus`

Whether the current cursor is focused on the editor

```ts
/**
 * Whether the current cursor has been focused on the editor
 */
isFocus(): boolean;
```

### `isEmpty`

Whether the current editor is empty

```ts
/**
  * Whether the current editor is empty
  */
isEmpty(): boolean;
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

Get the editor value asynchronously, and will wait for the plugin processing to complete before getting the value

```ts
/**
* Obtain the editor value asynchronously, and wait for the plugin processing to complete before obtaining the value
* For example, plugin upload is waiting, and the value will be obtained after the upload is completed.
* @param ignoreCursor Whether to include the cursor position information, it is not included by default
* @param callback Callback when there are plugins and actions that have not been executed, return false to terminate the value acquisition, return number to set the current action waiting time, in milliseconds
*/
getValueAsync(
  ignoreCursor?: boolean,
  callback?: (
    name: string,
    card?: CardInterface,
    ...args: any
  ) => boolean | number | void,
  ): Promise<string>;
```

### `getHtml`

Get the html of the editor

```ts
/**
 * Get the html of the editor
 */
getHtml(): string;
```

### `getJsonValue`

Get the value in JSON format

```ts
/**
  * Get the value in JSON format
  */
getJsonValue(): string | undefined | (string | {})[];
```

### `setValue`

Set editor value

```ts
/**
  * Set editor value
  * @param value
  * @param options Card asynchronous rendering callback
  */
setValue(value: string, callback?: (count: number) => void): EngineInterface;
```

### `setHtml`

Set html as editor value

```ts
/**
* Set html, it will be formatted as a legal editor value
* @param html html
* @param options Card asynchronous rendering callback
*/
setHtml(html: string, callback?: (count: number) => void): EngineInterface
```

### `setJsonValue`

Set the json format value, which is mainly used to synchronize with the value of the collaborative server

```ts
/**
* Set json format value, mainly used for collaboration
* @param callback Callback after the card is rendered asynchronously
*/
setJsonValue(
  value: Array<any>,
  callback?: (count: number) => void,
): EngineInterface;
```

### `setScrollNode`

Set editor scroll bar node

```ts
setScrollNode(node?: HTMLElement)
```

### showPlaceholder

Display placeholder

```ts
/**
  * Show placeholder
  */
showPlaceholder(): void;
```

Hide placeholder

### hidePlaceholder

```ts
/**
  * Hide placeholder
  */
hidePlaceholder(): void;
```

### `destroy`

Destroy the editor

```ts
destroy():void
```
