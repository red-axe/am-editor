# Schema

For a complex DOM tree, we need to use a set of rules to constrain the DOM tree structure, including node nesting, node attributes, and some specific behaviors.

We can make rules for a single node, of course, we can also make global rules for the three node types `mark` `inline` `block`. `card` belongs to a special type of us, in essence, they can also be classified as `inline` and `block` types

If a node is not in the constraint rule, it will be filtered out, including attributes and styles. If you need this attribute, then it must appear in the rule, otherwise it will not be retained

## Settings

Single rule type: `SchemaRule` Global rule type: `SchemaGlobal`

A rule contains the following attributes:

-   `name` DOM node name, optional value
-   `type` type, `mark` `inline` `block`. In the case of no node name, global rules will be set according to type. Must value
-   The `attributes` attribute, which sets the node attribute rules, is an object. Optional value
-   Whether `isVoid` is an empty node, like br, img and other tags, it is impossible to set child nodes, including text. Optional value

example:

```ts
//Single node rule
{
    name:'p',
    type:'block',
},
{
    name:'span',
    type:'mark',
    attributes: {
        style: {
            color: "@color"
        }
    }
}
//Global rules by type
{
    type: "block",
    attributes: {
        id: "*"
    }
}
```

## Additional rules for block-level nodes

In addition to the general rules, we have also customized two additional attributes for block-level nodes

```ts
{
    ...
    allowIn?: Array<string>;
canMerge?: boolean;
}
```

-   `allowIn` allows the name of the block-level node that the node can be put into, by default their value is `$root` (editor root node). This is usually used in nested nodes, for example: ul li unordered list has a li child node, which is also a block-level node on its own line. If a block-level node does not specify a block-level node that can be placed, it will be filtered out
-   `canMerge` Whether two adjacent block-level nodes can be merged. For example: quoting the plugin blockquote, when two blockquote nodes are adjacent, their child nodes will be merged into one blockquote node, because it is meaningless for them to exist separately next to each other, but it will increase the complexity of the document.

Type: `SchemaBlock`

## attributes value

The attribute value type `SchemaValue`, which consists of `SchemaValueObject` and `SchemaValueBase`

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

We can see that the attribute value can be configured very flexibly and supports:

-   Regular expression
-   Array
-   Single character
-   Function custom verification
-   `@number` number, number
-   `@length` length, including the pixel value of the pixel band unit, for example: 10px
-   `@color` can determine whether the attribute value is a "color". For example: #ffffff rgb(0,0,0,0)
-   `@ulr` determines whether the attribute value is a link
-   Any value of `*`, including undefined, null and other empty values ​​can pass the validation

In addition to the value determination, by default, these attributes are optional after they are set. We may also need to formulate necessary attributes for nodes to distinguish the difference between the nodes with the same name and the type of plugin they belong to, for example:

A style node representing the foreground color

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

Style nodes representing foreground and background colors

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

The names of these two style nodes are span and both contain color styles. Because the default attributes are optional attributes, we will ignore these optional attributes when determining a node. The rest of the names are also the same, which will cause Logic errors, many unexpected situations occurred.

So here we need to use the value of the `SchemaValueObject` type to show the uniqueness of these two nodes. These marked attributes are also the most important feature points of the node.

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

## Default rules

The engine divides the nodes according to functions and characteristics `mark` `inline` `block` `card`, in order to meet the normal operation of these divided nodes and the needs of the engine, we have formulated some default rules, which will be customized with us The rules are combined and used together, so it is not recommended to customize the rules to overwrite them

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
