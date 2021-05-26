---
translateHelp: true
toc: menu
---

# 工具栏配置

引入工具栏

```ts
//vue 请使用 @aomao/toolbar-vue
import Toolbar, { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar';
```

-   Toolbar 工具栏组件
-   ToolbarPlugin 提供给引擎的插件
-   ToolbarComponent 提供给引擎的卡片组件

除了 `Toolbar` 组件，后两者都是实现在编辑器按下 `/` 出现工具栏卡片插件选项的快捷方式

## 类型

工具栏现在有四种展现方式

-   `button` 按钮
-   `downdrop` 下拉框
-   `color` 颜色板
-   `collapse` 下拉面板，工具栏的第一个按钮出现的下拉框，卡片形式的组件基本上都放在这里

## Props

Toolbar 组件需要传入的属性：

-   `editor` 编辑器实例，可以用于自动调用插件执行
-   `items` 插件展示配置列表

## Items

items 是一个二维数组，我们可以把相同概念的插件放在一个组里面，便于寻找。渲染出来后，每个组都会有分割线分开

```ts
items: [['collapse'], ['bold', 'italic']];
```

在 Toolbar 组件里面已经配置好了现有插件的所有展现形式，我们可以直接传入插件名称使用这些配置。当然，我们也可以传入一个对象覆盖部分配置

```ts
items: [
	['collapse'],
	[
		{
			name: 'bold',
			icon: '图标',
			title: '提示文字',
		},
		'italic',
	],
];
```

如果通过 `name` 属性找到了默认配置，那么 `type` 属性是不会被覆盖的。如果配置的`name`不属于默认配置的一部分，也是可以展现出来，相当于在 toolbar 上加了一个自定义按钮，也可以为其添加事件自定义处理

## 默认配置

[https://github.com/itellyou-com/am-editor/blob/master/packages/toolbar/src/config/toolbar/index.tsx](https://github.com/itellyou-com/am-editor/blob/master/packages/toolbar/src/config/toolbar/index.tsx)
