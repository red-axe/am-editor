# am-editor

am-editor，一个基于[ShareDB](https://github.com/share/sharedb)Web 多人协同富文本编辑器，适用于`React`、`Vue`（部分插件还没有 vue 版本）框架，与主流的现代浏览器兼容。

[查看在线文档及演示](https://editor.aomao.com)

## 特性

-   📦 开箱即用，提供几十种丰富的插件
-   📋 丰富的多媒体支持，不仅支持图片和音视频，更支持插入嵌入式多媒体内容
-   🏷 引擎基于原生 JavaScript 开发，插件 UI 支持 React、Vue 等框架渲染
-   📡 内置协同编辑方案，轻量配置即可使用

## 所有插件

-   [x] `@aomao/plugin-alignment` 对齐方式
-   [x] `@aomao/plugin-backcolor` 背景色
-   [x] `@aomao/plugin-bold` 加粗
-   [x] `@aomao/plugin-code` 行内代码
-   [x] `@aomao/plugin-codelock` 块级代码
-   [x] `@aomao/plugin-fontcolor` 前景色
-   [x] `@aomao/plugin-fontsize` 字体大小
-   [x] `@aomao/plugin-heading` 标题
-   [x] `@aomao/plugin-hr` 分割线
-   [x] `@aomao/plugin-indent` 缩进
-   [x] `@aomao/plugin-italic` 斜体
-   [x] `@aomao/plugin-link` 链接
-   [x] `@aomao/plugin-mark` 标记
-   [x] `@aomao/plugin-orderedlist` 有序列表
-   [x] `@aomao/plugin-paintformat` 格式刷
-   [x] `@aomao/plugin-quote` 引用
-   [x] `@aomao/plugin-redo` 重做历史
-   [x] `@aomao/plugin-removeformat` 移除格式
-   [x] `@aomao/plugin-selectall` 全选
-   [x] `@aomao/plugin-strikethrough` 删除线
-   [x] `@aomao/plugin-sub` 下标
-   [x] `@aomao/plugin-sup` 上标
-   [x] `@aomao/plugin-tasklist` 任务列表
-   [x] `@aomao/plugin-underline` 下划线
-   [x] `@aomao/plugin-undo` 撤销历史
-   [x] `@aomao/plugin-unorderedlist` 无序列表
-   [x] `@aomao/plugin-image` 图片
-   [ ] `@aomao/plugin-video` 视频
-   [ ] `@aomao/plugin-table` 表格

## 快速上手

### 安装

am-editor 中`引擎`、`工具栏`、`每个插件`都是单独的包。其中`引擎`是最核心的包，其它包都将依赖它

使用 npm 或者 yarn 安装引擎包

```bash
$ npm install @aomao/engine
# or
$ yarn add @aomao/engine
```

### 使用

我们按照惯例先输出一个`Hello word!`

```tsx
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
		//初始化本地协作，用作记录历史
		engine.ot.initLockMode();
		//设置编辑器值
		engine.setValue(content);
		//监听编辑器值改变事件
		engine.on('change', value => {
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

现在我们在上诉代码基础上，引入`@aomao/plugin-bold`加粗插件

```tsx
import Bold from '@aomao/plugin-bold';
```

然后将`Bold`插件加入引擎

```tsx
//实例化引擎
const engine = new Engine(ref.current, {
	plugin: [Bold],
});
```

### 卡片

卡片是编辑器中单独划分的一个区域，其 UI 以及逻辑在卡片内部可以使用 React、Vue 或其它框架自定义渲染内容，最后再挂载到编辑器上。

引入`@aomao/plugin-codeblock`代码块插件

```tsx
import CodeBlock, { CodeBlockComponent } from '@aomao/plugin-codeblock';
```

将`CodeBlock`插件和`CodeBlockComponent`卡片组件加入引擎

```tsx
//实例化引擎
const engine = new Engine(ref.current, {
	plugins: [CodeBlock],
	cards: [CodeBlockComponent],
});
```

`CodeBlock`插件默认支持`markdown`，在编辑器一行开头位置输入代码块语法` ```javascript `回车后，看看效果吧

### 工具栏

引入`@aomao/toolbar`工具栏

```tsx | pure
import Toolbar, { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar';
```

将`ToolbarPlugin`插件和`ToolbarComponent`卡片组件加入引擎，它将让我们在编辑器中可以使用快捷键`/`唤醒出工具栏

```tsx
//实例化引擎
const engine = new Engine(ref.current, {
	plugins: [ToolbarPlugin],
	cards: [ToolbarComponent],
});
```

渲染工具栏，工具栏已配置好所有插件，这里我们只需要传入插件名称即可

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

### 协同编辑

协同编辑基于[ShareDB](https://github.com/share/sharedb)实现。每位编辑者作为[客户端](https://github.com/itellyou-com/am-editor/blob/master/docs/demo/ot-client.ts)通过`WebSocket`与[服务端](https://github.com/itellyou-com/am-editor/tree/master/ot-server)通信交换数据。编辑器处理数据、渲染数据。

我们将 客户端 和 服务端 搭建好后 开启协同编辑。[查看完整示例](https://github.com/itellyou-com/am-editor/blob/master/docs/demo/engine.tsx)

```tsx | pure
//实例化协作编辑客户端，传入当前编辑器引擎实例
const otClient = new OTClient(engine);
//连接到协作服务端，`demo` 与服务端文档ID相同
otClient.connect(
	`ws://127.0.0.1:8080${currentMember ? '?uid=' + currentMember.id : ''}`,
	'demo',
);
```
