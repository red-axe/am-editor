# Mark plugin

Style node plugin

Usually used for text modification, for example, bold, italic, underline, background color, etc.

For this type of plugin, we need to inherit the `MarkPlugin` abstract class. The `MarkPlugin` abstract class extends some properties and methods on the basis of inheriting the `ElementPlugin` abstract class. So the plugin that inherits `MarkPlugin` also has all the attributes and methods of the `ElementPlugin` abstract class

```ts
import { MarkPlugin } from '@aomao/engine';

export default class extends MarkPlugin {
	static get pluginName() {
		return 'mark-plugin';
	}

	readonly tagName = 'span';

	readonly style = {
		'font-size': '18px',
		color: 'red',
	};
}
```

After executing `editor.command.execute("mark-plugin")`, the text at the cursor position will be wrapped by a span tag with a font size of 18px and a font color of red

## Inheritance

Inherit the `MarkPlugin` abstract class

```ts
import {MarkPlugin} from'@aomao/engine'

export default class extends MarkPlugin {
...
}
```

## Attributes

### `tagName`

Label name, must

The tag name here is the same as the tag name in the parent class `ElementPlugin`, except that the tag name is one of the necessary attributes of the `MarkPlugin` plugin

### `copyOnEnter`

Whether to copy the mark effect after carriage return, the default is true, allowing

Type: `string`

E.g:
`<p><strong>abc<cursor /></strong></p>` The cursor tag represents the current cursor position, and a new line will appear after pressing the Enter key:

If copying is allowed: `<p><strong><cursor /></strong></p>`, otherwise `<p><cursor /></p>`

### `followStyle`

Whether to follow the style, the default is true, optional

After setting to not follow, input after this label will no longer have the mark plugin effect, and the mark plugin cancel command will be executed when the cursor is overlapped. E.g:

`<strong>abc<cursor /></strong>` or `<strong><cursor />abc</strong>` The cursor tag represents the current cursor position

Enter here, it will be entered after the strong node or before the strong node

`<strong>ab<cursor />c</strong>` If the cursor is in the middle of the style tag, it will continue to follow the style effect

`<strong>abc<cursor /></strong><em><strong>123</strong></em>` If there is a strong node style effect immediately after the style tag, then it will continue to follow the style. Complete the input after strong abc

### `combineValueByWrap`

When the package `schema` is judged to be the same mark plugin node, and the attribute names are the same, and the values ​​are inconsistent, whether to merge the former value to the new node or remove the former mark node, the default is false to remove, optional

The value of mark node style (style) will always be overwritten

`<span a="1">abc</span>` When using `<span a="2"></span>` to wrap the mark node of a=1. If the combined value is `<span a="1,2">abc</span>` otherwise it is `<span a="2">abc</span>`

## Method

### `init`

Initialization, optional

The `MarkPlugin` plugin has implemented the `init` method, if you need to use it, you need to manually call it again. Otherwise there will be unexpected situations

```ts
export default class extends MarkPlugin {
...
    init(){
        super.init()
    }
}
```

### `execute`

Execute plugin commands, optional

The `MarkPlugin` plugin has implemented the `execute` method, if you need to use it, you can override this method

### `queryState`

Query plugin status command, optional

The `MarkPlugin` plugin has implemented the `queryState` method, if you need to use it, you can override this method

### `schema`

Set the `schema` rule of this mark plugin, optional

The `ElementPlugin` plugin has implemented the `schema` method, which will automatically set the rules according to the `tagName` `style` `attributes`.

If you need to use it, you can override this method or use super.schema() to call this method again

### `isTrigger`

Whether to trigger the execution to add the current mark label package, otherwise it will remove the current mark label package, optional

By default, the `MarkPlugin` plugin will call `editor.command.queryState` to query the current plugin state (the node selected within the current cursor area matches the node set by the current mark plugin) and the currently set `tagName` `style` `attributes` In comparison, if they are consistent, the effect of removing the current mark plugin node will be executed, otherwise the effect of the current mark plugin node will be added.

If you implement the isTrigger method, you need to determine whether to cancel or add the effect of the current mark plugin node.

```ts
/**
 * Whether to trigger the execution to increase the current mark label package, otherwise it will remove the current mark label package
 * @param args is the parameter passed in when calling command.execute to execute the plugin
 */
isTrigger?(...args: any): boolean;
```
