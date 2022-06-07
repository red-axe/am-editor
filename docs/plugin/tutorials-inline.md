# Inline plugin

In-line node plugin

Usually used in scenarios where the text is individually styled and cannot be nested

For this type of plugin, we need to inherit the `InlinePlugin` abstract class. The `InlinePlugin` abstract class extends some properties and methods on the basis of inheriting the `ElementPlugin` abstract class. So the plugin that inherits `InlinePlugin` also has all the attributes and methods of the `ElementPlugin` abstract class

```ts
import { InlinePlugin } from '@aomao/engine';

export default class extends InlinePlugin {
	static get pluginName() {
		return 'inline-plugin';
	}

	readonly tagName = 'code';

	readonly style = {
		border: '1px solid #000000',
	};
}
```

After executing `editor.command.execute("inline-plugin")`, the text at the cursor position will be wrapped by a code label with a black border color

## Inheritance

Inherit the `InlinePlugin` abstract class

```ts
import {InlinePlugin} from'@aomao/engine'

export default class extends InlinePlugin {
...
}
```

## Attributes

### `tagName`

Label name, must

The label name here is the same as the label name in the parent class `ElementPlugin`, except that the label name is one of the necessary attributes of the `InlinePlugin` plugin

## Method

### `init`

Initialization, optional

The `InlinePlugin` plugin has implemented the `init` method, if you need to use it, you need to manually call it again. Otherwise there will be unexpected situations

```ts
export default class extends InlinePlugin {
...
    init(){
        super.init()
    }
}
```

### `execute`

Execute plugin commands, optional

The `InlinePlugin` plugin has implemented the `execute` method, if you need to use it, you can override this method

### `queryState`

Query plugin status command, optional

The `InlinePlugin` plugin has implemented the `queryState` method, if you need to use it, you can override this method

### `schema`

Set the `schema` rule of this inline plugin, optional

The `ElementPlugin` plugin has implemented the `schema` method, which will automatically set the rules according to the `tagName` `style` `attributes`.

If you need to use it, you can override this method or use super.schema() to call this method again

### `isTrigger`

Whether to trigger the execution to add the current inline package, otherwise the package with the current inline label will be removed, optional

By default, the `InlinePlugin` plugin will call `editor.command.queryState` to query the current plugin state (the node selected within the current cursor matches the node set by the current inline plugin) and the currently set `tagName` `style` `attributes` In comparison, if they are consistent, the effect of removing the current inline plugin node will be executed, otherwise the effect of the current inline plugin node will be added.

If you implement the isTrigger method, you need to determine whether to cancel or add the effect of the current inline plugin node.

```ts
/**
 * Whether to trigger the execution to increase the current inline label package, otherwise it will remove the current inline label package
 * @param args is the parameter passed in when calling command.execute to execute the plugin
 */
isTrigger?(...args: any): boolean;
```
