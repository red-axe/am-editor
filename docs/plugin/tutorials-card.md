# Card component

Card component

Usually used for completely custom rendering content

## Inheritance

Inherit the `Card` abstract class

```ts
import {Card} from'@aomao/engine'

export default class extends Card {
...
}
```

## Example

### `Rendering`

Rendering a card needs to display the `render` method, which is an abstract method and must be implemented

```ts
import { $, Card } from '@aomao/engine';

export default class extends Card {
	static get cardName() {
		return 'CardName';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	render() {
		//Return the node, it will be automatically appended to the center position of the card
		return $('<div>Card</div>');
		//Or take the initiative to append
		this.getCenter().append($('<div>Card</div>'));
	}
}
```

### React rendering

React components

```ts
import React from 'react';

export default () => <div>React Commponent</div>;
```

Card components

```ts
import ReactDOM from 'react-dom';
import { $, Card, CardType } from '@aomao/engine';
// Introduce custom react components
import ReactCommponent from 'ReactCommponent';

export default class extends Card {
	container?: NodeInterface;

	static get cardName() {
		return 'CardName';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	/**
	 * After the card is rendered successfully, the empty div node has been loaded in the editor
	 * */
	didRender() {
		if (!this.container) return;
		// Get a node of type HTMLElement
		const element = this.container.get<HTMLElement>()!;
		//Use ReactDOM to render React components onto empty div nodes on the container
		ReactDOM.render(<ReactCommponent />, element);
	}

	/**
	 * Render the card
	 * */
	render() {
		// Render an empty div node
		this.container = $('<div></div>');
		return this.container;
	}

	/**
	 * Uninstall components
	 * */
	destroy() {
		super.destory();
		const element = this.container.get<HTMLElement>();
		if (element) ReactDOM.unmountComponentAtNode(elment);
	}
}
```

### Vue rendering

Vue components

```ts
<template>
    <div>Vue Component</div>
</template>
<script lang="ts">
import {defineComponent} from'vue'

export default defineComponent({
    name:"am-vue-component",
})
</script>
```

Card components

```ts
import { createApp, App } from 'vue';
import { $, Card, CardType } from '@aomao/engine';
// Introduce custom vue components
import VueCommponent from 'VueCommponent';

export default class extends Card {
	container?: NodeInterface;
	private vm?: App;

	static get cardName() {
		return 'CardName';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	/**
	 * After the card is rendered successfully, the empty div node has been loaded in the editor
	 * */
	didRender() {
		if (!this.container) return;
		// Get a node of type HTMLElement
		const element = this.container.get<HTMLElement>()!;
		//Use createApp to render the Vue component to the empty div node on the container
		//Add a delay, otherwise it may not be rendered successfully
		setTimeout(() => {
			this.vm = createApp(VueComponent);
			this.vm.mount(element);
		}, 20);
	}

	/**
	 * Render the card
	 * */
	render() {
		// Render an empty div node
		this.container = $('<div></div>');
		return this.container;
	}

	/**
	 * Uninstall components
	 * */
	destroy() {
		super.destory();
		this.vm?.unmount();
		this.vm = undefined;
	}
}
```

### `Toolbar`

To implement the card toolbar, you need to rewrite the `toolbar` method

The toolbar has implemented some default buttons and events, just pass in the name to use

-   `separator` dividing line
-   `copy` copy, you can copy the content of the card containing the root node to the clipboard
-   `delete` delete card
-   `maximize` to maximize the card
-   `more` more button, need additional configuration `items` property
-   `dnd` is the draggable icon button on the left side of the card

In addition, you can customize button properties or render `React` and `Vue` front-end framework components

Customizable toolbar UI types are:

-   `button` button
-   `dropdown` drop-down box
-   `switch` radio button
-   `input` input box
-   `node` a node of type `NodeInterface`

For the configuration of each type, please see its [Type Definition](https://github.com/yanmao-cc/am-editor/blob/master/packages/engine/src/types/toolbar.ts)

```ts
import {
	$,
	Card,
	CardToolbarItemOptions,
	ToolbarItemOptions,
} from '@aomao/engine';

export default class extends Card {
	static get cardName() {
		return 'CardName';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	// Card Toolbar
	toolbar(): Array<CardToolbarItemOptions | ToolbarItemOptions> {
		return [
			// Drag the button on the left
			{
				type: 'dnd',
			},
			// copy
			{
				type: 'copy',
			},
			// delete
			{
				type: 'delete',
			},
			// split line
			{
				type: 'separator',
			},
			// Custom node
			{
				type: 'node',
				node: $('<div />'),
				didMount: (node) => {
					//After loading, you can use the front-end framework to render components to the node node. Vue needs to add delay to use createApp
					console.log(`The button is loaded, ${node}`);
				},
			},
		];
	}

	// render div
	render() {
		return $('<div>Card</div>');
	}
}
```

### Set card value

The default type of card value `CardValue`

Two values of `id` and `type` are provided by default, and the custom value cannot be the same as the default value

-   `id` unique card number
-   `type` card type

```ts
import {$, Card, CardType} from'@aomao/engine'

export default class extends Card<{ count: number }> {

  container?: NodeInterface

  static get cardName() {
    return'CardName';
  }

  static get cardType() {
    return CardType.BLOCK;
  }

  // click on the div
  onClick = () => {
    // Get card value
    const value = this.getValue() || {count: 0}
    // give count + 1
    const count = value.count + 1
    // Reset the card value, it will be saved to the data-card-value attribute on the root node of the card
    this.setValue({
      count,
    });
    // Set the content of the div
    this.container?.html(count)
  };

  // Render the div node
  render() {
    // Get the value of the card
    const value = this.getValue() || {count: 0}
    // Create a div node
    this.container = $(`<div>${value.count}</div>`)
    // bind the click event
    this.container.on("click" => this.onClick)
    // Return the node to load the container
    return this.container
  }
}
```

### Combine with plugins

```ts
import { Plugin, isEngine } from '@aomao/engine';
// Introduce cards
import CardComponent from './component';

type Options = {
	defaultValue?: number;
};

export default class extends Plugin<Options> {
	static get pluginName() {
		return 'card-plugin';
	}
	// The plugin executes the command, call engine.command.excute("card-plugin") to execute the current command
	execute() {
		// Reader does not execute
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
		//Insert the card and pass in the count initialization parameter
		card.insert(CardComponent.cardName, {
			count: this.otpions.defaultValue || 0,
		});
	}
}
export { CardComponent };
```

## Static properties

### `cardName`

CardName, read-only static attribute, required

Type: `string`

The CardName is unique and cannot be repeated with all the CardNames passed into the engine

```ts
export default class extends Plugin {
	//Define the CardName, it is required
	static get cardName() {
		return 'CardName';
	}
}
```

### `cardType`

Card type, read-only static property, required

Type: `CardType`

There are two types of `CardType`, `inline` and `block`

```ts
export default class extends Plugin {
	//Define the card type, it is required
	static get cardType() {
		return CardType.BLOCK;
	}
}
```

### `autoActivate`

Whether it can be activated automatically, the default is false

### `autoSelected`

Whether it can be selected automatically, the default is true

### `singleSelectable`

Whether it can be selected individually, the default is true

### `collab`

Whether you can participate in collaboration, when other authors edit the card, it will cover a layer of shadow

### `focus`

Can focus

### `selectStyleType`

The style of the selected yes, the default is the border change, optional values:

-   `border` border changes
-   `background` background color change

### `toolbarFollowMouse`

Whether the card toolbar follows the mouse position, the default flase

## Attributes

### `editor`

EditEditor example

Type: `EditorInterface`

When the plug-in is instantiated, the editor instance will be passed in. We can access it through `this`

```ts
import {Card, isEngine} from'@aomao/engine'

export default class extends Card<Options> {
...

init() {
console.log(isEngine(this.editor)? "Engine": "Reader")
}
}
```

### `id`

Read only

Type: `string`

Card id, each card has a unique ID, we can use this ID to find instances of card components

### `type`

The card type, the static property `cardType` of the card class is obtained by default. If there is a `type` value in `getValue()`, this value will be used as the `type`

When setting a new `type` value to the card, the current card will be removed and the new `type` will be used to re-render the card at the current card position

Type: `CardType`

### `isEditable`

Read only

Type: `boolean`

Whether the card is editable

### `contenteditable`

Editable node, optional

One or more CSS selectors can be set, and these nodes will become editable

The value of the editable area needs to be customized and saved. It is recommended to save it in the `value` of the card

```ts
import {Card, isEngine} from'@aomao/engine'

export default class extends Card<Options> {
...

    contenteditable = ["div.card-editor-container"]

render(){
        return "<div><div>Thi is Card</div><div class=\"card-editor-container\">Editable here</div></div>"
    }
}
```

### `readonly`

Is it read-only

Type: `boolean`

### `root`

Card root node

Type: `NodeInterface`

### `activated`

Activate now

Type: `boolean`

### `selected`

Whether selected

Type: `boolean`

### `isMaximize`

Whether to maximize

Type: `boolean`

### `activatedByOther`

Activator, effective in cooperative state

Type: `string | false`

### `selectedByOther`

Selected person, valid in collaboration state

Type: `string | false`

### `toolbarModel`

Toolbar operation class

Type: `CardToolbarInterface`

### `resizeModel`

Size adjustment operation class

Type: `ResizeInterface`

### `resize`

Whether the card size can be changed or passed into the rendering node

Type: `boolean | (() => NodeInterface);`

If specified, the `resizeModel` attribute will be instantiated

## Method

### `init`

Initialization, optional

```ts
init?(): void;
```

### `find`

Find the DOM node in the Card

```ts
/**
 * Find the DOM node in the Card
 * @param selector
 */
find(selector: string): NodeInterface;
```

### `findByKey`

Get the DOM node in the current Card through the value of data-card-element

```ts
/**
 * Get the DOM node in the current Card through the value of data-card-element
 * @param key key
 */
findByKey(key: string): NodeInterface;
```

### `getCenter`

Get the central node of the card, which is the outermost node of the custom content area of ​​the card

```ts
/**
 * Get the central node of the card
 */
getCenter(): NodeInterface;
```

### `isCenter`

Determine whether the node belongs to the central node of the card

```ts
/**
 * Determine whether the node belongs to the central node of the card
 * @param node node
 */
isCenter(node: NodeInterface): boolean;
```

### `isCursor`

Determine whether the node is at the left and right cursors of the card

```ts
/**
 * Determine whether the node is at the left and right cursors of the card
 * @param node node
 */
isCursor(node: NodeInterface): boolean;
```

### `isLeftCursor`

Determine whether the node is at the left cursor of the card

```ts
/**
 * Determine whether the node is at the left cursor of the card
 * @param node node
 */
isLeftCursor(node: NodeInterface): boolean;
```

### `isRightCursor`

Determine whether the node is at the right cursor of the card

```ts
/**
 * Determine whether the node is at the right cursor of the card
 * @param node node
 */
isRightCursor(node: NodeInterface): boolean;
```

### `focus`

Focus card

```ts
/**
 * Focus card
 * @param range cursor
 * @param toStart is the starting position
 */
focus(range: RangeInterface, toStart?: boolean): void;
```

### `focusPrevBlock`

Focus on the previous block-level node where the card is located

```ts
/**
 * Focus on the previous block-level node where the card is located
 * @param range cursor
 * @param hasModify When there is no node, whether to create an empty node and focus
 */
focusPrevBlock(range: RangeInterface, hasModify: boolean): void;
```

### `focusNextBlock`

Focus on the next block-level node where the card is located

```ts
/**
 * Focus on the next block-level node where the card is located
 * @param range cursor
 * @param hasModify When there is no node, whether to create an empty node and focus
 */
focusNextBlock(range: RangeInterface, hasModify: boolean): void;
```

### `onFocus`

Triggered when the card is focused

```ts
/**
 * Triggered when the card is focused
 */
onFocus?(): void;
```

### `activate`

Activate Card

```ts
/**
 * Activate Card
 * @param activated Whether to activate
 */
activate(activated: boolean): void;
```

### `select`

Choose Card

```ts
/**
 * Choose Card
 * @param selected is it selected
 */
select(selected: boolean): void;
```

### `onSelect`

Triggered when the selected state changes

```ts
/**
 * Trigger when the selected state changes
 * @param selected is it selected
 */
onSelect(selected: boolean): void;
```

### `onSelectByOther`

In the cooperative state, trigger when the selected state changes

```ts
/**
 * In the cooperative state, trigger when the selected state changes
 * @param selected is it selected
 * @param value {color: collaborator color, rgb: color rgb format}
 */
onSelectByOther(
    selected: boolean,
    value?: {
        color: string;
        rgb: string;
    },
): NodeInterface | void;
```

### `onActivate`

Triggered when the activation state changes

```ts
/**
 * Triggered when the activation status changes
 * @param activated Whether to activate
 */
onActivate(activated: boolean): void;
```

### `onActivateByOther`

In the cooperative state, trigger when the activation state changes

```ts
/**
 * In the cooperative state, trigger when the activation state changes
 * @param activated Whether to activate
 * @param value {color: collaborator color, rgb: color rgb format}
 */
onActivateByOther(
    activated: boolean,
    value?: {
        color: string;
        rgb: string;
    },
): NodeInterface | void;
```

### `onChange`

Trigger when the editable area value changes

```ts
/**
 * Trigger when the editor area value changes
 * @param node editable area node
 */
onChange?(node: NodeInterface): void;
```

### `setValue`

Set card value

```ts
/**
 * Set card value
 * @param value
 */
setValue(value: CardValue): void;
```

### `getValue`

Get card value

```ts
/**
 * Get card value
 */
getValue(): (CardValue & {id: string }) | undefined;
```

### `toolbar`

Toolbar configuration items

```ts
/**
 * Toolbar configuration items
 */
toolbar?(): Array<CardToolbarItemOptions | ToolbarItemOptions>;
```

### `maximize`

Maximize card

```ts
/**
 * Maximize
 */
maximize(): void;
```

### `minimize`

Minimize the card

```ts
/**
 * minimize
 */
minimize(): void;
```

### `render`

Render the card

```ts
/**
 * Render the card
 */
render(): NodeInterface | string | void;
```

### `destroy`

destroy

```ts
/**
 * Destroy
 */
destroy?(): void;
```

### `didInsert`

Triggered after inserting a card into the editor

```ts
/**
 * Trigger after insertion
 */
didInsert?(): void;
```

### `didUpdate`

Triggered after updating the card

```ts
/**
 * Triggered after update
 */
didUpdate?(): void;
```

### `didRender`

Triggered after the card is successfully rendered

```ts
/**
 * Triggered after rendering
 */
didRender(): void;
```

### `updateBackgroundSelection`

Update the editable card collaborative selection area

```ts
/**
 * Update the editable card collaborative selection area
 * @param range cursor
 */
updateBackgroundSelection?(range: RangeInterface): void;
```

### `drawBackground`

Render the editable card collaborative selection area

```ts
/**
  * Rendering the collaborative selection area of the editor card
  * @param node background canvas
  * @param range render cursor
  */
drawBackground?(
     node: NodeInterface,
     range: RangeInterface,
     targetCanvas: TinyCanvasInterface,
): DOMRect | RangeInterface[] | void | false;
```

### `getSelectionNodes`

```ts
/**
  * Get all nodes selected in the editable area
  */
getSelectionNodes?(): Array<NodeInterface>
```
