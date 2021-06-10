# am-editor

<img width="1676" alt="Demo" src="https://user-images.githubusercontent.com/55792257/119711922-a359b500-be92-11eb-9f77-459b6d468be9.png">

am-editor，一个基于[ShareDB](https://github.com/share/sharedb) 的 Web 多人协同富文本编辑器，适用于`React`、`Vue`框架，与主流的现代浏览器兼容。

[查看在线文档及演示](https://editor.aomao.com)

技术交流 QQ 群：907664876

[科学上网，方便、快捷的上网冲浪](https://xiyou4you.us/r/?s=18517120)

am-editor，一个 Web 多人实时协同富文本编辑器。使用浏览器提供的`contenteditable`属性让一个 DOM 节点具有可编辑能力。

众所周知`contenteditable`属性，在不同的浏览器厂商中实现会有不同的差异，并且其默认行为具有不可预测性，因此我们封装了一个具有一定可控性的编辑能力引擎库`@aomao/engine`，在默认行为和期望行为之间进行平衡取舍。

引擎库使用`javascript`编写，我们对 DOM 节点插入、删除、替换等一系列操作、包括光标、事件进行了封装并派生接口。因此，在引擎中我们的所有操作都将直接编辑复杂的 DOM 树，在数据结构中我们也将以 DOM 树结构呈现。不过在实际应用中，我们非常有必要对复杂的 DOM 树结构进行约束，以免出现不可预期的行为，并且在当前流行使用`React` `Vue`等前端框架来渲染 UI 的情况下，让我们再使用`javascript`定制 UI 是一件非常痛苦的事情。所以我们把 DOM 节点按功能和特性分为以下几类：`mark` `inline` `block` `card` 并且通过 `schema` 来约束他们特定的行为和一些特质属性，在 `card` 组件中我们还可以结合前端框架来完成复杂的 UI 渲染和编辑嵌套。

在现代化企业中，协同办公已是高效的代名词。在即时通讯、视频会议之后让文档也协同起来，已是大势所趋。在引擎库中，我们基于[ShareDB](https://github.com/share/sharedb)提供协同编辑能力，把复杂的 DOM 结构转换为[JSON0](https://github.com/ottypes/json0)协议的数据结构后，提交给`sharedb`处理协同编辑的交互。

## 特性

-   📦 开箱即用，提供几十种丰富的插件来满足大部分需求
-   🏷 高扩展性，除了`mark` `inline` `block`基础插件外，我们还提供`card`组件结合`React` `Vue`等前端框架渲染插件 UI
-   📋 丰富的多媒体支持，不仅支持图片和音视频，更支持插入嵌入式多媒体内容
-   🐠 不依赖前端框架，复杂架构轻松应对
-   📡 内置协同编辑方案，轻量配置即可使用
-   📱 兼容大部分最新移动端浏览器

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
-   [x] `@aomao/plugin-table` 表格
-   [x] `@aomao/plugin-file` 附件
-   [x] `@aomao/plugin-mark-range` 光标范围标记
-   [x] `@aomao/plugin-video` 视频
-   [x] `@aomao/plugin-math` 数学公式

## 快速上手

### 安装

am-editor 中`引擎`、`工具栏`、`每个插件`都是单独的包。其中`引擎`是最核心的包，其它包都将依赖它

使用 npm 或者 yarn 安装引擎包

```bash
$ npm install @aomao/engine
# or
$ yarn add @aomao/engine
```

`Vue` 使用者请看 [https://github.com/itellyou-com/am-editor/tree/master/demo-vue](https://github.com/itellyou-com/am-editor/tree/master/demo-vue)

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
		engine.on('change', (value) => {
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

引入`@aomao/plugin-codeblock`代码块插件，这个插件部分 UI 使用框架渲染，所以有区分。 `vue`开发者使用 `@aomao/plugin-codeblock-vue`

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

引入`@aomao/toolbar`工具栏，工具栏基本上都是使用框架渲染，`vue`开发者使用 `@aomao/toolbar-vue`

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

### 项目图标

[Iconfont](https://at.alicdn.com/t/project/1456030/575170a6-50ef-4156-9ad0-2cd0341752a7.html?spm=a313x.7781069.1998910419.35)

## 贡献

### 支付宝

![alipay](https://cdn-object.aomao.com/contribution/alipay.png?x-oss-process=image/resize,w_200)

### 微信支付

![wechat](https://cdn-object.aomao.com/contribution/weichat.png?x-oss-process=image/resize,w_200)

### PayPal

[https://paypal.me/aomaocom](https://paypal.me/aomaocom)
