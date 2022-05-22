# Mark 插件

样式节点插件

通常用于文本修饰，例如，加粗、斜体、下划线、背景色等等

此类插件我们需要继承 `MarkPlugin` 抽象类，`MarkPlugin` 抽象类在继承 `ElementPlugin` 抽象类的基础上扩展了一些属性和方法。所以继承 `MarkPlugin` 的插件也同样拥有`ElementPlugin`抽象类的所有属性和方法

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

执行 `editor.command.execute("mark-plugin")` 后，光标位置的文本就会被一个 字体大小为 18px 字体颜色为 red 的 span 标签包裹了

## 继承

继承 `MarkPlugin` 抽象类

```ts
import { MarkPlugin } from '@aomao/engine'

export default class extends MarkPlugin {
	...
}
```

## 属性

### `tagName`

标签名称，必须

此处的标签名称与父类`ElementPlugin`中的标签名称作用是一致的，只不过标签名称是 `MarkPlugin` 插件必要的属性之一

### `copyOnEnter`

回车后是否复制 mark 效果，默认为 true，允许

类型：`string`

例如：
`<p><strong>abc<cursor /></strong></p>` cursor 标签代表当前光标位置，按下回车键后会出现新行：

如果允许复制：`<p><strong><cursor /></strong></p>`，否则 `<p><cursor /></p>`

### `followStyle`

是否跟随样式，默认为 true，可选

设置为不跟随后，在此标签后输入将不在有此 mark 插件效果，光标重合状态下也无非执行此 mark 插件取消命令。例如：

`<strong>abc<cursor /></strong>` 或者 `<strong><cursor />abc</strong>` cursor 标签代表当前光标位置

在此处输入，会在 strong 节点后输入 或者 strong 节点前输入

`<strong>ab<cursor />c</strong>` 如果光标在样式标签中间，还是会继续跟随样式效果

`<strong>abc<cursor /></strong><em><strong>123</strong></em>` 如果样式标签后方紧接着还有 strong 节点样式效果，那么还是会继续跟随样式，在 strong abc 后面完成输入

### `combineValueByWrap`

在包裹`schema`判定为相同 mark 插件节点，并且属性名称一致，值不一致的的时候，是合并前者的值到新的节点还是移除前者 mark 节点，默认 false 移除，可选

mark 节点样式(style)的值将始终覆盖掉

`<span a="1">abc</span>` 在使用 `<span a="2"></span>` 包裹 a=1 的 mark 节点时。如果合并值，就是 `<span a="1,2">abc</span>` 否则就是 `<span a="2">abc</span>`

## 方法

### `init`

初始化，可选

`MarkPlugin` 插件已经实现了`init`方法，如果需要使用，需要手动再次调用。否则会出现意料外的情况

```ts
export default class extends MarkPlugin {
	...
    init(){
        super.init()
    }
}
```

### `execute`

执行插件命令，可选

`MarkPlugin` 插件已经实现了`execute`方法，如果需要使用，可以重写此方法

### `queryState`

查询插件状态命令，可选

`MarkPlugin` 插件已经实现了`queryState`方法，如果需要使用，可以重写此方法

### `schema`

设置此 mark 插件的`schema`规则，可选

`ElementPlugin` 插件已经实现了`schema`方法，会自动根据 `tagName` `style` `attributes` 设置规则。

如果需要使用，可以重写此方法或者使用 super.schema()再次调用此方法

### `isTrigger`

是否触发执行增加当前 mark 标签包裹，否则将移除当前 mark 标签的包裹，可选

默认情况下，`MarkPlugin` 插件会调用 `editor.command.queryState` 查询当前插件状态（当前光标范围内选中的节点符合当前 mark 插件设置的节点）与当前设置的`tagName` `style` `attributes`比较，一致的情况下会执行移除当前 mark 插件节点的效果，否则会加上当前 mark 插件节点的效果。

如果有实现 `isTrigger` 方法就需要自己判定当前是取消还是加上当前 mark 插件节点的效果

```ts
/**
 * 是否触发执行增加当前mark标签包裹，否则将移除当前mark标签的包裹
 * @param args 在调用 command.execute 执行插件传入时的参数
 */
isTrigger?(...args: any): boolean;
```
