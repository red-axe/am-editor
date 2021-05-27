# am-editor

<img width="1676" alt="Demo" src="https://user-images.githubusercontent.com/55792257/119711922-a359b500-be92-11eb-9f77-459b6d468be9.png">

[中文简体](https://github.com/itellyou-com/am-editor/blob/master/README.zh-CN.md)

> Thanks to Google Translate

am-editor, a web multi-person collaborative rich text editor based on [ShareDB](https://github.com/share/sharedb), suitable for `React` and `Vue` frameworks, compatible with mainstream modern browsers .

[View online documentation and demo](https://editor.aomao.com)

Technical exchange QQ group: 907664876

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

## All plugins

-   [x] `@aomao/plugin-alignment` alignment
-   [x] `@aomao/plugin-backcolor` background color
-   [x] `@aomao/plugin-bold` bold
-   [x] `@aomao/plugin-code` inline code
-   [x] `@aomao/plugin-codelock` block-level code
-   [x] `@aomao/plugin-fontcolor` foreground color
-   [x] `@aomao/plugin-fontsize` font size
-   [x] `@aomao/plugin-heading` heading
-   [x] `@aomao/plugin-hr` dividing line
-   [x] `@aomao/plugin-indent` indent
-   [x] `@aomao/plugin-italic` italic
-   [x] `@aomao/plugin-link` link
-   [x] `@aomao/plugin-mark` mark
-   [x] `@aomao/plugin-orderedlist` ordered list
-   [x] `@aomao/plugin-paintformat` format paint
-   [x] `@aomao/plugin-quote` quote
-   [x] `@aomao/plugin-redo` to redo history
-   [x] `@aomao/plugin-removeformat` remove format
-   [x] `@aomao/plugin-selectall` select all
-   [x] `@aomao/plugin-strikethrough` strikethrough
-   [x] `@aomao/plugin-sub` subscript
-   [x] `@aomao/plugin-sup` superscript
-   [x] `@aomao/plugin-tasklist` task list
-   [x] `@aomao/plugin-underline` underline
-   [x] `@aomao/plugin-undo` undo history
-   [x] `@aomao/plugin-unorderedlist` unordered list
-   [x] `@aomao/plugin-image` image
-   [x] `@aomao/plugin-table` table
-   [x] `@aomao/plugin-file` file
-   [x] `@aomao/plugin-mark-range` cursor range mark
-   [] `@aomao/plugin-video` video

## Get started quickly

### Installation

The `engine`, `toolbar`, and `each plug-in` in am-editor are separate packages. Among them, the `engine` is the core package, and all other packages will depend on it

Install engine package using npm or yarn

```bash
$ npm install @aomao/engine
# or
$ yarn add @aomao/engine
```

`Vue` users please see [https://github.com/itellyou-com/am-editor/tree/master/demo-vue](https://github.com/itellyou-com/am-editor/tree/master/demo-vue)

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
		engine.on('change', value => {
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

[Iconfont](https://at.alicdn.com/t/project/1456030/ada29c50-2c37-4701-b836-b9d622b8f0b3.html?spm=a313x.7781069.1998910419.35)
