# Node plugin

It is usually used in scenes that use node wrapping text to be modified. For example, `<strong>abc</strong>` `<h2>abc</h2>` uses a set of tags to wrap text or nodes

Or used to set all node styles. For example, indentation, `<p style="padding-left:10px"></p>`, `<h2 style="padding-left:10px"></h2>`, each block-level node can be set Indentation style

A tag is composed of `tag name`, `attribute`, and `style`. These three elements will eventually be added to the `schema` rule management. `schema` is a list of constraints of the DOM tree. If the tag, style, and attribute do not exist`In the schema` rules, all will be filtered and discarded

The `ElementPlugin` plugin will automatically compose a node of the `tag name`, `attribute`, and `style` we set, and automatically add it to the `schema` rule

For this type of plugin, we need to inherit the `ElementPlugin` abstract class. The `ElementPlugin` abstract class extends some properties and methods on the basis of inheriting the `Plugin` abstract class. So the plugin that inherits `ElementPlugin` also has all the attributes and methods of the `Plugin` abstract class

## Inheritance

Inherit the `ElementPlugin` abstract class

```ts
import {ElementPlugin} from'@aomao/engine'

export default class extends ElementPlugin {
...
}
```

## Attributes

Because `ElementPlugin` inherits the abstract class of `Plugin`, so don't forget `pluginName`~

### `tagName`

Label name, optional

The label name used to wrap the text or node

If there is a setting, it will be automatically added to the `schema` rule management

```ts
export default class extends ElementPlugin {
...
    readonly tagName = "span"
}
```

### `style`

Label style, optional

It is used to set the style of the current label. If the plugin does not set the label name, the style will be used as the style of the global label. The label `schema` with this style will be judged to be legal and the style will be retained.

If there is a setting, it will be automatically added to the `schema` rule management

Example:

```ts
export default class extends ElementPlugin {
...
    readonly style = {
        "font-weight": "bold"
    }
}
```

In some cases we need a dynamic value, such as font size, `<span style="font-size:14px"></span>` 14px is a fixed value, if you want to replace it with `every time you execute the plugin The dynamic value passed in by editor.command.execute`, then it is necessary to use the variable representation

This variable is derived from the parameters of the `editor.command.execute` command, and the variable name is determined by `@var` + the index of the location of the parameter. `editor.command.execute("plugin name","parameter 0","parameter 1","parameter 2",...)` The corresponding variable name is `@var0` `@var1` `@var2`. ..

```ts
export default class extends ElementPlugin {
...
    readonly style = {
        "font-size": "@var0"
    }
}
```

In addition to dynamically setting the value, we can also format the value obtained by the node. For example, when pasting some copied text, the font size unit is pt, and we need to convert it to the familiar px. In this way, when executing `editor.command.queryState`, we can easily get the expected value

```ts
export default class extends ElementPlugin {
...
    readonly style = {
        'font-size': {
value:'@var0',
format: (value: string) => {
value = this.convertToPX(value);
return value;
},
},
    }
}
```

### `attributes`

The attributes of the label, optional

The setting and usage are the same as `style`

```ts
export default class extends ElementPlugin {
...
    readonly attributes = {
        "data-attr": "@var0"
    }
}
```

Strictly speaking, `style` is also an attribute on the attribute tag, but the `style` attribute is more commonly used, and it appears in the form of key-value pairs. It is easier to understand and manage if listed separately. Eventually, when adding the `schema`, the `style` attribute will be merged into the `attributes` field.

### `variable`

Variable rules, optional

If dynamic variables are used in the values ​​of `style` or `attributes`, then the variables must be stated in rules. Otherwise, `@var0`, `@var1` will be treated as fixed values ​​in the `schema`, and non-conformities will be filtered out

```ts
variable = {
	'@var0': {
		required: true,
		value: /[\d\.]+(pt|px)$/,
	},
};
```

For `@var0` we used the following rules to indicate

-   `required` required value
-   `value` regular expression, you can use `pt` or `px` as the unit value

For more information about the setting of `schema` rules, please read in `Document` -> `Basic` -> `Structure`

## Method

### `init`

Initialization, optional

The `ElementPlugin` plugin has implemented the `init` method, if you need to use it, you need to manually call it again. Otherwise there will be unexpected situations

```ts
export default class extends ElementPlugin {
...
    init(){
        super.init()
    }
}
```

### `setStyle`

Apply the current plugin `style` attribute to a node

```ts
/**
 * Apply the current plugin style attribute to the node
 * @param node The node that needs to be set
 * @param args If there is a dynamic value in `style`, pass it here as a parameter, and you need to pay attention to the order of the parameters
 */
setStyle(node: NodeInterface | Node, ...args: Array<any>): void
```

### `setAttributes`

Apply the current plugin `attributes` attribute to a node

```ts
/**
 * Apply the attributes of the current plugin to the node
 * @param node node
 * @param args If there is a dynamic value in `attributes`, pass it in as a parameter here, and you need to pay attention to the order of the parameters
 */
setAttributes(node: NodeInterface | Node, ...args: Array<any>): void;
```

### `getStyle`

Get the style of a node that meets the current plugin rules

```ts
/**
 * Get the style of the node that meets the current plugin rules
 * @param node node
 * @returns key-value pairs of style name and style value
 */
getStyle(node: NodeInterface | Node): {[key: string]: string };
```

### `getAttributes`

Get the attributes of the node that comply with the current plugin rules

```ts
/**
 * Get the attributes of the node that comply with the current plugin rules
 * @param node node
 * @returns attribute name and attribute value key-value pair
 */
getAttributes(node: NodeInterface | Node): {[key: string]: string };
```

### `isSelf`

Check whether the current node meets the rules set by the current plugin

```ts
/**
 * Check whether the current node meets the rules set by the current plugin
 * @param node node
 * @returns true | false
 */
isSelf(node: NodeInterface | Node): boolean;
```

### `queryState`

Query plugin status command, optional

```ts
queryState() {
    //Not an engine
    if (!isEngine(this.editor)) return;
    const {change} = this.editor;
    //If there are no attributes and style restrictions, directly query whether the current label name is included
    if (!this.style && !this.attributes)
        return change.marks.some(node ​​=> node.name === this.tagName);
    //Get the value collection within the attribute and style limit
    const values: Array<string> = [];
    change.marks.forEach(node ​​=> {
        values.push(...Object.values(this.getStyle(node)));
        values.push(...Object.values(this.getAttributes(node)));
    });
    return values.length === 0? undefined: values;
}
```

### `execute`

Execute plugin commands, need to be implemented

Example of adding a mark tag:

```ts
execute(...args) {
    //Not an engine
    if (!isEngine(this.editor)) return;
    const { change} = this.editor;
    //Instantiate a label name node set by the current plugin
    const markNode = $(`<${this.tagName} />`);
    //Set the style set by the current plugin for the node. If there is a dynamic value, the dynamic parameter will be automatically combined
    this.setStyle(markNode, ...args);
    //Set the attributes set by the current plugin to the node, if there are dynamic values, automatically combine dynamic parameters
    this.setAttributes(markNode, ...args);

    const {mark} = this.editor;
    //Query whether the current cursor position meets the settings of the current plugin
    const trigger = !this.queryState()
    if (trigger) {
        //Wrap the mark style label node set by the current plugin at the cursor
        mark.wrap(markNode);
    } else {
        //Remove the mark style label node set by the current plugin at the cursor
        mark.unwrap(markNode);
    }
}
```

### `schema`

Get the rules generated by the attributes and styles set by the plugin. These rules will be added to the `schema` object

```ts
/**
  * Get the rules generated by the attributes and styles set by the plugin
  */
schema(): SchemaRule | SchemaGlobal | Array<SchemaRule>;
```
