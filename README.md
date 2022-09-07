> In the past two years, the `am-editor` editor has done a lot of functions and extensions based on the `contenteditable` attribute, but also encountered many problems. Of course, some problems are doomed from the very beginning of the architectural design. So, be bold now and try to abandon the `contenteditable` attribute and use the self-drawn cursor mode to develop the next version of the [rich text editor](https://github.com/editablejs/editable).

# am-editor

<p align="center">
	A rich text editor that supports collaborative editing, you can freely use React, Vue and other front-end common libraries to extend and define plugins.
</p>

<p align="center">
	<a href="https://editor.aomao.com"><strong>Preview</strong></a> ·
  	<a href="https://editor.aomao.com/docs"><strong>Document</strong></a> ·
 	<a href="plugins.md"><strong>Plugins</strong></a>
</p>

<div align="center">
  <p>
    <a href="README.zh-CN.md">
      <img src="https://img.shields.io/badge/lang-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-red.svg?longCache=true&style=flat-square">
    </a>
  </p>
</div>

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

## Features

-   🍉 **Out of the box** - Dozens of ready to use plug to meet most needs
-   🍋 **Extensibility** - In addition to the basic plugin of `mark`, inline`and`block`type`, we also provide`card`component combined with`React`, `Vue` and other front-end libraries to render the plugin UI
-   🍎 **Markdown Support**
-   👨‍🦳 **I18n**
-   🔥 **Zero dependency** - The engine is written by pure **JavaScript** and does not rely on any front-end libraries. Plugins can be developed by any libraries such as `React` 、 `Vue` or `Svelte`
-   🦔 **Collaboration** - Ready to use with lightweight configuration
-   Compatible with most of the latest mobile browsers
-   🦾 **TypeScript** - Of course

## Example

[**`Vue2`**](https://github.com/zb201307/am-editor-vue2)

[**`Vue3`**](https://github.com/red-axe/am-editor-vue3-demo)

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

Import `@aomao/plugin-bold` bold plugin

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

The `CodeBlock` plugin supports `markdown` by default. Enter the code block syntax ````javascript` at the beginning of a line in the editor to trigger it after pressing Space.

### Toolbar

Import the `@aomao/toolbar` toolbar. Due to the complex interaction, the toolbar is basically rendered using `React` + `Antd` UI components, while `Vue3` uses `@aomao/toolbar-vue`

Except for UI interaction, most of the work of the toolbar is just to call the engine to execute the corresponding plugin commands after different button events are triggered. In the case of complicated requirements or the need to re-customize the UI, it is easier to modify after the fork.

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

Rendering toolbar, the toolbar has been configured with all plugins, here we only need to pass in the plugin name

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

[View the complete example of Vue3](https://github.com/red-axe/am-editor-vue3-demo)

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

[am-editor vue example](https://github.com/red-axe/am-editor-vue3-demo)

> Vue example powered by [**modern-vue-template**](https://github.com/byoungd/modern-vue-template)

## Contribution

Thanks [pleasedmi](https://github.com/pleasedmi)、[Elena211314](https://github.com/Elena211314)、[zb201307](https://github.com/zb201307)、[cheon](https://github.com/number317) for donation

### Alipay

![alipay](https://cdn-object.aomao.com/contribution/alipay.png?x-oss-process=image/resize,w_200)

### WeChat Pay

![wechat](https://cdn-object.aomao.com/contribution/weichat.png?x-oss-process=image/resize,w_200)

### PayPal

[https://paypal.me/aomaocom](https://paypal.me/aomaocom)
