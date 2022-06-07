# 工具栏配置

引入工具栏

```ts
//vue3 请使用 @aomao/toolbar-vue
//vue2 请使用 am-editor-toolbar-vue2
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

## 属性

Toolbar 组件需要传入的属性：

-   `editor` 编辑器实例，可以用于自动调用插件执行
-   `items` 插件展示配置列表

## 配置项

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

如果通过 `name` 属性找到了默认配置，那么 `type` 属性是不会被覆盖的。如果配置的`name`不属于默认配置的一部分，就按照自定义按钮处理

## 工具栏组件

通过组件形式使用工具栏，需要传入引擎实例和 items 配置项

```ts
import Toolbar from '@aomao/toolbar';

<Toolbar engine={engine} items={items} />;
```

## 弹出框

跟随鼠标拖蓝选中后的工具栏弹出框

```ts
import { ToolbarPlugin } from '@aomao/toolbar';
import type { ToolbarOptions } from '@aomao/toolbar';
const toolbarOptions: ToolbarOptions = {
	popup: {
		items: [
			['undo', 'redo'],
			{
				icon: 'text',
				items: [
					'bold',
					'italic',
					'strikethrough',
					'underline',
					'backcolor',
					'moremark',
				],
			},
		],
	},
};
new Engine(...,{ config: {
    [ToolbarPlugin.pluginName]: toolbarOptions,
} })

```

## 快捷键弹出工具栏

输入 / 后弹出卡片工具栏

```ts
import { ToolbarPlugin } from '@aomao/toolbar';
import type { ToolbarOptions } from '@aomao/toolbar';
const toolbarOptions: ToolbarOptions = {
	// 或者配置 config: false 关闭此功能
	config: [
		{
			title: '分组标题',// 可选
			items: [
				'image-uploader',
				'codeblock',
				'table',
				'file-uploader',
				'video-uploader',
				'math',
				'status',
			],
		},
	],
};
new Engine(...,{ config: {
    [ToolbarPlugin.pluginName]: toolbarOptions,
} })

```

## Collapse

通常用于配置卡片下拉框

需要指定 `type` 为 `collapse`

### className

自定义样式名称

### icon

可选

按钮图标，可以是 React 组件，在 Vue 中也可以是一段字符串的 html

### content

可选

按钮显示内容，会与 icon 一起显示

可以是 React 组件，在 Vue 中也可以是一段字符串的 html。或者是一个方法，并且返回 React 组件或者 html 字符串

### onSelect

列表项选中事件，返回 `false` 不会执行列表项配置的默认命令

```ts
onSelect?: (event: React.MouseEvent, name: string, engine?: EngineInterface) => void | boolean;
```

### groups

分组显示

通过 `groups` 属性可以设置按需要把不同用途的卡片分类

不填写 `title` 将不会出现分组样式

```ts
// 显示分组信息
items: [
	[
		{
			type: 'collapse',
			groups: [
				{
					title: '文件',
					items: ['image-uploader', 'file-uploader'],
				},
			],
		},
	],
];

// or 不显示分组信息

items: [
	[
		{
			type: 'collapse',
			groups: [
				{
					items: ['bold', 'underline'],
				},
			],
		},
	],
];
```

### items

配置 `collapse` 的 `items`

默认情况下已经配置了以下卡片

```ts
'image-uploader',
'codeblock',
'table',
'file-uploader',
'video-uploader',
'math',
'status',
```

我们可以指定 `name` 为已存在的卡片名称，并且配置其它选项覆盖默认配置。

当然我们也可以指定其它名称，完成自定义`item`

```ts
items: [
	[
		{
			type: 'collapse',
			groups: [
				{
					items: [{ name: 'codeblock', content: '我是CodeBlock' }],
				},
			],
		},
	],
];
```

基本属性与 `button` 属性一样，可以在文章以下部分查看，这里列出了相对于 `button` 外的特殊属性

#### search

查询字符，在工具栏插件中我们可以使用 `/` 在编辑器唤出快捷选项，并且可以搜索相关卡片，所以这里可以指定相关关键字字符组合

#### description

列表项描述，可以返回一个 `React` 组件，或者 `Vue` 可以返回 `html` 字符串

#### prompt

鼠标移入到列表项时需要渲染的内容，可以返回一个 `React` 组件，或者 `Vue` 可以返回 `html` 字符串

效果类似于 `table` 卡片项，输入移入后展示一个选择列和行数的表格

#### onClick

列表项单击事件，返回 `false` 将不会执行配置的默认命令

```ts
onClick?: (event: React.MouseEvent, name: string, engine?: EngineInterface) => void | boolean;
```

## Button

button 配置属性

在工具栏 items 里面配置，需要指定 `type` 为 `button`

```ts
items:[
    [
        {
            type: 'button',
            name: 'test',
            ...
        }
    ]
]
```

### name

按钮名称

如果按钮名称与工具栏默认配置项名称相同，那么会覆盖默认已有配置，否则将作为自定义按钮

### icon

可选

按钮图标，可以是 React 组件，在 Vue 中也可以是一段字符串的 html

### content

可选

按钮显示内容，会与 icon 一起显示

可以是 React 组件，在 Vue 中也可以是一段字符串的 html。或者是一个方法，并且返回 React 组件或者 html 字符串

### title

鼠标移入按钮时显示的提示信息

### placement

设置提示信息的位置

```ts
placement?:
    | 'right'
    | 'top'
    | 'left'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight'
    | 'leftTop'
    | 'leftBottom'
    | 'rightTop'
    | 'rightBottom';
```

### Hotkey

是否显示热键，或者设置热键的信息

默认为显示热键到提示信息（`title`），并且通过 `name` 信息找到插件设置的热键

```ts
hotkey?: boolean | string;
```

### autoExecute

按钮单击时，是否自动执行插件命令，默认启用

### command

插件命令或参数

如果有配置此参数，并且 `autoExecute` 属性为启用状态，在按钮单击时，调用此配置执行插件命令

如果有配置 `name` 就执行`name` 对应的插件，否则就执行 `button` 指定的 `name` 对应的插件

如果有配置 `args` 或者 `command` 为纯数组，会作为参数传入执行插件的命令

```ts
command?: { name: string; args: Array<any> } | Array<any>;
```

### className

为按钮配置样式名称

### onClick

鼠标单击事件

如果返回 `false` 将不会自动执行插件命令

```ts
onClick?: (event: React.MouseEvent, engine?: EngineInterface) => void | boolean;
```

### onMouseDown

鼠标按下按钮事件

```ts
onMouseDown?: (event: React.MouseEvent, engine?: EngineInterface) => void;
```

### onMouseEnter

鼠标移入按钮事件

```ts
onMouseEnter?: (event: React.MouseEvent, engine?: EngineInterface) => void;
```

### onMouseLeave

鼠标移开按钮事件

```ts
onMouseLeave?: (event: React.MouseEvent, engine?: EngineInterface) => void;
```

### onActive

自定义按钮激活选中，默认调用插件 `engine.command.queryState` 方法

```ts
onActive?: () => boolean;
```

### onDisabled

自定义按钮禁用，默认调用插件 `engine.command.queryEnabled`

```ts
onDisabled?: () => boolean;
```

## Dropdown

dropdown 配置属性

在工具栏 items 里面配置，需要指定 `type` 为 `dropdown`

```ts
items:[
    [
        {
            type: 'dropdown',
            name: 'test',
            items: [
                {
                    key: 'item1',
                    content: 'item1'
                }
            ]
            ...
        }
    ]
]
```

### items

下拉列表项，与按钮类似

```ts
items:[{
    key: string;
    icon?: React.ReactNode;
    content?: React.ReactNode | ((engine?: EngineInterface) => React.ReactNode);
    hotkey?: boolean | string;
    isDefault?: boolean;
    title?: string;
    placement?:
        | 'right'
        | 'top'
        | 'left'
        | 'bottom'
        | 'topLeft'
        | 'topRight'
        | 'bottomLeft'
        | 'bottomRight'
        | 'leftTop'
        | 'leftBottom'
        | 'rightTop'
        | 'rightBottom';
    className?: string;
    disabled?: boolean;
    command?: { name: string; args: Array<any> } | Array<any>;
    autoExecute?: boolean;
}]
```

### name

下拉列表名称

如果名称与工具栏默认配置项名称相同，那么会覆盖默认已有配置，否则将作为自定义下拉列表

### icon

可选

按钮图标，可以是 React 组件，在 Vue 中也可以是一段字符串的 html

### content

可选

按钮显示内容，会与 icon 一起显示

可以是 React 组件，在 Vue 中也可以是一段字符串的 html。或者是一个方法，并且返回 React 组件或者 html 字符串

### title

鼠标移入按钮时显示的提示信息

### values

下拉列表选中值，默认通过 `engine.command.queryState` 获取，如果有配置 `onActive` 将会从自定义 `onActive` 中获取值

```ts
values?: string | Array<string>;
```

### single

单选还是可以多选

```ts
single?: boolean;
```

### className

下拉列表样式

### direction

排列方向 `vertical` | `horizontal`

```ts
direction?: 'vertical' | 'horizontal';
```

### onSelect

列表项选中事件，返回 `false` 将不自动执行选中项配置的命令

```ts
onSelect?: (event: React.MouseEvent, key: string, engine?: EngineInterface) => void | boolean;
```

### hasArrow

是否显示下拉箭头

```ts
hasArrow?: boolean;
```

### hasDot

是否显示选中值后的勾选效果

```ts
hasDot?: boolean;
```

### renderContent

自定义渲染下拉列表选中后显示的内容，默认为下拉列表配置的 `icon` 或者 `content`

可以返回 React 组件或者 Vue 可以返回 html 字符串

```ts
renderContent?: (item: DropdownListItem, engine?: EngineInterface) => React.ReactNode;
```

### onActive

自定义按钮激活选中，默认调用插件 `engine.command.queryState` 方法

```ts
onActive?: () => boolean;
```

### onDisabled

自定义按钮禁用，默认调用插件 `engine.command.queryEnabled`

```ts
onDisabled?: () => boolean;
```

## 所有插件的默认配置

```ts
[
	['collapse'],
	['undo', 'redo', 'paintformat', 'removeformat'],
	['heading', 'fontfamily', 'fontsize'],
	['bold', 'italic', 'strikethrough', 'underline', 'moremark'],
	['fontcolor', 'backcolor'],
	['alignment'],
	['unorderedlist', 'orderedlist', 'tasklist', 'indent', 'line-height'],
	['link', 'quote', 'hr'],
];
```

这些默认配置详细信息可以在这里找到定义：

React: [https://github.com/yanmao-cc/am-editor/blob/master/packages/toolbar/src/config/toolbar/index.tsx](https://github.com/yanmao-cc/am-editor/blob/master/packages/toolbar/src/config/toolbar/index.tsx)

Vue3: [https://github.com/yanmao-cc/am-editor/blob/master/packages/toolbar-vue/src/config/index.ts](https://github.com/yanmao-cc/am-editor/blob/master/packages/toolbar-vue/src/config/index.ts)

Vue2: [https://github.com/zb201307/am-editor-vue2/blob/main/packages/toolbar/src/config/index.ts](https://github.com/zb201307/am-editor-vue2/blob/main/packages/toolbar/src/config/index.ts)
