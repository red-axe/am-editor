# 节点插件

通常用于使用节点包裹文本加以修饰的场景。例如，`<strong>abc</strong>` `<h2>abc</h2>` 使用一组标签包裹文本或者节点

或者用于设置所有的节点样式。例如缩进，`<p style="padding-left:10px"></p>`，`<h2 style="padding-left:10px"></h2>`，每个块级节点都可以设置缩进样式

一个标签由 `标签名称`、`属性`、`样式` 组成，这三要素最终都会加入 `schema` 规则管理里面，`schema` 是 DOM 树的约束条件列表，标签、样式、属性如果不存在 `schema` 规则里面，都会被过滤遗弃

`ElementPlugin` 插件会把我们设置的`标签名称`、`属性`、`样式`自动组成一个节点，并自动加入到`schema`规则里面

此类插件我们需要继承 `ElementPlugin` 抽象类，`ElementPlugin` 抽象类在继承 `Plugin` 抽象类的基础上扩展了一些属性和方法。所以继承 `ElementPlugin` 的插件也同样拥有`Plugin`抽象类的所有属性和方法

## 继承

继承 `ElementPlugin` 抽象类

```ts
import { ElementPlugin } from '@aomao/engine'

export default class extends ElementPlugin {
	...
}
```

## 属性

因为 `ElementPlugin` 继承了 `Plugin` 抽象类，所以 `pluginName` 不要忘记了～

### `tagName`

标签名称，可选

用于包裹文本或节点的标签名称

如果有设置，会自动加入 `schema` 规则管理

```ts
export default class extends ElementPlugin {
	...
    readonly tagName = "span"
}
```

### `style`

标签的样式，可选

用于设置当前标签的样式，如果此插件没有设置标签名称，样式将作为全局标签的样式，拥有此样式的标签`schema`会判定为合法的，会把样式保留。

如果有设置，会自动加入 `schema` 规则管理

示例：

```ts
export default class extends ElementPlugin {
	...
    readonly style = {
        "font-weight": "bold"
    }
}
```

某些情况下我们需要一个动态值，例如字体大小，`<span style="font-size:14px"></span>` 14px 是一个固定的值，如果希望每次执行插件都能替换成`editor.command.execute`传进来的动态值，那么就要使用变量表示

这个变量来源于`editor.command.execute`命令的参数，变量名称由 `@var` + 参数所在位置索引决定。`editor.command.execute("插件名称","参数0","参数1","参数2",...)` 对应的变量名为 `@var0` `@var1` `@var2` ...

```ts
export default class extends ElementPlugin {
	...
    readonly style = {
        "font-size": "@var0"
    }
}
```

除了动态设置值以外，我们还可以对节点获取到的值进行格式化。例如，在粘贴某些复制过来的文本时，字体大小单位是 pt，我们需要转换成我们熟悉的 px。这样在执行`editor.command.queryState`时，我们能轻松的获取到预期内的值

```ts
export default class extends ElementPlugin {
	...
    readonly style = {
        'font-size': {
			value: '@var0',
			format: (value: string) => {
				value = this.convertToPX(value);
				return value;
			},
		},
    }
}
```

### `attributes`

标签的属性，可选

设置和使用方式与 `style` 一样

```ts
export default class extends ElementPlugin {
	...
    readonly attributes = {
        "data-attr": "@var0"
    }
}
```

严格意义上`style`也属性标签上的属性，不过`style`属性比较常用，并且它是以键值对形式出现的，单独罗列出来比较好理解和管理。最终在加入 `schema` 时 `style` 属性会被合并到 `attributes` 字段中。

### `variable`

变量规则，可选

如果 `style` 或 `attributes` 的值有使用动态变量，那么必须要对变量进行规则说明。否则，`@var0`，`@var1` 在 `schema` 中会被当作固定值处理，不符合就会被过滤遗弃

```ts
variable = {
	'@var0': {
		required: true,
		value: /[\d\.]+(pt|px)$/,
	},
};
```

对于`@var0`我们使用了以下规则表明

-   `required` 必需要有的值
-   `value` 正则表达式，可以用`pt` 或 `px`做单位的数值

更多关于 `schema` 规则的设置请在 `文档` -> `基础` -> `结构`阅读

## 方法

### `init`

初始化，可选

`ElementPlugin` 插件已经实现了`init`方法，如果需要使用，需要手动再次调用。否则会出现意料外的情况

```ts
export default class extends ElementPlugin {
	...
    init(){
        super.init()
    }
}
```

### `setStyle`

将当前插件 `style` 属性应用到一个节点

```ts
/**
 * 将当前插件style属性应用到节点
 * @param node 需要设置的节点
 * @param args 如果有 `style` 中有动态值，在这里以参数的形式传入，需要注意参数顺序
 */
setStyle(node: NodeInterface | Node, ...args: Array<any>): void
```

### `setAttributes`

将当前插件 `attributes` 属性应用到一个节点

```ts
/**
 * 将当前插件attributes属性应用到节点
 * @param node 节点
 * @param args 如果有 `attributes` 中有动态值，在这里以参数的形式传入，需要注意参数顺序
 */
setAttributes(node: NodeInterface | Node, ...args: Array<any>): void;
```

### `getStyle`

获取一个节点符合当前插件规则的样式

```ts
/**
 * 获取节点符合当前插件规则的样式
 * @param node 节点
 * @returns 样式名称和样式值键值对
 */
getStyle(node: NodeInterface | Node): { [key: string]: string };
```

### `getAttributes`

获取节点符合当前插件规则的属性

```ts
/**
 * 获取节点符合当前插件规则的属性
 * @param node 节点
 * @returns 属性名称和属性值键值对
 */
getAttributes(node: NodeInterface | Node): { [key: string]: string };
```

### `isSelf`

检测当前节点是否符合当前插件设置的规则

```ts
/**
 * 检测当前节点是否符合当前插件设置的规则
 * @param node 节点
 * @returns true | false
 */
isSelf(node: NodeInterface | Node): boolean;
```

### `queryState`

查询插件状态命令，可选

```ts
queryState() {
    //不是引擎
    if (!isEngine(this.editor)) return;
    const { change } = this.editor;
    //如果没有属性和样式限制，直接查询是否包含当前标签名称
    if (!this.style && !this.attributes)
        return change.marks.some(node => node.name === this.tagName);
    //获取属性和样式限制内的值集合
    const values: Array<string> = [];
    change.marks.forEach(node => {
        values.push(...Object.values(this.getStyle(node)));
        values.push(...Object.values(this.getAttributes(node)));
    });
    return values.length === 0 ? undefined : values;
}
```

### `execute`

执行插件命令，需要实现

添加一个 mark 标签的例子：

```ts
execute(...args) {
    //不是引擎
    if (!isEngine(this.editor)) return;
    const { change } = this.editor;
    //实例化一个当前插件设定的标签名称节点
    const markNode = $(`<${this.tagName} />`);
    //给节点设置当前插件设定的样式，如果有动态值，自动组合动态参数
    this.setStyle(markNode, ...args);
    //给节点设置当前插件设定的属性，如果有动态值，自动组合动态参数
    this.setAttributes(markNode, ...args);

    const { mark } = this.editor;
    //查询当前光标位置是否符合当前插件的设置
    const trigger = !this.queryState()
    if (trigger) {
        //在光标处包裹当前插件设置的mark样式标签节点
        mark.wrap(markNode);
    } else {
        //在光标处移除当前插件设置的mark样式标签节点
        mark.unwrap(markNode);
    }
}
```

### `schema`

获取插件设置的属性和样式所生成的规则，这些规则将添加到 `schema` 对象中

```ts
/**
 * 获取插件设置的属性和样式所生成的规则
 */
schema(): SchemaRule | SchemaGlobal | Array<SchemaRule>;
```
