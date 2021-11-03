# FAQ

## am-editor 支持 Vue2 吗？

引擎库 `@aomao/engine` 本身是 javascript 编写的，不涉及到前端框架。主要在于一些插件我们使用了前端框架渲染

下面这三个插件有区别

-   `@aomao/toolbar-vue` 编辑器工具栏。按钮、图标、下拉框、颜色选择器等都是复杂的 UI

-   `@aomao/plugin-codeblock-vue` 选择代码语言的下拉框具有搜索功能，使用前端库现有的 UI 是比较好的选择

-   `@aomao/plugin-link-vue` 链接输入、文本输入，使用前端库现有的 UI 是比较好的选择

这三个插件都有 vue3 的依赖，并且使用的是 antd UI 库。其它插件没有依赖任何前端框架

[Vue2 插件](https://github.com/zb201307/am-editor-vue2/tree/main/packages)

## window is not defined, document is not defined, navigator is not defined

SSR 因为会在服务端执行 render 渲染方法，而服务端没有 DOM/BOM 变量和方法

在编辑模式下，基本上没有服务端渲染的需求。主要在于视图渲染，如果使用纯 html 呈现将缺少`Card`内容的动态交互。

1. 使用 jsdom 内置 window 对象。在引擎或插件内部可以使用 getWindow 对象获取这个 \_\_amWindow 对象。但是无法解决第三方包依赖 window 对象的问题

```ts
const { JSDOM } = require('jsdom');

const { window } = new JSDOM(`<html><body></body></html>`);
global.__amWindow = window;
```

2. 将第三方包动态引入 或者 使用 `isServer` 判定是否有 window 对象。这样能解决运行不会出错的问题，但是在服务端还是无法完整的渲染出内容。可以在服务端输出 html，满足 seo 需求。加载到浏览器后重新渲染 view 阅读器
