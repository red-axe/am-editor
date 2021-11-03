# List 插件

列表节点插件

通常用于有序列表、无序列表、自定义列表。例如，任务列表就属于自定义列表，里面的`checkbox`是 `inline` 类型的 `card` 实现

此类插件我们需要继承 `ListPlugin` 抽象类，`ListPlugin` 抽象类在继承 `BlockPlugin` 抽象类的基础上扩展了一些属性和方法。所以继承 `ListPlugin` 的插件也同样拥有`BlockPlugin`抽象类的所有属性和方法

## 继承

继承 `ListPlugin` 抽象类

```ts
import { ListPlugin } from '@aomao/engine'

export default class extends ListPlugin {
	...
}
```

## 属性

`ListPlugin` 拥有继承的 `BlockPlugin` `ElementPlugin` `Plugin` 所有的属性和方法

### `cardName`

卡片名称，可选。

在我们自定义列表时，`cardName` 是必须的

卡片名称所对应的 `card` 组件必须是 `inline` 类型的，不能是 `block` 类型

类型：`string`

```ts
cardName = 'checkbox';
```

## 方法

### `init`

初始化，可选

`ListPlugin` 插件已经实现了`init`方法，如果需要使用，需要手动再次调用。否则会出现意料外的情况

```ts
export default class extends ListPlugin {
	...
    init(){
        super.init()
    }
}
```

### `isCurrent`

判断节点是否是当前列表所需要的节点，必须实现它

我们需要通过此方法，判定一个列表节点属性哪个插件

```ts
isCurrent(node: NodeInterface) {
    //li 节点，必须包含 `CUSTOMZIE_LI_CLASS` 自定义列表的样式，并且li下的第一个子节点，应是一个卡片，卡片名称与我们设置的 cardName 对应
    if (node.name === 'li')
        return (
            node.hasClass(this.editor.list.CUSTOMZIE_LI_CLASS) &&
            node.first()?.attributes(CARD_KEY) === this.cardName
        );
    //ul 节点应该必须包含 `CUSTOMZIE_UI_CLASS` 自定义列表的样式。并且还有我们自定义的样式
    return node.hasClass(this.editor.list.CUSTOMZIE_UI_CLASS) && node.hasClass('data-list-task');
}
```

### `queryState`

`ListPlugin` 插件已经实现了`queryState`方法，如果需要使用，可以重写此方法

```ts
queryState() {
    if (!isEngine(this.editor)) return false;
    return (
        this.editor.list.getPluginNameByNodes(this.editor.change.blocks) ===
        (this.constructor as PluginEntryType).pluginName
    );
}
```

### `execute`

需用通过 API 调用方法，来实现对列表节点的包裹，与移除

```ts
//非引擎
if (!isEngine(this.editor)) return;
const { change, list, block } = this.editor;
//先要切割列表，<ul><li /><anchor /><li /><focus /><li /></ul> -> <ul><li /></ul><anchor /><ul><li /><focus /></ul><ul><li /></ul>
list.split();
//获取当前光标
const range = change.range.get();
//获取当前所有季后的block节点
const activeBlocks = block.findBlocks(range);
if (activeBlocks) {
	//在光标处创建标记节点
	const selection = range.createSelection();
	//判定是否属于当前插件类型的自定义列表节点
	if (list.isSpecifiedType(activeBlocks, 'ul', 'checkbox')) {
		//移除包裹
		list.unwrap(activeBlocks);
	} else {
		//把当前的所有激活的block节点转换为自定义列表
		const listBlocks = list.toCustomize(
			activeBlocks,
			'checkbox',
			//checkbox 卡片的值，由checkbox定义时的值决定。例如 checked 是否有选中
			{
				checked: boolean,
			},
		) as Array<NodeInterface>;
		//转换完成后，循环添加我们自定义的样式
		listBlocks.forEach((list) => {
			if (this.editor.node.isList(list)) list.addClass('data-list-task');
		});
	}
	//移除标记，并把光标复原
	selection.move();
	//重新选中新的光标位置
	change.range.select(range);
	//合并相邻并且相同的列表节点，如果有
	list.merge();
}
```
