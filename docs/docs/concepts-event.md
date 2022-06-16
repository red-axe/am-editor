# Incident

In the engine, we handle many events by default, such as: text input, delete, copy, paste, left and right arrow keys, markdown syntax input monitoring, plugin shortcut keys, and so on. These events may have different processing logic at different cursor positions. Most operations are to modify the DOM tree structure and repair the cursor position. In addition, we also expose these events to the plugin to handle by itself.

Method signature

```ts
/**
* Bind event
* @param eventType event type
* @param listener event callback
* @param rewrite whether to rewrite
*/
on(eventType: string, listener: EventListener, rewrite?: boolean): void;
/**
 * Remove bound event
 * @param eventType event type
 * @param listener event callback
 */
off(eventType: string, listener: EventListener): void;
/**
 * trigger event
 * @param eventType event name
 * @param args trigger parameters
 */
trigger(eventType: string, ...args: any): any;
```

### Element events

In javascript, we usually use document.addEventListener document.removeEventListener to bind DOM element events. In the engine, we abstract an `EventInterface` type interface, and elements of the `NodeInterface` type are bound to an attribute event of the `EventInterface` type. So as long as the element of type `NodeInterface` can be bound, removed, and triggered by on off trigger. Not only can bind DOM native events, but also custom events

```ts
const node = $('<div></div>');
//Native event
node.on('click', () => alert('click'));
//Custom event
node.on('customer', () => alert('customer'));
node.trigger('customer');
```

### Editor events

We have processed the specific combination of keys. The following are some of the events we exposed, which are effective in both editing mode and reading mode.

```ts
//engine
engine.on('event name', 'processing method');
//read
view.on('event name', 'processing method');
```

### `keydown:all`

Select all ctrl+a key press, if it returns false, stop processing other monitors

```ts
/**
 * @param event key event
 * */
(event: KeyboardEvent) => boolean | void
```

### `card:minimiz`

Triggered when the card is minimized

```ts
/**
 * @param card card instance
 * */
(card: CardInterface) => void
```

### `card:maximize`

Triggered when the card is maximized

```ts
/**
 * @param card card instance
 * */
(card: CardInterface) => void
```

### `parse:value-before`

Triggered before parsing DOM nodes and generating standard editor values

```ts
/**
* @param root DOM root node
*/
(root: NodeInterface) => void
```

### `parse:value`

Parse the DOM node, generate the editor value that meets the standard, and trigger when it traverses the child nodes. Return false to skip the current node

```ts
/**
* @param node The node currently traversed
* @param attributes The filtered attributes of the current node
* @param styles The filtered style of the current node
* @param value The currently generated editor value collection
*/
(
    node: NodeInterface,
    attributes: {[key: string]: string },
    styles: {[key: string]: string },
    value: Array<string>,
) => boolean | void
```

### `parse:text`

Parse the DOM node, generate the text, and trigger when it traverses the child nodes. Return false to skip the current node

```ts
/**
* @param node The node currently traversed
* @param attributes The filtered attributes of the current node
* @param styles The filtered style of the current node
* @param value The currently generated text
*/
(
    node: NodeInterface,
    attributes: {[key: string]: string },
    styles: {[key: string]: string },
    value: Array<string>,
) => boolean | void
```

### `parse:value-after`

Analyze DOM nodes and generate editor values ​​that conform to the standard. Triggered after generating xml code

```ts
/**
* @param value xml code
*/
(value: Array<string>) => void
```

### `parse:html-before`

Triggered before conversion to HTML code

```ts
/**
* @param root The root node to be converted
*/
(root: NodeInterface) => void
```

### `parse:html`

Convert to HTML code

```ts
/**
* @param root The root node to be converted
*/
(root: NodeInterface) => void
```

### `parse:html-after`

Triggered after conversion to HTML code

```ts
/**
* @param root The root node to be converted
*/
(root: NodeInterface) => void
```

### `copy`

Triggered when DOM node is copied

```ts
/**
* @param node The child node currently traversed
*/
(root: NodeInterface) => void
```

## Engine events

### `change`

Editor value change event

```ts
/**
 * @param value Editor value
 * */
(value: string) => void
```

### `select`

Editor cursor selection trigger

```ts
() => void
```

### `focus`

Triggered when the editor is focused

```ts
() => void
```

### `blur`

Triggered when the editor loses focus

```ts
() => void
```

### `beforeCommandExecute`

Triggered before the editor executes the command

```ts
/**
 * @param name Execute plugin command name
 * @param args command execution parameters
 * */
(name: string, ...args: any) => void
```

### `afterCommandExecute`

Triggered after the editor executes a command

```ts
/**
 * @param name Execute plugin command name
 * @param args command execution parameters
 * */
(name: string, ...args: any) => void
```

### `drop:files`

Triggered when a file is dragged to the editor

```ts
/**
 * @param files file collection
 * */
(files: Array<File>) => void
```

### `beforeSetValue`

Triggered before assigning a value to the editor

```ts
/**
 * @param value Editor value
 * */
(value: string) => void
```

### `afterSetValue`

Triggered after assigning a value to the editor

```ts
/**
 * @param value Editor value
 * */
(value: string) => void
```

### `readonly`

Triggered when the editor's read-only attribute is changed

```ts
/**
 * @param readonly is read-only
 * */
(readonly: boolean) => void
```

### `paste:event`

Triggered when the paste to editor event occurs, if it returns false, the paste will not be processed

```ts
/**
 * @param data Pasteboard related data
 * @param source pasted rich text
 * */
(data: ClipboardData & {isPasteText: boolean }, source: string) => boolean | void
```

### `paste:schema`

Set the structural rules of the DOM elements that need to be retained for this pasting, and the structural rules that the attributes need to retain

```ts
/**
 * @param schema Schema object, you can add, modify, delete and other operations to the structure rules
 * */
(schema: SchemaInterface) => void
```

### `paste:origin`

Parse the pasted data, and trigger before generating a fragment that matches the editor data

```ts
/**
 * @param root pasted DOM node
 * */
(root: NodeInterface) => void
```

### `paste:each`

Analyze the pasted data, generate a fragment that matches the editor data, and then cyclically organize the sub-elements to trigger

```ts
/**
 * @param node Paste the element child nodes traversed by the fragment
 * */
(root: NodeInterface) => void,
```

### `paste:each-after`

Analyze the pasted data, generate a fragment that matches the editor data, and then cycle through the sub-element stage to trigger

```ts
/**
 * @param node Paste the element child nodes traversed by the fragment
 * */
(root: NodeInterface) => void
```

### `paste:before`

After the DOM fragment is generated from the pasted data, it is triggered before it is written to the editor

```ts
/**
 * @param fragment pasted fragment
 * */
(fragment: DocumentFragment) => void
```

### `paste:insert`

Triggered after inserting the currently pasted fragment, the card has not been rendered yet

```ts
/**
 * @param range cursor instance after current insertion
 * */
(range: RangeInterface) => void
```

### `paste:after`

Triggered after the paste action is completed

```ts
() => void
```

### `ops`

Triggered by DOM changes, these operational changes are usually sent to the collaborative server for interaction

```ts
/**
 * @param ops operation item
 * */
(ops: Op[]) => void
```

### `keydown:enter`

Press the enter key, if it returns false, stop processing other monitors

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:backspace`

The delete key is pressed, if it returns false, the processing of other monitors is terminated

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:tab`

Tab key is pressed, if it returns false, stop processing other monitors

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:shift-tab`

Press the Shift-Tab key, if it returns false, stop processing other monitors

```ts
(event: KeyboardEvent) => boolean |void
```

### `keydown:at`

@ The corresponding key is pressed, if it returns false, the processing of other monitors will be terminated

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:space`

Press the space bar, if it returns false, stop processing other monitors

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:slash`

Press the backslash key to call out the Toolbar, if it returns false, stop processing other monitors

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:left`

Press the left arrow key, if it returns false, stop processing other monitors

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:right`

Press the right arrow key, if it returns false, stop processing other monitors

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:up`

Press the up arrow key, if it returns false, stop processing other monitors

```ts
(event: KeyboardEvent) => boolean | void
```

### `keydown:down`

Press the down arrow key, if it returns false, stop processing other monitors

```ts
(event: KeyboardEvent) => boolean | void
```

### `keyup:enter`

Press the enter key to bounce up, if it returns false, stop processing other monitors

```ts
(event: KeyboardEvent) => boolean | void
```

### `keyup:backspace`

Press the delete button to pop up, if it returns false, terminate the processing of other monitors

```ts
(event: KeyboardEvent) => boolean | void
```

### `keyup:tab`

Tab key presses and pops up, if it returns false, terminate the processing of other monitors

```ts
(event: KeyboardEvent) => boolean | void
```

### `keyup:space`

Press the space bar to pop up, if it returns false, terminate the processing of other monitors

```ts
(event: KeyboardEvent) => boolean | void
```

## Reader events

### `render`

Triggered after the reader has finished rendering

```ts
/**
 * @param node render root node
 * */
(node: NodeInterface) => void
```
