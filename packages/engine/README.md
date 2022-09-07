# am-editor

<p align="center">
	一个富文本<em>协同</em>编辑器框架，可以使用<em>React</em>和<em>Vue</em>自定义插件
</p>

<p align="center">
  <a href="https://github.com/yanmao-cc/am-editor/blob/master/README.md"><strong>English</strong></a> ·
  <a href="https://editor.aomao.com"><strong>Demo</strong></a> ·
  <a href="https://editor.aomao.com/docs"><strong>文档</strong></a> ·
  <a href="#plugins"><strong>插件</strong></a> ·
  <a href="https://qm.qq.com/cgi-bin/qm/qr?k=Gva5NtZ2USlHSLbFOeMroysk8Uwo7fCS&jump_from=webapi"><strong>QQ群 907664876</strong></a> ·
</p>

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

`广告`：[科学上网，方便、快捷的上网冲浪](https://xiyou4you.us/r/?s=18517120) 稳定、可靠，访问 Github 或者其它外网资源很方便。

使用浏览器提供的 `contenteditable` 属性让一个 DOM 节点具有可编辑能力。

引擎接管了浏览器大部分光标、事件等默认行为。

可编辑器区域内的节点通过 `schema` 规则，制定了 `mark` `inline` `block` `card` 4 种组合节点，他们由不同的属性、样式或 `html` 结构组成，并对它们的嵌套进行了一定的约束。

通过 `MutationObserver` 监听编辑区域内的 `DOM` 树的改变，并生成 `json0` 类型的数据格式与 [ShareDB](https://github.com/share/sharedb) 库进行交互，从而达到协同编辑的需要。

**`Vue2`** DEMO [https://github.com/zb201307/am-editor-vue2](https://github.com/zb201307/am-editor-vue2)

**`Vue3`** DEMO [https://github.com/red-axe/am-editor-vue3-demo](https://github.com/red-axe/am-editor-vue3-demo)

**`React`** DEMO [https://github.com/yanmao-cc/am-editor/tree/master/examples/react](https://github.com/yanmao-cc/am-editor/tree/master/examples/react)

## 特性

-   开箱即用，提供几十种丰富的插件来满足大部分需求
-   高扩展性，除了 `mark` `inline` `block` 类型基础插件外，我们还提供 `card` 组件结合`React` `Vue`等前端库渲染插件 UI
-   丰富的多媒体支持，不仅支持图片和音视频，更支持插入嵌入式多媒体内容
-   支持 Markdown 语法
-   支持国际化
-   引擎纯 JavaScript 编写，不依赖任何前端库，插件可以使用 `React` `Vue` 等前端库渲染。复杂架构轻松应对
-   内置协同编辑方案，轻量配置即可使用
-   兼容大部分最新移动端浏览器

## 插件

| **包**                                                   |                                                                                                                                   **版本** |                                                                                                                                                                           **大小** | **描述**               |
| :------------------------------------------------------- | -----------------------------------------------------------------------------------------------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------- |
| [`@aomao/toolbar`](./packages/toolbar)                   |                   [![](https://img.shields.io/npm/v/@aomao/toolbar.svg?maxAge=3600&label=&colorB=007ec6)](./packages/toolbar/package.json) |                           [![](http://img.badgesize.io/https://unpkg.com/@aomao/toolbar/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/toolbar/dist/index.js) | 工具栏, 适用于 `React` |
| [`@aomao/toolbar-vue`](./packages/toolbar-vue)           |           [![](https://img.shields.io/npm/v/@aomao/toolbar-vue.svg?maxAge=3600&label=&colorB=007ec6)](./packages/toolbar-vue/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/toolbar-vue/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/toolbar-vue/dist/index.js) | 工具栏, 适用于 `Vue3`  |
| [`@aomao/plugin-alignment`](./plugins/alignment)         |         [![](https://img.shields.io/npm/v/@aomao/plugin-alignment.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/alignment/package.json) |         [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-alignment/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-alignment/dist/index.js) | 对齐方式               |
| [`@aomao/plugin-backcolor`](./plugins/backcolor)         |         [![](https://img.shields.io/npm/v/@aomao/plugin-backcolor.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/backcolor/package.json) |         [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-backcolor/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-backcolor/dist/index.js) | 背景色                 |
| [`@aomao/plugin-bold`](./plugins/bold)                   |                   [![](https://img.shields.io/npm/v/@aomao/plugin-bold.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/bold/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-bold/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-bold/dist/index.js) | 加粗                   |
| [`@aomao/plugin-code`](./plugins/code)                   |                   [![](https://img.shields.io/npm/v/@aomao/plugin-code.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/code/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-code/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-code/dist/index.js) | 行内代码               |
| [`@aomao/plugin-codeblock`](./plugins/codeblock)         |         [![](https://img.shields.io/npm/v/@aomao/plugin-codeblock.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/codeblock/package.json) |         [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-codeblock/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-codeblock/dist/index.js) | 代码块, 适用于 `React` |
| [`@aomao/plugin-codeblock-vue`](./plugins/codeblock-vue) | [![](https://img.shields.io/npm/v/@aomao/plugin-codeblock-vue.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/codeblock-vue/package.json) | [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-codeblock-vue/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-codeblock-vue/dist/index.js) | 代码块, 适用于 `Vue3`  |
| [`@aomao/plugin-fontcolor`](./plugins/fontcolor)         |         [![](https://img.shields.io/npm/v/@aomao/plugin-fontcolor.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/fontcolor/package.json) |         [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-fontcolor/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-fontcolor/dist/index.js) | 前景色                 |
| [`@aomao/plugin-fontfamily`](./plugins/fontfamily)       |       [![](https://img.shields.io/npm/v/@aomao/plugin-fontfamily.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/fontfamily/package.json) |       [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-fontfamily/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-fontfamily/dist/index.js) | 字体                   |
| [`@aomao/plugin-fontsize`](./plugins/fontsize)           |           [![](https://img.shields.io/npm/v/@aomao/plugin-fontsize.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/fontsize/package.json) |           [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-fontsize/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-fontsize/dist/index.js) | 字体大小               |
| [`@aomao/plugin-heading`](./plugins/heading)             |             [![](https://img.shields.io/npm/v/@aomao/plugin-heading.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/heading/package.json) |             [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-heading/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-heading/dist/index.js) | 标题                   |
| [`@aomao/plugin-hr`](./plugins/hr)                       |                       [![](https://img.shields.io/npm/v/@aomao/plugin-hr.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/hr/package.json) |                       [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-hr/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-hr/dist/index.js) | 分割线                 |
| [`@aomao/plugin-indent`](./plugins/indent)               |               [![](https://img.shields.io/npm/v/@aomao/plugin-indent.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/indent/package.json) |               [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-indent/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-indent/dist/index.js) | 缩进                   |
| [`@aomao/plugin-italic`](./plugins/italic)               |               [![](https://img.shields.io/npm/v/@aomao/plugin-italic.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/italic/package.json) |               [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-italic/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-italic/dist/index.js) | 斜体                   |
| [`@aomao/plugin-link`](./plugins/link)                   |                   [![](https://img.shields.io/npm/v/@aomao/plugin-link.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/link/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-link/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-link/dist/index.js) | 链接, 适用于 `React`   |
| [`@aomao/plugin-link-vue`](./plugins/link-vue)           |           [![](https://img.shields.io/npm/v/@aomao/plugin-link-vue.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/link-vue/package.json) |           [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-link-vue/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-link-vue/dist/index.js) | 链接, 适用于 `Vue3`    |
| [`@aomao/plugin-line-height`](./plugins/line-height)     |     [![](https://img.shields.io/npm/v/@aomao/plugin-line-height.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/line-height/package.json) |     [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-line-height/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-line-height/dist/index.js) | 行高                   |
| [`@aomao/plugin-mark`](./plugins/mark)                   |                   [![](https://img.shields.io/npm/v/@aomao/plugin-mark.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/mark/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-mark/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-mark/dist/index.js) | 标记                   |
| [`@aomao/plugin-mention`](./plugins/mention)             |             [![](https://img.shields.io/npm/v/@aomao/plugin-mention.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/mention/package.json) |             [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-mention/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-mention/dist/index.js) | 提及                   |
| [`@aomao/plugin-orderedlist`](./plugins/orderedlist)     |     [![](https://img.shields.io/npm/v/@aomao/plugin-orderedlist.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/orderedlist/package.json) |     [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-orderedlist/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-orderedlist/dist/index.js) | 有序列表               |
| [`@aomao/plugin-paintformat`](./plugins/paintformat)     |     [![](https://img.shields.io/npm/v/@aomao/plugin-paintformat.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/paintformat/package.json) |     [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-paintformat/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-paintformat/dist/index.js) | 格式刷                 |
| [`@aomao/plugin-quote`](./plugins/quote)                 |                 [![](https://img.shields.io/npm/v/@aomao/plugin-quote.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/quote/package.json) |                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-quote/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-quote/dist/index.js) | 引用块                 |
| [`@aomao/plugin-redo`](./plugins/redo)                   |                   [![](https://img.shields.io/npm/v/@aomao/plugin-redo.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/redo/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-redo/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-redo/dist/index.js) | 重做                   |
| [`@aomao/plugin-removeformat`](./plugins/removeformat)   |   [![](https://img.shields.io/npm/v/@aomao/plugin-removeformat.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/removeformat/package.json) |   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-removeformat/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-removeformat/dist/index.js) | 移除样式               |
| [`@aomao/plugin-selectall`](./plugins/selectall)         |         [![](https://img.shields.io/npm/v/@aomao/plugin-selectall.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/selectall/package.json) |         [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-selectall/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-selectall/dist/index.js) | 全选                   |
| [`@aomao/plugin-status`](./plugins/status)               |               [![](https://img.shields.io/npm/v/@aomao/plugin-status.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/status/package.json) |               [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-status/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-status/dist/index.js) | 状态                   |
| [`@aomao/plugin-strikethrough`](./plugins/strikethrough) | [![](https://img.shields.io/npm/v/@aomao/plugin-strikethrough.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/strikethrough/package.json) | [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-strikethrough/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-strikethrough/dist/index.js) | 删除线                 |
| [`@aomao/plugin-sub`](./plugins/sub)                     |                     [![](https://img.shields.io/npm/v/@aomao/plugin-sub.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/sub/package.json) |                     [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-sub/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-sub/dist/index.js) | 下标                   |
| [`@aomao/plugin-sup`](./plugins/sup)                     |                     [![](https://img.shields.io/npm/v/@aomao/plugin-sup.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/sup/package.json) |                     [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-sup/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-sup/dist/index.js) | 上标                   |
| [`@aomao/plugin-tasklist`](./plugins/tasklist)           |           [![](https://img.shields.io/npm/v/@aomao/plugin-tasklist.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/tasklist/package.json) |           [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-tasklist/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-tasklist/dist/index.js) | 任务列表               |
| [`@aomao/plugin-underline`](./plugins/underline)         |         [![](https://img.shields.io/npm/v/@aomao/plugin-underline.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/underline/package.json) |         [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-underline/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-underline/dist/index.js) | 下划线                 |
| [`@aomao/plugin-undo`](./plugins/undo)                   |                   [![](https://img.shields.io/npm/v/@aomao/plugin-undo.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/undo/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-undo/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-undo/dist/index.js) | 撤销                   |
| [`@aomao/plugin-unorderedlist`](./plugins/unorderedlist) | [![](https://img.shields.io/npm/v/@aomao/plugin-unorderedlist.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/unorderedlist/package.json) | [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-unorderedlist/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-unorderedlist/dist/index.js) | 无序列表               |
| [`@aomao/plugin-image`](./plugins/image)                 |                 [![](https://img.shields.io/npm/v/@aomao/plugin-image.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/image/package.json) |                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-image/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-image/dist/index.js) | 图片                   |
| [`@aomao/plugin-table`](./plugins/table)                 |                 [![](https://img.shields.io/npm/v/@aomao/plugin-table.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/table/package.json) |                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-table/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-table/dist/index.js) | 表格                   |
| [`@aomao/plugin-file`](./plugins/file)                   |                   [![](https://img.shields.io/npm/v/@aomao/plugin-file.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/file/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-file/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-file/dist/index.js) | 文件                   |
| [`@aomao/plugin-mark-range`](./plugins/mark-range)       |       [![](https://img.shields.io/npm/v/@aomao/plugin-mark-range.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/mark-range/package.json) |       [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-mark-range/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-mark-range/dist/index.js) | 标记光标, 例如: 批注.  |
| [`@aomao/plugin-math`](./plugins/math)                   |                   [![](https://img.shields.io/npm/v/@aomao/plugin-math.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/math/package.json) |                   [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-math/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-math/dist/index.js) | 数学公式               |
| [`@aomao/plugin-video`](./plugins/video)                 |                 [![](https://img.shields.io/npm/v/@aomao/plugin-video.svg?maxAge=3600&label=&colorB=007ec6)](./plugins/video/package.json) |                 [![](http://img.badgesize.io/https://unpkg.com/@aomao/plugin-video/dist/index.js?compression=gzip&label=%20)](https://unpkg.com/@aomao/plugin-video/dist/index.js) | 视频                   |

## 快速上手

### 安装

编辑器由 `引擎`、`工具栏`、`插件` 组成。`引擎` 为我们提供了核心的编辑能力。

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
	const [content, setContent] = useState<string>('<p>Hello word!</p>');

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

引入 `@aomao/plugin-bold` 加粗插件

```tsx
import Bold from '@aomao/plugin-bold';
```

把 `Bold` 插件加入引擎

```tsx
//实例化引擎
const engine = new Engine(ref.current, {
	plugins: [Bold],
});
```

### 卡片

卡片是编辑器中单独划分的一个区域，其 UI 以及逻辑在卡片内部可以使用 React、Vue 或其它前端库自定义渲染内容，最后再挂载到编辑器上。

引入 `@aomao/plugin-codeblock` 代码块插件，这个插件的 `语言下拉框` 使用 `React` 渲染，所以有区分。 `Vue3` 使用 `@aomao/plugin-codeblock-vue`

```tsx
import CodeBlock, { CodeBlockComponent } from '@aomao/plugin-codeblock';
```

把 `CodeBlock` 插件和 `CodeBlockComponent` 卡片组件加入引擎

```tsx
//实例化引擎
const engine = new Engine(ref.current, {
	plugins: [CodeBlock],
	cards: [CodeBlockComponent],
});
```

`CodeBlock` 插件默认支持 `markdown`，在编辑器一行开头位置输入代码块语法` ```javascript ` 回车后即可触发。

### 工具栏

引入 `@aomao/toolbar` 工具栏，工具栏由于交互复杂，基本上都是使用 `React` + `Antd` UI 组件渲染，`Vue3` 使用 `@aomao/toolbar-vue`

工具栏除了 UI 交互外，大部分工作只是对不同的按钮事件触发后调用了引擎执行对应的插件命令，在需求比较复杂或需要重新定制 UI 的情况下，Fork 后修改起来也比较容易。

```tsx
import Toolbar, { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar';
```

把 `ToolbarPlugin` 插件和 `ToolbarComponent` 卡片组件加入引擎，它可以让我们在编辑器中可以使用快捷键 `/` 唤醒出卡片工具栏

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

更复杂的工具栏配置请查看文档 [https://editor.aomao.com/zh-CN/config/toolbar](https://editor.aomao.com/zh-CN/config/toolbar)

### 协同编辑

协同编辑基于 [ShareDB](https://github.com/share/sharedb) 开源库实现，比较陌生的朋友可以先了解它。

#### 交互模式

每位编辑者作为 [客户端](https://github.com/yanmao-cc/am-editor/tree/master/examples/react/components/editor/ot/client.ts) 通过 `WebSocket` 与 [服务端](https://github.com/yanmao-cc/am-editor/tree/master/ot-server) 通信交换由编辑器生成的 `json0` 格式的数据。

服务端会保留一份 `json` 格式的 `html` 结构数据，接收到来自客户端的指令后，再去修改这份数据，最后再转发到每个客户端。

在启用协同编辑前，我们需要配置好 [客户端](https://github.com/yanmao-cc/am-editor/tree/master/examples/react/components/editor/ot/client.ts) 和 [服务端](https://github.com/yanmao-cc/am-editor/tree/master/ot-server)

服务端是 `NodeJs` 环境，使用 `express` + `WebSocket` 搭建的网络服务。

#### DEMO

DEMO 中我们已经一份比较基础的客户端代码

[查看 React 完整 DEMO](https://github.com/yanmao-cc/am-editor/tree/master/examples/react)

[查看 Vue3 完整 DEMO](https://github.com/red-axe/am-editor-vue3-demo)

[查看 Vue2 完整 DEMO](https://github.com/zb201307/am-editor-vue2)

```tsx
//实例化协作编辑客户端，传入当前编辑器引擎实例
const otClient = new OTClient(engine);
//连接到协作服务端，`demo` 与服务端文档ID相同
otClient.connect(
	`ws://127.0.0.1:8080${currentMember ? '?uid=' + currentMember.id : ''}`,
	'demo',
);
```

### 项目图标

[Iconfont](https://at.alicdn.com/t/project/1456030/0cbd04d3-3ca1-4898-b345-e0a9150fcc80.html?spm=a313x.7781069.1998910419.35)

## 开发

### React

需要在 `am-editor 根目录` `site-ssr` `ot-server` 中分别安装依赖

```base
//依赖安装好后，只需要在根目录执行以下命令

yarn ssr
```

-   `packages` 引擎和工具栏
-   `plugins` 所有的插件
-   `site-ssr` 所有的后端 API 和 SSR 配置。使用的 egg 。在 am-editor 根目录下使用 yarn ssr 自动启动 `site-ssr`
-   `ot-server` 协同服务端。启动：yarn start

### Vue3

只需要进入 examples/vue 目录安装依赖

```base
//依赖安装好后，在 examples/vue 目录执行以下命令

yarn serve
```

在 Vue 运行环境中，默认是安装的已发布到 npm 上的代码。如果需要修改引擎或者插件的代码后立即看到效果，我们需要做以下步骤：

-   删除 examples/vue/node_modules/@aomao 文件夹
-   删除 examples/vue/node_modules/vue 文件夹。因为有插件依赖了 Vue，所以 Vue 的包会在项目根目录中安装。如果不删除 examples/vue 中的 Vue 包，和插件的 Vue 包不在一个环境中，就无法加载插件
-   在 am-editor 根目录下执行安装所有依赖命令，例如：`yarn`
-   最后在 examples/vue 中重新启动

`Vue` DEMO 中没有配置任何后端 API，具体可以参考 `React` 和 `site-ssr`

## 贡献

感谢 [pleasedmi](https://github.com/pleasedmi)、[Elena211314](https://github.com/Elena211314) 的捐赠

如果您愿意，可以在这里留下你的名字。

### 支付宝

![alipay](https://cdn-object.aomao.com/contribution/alipay.png?x-oss-process=image/resize,w_200)

### 微信支付

![wechat](https://cdn-object.aomao.com/contribution/weichat.png?x-oss-process=image/resize,w_200)

### PayPal

[https://paypal.me/aomaocom](https://paypal.me/aomaocom)
