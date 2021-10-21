---
title: 介绍
---

## 是什么？

一个富文本<em>协同</em>编辑器框架，可以使用<em>React</em>和<em>Vue</em>自定义插件

`广告`：[科学上网，方便、快捷的上网冲浪](https://xiyou4you.us/r/?s=18517120) 稳定、可靠，访问 Github 或者其它外网资源很方便。

使用浏览器提供的 `contenteditable` 属性让一个 DOM 节点具有可编辑能力。

引擎接管了浏览器大部分光标、事件等默认行为。

可编辑器区域内的节点通过 `schema` 规则，制定了 `mark` `inline` `block` `card` 4 种组合节点，他们由不同的属性、样式或 `html` 结构组成，并对它们的嵌套进行了一定的约束。

通过 `MutationObserver` 监听编辑区域内的 `html` 结构的改变，并生成 `json0` 类型的数据格式与 [ShareDB](https://github.com/share/sharedb) 库进行交互达到协同编辑的需要。

**`Vue2`** 案例 [https://github.com/zb201307/am-editor-vue2](https://github.com/zb201307/am-editor-vue2)

**`Vue3`** 案例 [https://github.com/yanmao-cc/am-editor/tree/master/examples/vue](https://github.com/yanmao-cc/am-editor/tree/master/examples/vue)

**`React`** 案例 [https://github.com/yanmao-cc/am-editor/tree/master/examples/react](https://github.com/yanmao-cc/am-editor/tree/master/examples/react)

## 特性

-   开箱即用，提供几十种丰富的插件来满足大部分需求
-   高扩展性，除了 `mark` `inline` `block` 类型基础插件外，我们还提供 `card` 组件结合`React` `Vue`等前端库渲染插件 UI
-   丰富的多媒体支持，不仅支持图片和音视频，更支持插入嵌入式多媒体内容
-   支持 Markdown 语法
-   引擎纯 JavaScript 编写，不依赖任何前端库，插件可以使用 `React` `Vue` 等前端库渲染。复杂架构轻松应对
-   内置协同编辑方案，轻量配置即可使用
-   兼容大部分最新移动端浏览器
