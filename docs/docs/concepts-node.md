# Node

The DOM node is the most important object in the editor, and the editor data structure is a DOM tree. According to functions and characteristics, we can be divided into

-   `mark` style node, we can add color, bold, font size and other effects to the text, and can nest effects in each other
-   `inline` Inline nodes, for example, links. Add special attributes or style effects to a paragraph of text, not nested.
-   `block` block-level node, can occupy a line alone, and can have multiple `mark` `inline` style nodes as child nodes
-   `card` is a single area, which can be in-line nodes or block-level nodes. In this area, unless there is a specific area that can be edited, it will be handed over to the developer to customize

This is a simple plain text value:

```html
<p>This is a <strong>paragraph</strong></p>
```

Nodes usually consist of html tags and some style attributes. In order to facilitate the distinction, the composition of each style node should be unique.

For example, to have a unique label name:

```html
<strong>Bold</strong> <em>Italic</em>
```

Or modified by attributes and styles:

```html
<span style="font-weight:bold">Bold</span>
<span style="font-style:italic">Italic</span>
```

They all have the same effect, but the engine judges that they all belong to different plugins.

## Style node

The style node is usually used to describe the text size, bold, italic, color and other styles of the text.

The child nodes of a style node can only be a text node or a style node. The style node must have a parent node (inline node or block-level node) and cannot exist in the editor alone.

```html
<p>
	This is a <span style="color:red"><em>red</em> text</span>
</p>
```

## In-line node

Inline nodes have all the characteristics of style nodes, but inline nodes cannot be nested, and the child nodes of inline nodes can only be style nodes or text nodes. Similarly, inline nodes must have a parent node (only block-level nodes), and cannot exist alone in the editor.

```html
<p>
	This is <a href="https://www.aomao.com">a <strong>link</strong></a>
</p>
```

## Block node

The block-level node occupies a line in the editor. Except for explicitly specifying the nesting relationship with `schema`, it can only be under `$root` (editor root node) by default. The child node can be any other node, unless it has been specified that the plugin cannot contain certain style node classes. For example, bolding and adjusting the font size cannot be used in the title.

```html
<!-- strong tags will be filtered out -->
<h2>This is a <strong>title</strong></h2>
```

The p tag belongs to the block-level node required by default in the engine and is used to indicate a paragraph. In custom nodes, it is not recommended to use the p tag.

## Card

We can divide a separate area in the editor to display a complex editing module. This area is like a piece of white paper, you can sway freely on it. His structure looks like this:

```html
<div
	data-card-value="data:%7B%22id%22%3A%22eIxTM%22%7D"
	data-card-type="block"
	data-card-key="hr"
>
	<div data-card-element="body">
		<span data-card-element="left" data-transient-element="true">​</span>
		<div data-card-element="center" contenteditable="false" class="card-hr">
			<!-- Card content node -->
		</div>
		<span data-card-element="right" data-transient-element="true">​</span>
	</div>
</div>
```

### Attributes

`data-card-type` indicates the card type, there are two types of cards:

-   Inline `inline` can be embedded in a block-level label as a child node, which can be displayed at the same level as text, style nodes, and other inline nodes
-   `block` as a block-level node on its own line

`data-card-value` card custom value, which can be dynamically rendered with the help of the value during rendering

`data-card-key` card name identification

### Child node

`data-card-element` card sub-fixed node identification attribute

-   `body` The main node of the card, which contains all the content of the card
-   `left` `right` The user controls the cursor on both sides of the card, which is also a fixed node and cannot store any content
-   The `center` card content node is also a custom rendering node. All your nodes should be placed here.

## Node selector

To manipulate the complex DOM tree, it seems more troublesome to use the document.createElement related function that comes with the browser. It would be very convenient if there is a javascript library like `JQuery`, so we encapsulated a "simple version of the jquery library".

```ts
import { $ } from '@aomao/engine';

//Select node
const node = $('CSS selector');
//Create node
const divNode = $('<div></div>');
```

Using \$ to create or select a node will return a `NodeInterface` type object, which can better help you manage DOM `Node` nodes. Please check the API for specific properties and methods
