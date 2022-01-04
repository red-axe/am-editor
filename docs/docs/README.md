---
title: Introduction
---

## What is it?

A rich text editor that supports collaborative editing, you can freely use React, Vue and other front-end common libraries to extend and define plug-ins.

## Fundamental

Use the `contenteditable` attribute provided by the browser to make a DOM node editable:

```html
<div contenteditable="true"></div>
```

So its value looks like this:

```html
<div data-element="root" contenteditable="true">
	<p>Hello world!</p>
	<p><br /></p>
</div>
```

Of course, in some scenarios, for the convenience of operation, an API that converts to a JSON type value is also provided:

```json
[
	"div", // node name
	// All attributes of the node
	{
		"data-element": "root",
		"contenteditable": "true"
	},
	// child node 1
	[
		// child node name
		"p",
		// Child node attributes
		{},
		// child node of byte point
		"Hello world!"
	],
	// child node 2
	["p", {}, ["br", {}]]
]
```

<Alert>
  The editor relies on the input capabilities provided by the <strong>contenteditable</strong> attribute and cursor control capabilities. Therefore, it has all the default browser behaviors, but the default behavior of the browser has different processing methods under different browser vendors' implementations, so we intercept most of its default behaviors and customize them.
</Alert>

For example, during the input process, `beforeinput`, `input`, delete, enter, and shortcut keys related to `mousedown`, `mouseup`, `click` and other events will be intercepted and customized processing will be performed.

After taking over the event, what the editor does is to manage all the child nodes under the root node based on the `contenteditable` property, such as inserting text, deleting text, inserting pictures, and so on.

In summary, the data structure in editing is a DOM tree structure, and all operations are performed directly on the DOM tree, not a typical MVC mode that drives view rendering with a data model.

## Node constraints

In order to manage nodes more conveniently and reduce complexity. The editor abstracts node attributes and functions, and formulates four types of nodes, `mark`, `inline`, `block`, and `card`. They are composed of different attributes, styles, or `html` structures, and use the `schema` uniformly. They are constrained.

A simple `schema` looks like this:

```ts
{
  name:'p', // node name
  type:'block' // node type
}
```

In addition, you can also describe attributes, styles, etc., such as:

```ts
{
  name:'span', // node name
  type:'mark', // node type
  attributes: {
    // The node has a style attribute
    style: {
      // Must contain a color style
      color: {
        required: true, // must contain
        value:'@color' // The value is a color value that conforms to the css specification. @color is the color validation defined in the editor. Here, methods and regular expressions can also be used to determine whether the required rules are met
      }
    },
    // Optional include a test attribute, its value can be arbitrary, but it is not required
    test:'*'
  }
}
```

The following types of nodes conform to the above rules:

```html
<span style="color:#fff"></span>
<span style="color:#fff" test="test123" test1="test1"></span>
<span style="color:#fff;background-color:#000;"></span>
<span style="color:#fff;background-color:#000;" test="test123"></span>
```

But except that color and test have been defined in `schema`, other attributes (background-color, test1) will be filtered out by the editor during processing.

The nodes in the editable area have four types of combined nodes of `mark`, `inline`, block`, and `card`through the`schema`rule. They are composed of different attributes, styles or`html` structures. Certain constraints are imposed on nesting.

## Collaboration

Use the `MutationObserver` to monitor the mutation of the `html` structure in the editable area (contenteditable root node) to reverse infer OT. Connect to [ShareDB](https://github.com/share/sharedb) through `Websocket`, and then use commands to add, delete, modify, and check the data saved in ShareDB.

## Features

-   Out of the box, it provides dozens of rich plug-ins to meet most needs
-   High extensibility, in addition to the basic plug-in of `mark`, inline`, and `block`type, we also provide`card`component combined with`React`, `Vue` and other front-end libraries to render the plug-in UI
-   Rich multimedia support, not only supports pictures, audio and video, but also supports insertion of embedded multimedia content
-   Support Markdown syntax
-   The engine is written in pure JavaScript and does not rely on any front-end libraries. Plug-ins can be rendered using front-end libraries such as `React` and `Vue`. Easily cope with complex architecture
-   Built-in collaborative editing program, ready to use with lightweight configuration
-   Compatible with most of the latest mobile browsers
