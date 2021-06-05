# Card 组件

卡片组件

通常用于完全自定义渲染内容

## 继承

继承 `Card` 抽象类

```ts
import { Card } from '@aomao/engine'

export default class extends Card {
	...
}
```

## 案例

### `渲染`

渲染一个卡片需要显示 `render` 方法，这是个抽象方法，必须要实现它

```ts
import { $, Card } from '@aomao/engine';

export default class extends Card {
	static get cardName() {
		return '卡片名称';
	}

	static get cardType() {
		return CardType.Block;
	}

	render() {
		//返回节点，会自动追加到卡片 center 位置
		return $('<div>Card</div>');
		//或者主动追加
		this.getCenter().append($('<div>Card</div>'));
	}
}
```

### React 渲染

React 组件

```ts
import React from 'react';

export default () => <div>React Commponent</div>;
```

卡片组件

```ts
import { ReactDOM } from 'react';
import { $, Card } from '@aomao/engine';

export default class extends Card {
	container?: NodeInterface;

	static get cardName() {
		return '卡片名称';
	}

	static get cardType() {
		return CardType.Block;
	}

	//卡片渲染成功后，节点已在编辑器中加载
	didRender() {
		if (!this.container) return;
		const element = this.container.get<HTMLElement>()!;
		//使用 ReactDOM 渲染组件
		ReactDOM.render(<ReactCommponent />, element);
	}

	render() {
		this.container = $('<div></div>');
		return this.container;
	}
}
```

### Vue 渲染

Vue 组件

```ts
<template>
    <div>Vue Component</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name:"am-vue-component",
})
</script>
```

卡片组件

```ts
import { createApp } from 'vue';
import { $, Card } from '@aomao/engine';

export default class extends Card {
	container?: NodeInterface;

	static get cardName() {
		return '卡片名称';
	}

	static get cardType() {
		return CardType.Block;
	}

	//卡片渲染成功后，节点已在编辑器中加载
	didRender() {
		if (!this.container) return;
		const element = this.container.get<HTMLElement>()!;
		//使用 createApp 渲染组件
		//加个延时，不然可能无法渲染成功
		setTimeout(() => {
			const vm = createApp(VueComponent);
			vm.mount(container);
		}, 20);
	}

	render() {
		this.container = $('<div></div>');
		return this.container;
	}
}
```

### `工具栏`

实现卡片工具栏，需要重写 `toolbar` 方法

工具栏已经实现了一些默认按钮和事件，传入名称即可使用

-   `separator` 分割线
-   `copy` 复制，可以复制卡片包含根节点的内容到剪切板上
-   `delete` 删除卡片
-   `maximize` 最大化卡片
-   `more` 更多按钮，需要额外配置 `items` 属性
-   `dnd` 位于卡片左侧的可拖动图标按钮

另外，还可以自定义按钮属性，或者渲染`React` `Vue` 前端框架组件

可自定义工具栏 UI 类型有：

-   `button` 按钮
-   `dropdown` 下拉框
-   `switch` 单选按钮
-   `input` 输入框
-   `node` 一个类型为 `NodeInterface` 的节点

每个类型的配置请看它的[类型定义](https://github.com/itellyou-com/am-editor/blob/master/packages/engine/src/types/toolbar.ts)

```ts
import {
	$,
	Card,
	CardToolbarItemOptions,
	ToolbarItemOptions,
} from '@aomao/engine';

export default class extends Card {
	static get cardName() {
		return '卡片名称';
	}

	static get cardType() {
		return CardType.Block;
	}

	toolbar(): Array<CardToolbarItemOptions | ToolbarItemOptions> {
		return [
			{
				type: 'dnd',
			},
			{
				type: 'copy',
			},
			{
				type: 'delete',
			},
			{
				type: 'node',
				node: $('<div />'),
				didMount: node => {
					//加载完成后，可以使用前端框架渲染组件到 node 节点上
					console.log(`按钮加载好了，${node}`);
				},
			},
		];
	}

	render() {
		return $('<div>Card</div>');
	}
}
```

### 设置卡片值

```ts
import { $, Card } from '@aomao/engine'

export default class extends Card {

    container?: NodeInterface

	static get cardName() {
		return '卡片名称';
	}

    static get cardType() {
		return CardType.Block;
	}

    onClick = () => {
	    const value = this.getValue() || { count: 0}
        const count = value.count + 1
		this.setValue({
			count,
		});
        this.container?.html(count)
	};

    render() {
        const value = this.getValue() || { count: 0}
        this.container = $(`<div>${value.count}</div>`)
        this.container.on("click" => this.)
        return this.container
    }
}
```

### 与插件结合

````ts
import {
	Plugin
} from '@aomao/engine';
import CardComponent from './component';

export default class extends Plugin<Options> {
	static get pluginName() {
		return 'card-plugin';
	}

	execute() {
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
        //插入卡片
		card.insert(CardComponent.cardName);
	}
}
export { CardComponent };

```

## 静态属性

### `cardName`

卡片名称，只读静态属性，必须

类型：`string`

卡片名称是唯一的，不可与传入引擎的所有卡片名称重复

```ts
export default class extends Plugin {
    //定义卡片名称，它是必须的
	static get cardName() {
		return '卡片名称';
	}
}
````

### `cardType`

卡片类型，只读静态属性，必须

类型：`CardType`

`CardType` 有两种类型，`inline` 和 `block`

```ts
export default class extends Plugin {
	//定义卡片类型，它是必须的
	static get cardType() {
		return CardType.Block;
	}
}
```

### `autoActivate`

是否能自动激活，默认 false

### `autoSelected`

是否能自动选中，默认 true

### `singleSelectable`

是否能单独选中，默认 true

### `collab`

是否能参与协作，在其它作者编辑卡片时，会遮盖一层阴影

### `focus`

是否能聚焦

### `selectStyleType`

被选中是的样式，默认为边框变化，可选值：

-   `border` 边框变化
-   `background` 背景颜色变化

### `toolbarFollowMouse`

卡片工具栏是否跟随鼠标位置，默认 flase

## 属性

### `editor`

编辑器实例

类型：`EditorInterface`

在插件实例化的时候，会传入编辑器实例。我们可以通过 `this` 访问它

```ts
import { Card, isEngine } from '@aomao/engine'

export default class extends Card<Options> {
	...

	init() {
		console.log(isEngine(this.editor) ? "引擎" : "阅读器")
	}
}
```

### `id`

只读

类型：`string`

卡片 id，每个卡片都有一个唯一 ID，我们可以用此 ID 来查找卡片组件实例

### `isEditable`

只读

类型：`boolean`

卡片是否可编辑器

### `contenteditable`

可编辑节点，可选

可设置一个或多个 CSS 选择器，这些节点将会变为可编辑的

可编辑区域的值需要自定义保存。推荐保存在卡片的 `value` 里面

```ts
import { Card, isEngine } from '@aomao/engine'

export default class extends Card<Options> {
	...

    contenteditable = ["div.card-editor-container"]

	render(){
        return "<div><div>Thi is Card</div><div class=\"card-editor-container\"></div></div>"
    }
}
```

### `readonly`

是否是只读

类型：`boolean`

### `root`

卡片根节点

类型：`NodeInterface`

### `activated`

是否激活

类型：`boolean`

### `selected`

是否选中

类型：`boolean`

### `isMaximize`

是否最大化

类型：`boolean`

### `activatedByOther`

激活者，协同状态下有效

类型：`string | false`

### `selectedByOther`

选中者，协同状态下有效

类型：`string | false`

### `toolbarModel`

工具栏操作类

类型：`CardToolbarInterface`

### `resizeModel`

大小调整操作类

类型：`ResizeInterface`

### `resize`

是否可改变卡片大小，或者传入渲染节点

类型：`boolean | (() => NodeInterface);`

如果有指定，将会实例化 `resizeModel` 属性

## 方法

### `init`

初始化，可选

```ts
init?(): void;
```

### `find`

查找 Card 内的 DOM 节点

```ts
/**
 * 查找Card内的 DOM 节点
 * @param selector
 */
find(selector: string): NodeInterface;
```

### `findByKey`

通过 data-card-element 的值，获取当前 Card 内的 DOM 节点

```ts
/**
 * 通过 data-card-element 的值，获取当前Card内的 DOM 节点
 * @param key key
 */
findByKey(key: string): NodeInterface;
```

### `getCenter`

获取卡片的中心节点，也就是卡片自定义内容区域的最外层节点

```ts
/**
 * 获取卡片的中心节点
 */
getCenter(): NodeInterface;
```

### `isCenter`

判断节点是否属于卡片的中心节点

```ts
/**
 * 判断节点是否属于卡片的中心节点
 * @param node 节点
 */
isCenter(node: NodeInterface): boolean;
```

### `isCursor`

判断节点是否在卡片的左右光标处

```ts
/**
 * 判断节点是否在卡片的左右光标处
 * @param node 节点
 */
isCursor(node: NodeInterface): boolean;
```

### `isLeftCursor`

判断节点是否在卡片的左光标处

```ts
/**
 * 判断节点是否在卡片的左光标处
 * @param node 节点
 */
isLeftCursor(node: NodeInterface): boolean;
```

### `isRightCursor`

判断节点是否在卡片的右光标处

```ts
/**
 * 判断节点是否在卡片的右光标处
 * @param node 节点
 */
isRightCursor(node: NodeInterface): boolean;
```

### `focus`

聚焦卡片

```ts
/**
 * 聚焦卡片
 * @param range 光标
 * @param toStart 是否开始位置
 */
focus(range: RangeInterface, toStart?: boolean): void;
```

### `focusPrevBlock`

聚焦卡片所在位置的前一个块级节点

```ts
/**
 * 聚焦卡片所在位置的前一个块级节点
 * @param range 光标
 * @param hasModify 没有节点时，是否创建一个空节点并聚焦
 */
focusPrevBlock(range: RangeInterface, hasModify: boolean): void;
```

### `focusNextBlock`

聚焦卡片所在位置的下一个块级节点

```ts
/**
 * 聚焦卡片所在位置的下一个块级节点
 * @param range 光标
 * @param hasModify 没有节点时，是否创建一个空节点并聚焦
 */
focusNextBlock(range: RangeInterface, hasModify: boolean): void;
```

### `onFocus`

当卡片聚焦时触发

```ts
/**
 * 当卡片聚焦时触发
 */
onFocus?(): void;
```

### `activate`

激活 Card

```ts
/**
 * 激活Card
 * @param activated 是否激活
 */
activate(activated: boolean): void;
```

### `select`

选择 Card

```ts
/**
 * 选择Card
 * @param selected 是否选中
 */
select(selected: boolean): void;
```

### `onSelect`

选中状态变化时触发

```ts
/**
 * 选中状态变化时触发
 * @param selected 是否选中
 */
onSelect(selected: boolean): void;
```

### `onSelectByOther`

协同状态下，选中状态变化时触发

```ts
/**
 * 协同状态下，选中状态变化时触发
 * @param selected 是否选中
 * @param value { color:协同者颜色 , rgb:颜色rgb格式 }
 */
onSelectByOther(
    selected: boolean,
    value?: {
        color: string;
        rgb: string;
    },
): NodeInterface | void;
```

### `onActivate`

激活状态变化时触发

```ts
/**
 * 激活状态变化时触发
 * @param activated 是否激活
 */
onActivate(activated: boolean): void;
```

### `onActivateByOther`

协同状态下，激活状态变化时触发

```ts
/**
 * 协同状态下，激活状态变化时触发
 * @param activated 是否激活
 * @param value { color:协同者颜色 , rgb:颜色rgb格式 }
 */
onActivateByOther(
    activated: boolean,
    value?: {
        color: string;
        rgb: string;
    },
): NodeInterface | void;
```

### `onChange`

可编辑器区域值改变时触发

```ts
/**
 * 可编辑器区域值改变时触发
 * @param node 可编辑器区域节点
 */
onChange?(node: NodeInterface): void;
```

### `setValue`

设置卡片值

```ts
/**
 * 设置卡片值
 * @param value 值
 */
setValue(value: CardValue): void;
```

### `getValue`

获取卡片值

```ts
/**
 * 获取卡片值
 */
getValue(): (CardValue & { id: string }) | undefined;
```

### `toolbar`

工具栏配置项

```ts
/**
 * 工具栏配置项
 */
toolbar?(): Array<CardToolbarItemOptions | ToolbarItemOptions>;
```

### `maximize`

最大化卡片

```ts
/**
 * 最大化
 */
maximize(): void;
```

### `minimize`

最小化卡片

```ts
/**
 * 最小化
 */
minimize(): void;
```

### `render`

渲染卡片

```ts
/**
 * 渲染卡片
 */
render(): NodeInterface | string | void;
```

### `destroy`

销毁

```ts
/**
 * 销毁
 */
destroy?(): void;
```

### `didInsert`

插入卡片到编辑器后触发

```ts
/**
 * 插入后触发
 */
didInsert?(): void;
```

### `didUpdate`

更新卡片后触发

```ts
/**
 * 更新后触发
 */
didUpdate?(): void;
```

### `didRender`

卡片渲染成功后触发

```ts
/**
 * 渲染后触发
 */
didRender(): void;
```

### `updateBackgroundSelection`

更新可编辑器卡片协同选择区域

```ts
/**
 * 更新可编辑器卡片协同选择区域
 * @param range 光标
 */
updateBackgroundSelection?(range: RangeInterface): void;
```

### `drawBackground`

渲染可编辑器卡片协同选择区域

```ts
/**
 * 渲染可编辑器卡片协同选择区域
 * @param node 背景画布
 * @param range 渲染光标
 */
drawBackground?(
    node: NodeInterface,
    range: RangeInterface,
    targetCanvas: TinyCanvasInterface,
): DOMRect | RangeInterface[] | void | false;
```
