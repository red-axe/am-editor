# Schema

对于复杂的 DOM 树，我们需要使用一套规则来约束 DOM 树结构，包括节点嵌套、节点属性、以及一些特定的行为。

我们可以对单个节点制定规则，当然也可以针对三种节点类型`mark` `inline` `block`制定全局规则。`card` 属于我们一种特殊类型，本质上他们也可以归纳为 `inline` 和 `block` 类型

如果一个节点不在约束规则中，那么它将会被过滤掉，包括属性、样式，如果你需要这个属性，那么它一定要出现在规则中，否则都不会被保留

## 设置

单个规则类型：`SchemaRule` 全局规则类型：`SchemaGlobal`

一个规则的包含以下属性：

-   `name` DOM 节点名称，可选值
-   `type` 类型，`mark` `inline` `block`。在不制定节点名称情况下，将根据 type 设置全局规则。必须值
-   `attributes` 属性，设置节点属性规则，是一个对象。可选值
-   `isVoid` 是否是空节点，类似 br、img 等标签，是无法设置子节点的，包括文本。可选值

例子：

```ts
//单个节点规则
{
    name: 'p',
    type: 'block',
},
{
    name: 'span',
    type: 'mark',
    attributes: {
        style: {
            color: "@color"
        }
    }
}
//按类型全局规则
{
    type: "block",
    attributes: {
        id: "*"
    }
}
```

## 块级节点额外规则

在通用规则之外，我们还为块级节点额外定制了两个属性

```ts
{
    ...
    allowIn?: Array<string>;
	canMerge?: boolean;
}
```

-   `allowIn` 允许节点可以放入的块级节点名称，默认他们的值为 `$root`(编辑器根节点)。这通常在嵌套节点中使用，例如：ul li 无序列表下有 li 子节点，它也是独占一行的属于块级节点。如果一个块级节点没有指定可放入的块级节点，那么它将会被过滤掉
-   `canMerge` 相邻的两个块级节点是否可以合并。例如：引用插件 blockquote ，在两个 blockquote 节点处于相邻状态时，它们的子节点会被合并到一个 blockquote 节点下，因为它们相邻单独存在是没有意义的，反而还会增加文档的复杂性

类型：`SchemaBlock`

## attributes 值

属性值类型 `SchemaValue`，它由 `SchemaValueObject` 和 `SchemaValueBase` 组成

```ts
export type SchemaValueBase =
	| RegExp
	| Array<string>
	| string
	| ((propValue: string) => boolean)
	| '@number'
	| '@length'
	| '@color'
	| '@url'
	| '*';

export type SchemaValueObject = {
	required: boolean;
	value: SchemaValueBase;
};
```

我们可以看到属性值是可以很灵活配置的，支持：

-   正则表达式
-   数组
-   单个字符
-   函数自定义验证
-   `@number` 数量，数字
-   `@length` 长度，包括像素带单位的像素值，例如：10px
-   `@color` 可以判断该属性值是否是一个“颜色”。例如：#ffffff rgb(0,0,0,0)
-   `@ulr` 判断该属性值是否是一个链接
-   `*` 任意值，包括 undefined、null 等空值都可以通过效验

除了值的判定外，默认情况下，这些属性设置后都是可选属性，我们还可能需要为节点制定必要的属性，以区分相通名称节点之间的差别和所属插件类型判别，例如：

表示前景色的样式节点

```html
<span style="color:#ffffff">Hello</span>
```

```ts
{
    name: "span",
    type: "mark",
    attributes: {
        style:{
            color: "@color"
        }
    }
}
```

表示前景色和背景色的样式节点

```html
<span style="color:#ffffff;background-color:#000000">Hello</span>
```

```ts
{
    name: "span",
    type: "mark",
    attributes: {
        style:{
            color: "@color",
            "background-color": "@color"
        }
    }
}
```

这两个样式节点名称都是 span 而且都包含 color 样式，因为默认属性都是可选属性，所以我们在判定一个节点时会忽略这些可选属性，剩下的名称也是一样的，这样就会造成逻辑错误，出现很多意外情况。

所以这里我们需要使用 `SchemaValueObject` 类型的值，来表明这两个节点的唯一性，这些标明的属性也是节点最主要的特征点

```ts
{
    name: "span",
    type: "mark",
    attributes: {
        style:{
            color: {
                required: true,
                value:"@color"
            }
        }
    }
}

{
    name: "span",
    type: "mark",
    attributes: {
        style:{
            color: {
                required: true,
                value:"@color"
            },
            "background-color": {
                required: true,
                value:"@color"
            }
        }
    }
}
```

## 默认规则

引擎按照功能和特性对节点进行了划分 `mark` `inline` `block` `card`，为了满足这些划分后的节点正常工作以及引擎需要，我们制定了一些默认规则，这些规则会和我们自定义规则合并后一起使用，所以不建议自定义规则去覆盖它们

```ts
import { SchemaGlobal, SchemaRule } from '../types';
import { CARD_KEY, CARD_TYPE_KEY, CARD_VALUE_KEY } from './card';
import { ANCHOR, CURSOR, FOCUS } from './selection';

const defualtSchema: Array<SchemaRule | SchemaGlobal> = [
	{
		name: 'p',
		type: 'block',
	},
	{
		name: 'br',
		type: 'inline',
		isVoid: true,
	},
	{
		name: ANCHOR,
		type: 'inline',
		isVoid: true,
	},
	{
		name: FOCUS,
		type: 'inline',
		isVoid: true,
	},
	{
		name: CURSOR,
		type: 'inline',
		isVoid: true,
	},
	{
		type: 'block',
		attributes: {
			'data-id': '*',
		},
	},
	{
		name: 'card',
		type: 'inline',
		attributes: {
			name: {
				required: true,
				value: /\w+/,
			},
			type: {
				required: true,
				value: 'inline',
			},
			value: '*',
		},
	},
	{
		name: 'span',
		type: 'inline',
		attributes: {
			[CARD_KEY]: {
				required: true,
				value: /\w+/,
			},
			[CARD_TYPE_KEY]: {
				required: true,
				value: 'inline',
			},
			[CARD_VALUE_KEY]: '*',
			class: '*',
			contenteditable: '*',
		},
	},
	{
		name: 'card',
		type: 'block',
		attributes: {
			name: {
				required: true,
				value: /\w+/,
			},
			type: {
				required: true,
				value: 'block',
			},
			value: '*',
		},
	},
	{
		name: 'div',
		type: 'block',
		attributes: {
			[CARD_KEY]: {
				required: true,
				value: /\w+/,
			},
			[CARD_TYPE_KEY]: {
				required: true,
				value: 'block',
			},
			[CARD_VALUE_KEY]: '*',
			class: '*',
			contenteditable: '*',
		},
	},
];

export default defualtSchema;
```
