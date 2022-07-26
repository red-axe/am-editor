# Engine and reader share attributes and methods

Type: `EditorInterface`

Editing engine and reader share attributes and methods

## Attributes

### `kind`

Editor type, editing engine or reader

```ts
readonly kind:'engine' |'view';
```

### `language`

Language

Type: `LanguageInterface`

### `container`

Editor node

Type: `NodeInterface`

### `root`

Editor root node, the default is the parent node of the editor node

Type: `NodeInterface`

### `command`

Editor commands

Type: `CommandInterface`

### `card`

Card management, you can create cards, delete, modify, update and other related operations

Type: `CardModelInterface`

### `plugin`

Can manage all instantiated plugin instances

Type: `PluginModelInterface`

### `node`

Node management, including node type judgment, inserting nodes in the DOM tree

Type: `NodeModelInterface`

### nodeId

Node data-id manager

```ts
/**
 * Node id manager
 */
nodeId: NodeIdInterface;
```

### `list`

List node management

Type: `ListModelInterface`

### `mark`

Style node management

Type: `MarkModelInterface`

### `inline`

In-line node management

Type: `InlineModelInterface`

### `block`

Block-level node management

Type: `BlockModelInterface`

### `event`

Incident management

Type: `EventInterface`

### `schema`

Element structure management

Type: `SchemaInterface`

### `conversion`

Element name conversion rules

Type: `ConversionInterface`

### `clipboard`

Clipboard management

Type: `ClipboardInterface`

## Method

### `on`

Event binding

```ts
/**
 * Bind event
 * @param eventType event type
 * @param listener event callback
 * @param rewrite whether to rewrite
 */
on(eventType: string, listener: EventListener, rewrite?: boolean): void;
```

### `off`

Remove event binding

```ts
/**
 * Remove bound event
 * @param eventType event type
 * @param listener event callback
 */
off(eventType: string, listener: EventListener): void;
```

### `trigger`

trigger event

```ts
/**
* trigger event
* @param eventType event name
* @param args trigger parameters
*/
trigger(eventType: string, ...args: any): any;
```

### `messageSuccess`

Show success messages, and print messages on the console by default. You can modify the `messageSuccess` method and use the UI to display `engine.messageSuccess = text => Message.show(text)`

This method may be called in the plugin or the engine to pop up a message

```ts
/**
* Show success information
* @param message
*/
messageSuccess(type: string, message: string, ...args: any[]): void;
```

### `messageError`

Show error message

```ts
/**
 * Display error message
 * @param error error message
 */
messageError(type: string, message: string, ...args: any[]): void;
```

### `messageConfirm`

A confirmation prompt box pops up, no UI is displayed in the engine by default, and false is always returned. So you need to re-assign a meaningful confirmation prompt box function

For example, using the Modal.confirm component of antd

```ts
engine.messageConfirm = (msg: string) => {
	return new Promise<boolean>((resolve, reject) => {
		Modal.confirm({
			content: msg,
			onOk: () => resolve(true),
			onCancel: () => reject(),
		});
	});
};
```

Method signature

```ts
/**
* Message confirmation
* @param message
*/
messageConfirm(type: string, message: string, ...args: any[]): Promise<boolean>;
```
