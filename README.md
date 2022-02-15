# am-editor

<p align="center">
	A rich text editor that supports collaborative editing, you can freely use React, Vue and other front-end common libraries to extend and define plug-ins.
</p>

<p align="center">
	<a href="https://editor.aomao.com"><strong>Preview</strong></a> ·
  	<a href="https://editor.aomao.com/docs"><strong>Documentation</strong></a> ·
 	<a href="#plugins"><strong>Plugins</strong></a>
</p>

<div align="center">
  <p>
    <a href="README.zh-CN.md">
      <img src="https://img.shields.io/badge/lang-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-red.svg?longCache=true&style=flat-square">
    </a>
  </p>
</div>

![aomao-preview](https://user-images.githubusercontent.com/55792257/125074830-62d79300-e0f0-11eb-8d0f-bb96a7775568.png)

<p align="center">
  <a href="./packages/engine/package.json">
    <img src="https://img.shields.io/npm/l/@aomao/engine">
  </a>
  <a href="https://unpkg.com/@aomao/engine/dist/index.js">
    <img src="http://img.badgesize.io/https://unpkg.com/@aomao/engine/dist/index.js?compression=gzip&amp;label=size">
  </a>
  <a href="./packages/engine/package.json">
    <img src="https://img.shields.io/npm/v/@aomao/engine.svg?maxAge=3600&label=version&colorB=007ec6">
  </a>
  <a href="https://www.npmjs.com/package/@aomao/engine">
    <img src="https://img.shields.io/npm/dw/@aomao/engine">
  </a>
  <a href="https://github.com/umijs/dumi">
    <img src="https://img.shields.io/badge/docs%20by-dumi-blue">
  </a>
</p>

## Example

[**`Vue2`**](https://github.com/zb201307/am-editor-vue2)

[**`Vue3`**](https://github.com/red-axe/am-editor-vue)

[**`React`** ](https://github.com/yanmao-cc/am-editor/tree/master/examples/react)

[**`Vue2 Demo`**](https://github.com/yanmao-cc/am-editor-demo-vue2)

[**`Vue2 Nuxt Demo`**](https://github.com/yanmao-cc/am-editor-nuxt)

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

```ts
[
	'div', // node name
	// All attributes of the node
	{
		'data-element': 'root',
		contenteditable: 'true',
	},
	// child node 1
	[
		// child node name
		'p',
		// Child node attributes
		{},
		// child node of byte point
		'Hello world!',
	],
	// child node 2
	['p', {}, ['br', {}]],
];
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

## Features

-   Out of the box, it provides dozens of rich plug-ins to meet most needs
-   High extensibility, in addition to the basic plug-in of `mark`, inline`and`block`type`, we also provide`card`component combined with`React`, `Vue` and other front-end libraries to render the plug-in UI
-   Rich multimedia support, not only supports pictures, audio and video, but also supports insertion of embedded multimedia content
-   Support Markdown syntax
-   Support internationalization
-   The engine is written in pure JavaScript and does not rely on any front-end libraries. Plug-ins can be rendered using front-end libraries such as `React` and `Vue`. Easily cope with complex architecture
-   Built-in collaborative editing program, ready to use with lightweight configuration
-   Compatible with most of the latest mobile browsers

## Plugins

| **Package**                                                                                           |                                                                                                                                                                             **Version** |                                                                                                                                                                           **Size** | **Description**                        |
| :---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------- |
| [`@aomao/toolbar`](./packages/toolbar)                                                                |                                                                [![](https://img.shields.io/npm/v/@aomao/toolbar.svg?maxAge=3600&label=&colorB=007ec6)](./packages/toolbar/package.json) |                           [![](http://img.badgesize.io/https://unpkg.com/@aomao/toolbar/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/toolbar/dist/index.js) | Toolbar, for React.                    |
| [`@aomao/toolbar-vue`](./packages/toolbar-vue)                                                        |                                                        [![](https://img.shields.io/npm/v/@aomao/toolbar-vue.svg?maxAge=3600&label=&colorB=007ec6)](./packages/toolbar-vue/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/toolbar-vue/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/toolbar-vue/dist/index.js) | Toolbar, for `Vue3`.                   |
| [`am-editor-toolbar-vue2`](https://github.com/zb201307/am-editor-vue2/tree/main/packages/toolbar)     |     [![](https://img.shields.io/npm/v/am-editor-toolbar-vue2.svg?maxAge=3600&label=&colorB=007ec6)](https://github.com/zb201307/am-editor-vue2/blob/main/packages/toolbar/package.json) |           [![](http://img.badgesize.io/https://unpkg.com/am-editor-toolbar-vue2/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/am-editor-toolbar-vue2/dist/index.js) | Toolbar, for `Vue2`                    |
| [`@aomao/plugin-alignment`](./plugins/alignment)                                                      |                                                      [![](https://img.shields.io/npm/v/@aomao/plugin-alignment.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/alignment/package.json) |         [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-alignment/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-alignment/dist/index.js) | Alignment.                             |
| [`@aomao/plugin-embed`](./plugins/embed)                                                              |                                                              [![](https://img.shields.io/npm/v/@aomao/plugin-embed.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/embed/package.json) |                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-embed/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-embed/dist/index.js) | Embed URL                              |
| [`@aomao/plugin-backcolor`](./plugins/backcolor)                                                      |                                                      [![](https://img.shields.io/npm/v/@aomao/plugin-backcolor.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/backcolor/package.json) |         [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-backcolor/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-backcolor/dist/index.js) | Background color.                      |
| [`@aomao/plugin-bold`](./plugins/bold)                                                                |                                                                [![](https://img.shields.io/npm/v/@aomao/plugin-bold.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/bold/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-bold/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-bold/dist/index.js) | Bold.                                  |
| [`@aomao/plugin-code`](./plugins/code)                                                                |                                                                [![](https://img.shields.io/npm/v/@aomao/plugin-code.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/code/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-code/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-code/dist/index.js) | Inline code.                           |
| [`@aomao/plugin-codeblock`](./plugins/codeblock)                                                      |                                                      [![](https://img.shields.io/npm/v/@aomao/plugin-codeblock.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/codeblock/package.json) |         [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-codeblock/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-codeblock/dist/index.js) | Code block, for React.                 |
| [`@aomao/plugin-codeblock-vue`](./plugins/codeblock-vue)                                              |                                              [![](https://img.shields.io/npm/v/@aomao/plugin-codeblock-vue.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/codeblock-vue/package.json) | [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-codeblock-vue/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-codeblock-vue/dist/index.js) | Code block, for `Vue3`.                |
| [`am-editor-codeblock-vue2`](https://github.com/zb201307/am-editor-vue2/tree/main/packages/codeblock) | [![](https://img.shields.io/npm/v/am-editor-codeblock-vue2.svg?maxAge=3600&label=&colorB=007ec6)](https://github.com/zb201307/am-editor-vue2/tree/main/packages/codeblock/package.json) |       [![](http://img.badgesize.io/https://unpkg.com/am-editor-codeblock-vue2/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/am-editor-codeblock-vue2/dist/index.js) | Code Block, for `Vue2`                 |
| [`@aomao/plugin-fontcolor`](./plugins/fontcolor)                                                      |                                                      [![](https://img.shields.io/npm/v/@aomao/plugin-fontcolor.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/fontcolor/package.json) |         [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-fontcolor/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-fontcolor/dist/index.js) | Font color.                            |
| [`@aomao/plugin-fontfamily`](./plugins/fontfamily)                                                    |                                                    [![](https://img.shields.io/npm/v/@aomao/plugin-fontfamily.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/fontfamily/package.json) |       [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-fontfamily/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-fontfamily/dist/index.js) | Font.                                  |
| [`@aomao/plugin-fontsize`](./plugins/fontsize)                                                        |                                                        [![](https://img.shields.io/npm/v/@aomao/plugin-fontsize.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/fontsize/package.json) |           [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-fontsize/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-fontsize/dist/index.js) | Font size.                             |
| [`@aomao/plugin-heading`](./plugins/heading)                                                          |                                                          [![](https://img.shields.io/npm/v/@aomao/plugin-heading.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/heading/package.json) |             [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-heading/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-heading/dist/index.js) | Heading.                               |
| [`@aomao/plugin-hr`](./plugins/hr)                                                                    |                                                                    [![](https://img.shields.io/npm/v/@aomao/plugin-hr.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/hr/package.json) |                       [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-hr/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-hr/dist/index.js) | Dividing line.                         |
| [`@aomao/plugin-indent`](./plugins/indent)                                                            |                                                            [![](https://img.shields.io/npm/v/@aomao/plugin-indent.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/indent/package.json) |               [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-indent/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-indent/dist/index.js) | Indent.                                |
| [`@aomao/plugin-italic`](./plugins/italic)                                                            |                                                            [![](https://img.shields.io/npm/v/@aomao/plugin-italic.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/italic/package.json) |               [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-italic/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-italic/dist/index.js) | Italic.                                |
| [`@aomao/plugin-link`](./plugins/link)                                                                |                                                                [![](https://img.shields.io/npm/v/@aomao/plugin-link.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/link/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-link/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-link/dist/index.js) | Link, for React.                       |
| [`@aomao/plugin-link-vue`](./plugins/link-vue)                                                        |                                                        [![](https://img.shields.io/npm/v/@aomao/plugin-link-vue.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/link-vue/package.json) |           [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-link-vue/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-link-vue/dist/index.js) | Link, for `Vue3`.                      |
| [`am-editor-link-vue2`](https://github.com/zb201307/am-editor-vue2/tree/main/packages/link)           |           [![](https://img.shields.io/npm/v/am-editor-link-vue2.svg?maxAge=3600&label=&colorB=007ec6)](https://github.com/zb201307/am-editor-vue2/tree/main/packages/link/package.json) |                 [![](http://img.badgesize.io/https://unpkg.com/am-editor-link-vue2/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/am-editor-link-vue2/dist/index.js) | Link, for `Vue2`                       |
| [`@aomao/plugin-line-height`](./plugins/line-height)                                                  |                                                  [![](https://img.shields.io/npm/v/@aomao/plugin-line-height.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/line-height/package.json) |     [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-line-height/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-line-height/dist/index.js) | Line height.                           |
| [`@aomao/plugin-mark`](./plugins/mark)                                                                |                                                                [![](https://img.shields.io/npm/v/@aomao/plugin-mark.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/mark/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-mark/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-mark/dist/index.js) | Mark.                                  |
| [`@aomao/plugin-mention`](./plugins/mention)                                                          |                                                          [![](https://img.shields.io/npm/v/@aomao/plugin-mention.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/mention/package.json) |             [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-mention/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-mention/dist/index.js) | Mention                                |
| [`@aomao/plugin-orderedlist`](./plugins/orderedlist)                                                  |                                                  [![](https://img.shields.io/npm/v/@aomao/plugin-orderedlist.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/orderedlist/package.json) |     [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-orderedlist/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-orderedlist/dist/index.js) | Ordered list.                          |
| [`@aomao/plugin-paintformat`](./plugins/paintformat)                                                  |                                                  [![](https://img.shields.io/npm/v/@aomao/plugin-paintformat.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/paintformat/package.json) |     [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-paintformat/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-paintformat/dist/index.js) | Format Painter.                        |
| [`@aomao/plugin-quote`](./plugins/quote)                                                              |                                                              [![](https://img.shields.io/npm/v/@aomao/plugin-quote.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/quote/package.json) |                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-quote/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-quote/dist/index.js) | Quote block.                           |
| [`@aomao/plugin-redo`](./plugins/redo)                                                                |                                                                [![](https://img.shields.io/npm/v/@aomao/plugin-redo.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/redo/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-redo/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-redo/dist/index.js) | Redo history.                          |
| [`@aomao/plugin-removeformat`](./plugins/removeformat)                                                |                                                [![](https://img.shields.io/npm/v/@aomao/plugin-removeformat.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/removeformat/package.json) |   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-removeformat/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-removeformat/dist/index.js) | Remove style.                          |
| [`@aomao/plugin-selectall`](./plugins/selectall)                                                      |                                                      [![](https://img.shields.io/npm/v/@aomao/plugin-selectall.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/selectall/package.json) |         [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-selectall/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-selectall/dist/index.js) | Select all.                            |
| [`@aomao/plugin-status`](./plugins/status)                                                            |                                                            [![](https://img.shields.io/npm/v/@aomao/plugin-status.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/status/package.json) |               [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-status/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-status/dist/index.js) | Status.                                |
| [`@aomao/plugin-strikethrough`](./plugins/strikethrough)                                              |                                              [![](https://img.shields.io/npm/v/@aomao/plugin-strikethrough.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/strikethrough/package.json) | [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-strikethrough/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-strikethrough/dist/index.js) | Strikethrough.                         |
| [`@aomao/plugin-sub`](./plugins/sub)                                                                  |                                                                  [![](https://img.shields.io/npm/v/@aomao/plugin-sub.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/sub/package.json) |                     [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-sub/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-sub/dist/index.js) | Sub.                                   |
| [`@aomao/plugin-sup`](./plugins/sup)                                                                  |                                                                  [![](https://img.shields.io/npm/v/@aomao/plugin-sup.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/sup/package.json) |                     [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-sup/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-sup/dist/index.js) | Sup.                                   |
| [`@aomao/plugin-tasklist`](./plugins/tasklist)                                                        |                                                        [![](https://img.shields.io/npm/v/@aomao/plugin-tasklist.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/tasklist/package.json) |           [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-tasklist/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-tasklist/dist/index.js) | task list.                             |
| [`@aomao/plugin-underline`](./plugins/underline)                                                      |                                                      [![](https://img.shields.io/npm/v/@aomao/plugin-underline.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/underline/package.json) |         [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-underline/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-underline/dist/index.js) | Underline.                             |
| [`@aomao/plugin-undo`](./plugins/undo)                                                                |                                                                [![](https://img.shields.io/npm/v/@aomao/plugin-undo.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/undo/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-undo/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-undo/dist/index.js) | Undo history.                          |
| [`@aomao/plugin-unorderedlist`](./plugins/unorderedlist)                                              |                                              [![](https://img.shields.io/npm/v/@aomao/plugin-unorderedlist.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/unorderedlist/package.json) | [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-unorderedlist/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-unorderedlist/dist/index.js) | Unordered list.                        |
| [`@aomao/plugin-image`](./plugins/image)                                                              |                                                              [![](https://img.shields.io/npm/v/@aomao/plugin-image.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/image/package.json) |                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-image/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-image/dist/index.js) | Image.                                 |
| [`@aomao/plugin-table`](./plugins/table)                                                              |                                                              [![](https://img.shields.io/npm/v/@aomao/plugin-table.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/table/package.json) |                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-table/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-table/dist/index.js) | Table.                                 |
| [`@aomao/plugin-file`](./plugins/file)                                                                |                                                                [![](https://img.shields.io/npm/v/@aomao/plugin-file.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/file/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-file/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-file/dist/index.js) | File.                                  |
| [`@aomao/plugin-mark-range`](./plugins/mark-range)                                                    |                                                    [![](https://img.shields.io/npm/v/@aomao/plugin-mark-range.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/mark-range/package.json) |       [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-mark-range/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-mark-range/dist/index.js) | Mark the cursor, for example: comment. |
| [`@aomao/plugin-math`](./plugins/math)                                                                |                                                                [![](https://img.shields.io/npm/v/@aomao/plugin-math.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/math/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-math/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-math/dist/index.js) | Mathematical formula.                  |
| [`@aomao/plugin-video`](./plugins/video)                                                              |                                                              [![](https://img.shields.io/npm/v/@aomao/plugin-video.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/video/package.json) |                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-video/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-video/dist/index.js) | Video.                                 |

## Getting Started

### Installation

The editor consists of `engine`, `toolbar`, and `plugin`. `Engine` provides us with core editing capabilities.

Install engine package using npm or yarn

```bash
$ npm install @aomao/engine
# or
$ yarn add @aomao/engine
```

### Usage

We follow the convention to output a `Hello word!`

```tsx
import React, { useEffect, useRef, useState } from 'react';
import Engine, { EngineInterface } from '@aomao/engine';

const EngineDemo = () => {
	//Editor container
	const ref = useRef<HTMLDivElement | null>(null);
	//Engine instance
	const [engine, setEngine] = useState<EngineInterface>();
	//Editor content
	const [content, setContent] = useState<string>('<p>Hello word!</p>');

	useEffect(() => {
		if (!ref.current) return;
		//Instantiate the engine
		const engine = new Engine(ref.current);
		//Set the editor value
		engine.setValue(content);
		//Listen to the editor value change event
		engine.on('change', () => {
			const value = engine.getValue();
			setContent(value);
			console.log(`value:${value}`);
		});
		//Set the engine instance
		setEngine(engine);
	}, []);

	return <div ref={ref} />;
};
export default EngineDemo;
```

### Plugins

Import `@aomao/plugin-bold` bold plug-in

```tsx
import Bold from '@aomao/plugin-bold';
```

Add the `Bold` plugin to the engine

```tsx
//Instantiate the engine
const engine = new Engine(ref.current, {
	plugins: [Bold],
});
```

### Card

A card is a separate area in the editor. The UI and logic inside the card can be customized using React, Vue or other front-end libraries to customize the rendering content, and finally mount it to the editor.

Import the `@aomao/plugin-codeblock` code block plugin. The `Language drop-down box` of this plugin is rendered using `React`, so there is a distinction. `Vue3` uses `@aomao/plugin-codeblock-vue`

```tsx
import CodeBlock, { CodeBlockComponent } from '@aomao/plugin-codeblock';
```

Add the `CodeBlock` plugin and `CodeBlockComponent` card component to the engine

```tsx
//Instantiate the engine
const engine = new Engine(ref.current, {
	plugins: [CodeBlock],
	cards: [CodeBlockComponent],
});
```

The `CodeBlock` plugin supports `markdown` by default. Enter the code block syntax ````javascript` at the beginning of a line in the editor to trigger it after pressing Enter.

### Toolbar

Import the `@aomao/toolbar` toolbar. Due to the complex interaction, the toolbar is basically rendered using `React` + `Antd` UI components, while `Vue3` uses `@aomao/toolbar-vue`

Except for UI interaction, most of the work of the toolbar is just to call the engine to execute the corresponding plug-in commands after different button events are triggered. In the case of complicated requirements or the need to re-customize the UI, it is easier to modify after the fork.

```tsx
import Toolbar, { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar';
```

Add the `ToolbarPlugin` plugin and `ToolbarComponent` card component to the engine, which allows us to use the shortcut key `/` in the editor to wake up the card toolbar

```tsx
//Instantiate the engine
const engine = new Engine(ref.current, {
	plugins: [ToolbarPlugin],
	cards: [ToolbarComponent],
});
```

Rendering toolbar, the toolbar has been configured with all plug-ins, here we only need to pass in the plug-in name

```tsx
return (
    ...
    {
        engine && (
            <Toolbar
                engine={engine}
                items={[
                    ['collapse'],
                    [
                        'bold',
                    ],
                ]}
            />
        )
    }
    ...
)
```

For more complex toolbar configuration, please check the document [https://editor.aomao.com/config/toolbar](https://editor.aomao.com/config/toolbar)

### Collaborative editing

Use the `MutationObserver` to monitor the mutation of the `html` structure in the editable area (contenteditable root node) to reverse infer OT. Connect to [ShareDB](https://github.com/share/sharedb) through `Websocket`, and then use commands to add, delete, modify, and check the data saved in ShareDB.

#### Interactive mode

Each editor acts as a [Client](https://github.com/yanmao-cc/am-editor/tree/master/examples/react/components/editor/ot/client.ts) through `WebSocket` and [ Server](https://github.com/yanmao-cc/am-editor/tree/master/ot-server) Communication and exchange of data in `json0` format generated by the editor.

The server will keep a copy of the `html` structure data in the `json` format. After receiving the instructions from the client, it will modify the data, and finally forward it to each client.

Before enabling collaborative editing, we need to configure [Client](https://github.com/yanmao-cc/am-editor/tree/master/examples/react/components/editor/ot/client.ts) and [Server](https://github.com/yanmao-cc/am-editor/tree/master/ot-server)

The server is a `NodeJs` environment, and a network service built using `express` + `WebSocket`.

#### Example

In the example, we have a relatively basic client code

[View the complete React example](https://github.com/yanmao-cc/am-editor/tree/master/examples/react)

[View the complete example of Vue3](https://github.com/yanmao-cc/am-editor/tree/master/examples/vue)

[View the complete example of Vue2](https://github.com/zb201307/am-editor-vue2)

```tsx
//Instantiate the collaborative editing client and pass in the current editor engine instance
const otClient = new OTClient(engine);
//Connect to the collaboration server, `demo` is the same as the server document ID
otClient.connect(
	`ws://127.0.0.1:8080${currentMember ? '?uid=' + currentMember.id : ''}`,
	'demo',
);
```

### Project icon

[Iconfont](https://at.alicdn.com/t/project/1456030/0cbd04d3-3ca1-4898-b345-e0a9150fcc80.html?spm=a313x.7781069.1998910419.35)

## Development

### React

Need to install dependencies in `am-editor

```base
//After the dependencies are installed, you only need to execute the following commands in the root directory

yarn start
```

-   `packages` engine and toolbar
-   `plugins` all plugins
-   `api` supports api access required by some plugins. By default, https://editor.aomao.com is used as the api service
-   `ot-server` collaborative server. Start: yarn dev

Visit localhost:7001 after startup

### Vue

[am-editor vue example](https://github.com/byoungd/am-editor-vue)

> Vue example powered by [**modern-vue-template**](https://github.com/byoungd/modern-vue-template)

## Contribution

Thanks [pleasedmi](https://github.com/pleasedmi)、[Elena211314](https://github.com/Elena211314)、[zb201307](https://github.com/zb201307) for donation

### Alipay

![alipay](https://cdn-object.aomao.com/contribution/alipay.png?x-oss-process=image/resize,w_200)

### WeChat Pay

![wechat](https://cdn-object.aomao.com/contribution/weichat.png?x-oss-process=image/resize,w_200)

### PayPal

[https://paypal.me/aomaocom](https://paypal.me/aomaocom)
