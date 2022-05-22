# Inline 插件

行内节点插件

通常用于文本单独样式、不可嵌套的场景下

此类插件我们需要继承 `InlinePlugin` 抽象类，`InlinePlugin` 抽象类在继承 `ElementPlugin` 抽象类的基础上扩展了一些属性和方法。所以继承 `InlinePlugin` 的插件也同样拥有`ElementPlugin`抽象类的所有属性和方法

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

执行 `editor.command.execute("inline-plugin")` 后，光标位置的文本就会被一个边框颜色为黑色的 code 标签包裹了

## 继承

继承 `InlinePlugin` 抽象类

```ts
import { InlinePlugin } from '@aomao/engine'

export default class extends InlinePlugin {
	...
}
```

## 属性

### `tagName`

标签名称，必须

此处的标签名称与父类`ElementPlugin`中的标签名称作用是一致的，只不过标签名称是 `InlinePlugin` 插件必要的属性之一

## 方法

### `init`

初始化，可选

`InlinePlugin` 插件已经实现了`init`方法，如果需要使用，需要手动再次调用。否则会出现意料外的情况

```ts
export default class extends InlinePlugin {
	...
    init(){
        super.init()
    }
}
```

### `execute`

执行插件命令，可选

`InlinePlugin` 插件已经实现了`execute`方法，如果需要使用，可以重写此方法

### `queryState`

查询插件状态命令，可选

`InlinePlugin` 插件已经实现了`queryState`方法，如果需要使用，可以重写此方法

### `schema`

设置此 inline 插件的`schema`规则，可选

`ElementPlugin` 插件已经实现了`schema`方法，会自动根据 `tagName` `style` `attributes` 设置规则。

如果需要使用，可以重写此方法或者使用 super.schema()再次调用此方法

### `isTrigger`

是否触发执行增加当前 inline 包裹，否则将移除当前 inline 标签的包裹，可选

默认情况下，`InlinePlugin` 插件会调用 `editor.command.queryState` 查询当前插件状态（当前光标范围内选中的节点符合当前 inline 插件设置的节点）与当前设置的`tagName` `style` `attributes`比较，一致的情况下会执行移除当前 inline 插件节点的效果，否则会加上当前 inline 插件节点的效果。

如果有实现 `isTrigger` 方法就需要自己判定当前是取消还是加上当前 inline 插件节点的效果

```ts
/**
 * 是否触发执行增加当前inline标签包裹，否则将移除当前inline标签的包裹
 * @param args 在调用 command.execute 执行插件传入时的参数
 */
isTrigger?(...args: any): boolean;
```
