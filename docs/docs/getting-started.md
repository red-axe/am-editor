---
title: Quick start
---

## Get started quickly

In addition to the pure `javascript` writing of the engine library, a small part of the plugins we provide have more complex UI, and it is a relatively easy task to use the front-end library to render the UI.

The following three plugins are different

-   `@aomao/toolbar` editor toolbar. Buttons, icons, drop-down boxes, color pickers, etc. are all complex UIs

-   `@aomao/plugin-codeblock` The drop-down box for selecting the code language has a search function. It is a better choice to use the existing UI of the front-end library

-   `@aomao/plugin-link` link input, text input, using the existing UI of the front-end library is a better choice

**`Vue2`** example [https://github.com/zb201307/am-editor-vue2](https://github.com/zb201307/am-editor-vue2)

**`Vue3`** example [https://github.com/red-axe/am-editor-vue3-demo](https://github.com/red-axe/am-editor-vue3-demo)

**`React`** example [https://github.com/yanmao-cc/am-editor/tree/master/examples/react](https://github.com/yanmao-cc/am-editor/tree/master/examples/react)

### Installation

Use npm or yarn to install the editing engine

```bash
$ npm install @aomao/engine
# or
$ yarn add @aomao/engine
```

### Use

Let's start by outputting a `Hello word!`. Now you can edit it below.

```tsx
/**
 * defaultShowCode: true
 */
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

Now, on the basis of the appeal code, we introduce the `@aomao/plugin-bold` bold plugin

```tsx | pure
import Bold from '@aomao/plugin-bold';
```

Then add the `Bold` plugin to the engine

```tsx | pure
//Instantiate the engine
const engine = new Engine(ref.current, {
	plugins: [Bold],
});
```

The default shortcut of the `Bold` plugin is windows `ctrl+b` or mac `⌘+b`, now try the bold effect

```tsx
import React, { useEffect, useRef, useState } from 'react';
import Engine, { EngineInterface } from '@aomao/engine';
import Bold from '@aomao/plugin-bold';

const EngineDemo = () => {
	//Editor container
	const ref = useRef<HTMLDivElement | null>(null);
	//Engine instance
	const [engine, setEngine] = useState<EngineInterface>();
	//Editor content
	const [content, setContent] = useState<string>(
		'Hello <strong>word</strong>!',
	);

	useEffect(() => {
		if (!ref.current) return;
		//Instantiate the engine
		const engine = new Engine(ref.current, {
			plugins: [Bold],
		});
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

### Card

A card is a separate area in the editor. The UI of this area can be customized to render content using front-end frameworks such as React and Vue, and finally mounted on the editor.

Introduce the `@aomao/plugin-codeblock` code block plugin. Part of the plugin UI is rendered by the front-end framework, so there is a distinction. `vue3` developers use `@aomao/plugin-codeblock-vue` `vue2` developers use `am-editor-codeblock-vue2`

```tsx | pure
import CodeBlock, { CodeBlockComponent } from '@aomao/plugin-codeblock';
```

Add `CodeBlock` plugin and `CodeBlockComponent` card component to the engine

```tsx | pure
//Instantiate the engine
const engine = new Engine(ref.current, {
	plugins: [CodeBlock],
	cards: [CodeBlockComponent],
});
```

The `CodeBlock` plugin supports `markdown` by default. Enter the code block syntax ```javascript` at the beginning of a line in the editor, and then see the effect.

```tsx
import React, { useEffect, useRef, useState } from 'react';
import Engine, { EngineInterface } from '@aomao/engine';
import CodeBlock, { CodeBlockComponent } from '@aomao/plugin-codeblock';

const EngineDemo = () => {
	//Editor container
	const ref = useRef<HTMLDivElement | null>(null);
	//Engine instance
	const [engine, setEngine] = useState<EngineInterface>();
	//Editor content
	const [content, setContent] = useState<string>(
		'Hello <strong>word</strong>!',
	);

	useEffect(() => {
		if (!ref.current) return;
		//Instantiate the engine
		const engine = new Engine(ref.current, {
			plugins: [CodeBlock],
			cards: [CodeBlockComponent],
		});
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

### toolbar

Introduce the `@aomao/toolbar` toolbar, the toolbar UI is more complicated, all of which are rendered by using the front-end framework, `vue3` developers use `@aomao/toolbar-vue` `vue2` developers use `am-editor-codeblock-vue2`

```tsx | pure
import Toolbar, { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar';
```

Add the `ToolbarPlugin` plugin and the `ToolbarComponent` card component to the engine, it will allow us to use the shortcut key `/` to wake up the toolbar in the editor

```tsx | pure
//Instantiate the engine
const engine = new Engine(ref.current, {
	plugins: [ToolbarPlugin],
	cards: [ToolbarComponent],
});
```

Rendering toolbar, the toolbar has been configured with all plugins, here we only need to pass in the plugin name

```tsx | pure
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

```tsx
/**
 * transform: true
 */
import React, { useEffect, useRef, useState } from 'react';
import Engine, { EngineInterface } from '@aomao/engine';
import Bold from '@aomao/plugin-bold';
import CodeBlock, { CodeBlockComponent } from '@aomao/plugin-codeblock';
import Toolbar, { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar';

const EngineDemo = () => {
	//Editor container
	const ref = useRef<HTMLDivElement | null>(null);
	//Engine instance
	const [engine, setEngine] = useState<EngineInterface>();
	//Editor content
	const [content, setContent] = useState<string>(
		'Hello <strong>word</strong>!',
	);

	useEffect(() => {
		if (!ref.current) return;
		//Instantiate the engine
		const engine = new Engine(ref.current, {
			plugins: [CodeBlock, Bold, ToolbarPlugin],
			cards: [CodeBlockComponent, ToolbarComponent],
		});
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

	return (
		<>
			{engine && <Toolbar engine={engine} items={[['bold']]} />}
			<div ref={ref} />
		</>
	);
};
export default EngineDemo;
```

#### Develop your own toolbar

`@aomao/toolbar` is more to provide a toolbar UI display, the essence is to call `engine.command.execute` to execute plugin commands

```tsx
/**
 * transform: true
 */
import React, { useEffect, useRef, useState } from 'react';
import Engine, { EngineInterface } from '@aomao/engine';
import Bold from '@aomao/plugin-bold';

const EngineDemo = () => {
	//Editor container
	const ref = useRef<HTMLDivElement | null>(null);
	//Engine instance
	const [engine, setEngine] = useState<EngineInterface>();
	//Editor content
	const [content, setContent] = useState<string>(
		'Hello <strong>word</strong>!',
	);
	// button state
	const [btnActive, setBtnActive] = useState<boolean>(false);

	useEffect(() => {
		if (!ref.current) return;
		//Instantiate the engine
		const engine = new Engine(ref.current, {
			plugins: [Bold],
		});
		//Set the editor value
		engine.setValue(content);
		//Listen to the editor value change event
		engine.on('change', () => {
			const value = engine.getValue();
			setContent(value);
			console.log(`value:${value}`);
		});
		// listen for cursor changes
		engine.on('select', () => {
			// Query the selected state of the bold plugin
			setBtnActive(engine.command.queryState('bold'));
		});
		//Set the engine instance
		setEngine(engine);
	}, []);

	const handleMouseDown = (event: React.MouseDown) => {
		// Click the button to avoid losing the editor cursor
		event.preventDefault();
	};

	const handleBoldClick = () => {
		// execute the bold command
		engine?.command.execute('bold');
	};

	return (
		<>
			{engine && (
				<button
					onMouseDown={handleMouseDown}
					onClick={handleBoldClick}
					style={{ color: btnActive ? 'blue' : '' }}
				>
					Bold
				</button>
			)}
			<div ref={ref} />
		</>
	);
};
export default EngineDemo;
```

### Collaborative editing

Collaborative editing is based on [ShareDB](https://github.com/share/sharedb). Each editor acts as [client](https://github.com/yanmao-cc/am-editor/blob/master/docs/demo/ot-client.ts) through `WebSocket` and [server](https://github.com/yanmao-cc/am-editor/tree/master/ot-server) to exchange data. The editor processes and renders data.

We need to set up the server and then configure the client. [View full example](https://github.com/yanmao-cc/am-editor/blob/master/docs/demo/engine.tsx)

```tsx | pure
//Instantiate the collaborative editing client and pass in the current editor engine instance
const otClient = new OTClient(engine);
//Connect to the collaboration server, uid will do a simple authentication demonstration here, and authentication information such as token should be required in normal business. `demo` is the unique number of the document
otClient.connect(
	`ws://127.0.0.1:8080${currentMember ? '?uid=' + currentMember.id : ''}`,
	'demo',
);
```
