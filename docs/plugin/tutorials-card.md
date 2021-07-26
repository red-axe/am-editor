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

## Case

### `Rendering`

Rendering a card needs to display the `render` method, which is an abstract method and must be implemented

```ts
import { $, Card } from '@aomao/engine';

export default class extends Card {
	static get cardName() {
		return 'Card Name';
	}

	static get cardType() {
		return CardType.Block;
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

Card component

```ts
import { ReactDOM } from 'react';
import { $, Card } from '@aomao/engine';

export default class extends Card {
	container?: NodeInterface;

	static get cardName() {
		return 'Card Name';
	}

	static get cardType() {
		return CardType.Block;
	}

	//After the card is rendered successfully, the node has been loaded in the editor
	didRender() {
		if (!this.container) return;
		const element = this.container.get<HTMLElement>()!;
		//Use ReactDOM to render components
		ReactDOM.render(<ReactCommponent />, element);
	}

	render() {
		this.container = $('<div></div>');
		return this.container;
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

Card component

```ts
import { createApp } from 'vue';
import { $, Card } from '@aomao/engine';

export default class extends Card {
	container?: NodeInterface;

	static get cardName() {
		return 'Card Name';
	}

	static get cardType() {
		return CardType.Block;
	}

	//After the card is rendered successfully, the node has been loaded in the editor
	didRender() {
		if (!this.container) return;
		const element = this.container.get<HTMLElement>()!;
		//Use createApp to render components
		//Add a delay, otherwise it may not be rendered successfully
		setTimeout(() => {
			const vm = createApp(VueComponent);
			vm.mount(container);
		}, 20);
	}

	render() {
		this.container = $('<div></div>');
		return this.container;
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
		return 'Card Name';
	}

	static get cardType() {
		return CardType.Block;
	}

	toolbar(): Array<CardToolbarItemOptions | ToolbarItemOptions> {
		return [
			{
				type: 'dnd',
			},
			{
				type: 'copy',
			},
			{
				type: 'delete',
			},
			{
				type: 'node',
				node: $('<div />'),
				didMount: (node) => {
					//After loading, you can use the front-end framework to render components to the node node
					console.log(`The button is loaded, ${node}`);
				},
			},
		];
	}

	render() {
		return $('<div>Card</div>');
	}
}
```

### Set card value

```ts
import { $, Card } from'@aomao/engine'

export default class extends Card {

    container?: NodeInterface

    static get cardName() {
        return'Card Name';
    }

    static get cardType() {
        return CardType.Block;
    }

    onClick = () => {
        const value = this.getValue() || {count: 0}
                const count = value.count + 1
        this.setValue({
            count,
        });
        this.container?.html(count)
    };

    render() {
        const value = this.getValue() || {count: 0}
        this.container = $(`<div>${value.count}</div>`)
        this.container.on("click" => this.)
        return this.container
    }
}
```

### Combine with plugins

```ts
import { Plugin } from '@aomao/engine';
import CardComponent from './component';

export default class extends Plugin<Options> {
	static get pluginName() {
		return 'card-plugin';
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
		//Insert card
		card.insert(CardComponent.cardName);
	}
}
export { CardComponent };
```

## Static properties

### `cardName`

Card name, read-only static attribute, required

Type: `string`

The card name is unique and cannot be repeated with all the card names passed into the engine

```ts
export default class extends Plugin {
	//Define the card name, it is required
	static get cardName() {
		return 'Card Name';
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
		return CardType.Block;
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
        return "<div><div>Thi is Card</div><div class=\"card-editor-container\"></div></div>"
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
