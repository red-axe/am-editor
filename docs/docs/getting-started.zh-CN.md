---
title: 安装
---

## 介绍

除引擎库纯`javascript`编写外，我们所提供的插件中，小部分插件 UI 比较复杂，使用前端库来渲染 UI 是一项比较轻松的工作。

下面这三个插件有区别

-   `@aomao/toolbar` 编辑器工具栏。按钮、图标、下拉框、颜色选择器等都是复杂的 UI

-   `@aomao/plugin-codeblock` 选择代码语言的下拉框具有搜索功能，使用前端库现有的 UI 是比较好的选择

-   `@aomao/plugin-link` 链接输入、文本输入，使用前端库现有的 UI 是比较好的选择

**`Vue2`** DEMO [https://github.com/zb201307/am-editor-vue2](https://github.com/zb201307/am-editor-vue2)

**`Vue3`** DEMO [https://github.com/red-axe/am-editor-vue3-demo](https://github.com/red-axe/am-editor-vue3-demo)

**`React`** DEMO [https://github.com/big-camel/am-editor/tree/master/examples/react](https://github.com/big-camel/am-editor/tree/master/examples/react)

### 安装

使用 npm 或者 yarn 安装编辑引擎

```bash
$ npm install @aomao/engine
# or
$ yarn add @aomao/engine
```

### 使用

我们按从输出一个`Hello word!`入手。现在你可以在下方编辑了。

```tsx
/**
 * defaultShowCode: true
 */
import React, { useEffect, useRef, useState } from 'react';
import Engine, { EngineInterface } from '@aomao/engine';

const EngineDemo = () => {
	//编辑器容器
	const ref = useRef<HTMLDivElement | null>(null);
	//引擎实例
	const [engine, setEngine] = useState<EngineInterface>();
	//编辑器内容
	const [content, setContent] = useState<string>('Hello word!');

	useEffect(() => {
		if (!ref.current) return;
		//实例化引擎
		const engine = new Engine(ref.current);
		//设置编辑器值
		engine.setValue(content);
		//监听编辑器值改变事件
		engine.on('change', () => {
			const value = engine.getValue();
			setContent(value);
			console.log(`value:${value}`);
		});
		//设置引擎实例
		setEngine(engine);
	}, []);

	return <div ref={ref} />;
};
export default EngineDemo;
```

### 插件

现在我们在上述代码基础上，引入`@aomao/plugin-bold`加粗插件

```tsx | pure
import Bold from '@aomao/plugin-bold';
```

然后将`Bold`插件加入引擎

```tsx | pure
//实例化引擎
const engine = new Engine(ref.current, {
	plugins: [Bold],
});
```

`Bold`插件的默认快捷键为 windows `ctrl+b` 或 mac `⌘+b`，现在试试加粗效果吧

```tsx
import React, { useEffect, useRef, useState } from 'react';
import Engine, { EngineInterface } from '@aomao/engine';
import Bold from '@aomao/plugin-bold';

const EngineDemo = () => {
	//编辑器容器
	const ref = useRef<HTMLDivElement | null>(null);
	//引擎实例
	const [engine, setEngine] = useState<EngineInterface>();
	//编辑器内容
	const [content, setContent] = useState<string>(
		'Hello <strong>word</strong>!',
	);

	useEffect(() => {
		if (!ref.current) return;
		//实例化引擎
		const engine = new Engine(ref.current, {
			plugins: [Bold],
		});
		//设置编辑器值
		engine.setValue(content);
		//监听编辑器值改变事件
		engine.on('change', () => {
			const value = engine.getValue();
			setContent(value);
			console.log(`value:${value}`);
		});
		//设置引擎实例
		setEngine(engine);
	}, []);

	return <div ref={ref} />;
};
export default EngineDemo;
```

### 卡片

卡片是编辑器中单独划分的一个区域，该区域的 UI 可以使用 React、Vue 等前端框架自定义渲染内容，最后再挂载到编辑器上。

引入`@aomao/plugin-codeblock`代码块插件，这个插件部分 UI 使用前端框架渲染，所以有区分。 `vue3`开发者使用 `@aomao/plugin-codeblock-vue` `vue2`开发者使用 `am-editor-codeblock-vue2`

```tsx | pure
import CodeBlock, { CodeBlockComponent } from '@aomao/plugin-codeblock';
```

将`CodeBlock`插件和`CodeBlockComponent`卡片组件加入引擎

```tsx | pure
//实例化引擎
const engine = new Engine(ref.current, {
	plugins: [CodeBlock],
	cards: [CodeBlockComponent],
});
```

`CodeBlock`插件默认支持`markdown`，在编辑器一行开头位置输入代码块语法` ```javascript `回车后，看看效果吧

```tsx
import React, { useEffect, useRef, useState } from 'react';
import Engine, { EngineInterface } from '@aomao/engine';
import CodeBlock, { CodeBlockComponent } from '@aomao/plugin-codeblock';

const EngineDemo = () => {
	//编辑器容器
	const ref = useRef<HTMLDivElement | null>(null);
	//引擎实例
	const [engine, setEngine] = useState<EngineInterface>();
	//编辑器内容
	const [content, setContent] = useState<string>(
		'Hello <strong>word</strong>!',
	);

	useEffect(() => {
		if (!ref.current) return;
		//实例化引擎
		const engine = new Engine(ref.current, {
			plugins: [CodeBlock],
			cards: [CodeBlockComponent],
		});
		//设置编辑器值
		engine.setValue(content);
		//监听编辑器值改变事件
		engine.on('change', () => {
			const value = engine.getValue();
			setContent(value);
			console.log(`value:${value}`);
		});
		//设置引擎实例
		setEngine(engine);
	}, []);

	return <div ref={ref} />;
};
export default EngineDemo;
```

### 工具栏

引入`@aomao/toolbar`工具栏，工具栏 UI 比较复杂，都是借助使用前端框架渲染，`vue3`开发者使用 `@aomao/toolbar-vue` `vue2`开发者使用 `am-editor-toolbar-vue2`

```tsx | pure
import Toolbar, { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar';
```

将`ToolbarPlugin`插件和`ToolbarComponent`卡片组件加入引擎，它将让我们在编辑器中可以使用快捷键`/`唤醒出工具栏

```tsx | pure
//实例化引擎
const engine = new Engine(ref.current, {
	plugins: [ToolbarPlugin],
	cards: [ToolbarComponent],
});
```

渲染工具栏，工具栏已配置好所有插件，这里我们只需要传入插件名称即可

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
	//编辑器容器
	const ref = useRef<HTMLDivElement | null>(null);
	//引擎实例
	const [engine, setEngine] = useState<EngineInterface>();
	//编辑器内容
	const [content, setContent] = useState<string>(
		'Hello <strong>word</strong>!',
	);

	useEffect(() => {
		if (!ref.current) return;
		//实例化引擎
		const engine = new Engine(ref.current, {
			plugins: [CodeBlock, Bold, ToolbarPlugin],
			cards: [CodeBlockComponent, ToolbarComponent],
		});
		//设置编辑器值
		engine.setValue(content);
		//监听编辑器值改变事件
		engine.on('change', () => {
			const value = engine.getValue();
			setContent(value);
			console.log(`value:${value}`);
		});
		//设置引擎实例
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

#### 自己开发工具栏

`@aomao/toolbar` 更多的是提供了一个工具栏的 UI 展示，本质是调用 `engine.command.execute` 执行插件命令

```tsx
/**
 * transform: true
 */
import React, { useEffect, useRef, useState } from 'react';
import Engine, { EngineInterface } from '@aomao/engine';
import Bold from '@aomao/plugin-bold';

const EngineDemo = () => {
	//编辑器容器
	const ref = useRef<HTMLDivElement | null>(null);
	//引擎实例
	const [engine, setEngine] = useState<EngineInterface>();
	//编辑器内容
	const [content, setContent] = useState<string>(
		'Hello <strong>word</strong>!',
	);
	// 按钮状态
	const [btnActive, setBtnActive] = useState<boolean>(false);

	useEffect(() => {
		if (!ref.current) return;
		//实例化引擎
		const engine = new Engine(ref.current, {
			plugins: [Bold],
		});
		//设置编辑器值
		engine.setValue(content);
		//监听编辑器值改变事件
		engine.on('change', () => {
			const value = engine.getValue();
			setContent(value);
			console.log(`value:${value}`);
		});
		// 监听光标改变
		engine.on('select', () => {
			// 查询bold插件的选中状态
			setBtnActive(engine.command.queryState('bold'));
		});
		//设置引擎实例
		setEngine(engine);
	}, []);

	const handleMouseDown = (event: React.MouseDown) => {
		// 点击按钮避免编辑器光标丢失
		event.preventDefault();
	};

	const handleBoldClick = () => {
		// 执行加粗命令
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

### 协同编辑

该开源库通过监听编辑区域(contenteditable 根节点)内的 html 结构的变化，使用 `MutationObserver` 反推数据结构，并通过 `WebSocket` 与 [Yjs](https://github.com/yjs/yjs) 连接交互，实现多用户协同编辑的功能。

每位编辑者作为 [客户端](https://github.com/red-axe/am-editor/blob/master/examples/react/components/editor/index.tsx#L250) 通过 `@aomao/plugin-yjs-websocket` 插件中的 `Websocket` 与 [服务端](https://github.com/big-camel/am-editor/tree/master/yjs-server) 进行通信交互。

-   `@aomao/yjs` 实现编辑器与 `Yjs` 数据的转换
-   `@aomao/plugin-yjs-websocket` 提供编辑器与 `Yjs` 的 `WebSocket` 客户端功能
-   `@aomao/plugin-yjs-websocket/server` 提供 `Yjs` 的 `WebSocket` 服务端，使用 Node.js 编写，并支持使用 `MongoDB` 和 `LevelDB` 存储数据。
