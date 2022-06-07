# Basic

In addition to the plugin tutorial, you can first have an understanding of the plugin, read it in `Document` -> `Basic` -> `Plugin`

All plugins must inherit one of the plugin abstract classes and implement it. We can choose a type of plugin abstract class to inherit according to its purpose. Let's understand them one by one

## Inheritance

Inherit the `Plugin` abstract class

```ts
import {Plugin} from'@aomao/engine'

export default class extends Plugin {
...
}
```

## Attributes

### `pluginName`

Plugin name, read-only static property

Type: `string`

The plugin name is unique and cannot be repeated with all plugin names passed in to the engine

```ts
export default class extends Plugin {
	//Define the plugin name, it is required
	static get pluginName() {
		return 'plugin name';
	}
}
```

### `options`

Plugin options

Type: `T extends PluginOptions = {}` The default is an empty object

We can pass in an option to the plugin, for example: shortcut key

```ts
//Define the optional type
export type Options = {
hotkey?: string | Array<string>;
};

export default class extends Plugin<Options> {
...

init() {
        //Print the incoming optional hotkey
console.log(this.options.hotkey)
}
}
```

When instantiating the engine, pass in the options of the plugin through the `config` attribute

```ts
//Instantiate the engine
const engine = new Engine(render node, {
config: {
Plugin name: {
hotkey:'test',
},
},
});
```

### `editor`

Editor example

Type: `EditorInterface`

When the plugin is instantiated, the editor instance will be passed in. We can access it through `this`

```ts
import {Plugin, isEngine} from'@aomao/engine'

export default class extends Plugin<Options> {
...

init() {
console.log(isEngine(this.editor)? "Engine": "Reader")
}
}
```

We can use `isEngine` to determine whether the currently instantiated editor is an engine or a reader

## Method

### `init`

Executed when the plugin is initialized, we can bind some events or initialize some variables here

```ts
...
init(){
    if (isEngine(this.editor)) {
        this.editor.on('keydown:enter', event => () => {
            console.log("Enter key was pressed")
        });
    }
}
...
```

### `queryState`

Status query, optional

This method will be called by `editor.command.queryState`. Mainly used to query whether the current cursor selection area has the node of the current plugin selected, and then cooperate with the toolbar to display the active or disabled state of the plugin

You can also customize any other query, call it through `editor.command.queryState`, and pass back parameters to return any data you want to return

```ts
/**
* Query plugin status
* @param args parameters required by the plugin
*/
queryState?(...args: any): any;
/**
```

### `execute`

Plugin execution method, this is an abstract method, it must be implemented

This method will be called by `editor.command.execute`

```ts
...
execute(message: string) {
    console.log(`Hi, ${message}`)
}
...
```

Called by `editor.command.execute`

```ts
editor.command.execute('plugin name', 'xiaoming');
//Output Hi, Xiao Ming
```

### `hotkey`

Plugin hotkey binding, optional.

This returns the key combination characters that need to be matched, such as mod+b. If the match is successful, the plugin will be executed. You can also bring the parameters required for the plugin execution. Multiple parameters are returned in the form of an array {key:"mod+b",args:[ ]}

`mod` means the `ctrl` key under windows, and the `command` (⌘) key under mac

We use [is-hotkey](https://github.com/ianstormtaylor/is-hotkey) to match whether the hotkey is hit or not. For more usage methods, please go to [is-hotkey](https://github.com/ianstormtaylor/is-hotkey) view

We can also directly use isHotkey to determine whether it is hit

```ts
import {isHotkey, Plugin} from'@aomao/engine'

//Define the optional type
export type Options = {
hotkey?: string | Array<string>;
};

export default class extends Plugin<Options> {
...
hotkey(event?: KeyboardEvent) {
        //Use hotkey to judge
        return event && isHotkey(event, this.options.hotkey ||'')
        //Or directly return to the shortcut keys for optional configuration
return this.options.hotkey ||'';
        //You can also return to multiple sets of shortcut keys
        return ["mod+a","mod+b"]
}
}
```

Method signature

```ts
hotkey?(event?: KeyboardEvent,): string | {key: string; args: any} | Array<{ key: string; args: any }> | Array<string>;
```

After the hotkey is hit, it will execute the call `editor.command.execute` command to execute the plugin, and the parameters will also be carried

### `waiting`

Wait for the plugin to complete certain actions, optional

When using asynchronously to get the editor value `engine.getValueAsync`, if the plugin operation has not been completed, it will wait for the plugin to complete the action before returning the value. For example, the image is being uploaded

```ts
async waiting?(): Promise<void>;
```

### `Complete example`

```ts
import { Plugin } from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
};

export default class extends Plugin {
	static get pluginName() {
		return 'plugin name';
	}

	init() {
		console.log(isEngine(this.editor) ? 'Engine' : 'Reader');
	}

	execute(message: string) {
		console.log(`Hi, ${message}`);
	}

	hotkey() {
		return this.options.hotkey || '';
	}
}
```
