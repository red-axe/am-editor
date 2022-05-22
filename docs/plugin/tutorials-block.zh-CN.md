# Block 插件

块级节点插件

通常用于独占一行的块级节点，类似于标题、引用

此类插件我们需要继承 `BlockPlugin` 抽象类，`BlockPlugin` 抽象类在继承 `ElementPlugin` 抽象类的基础上扩展了一些属性和方法。所以继承 `BlockPlugin` 的插件也同样拥有`ElementPlugin`抽象类的所有属性和方法

## 继承

继承 `BlockPlugin` 抽象类

```ts
import { BlockPlugin } from '@aomao/engine'

export default class extends BlockPlugin {
	...
}
```

## 属性

### `tagName`

标签名称，必须

类型：`string | Array<string>`

此处的标签名称与父类`ElementPlugin`中的标签名称作用是一致的，只不过标签名称是 `BlockPlugin` 插件必要的属性之一

`BlockPlugin` 标签名称可以是数组。例如标题，h1 h2 h3 h4 h5 h6 多种标签名称，设置为数组后，会把这些名称单独和 `style` `attributes`组合成 `schema` 规则

```ts
readonly tagName = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
```

### `allowIn`

该节点允许可以放入的 block 节点，默认为 `$root`编辑器根节点

类型：`Array<string>`

```ts
readonly allowIn = ['blockquote', '$root']
```

### `disableMark`

禁用的 mark 插件样式，该 block 节点下不可以出现的 mark 插件节点的样式

类型：`Array<string>`

```ts
//传入 mark插件 名称
disableMark = ['fontsize', 'bold'];
```

### `canMerge`

相同的 block 节点能否合并，默认 false，可选

类型：`boolean`

## 方法

### `init`

初始化，可选

`BlockPlugin` 插件已经实现了`init`方法，如果需要使用，需要手动再次调用。否则会出现意料外的情况

```ts
export default class extends BlockPlugin {
	...
    init(){
        super.init()
    }
}
```

### `queryState`

查询插件状态命令，可选

```ts
queryState() {
    //不是引擎
    if (!isEngine(this.editor)) return;
    const { change } = this.editor
    //获取当前光标选择区域内的所有块级标签
    const blocks = change.blocks;
    if (blocks.length === 0) {
        return '';
    }
    //查看是否有包含当前插件设置的标签名称，如果有设置属性样式，还需要比较属性和样式
    return this.tagName.indexOf(blocks[0].name) >= 0 ? blocks[0].name : '';
}
```

### `execute`

执行插件命令，需要实现

添加一个 block 标签的例子：

```ts
execute(...args) {
    //不是引擎
    if (!isEngine(this.editor)) return;
    const { change, block, node } = this.editor;
    if (!this.queryState()) {
        //包裹块级节点
        block.wrap(`<${this.tagName} />`);
    } else {
        //获取光标对象
        const range = change.range.get();
        //获取当前光标区域内的第一个块级节点并且向上查找与当前插件设置的块级节点名称相同的节点
        const blockquote = change.blocks[0].closest(this.tagName);
        //标记移除包裹前光标位置
        const selection = range.createSelection();
        //移除包裹
        node.unwrap(blockquote);
        //还原移除包裹后的光标所处位置
        selection.move()
        //重新设置编辑器所处光标
        change.range.select(range);
    }
}
```

### `schema`

设置此 block 插件的`schema`规则，可选

`BlockPlugin` 插件已经实现了`schema`方法，会自动根据 `tagName` `style` `attributes` 设置规则。

如果需要使用，可以重写此方法或者使用 super.schema()再次调用此方法
