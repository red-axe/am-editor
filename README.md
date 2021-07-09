# am-editor
<p align="center">
	A rich text <em>collaborative</em> editor framework that can use <em>React</em> and <em>Vue</em> custom plug-ins
</p>

<p align="center">
  <a href="https://github.com/itellyou-com/am-editor/blob/master/README.zh-CN.md"><strong>中文简体</strong></a> ·
  <a href="https://editor.aomao.com"><strong>Demo</strong></a> ·
  <a href="https://editor.aomao.com/docs"><strong>Documentation</strong></a> ·
  <a href="#plugins"><strong>Plugins</strong></a> ·
  <a href="https://qm.qq.com/cgi-bin/qm/qr?k=Gva5NtZ2USlHSLbFOeMroysk8Uwo7fCS&jump_from=webapi"><strong>QQ-Group 907664876</strong></a> ·
</p>

![aomao-preview](https://user-images.githubusercontent.com/55792257/125074830-62d79300-e0f0-11eb-8d0f-bb96a7775568.png)

<p align="center">
  <a href="https://unpkg.com/@aomao/engine/dist/index.js">
    <img src="http://img.badgesize.io/https://unpkg.com/@aomao/engine/dist/index.js?compression=gzip&amp;label=size">
  </a>
  <a href="./packages/engine/package.json">
    <img src="https://img.shields.io/npm/v/@aomao/engine.svg?maxAge=3600&label=version&colorB=007ec6">
  </a>
</p>

> Thanks to Google Translate

am-editor, a web multi-person collaborative rich text editor based on [ShareDB](https://github.com/share/sharedb), suitable for `React` and `Vue` frameworks, compatible with mainstream modern browsers .

am-editor, a web multi-person real-time collaborative rich text editor. Use the `contenteditable` attribute provided by the browser to make a DOM node editable.

As we all know, the `contenteditable` property will be different in different browser vendors, and its default behavior is unpredictable, so we encapsulate a certain controllable editing capability engine library `@aomao/engine` , A trade-off between the default behavior and the desired behavior.

The engine library is written in `javascript`. We encapsulate and derive interfaces for a series of operations such as DOM node insertion, deletion, and replacement, including cursors and events. Therefore, all our operations in the engine will directly edit the complex DOM tree, and in the data structure we will also present it in the DOM tree structure. However, in practical applications, it is very necessary for us to constrain the complex DOM tree structure to avoid unexpected behavior, and in the current popular use of front-end frameworks such as `React` and `Vue` to render the UI, let us re Using `javascript` to customize the UI is a very painful thing. So we divide the DOM nodes into the following categories according to their functions and characteristics: `mark` `inline` `block` `card` and use the `schema` to constrain their specific behaviors and some idiosyncratic attributes. In the `card` component we It can also be combined with the front-end framework to complete complex UI rendering and editing nesting.

In modern enterprises, collaborative office is synonymous with high efficiency. Collaborating documents after instant messaging and video conferencing is a general trend. In the engine library, we provide collaborative editing capabilities based on [ShareDB](https://github.com/share/sharedb) and convert the complex DOM structure to [JSON0](https://github.com/ottypes/json0) After the data structure of the protocol, submit it to `sharedb` to handle the interaction of collaborative editing.

## Features

-   📦 Out of the box, it provides dozens of rich plug-ins to meet most needs
-   🏷 High scalability, in addition to the `mark` `inline` `block` basic plug-in, we also provide `card` component combined with `React` `Vue` and other front-end framework rendering plug-in UI
-   📋 Rich multimedia support, not only supports pictures, audio and video, but also supports inserting embedded multimedia content
-   🐠 Do not rely on front-end framework, easy to deal with complex architecture
-   📡 Built-in collaborative editing program, ready to use with lightweight configuration
-   📱 Compatible with most of the latest mobile browsers

## Plugins
| **Package**                                         |                                                                                                                           **Version** |                                                                                                                                                                                       **Size** | **Description**                                  |
| :-------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------- |
| [`@aomao/toolbar`](./packages/toolbar)                         |                         [![](https://img.shields.io/npm/v/@aomao/toolbar.svg?maxAge=3600&label=&colorB=007ec6)](./packages/toolbar/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/toolbar/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/toolbar/dist/index.js) | Toolbar, for React.
| [`@aomao/toolbar-vue`](./packages/toolbar-vue)                         |                         [![](https://img.shields.io/npm/v/@aomao/toolbar-vue.svg?maxAge=3600&label=&colorB=007ec6)](./packages/toolbar-vue/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/toolbar-vue/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/toolbar-vue/dist/index.js) | Toolbar, for Vue3.
| [`@aomao/plugin-alignment`](./plugins/alignment)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-alignment.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/alignment/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-alignment/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-alignment/dist/index.js) | Alignment.                   |
| [`@aomao/plugin-backcolor`](./plugins/backcolor)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-backcolor.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/backcolor/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-backcolor/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-backcolor/dist/index.js) | Background color.                   |
| [`@aomao/plugin-bold`](./plugins/bold)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-bold.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/bold/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-bold/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-bold/dist/index.js) | Bold.                   |
| [`@aomao/plugin-code`](./plugins/code)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-code.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/code/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-code/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-code/dist/index.js) | Inline code.     
| [`@aomao/plugin-codeblock`](./plugins/codeblock)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-codeblock.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/codeblock/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-codeblock/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-codeblock/dist/index.js) | Code block, for React. 
| [`@aomao/plugin-codeblock-vue`](./plugins/codeblock-vue)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-codeblock-vue.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/codeblock-vue/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-codeblock-vue/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-codeblock-vue/dist/index.js) | Code block, for Vue3. 
| [`@aomao/plugin-fontcolor`](./plugins/fontcolor)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-fontcolor.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/fontcolor/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-fontcolor/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-fontcolor/dist/index.js) | Font color. 
| [`@aomao/plugin-fontfamily`](./plugins/fontfamily)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-fontfamily.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/fontfamily/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-fontfamily/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-fontfamily/dist/index.js) | Font. 
| [`@aomao/plugin-fontsize`](./plugins/fontsize)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-fontsize.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/fontsize/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-fontsize/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-fontsize/dist/index.js) | Font size. 
| [`@aomao/plugin-heading`](./plugins/heading)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-heading.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/heading/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-heading/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-heading/dist/index.js) | Heading. 
| [`@aomao/plugin-hr`](./plugins/hr)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-hr.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/hr/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-hr/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-hr/dist/index.js) | Dividing line. 
| [`@aomao/plugin-indent`](./plugins/indent)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-indent.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/indent/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-indent/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-indent/dist/index.js) | Indent. 
| [`@aomao/plugin-italic`](./plugins/italic)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-italic.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/italic/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-italic/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-italic/dist/index.js) | Italic. 
| [`@aomao/plugin-link`](./plugins/link)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-link.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/link/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-link/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-link/dist/index.js) | Link, for React. 
| [`@aomao/plugin-link-vue`](./plugins/link-vue)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-link-vue.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/link-vue/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-link-vue/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-link-vue/dist/index.js) | Link, for Vue3. 
| [`@aomao/plugin-mark`](./plugins/mark)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-mark.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/mark/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-mark/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-mark/dist/index.js) | Mark. 
| [`@aomao/plugin-orderedlist`](./plugins/orderedlist)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-orderedlist.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/orderedlist/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-orderedlist/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-orderedlist/dist/index.js) | Ordered list. 
| [`@aomao/plugin-paintformat`](./plugins/paintformat)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-paintformat.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/paintformat/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-paintformat/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-paintformat/dist/index.js) | Format Painter. 
| [`@aomao/plugin-quote`](./plugins/quote)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-quote.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/quote/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-quote/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-quote/dist/index.js) | Quote block. 
| [`@aomao/plugin-redo`](./plugins/redo)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-redo.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/redo/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-redo/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-redo/dist/index.js) | Redo history. 
| [`@aomao/plugin-removeformat`](./plugins/removeformat)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-removeformat.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/removeformat/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-removeformat/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-removeformat/dist/index.js) | Remove style. 
| [`@aomao/plugin-selectall`](./plugins/selectall)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-selectall.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/selectall/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-selectall/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-selectall/dist/index.js) | Select all. 
| [`@aomao/plugin-status`](./plugins/status)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-status.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/status/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-status/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-status/dist/index.js) | Status. 
| [`@aomao/plugin-strikethrough`](./plugins/strikethrough)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-strikethrough.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/strikethrough/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-strikethrough/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-strikethrough/dist/index.js) | Strikethrough. 
| [`@aomao/plugin-sub`](./plugins/sub)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-sub.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/sub/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-sub/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-sub/dist/index.js) | Sub. 
| [`@aomao/plugin-sup`](./plugins/sup)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-sup.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/sup/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-sup/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-sup/dist/index.js) | Sup. 
| [`@aomao/plugin-tasklist`](./plugins/tasklist)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-tasklist.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/tasklist/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-tasklist/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-tasklist/dist/index.js) | task list. 
| [`@aomao/plugin-underline`](./plugins/underline)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-underline.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/underline/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-underline/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-underline/dist/index.js) | Underline. 
| [`@aomao/plugin-undo`](./plugins/undo)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-undo.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/undo/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-undo/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-undo/dist/index.js) | Undo history. 
| [`@aomao/plugin-unorderedlist`](./plugins/unorderedlist)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-unorderedlist.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/unorderedlist/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-unorderedlist/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-unorderedlist/dist/index.js) | Unordered list. 
| [`@aomao/plugin-image`](./plugins/image)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-image.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/image/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-image/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-image/dist/index.js) | Image. 
| [`@aomao/plugin-table`](./plugins/table)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-table.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/table/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-table/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-table/dist/index.js) | Table. 
| [`@aomao/plugin-file`](./plugins/file)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-file.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/file/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-file/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-file/dist/index.js) | File. 
| [`@aomao/plugin-mark-range`](./plugins/mark-range)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-mark-range.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/mark-range/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-mark-range/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-mark-range/dist/index.js) | Mark the cursor, for example: comment. 
| [`@aomao/plugin-math`](./plugins/math)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-math.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/math/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-math/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-math/dist/index.js) | Mathematical formula. 
| [`@aomao/plugin-video`](./plugins/video)                         |                         [![](https://img.shields.io/npm/v/@aomao/plugin-video.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/video/package.json) |                                                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-video/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-video/dist/index.js) | Video. 

## Get started quickly

### Installation

The `engine`, `toolbar`, and `each plug-in` in am-editor are separate packages. Among them, the `engine` is the core package, and all other packages will depend on it

Install engine package using npm or yarn

```bash
$ npm install @aomao/engine
# or
$ yarn add @aomao/engine
```

`Vue` users please see [https://github.com/itellyou-com/am-editor/tree/master/examples/vue](https://github.com/itellyou-com/am-editor/tree/master/examples/vue)

### Use

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
	const [content, setContent] = useState<string>('Hello word!');

	useEffect(() => {
		if (!ref.current) return;
		//Instantiate the engine
		const engine = new Engine(ref.current);
		//Initialize local collaboration to record history
		engine.ot.initLockMode();
		//Set the editor value
		engine.setValue(content);
		//Listen to the editor value change event
		engine.on('change', (value) => {
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

Now, on the basis of the appeal code, we introduce the `@aomao/plugin-bold` bold plug-in

```tsx
import Bold from '@aomao/plugin-bold';
```

Then add the `Bold` plugin to the engine

```tsx
//Instantiate the engine
const engine = new Engine(ref.current, {
	plugin: [Bold],
});
```

### Card

A card is a separate area in the editor. The UI and logic inside the card can be customized to render content using React, Vue or other frameworks, and finally mounted on the editor.

Introduce the `@aomao/plugin-codeblock` code block plug-in, part of the plug-in UI uses frame rendering, so there is a distinction. `vue` developers use `@aomao/plugin-codeblock-vue`

```tsx
import CodeBlock, { CodeBlockComponent } from '@aomao/plugin-codeblock';
```

Add `CodeBlock` plugin and `CodeBlockComponent` card component to the engine

```tsx
//Instantiate the engine
const engine = new Engine(ref.current, {
	plugins: [CodeBlock],
	cards: [CodeBlockComponent],
});
```

The `CodeBlock` plugin supports `markdown` by default. Enter the code block syntax ```javascript` at the beginning of a line in the editor, and then see the effect.

### toolbar

Introduce the `@aomao/toolbar` toolbar, which basically uses frame rendering, and `vue` developers use `@aomao/toolbar-vue`

```tsx | pure
import Toolbar, { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar';
```

Add the `ToolbarPlugin` plugin and the `ToolbarComponent` card component to the engine, it will allow us to use the shortcut key `/` to wake up the toolbar in the editor

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

### Collaborative editing

Collaborative editing is based on [ShareDB](https://github.com/share/sharedb). Each editor acts as [client](https://github.com/itellyou-com/am-editor/blob/master/docs/demo/ot-client.ts) through `WebSocket` and [server](https://github.com/itellyou-com/am-editor/tree/master/ot-server) to exchange data. The editor processes and renders data.

After we set up the client and server, we start collaborative editing. [View full example](https://github.com/itellyou-com/am-editor/blob/master/docs/demo/engine.tsx)

```tsx | pure
//Instantiate the collaborative editing client and pass in the current editor engine instance
const otClient = new OTClient(engine);
//Connect to the collaboration server, `demo` is the same as the server document ID
otClient.connect(
	`ws://127.0.0.1:8080${currentMember ? '?uid=' + currentMember.id : ''}`,
	'demo',
);
```

### Project icon

[Iconfont](https://at.alicdn.com/t/project/1456030/575170a6-50ef-4156-9ad0-2cd0341752a7.html?spm=a313x.7781069.1998910419.35)

## Contribution

### Alipay

![alipay](https://cdn-object.aomao.com/contribution/alipay.png?x-oss-process=image/resize,w_200)

### WeChat Pay

![wechat](https://cdn-object.aomao.com/contribution/weichat.png?x-oss-process=image/resize,w_200)

### PayPal

[https://paypal.me/aomaocom](https://paypal.me/aomaocom)
