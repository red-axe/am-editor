---
title: 介绍
---

## 是什么？

一个支持协同编辑的富文本编辑器，可以自由的使用 React、Vue 等前端常用库扩展定义插件。

`广告`：[科学上网，方便、快捷的上网冲浪](https://xiyou4you.us/r/?s=18517120) 稳定、可靠，访问 Github 或者其它外网资源很方便。

## 基本原理

使用浏览器提供的 `contenteditable` 属性让一个 DOM 节点具有可编辑能力：

```html
<div contenteditable="true"></div>
```

所以它的值看起来像是这样的：

```html
<div data-element="root" contenteditable="true">
	<p>Hello world!</p>
	<p><br /></p>
</div>
```

当然，有些场景下为了方便操作，也提供了转换为 JSON 类型值的 API：

```json
[
	"div", // 节点名称
	// 节点所有的属性
	{
		"data-element": "root",
		"contenteditable": "true"
	},
	// 子节点1
	[
		// 子节点名称
		"p",
		// 子节点属性
		{},
		// 字节点的子节点
		"Hello world!"
	],
	// 子节点2
	["p", {}, ["br", {}]]
]
```

<Alert>
  编辑器依赖 <strong>contenteditable</strong> 属性提供的输入能力以及光标的控制能力。因此，它拥有所有的默认浏览器行为，但是浏览器的默认行为在不同的浏览器厂商实现下存在不同的处理方式，所以我们其大部分默认行为进行了拦截并进行自定义的处理。
</Alert>

比如输入的过程中 `beforeinput` `input`， 删除、回车以及快捷键涉及到的 `mousedown` `mouseup` `click` 等事件都会被拦截，并进行自定义的处理。

在对事件进行接管后，编辑器所做的事情就是管理好基于 `contenteditable` 属性根节点下的所有子节点了，比如插入文本、删除文本、插入图片等等。

综上所述，编辑中的数据结构是一个 DOM 树结构，所有的操作都是对 DOM 树直接进行操作，不是典型的以数据模型驱动视图渲染的 MVC 模式。

## 节点约束

为了更方便的管理节点，降低复杂性。编辑器抽象化了节点属性和功能，制定了 `mark` `inline` `block` `card` 4 种类型节点，他们由不同的属性、样式或 `html` 结构组成，并统一使用 `schema` 对它们进行约束。

一个简单的 `schema` 看起来像是这样：

```ts
{
  name: 'p', // 节点名称
  type: 'block' // 节点类型
}
```

除此之外，还可以描述属性、样式等，比如：

```ts
{
  name: 'span', // 节点名称
  type: 'mark', // 节点类型
  attributes: {
    // 节点有一个 style 属性
    style: {
      // 必须包含一个color的样式
      color: {
        required: true, // 必须包含
        value: '@color' // 值是一个符合css规范的颜色值，@color 是编辑器内部定义的颜色效验，此处也可以使用方法、正则表达式去判断是否符合需要的规则
      }
    },
    // 可选的包含一个 test 属性，他的值可以是任意的，但不是必须的
    test: '*'
  }
}
```

下面这几种节点都符合上面的规则：

```html
<span style="color:#fff"></span>
<span style="color:#fff" test="test123" test1="test1"></span>
<span style="color:#fff;background-color:#000;"></span>
<span style="color:#fff;background-color:#000;" test="test123"></span>
```

但是除了在 color 和 test 已经在 `schema` 中定义外，其它的属性(background-color、test1)在处理时都会被编辑器过滤掉。

可编辑器区域内的节点通过 `schema` 规则，制定了 `mark` `inline` `block` `card` 4 种组合节点，他们由不同的属性、样式或 `html` 结构组成，并对它们的嵌套进行了一定的约束。

## 协同

通过 `MutationObserver` 监听编辑区域(contenteditable 根节点)内的 `html` 结构的突变反推 OT。通过`Websocket`与 [ShareDB](https://github.com/share/sharedb) 连接，然后使用命令对 ShareDB 保存的数据进行增、删、改、查。

## 特性

-   开箱即用，提供几十种丰富的插件来满足大部分需求
-   高扩展性，除了 `mark` `inline` `block` 类型基础插件外，我们还提供 `card` 组件结合`React` `Vue`等前端库渲染插件 UI
-   丰富的多媒体支持，不仅支持图片和音视频，更支持插入嵌入式多媒体内容
-   支持 Markdown 语法
-   引擎纯 JavaScript 编写，不依赖任何前端库，插件可以使用 `React` `Vue` 等前端库渲染。复杂架构轻松应对
-   内置协同编辑方案，轻量配置即可使用
-   兼容大部分最新移动端浏览器
