# 基础

在学习插件教程外，可以先对插件有一个了解，在 `文档` -> `基础` -> `插件`阅读

所有的插件都必须要继承插件抽象类其中一个，并且实现它。我们可以按照用途来选择一种类型的插件抽象类来继承。下面我们一个一个的来了解它们

## 继承

继承 `Plugin` 抽象类

```ts
import { Plugin } from '@aomao/engine'

export default class extends Plugin {
	...
}
```

## 属性

### `pluginName`

插件名称，只读静态属性

类型：`string`

插件名称是唯一的，不可与传入引擎的所有插件名称重复

```ts
export default class extends Plugin {
	//定义插件名称，它是必须的
	static get pluginName() {
		return '插件名称';
	}
}
```

### `options`

插件的可选项

类型：`T extends PluginOptions = {}` 默认是一个空对象

我们可以给插件传入一个可选项，例如：快捷键

```ts
//定义可选项类型
export type Options = {
	hotkey?: string | Array<string>;
};

export default class extends Plugin<Options> {
	...

	init() {
        //打印传入的可选项 hotkey
		console.log(this.options.hotkey)
	}
}
```

在实例化引擎时，通过 `config` 属性传入插件的可选项

```ts
//实例化引擎
const engine = new Engine(渲染节点, {
	config: {
		插件名称: {
			hotkey: 'test',
		},
	},
});
```

### `editor`

编辑器实例

类型：`EditorInterface`

在插件实例化的时候，会传入编辑器实例。我们可以通过 `this` 访问它

```ts
import { Plugin, isEngine } from '@aomao/engine'

export default class extends Plugin<Options> {
	...

	init() {
		console.log(isEngine(this.editor) ? "引擎" : "阅读器")
	}
}
```

我们可以通过 `isEngine` 判断当前实例化的编辑器是引擎还是阅读器

## 方法

### `init`

在插件初始化时执行，我们可以在这里绑定一些事件或者初始化一些变量

```ts
...
init(){
    if (isEngine(this.editor)) {
        this.editor.on('keydown:enter', event => () => {
            console.log("按下了回车键")
        });
    }
}
...
```

### `queryState`

状态查询，可选

这个方法会被 `editor.command.queryState` 调用。主要用于查询当前光标选区是否有选中当前插件的节点，然后配合 toolbar 显示插件的激活状态或者禁用状态

你也可自定义一些其它任何查询，通过 `editor.command.queryState` 调用，并且传回参数，返回任何你想返回的数据

```ts
/**
* 查询插件状态
* @param args 插件需要的参数
*/
queryState?(...args: any): any;
/**
```

### `execute`

插件执行方法，这是一个抽象方法，必须要实现它

这个方法会被 `editor.command.execute` 调用

```ts
...
execute(message: string) {
    console.log(`Hi, ${message}`)
}
...
```

通过 `editor.command.execute` 调用

```ts
editor.command.execute('插件名称', '小明');
//输出 Hi, 小明
```

### `hotkey`

插件热键绑定，可选。

该返回需要匹配的组合键字符，如 mod+b，匹配成功即执行插件，还可以带上插件执行所需要的参数，多个参数以数组形式返回{key:"mod+b",args:[]}

`mod` 表示 windows 下的 `ctrl` 键，mac 下的 `command`(⌘) 键

我们使用[is-hotkey](https://github.com/ianstormtaylor/is-hotkey)来匹配热键是否命中，更多使用方法请去[is-hotkey](https://github.com/ianstormtaylor/is-hotkey)查看

我们也可以直接使用 isHotkey 来判断是否命中

```ts
import { isHotkey, Plugin } from '@aomao/engine'

//定义可选项类型
export type Options = {
	hotkey?: string | Array<string>;
};

export default class extends Plugin<Options> {
	...
	hotkey(event?: KeyboardEvent) {
        //使用 hotkey 判断
        return event && isHotkey(event, this.options.hotkey || '')
        //或者直接返回可选项配置的快捷键
		return this.options.hotkey || '';
        //还可以返回多组快捷键
        return ["mod+a","mod+b"]
	}
}
```

方法签名

```ts
hotkey?(event?: KeyboardEvent,): string | { key: string; args: any } | Array<{ key: string; args: any }> | Array<string>;
```

在热键命中后会执行调用 `editor.command.execute` 命令执行插件，参数也会一起携带

### `waiting`

等待插件完成某些动作，可选

在使用异步获取编辑器值的时候 `engine.getValueAsync` ，如果插件操作还未处理完成，会等待插件完成动作后再返回值。例如，图片正处于上传状态中

```ts
async waiting?(): Promise<void>;
```

### `完整例子`

```ts
import { Plugin } from '@aomao/engine';

export type Options = {
	hotkey?: string | Array<string>;
};

export default class extends Plugin {
	static get pluginName() {
		return '插件名称';
	}

	init() {
		console.log(isEngine(this.editor) ? '引擎' : '阅读器');
	}

	execute(message: string) {
		console.log(`Hi, ${message}`);
	}

	hotkey() {
		return this.options.hotkey || '';
	}
}
```
