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

## DEMO

### `渲染`

渲染一个卡片需要显示 `render` 方法，这是个抽象方法，必须要实现它

```ts
import { $, Card } from '@aomao/engine';

export default class extends Card {
	static get cardName() {
		return '卡片名称';
	}

	static get cardType() {
		return CardType.BLOCK;
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
import ReactDOM from 'react-dom';
import { $, Card, CardType } from '@aomao/engine';
// 引入自定义的 react 组件
import ReactCommponent from 'ReactCommponent';

export default class extends Card {
	container?: NodeInterface;

	static get cardName() {
		return '卡片名称';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	/**
	 * 卡片渲染成功后，空的 div 节点已在编辑器中加载
	 * */
	didRender() {
		super.didRender();
		if (!this.container) return;
		// 获取 HTMLElement 类型的节点
		const element = this.container.get<HTMLElement>()!;
		//使用 ReactDOM 把 React 组件渲染到 container 上的空 div 节点上
		ReactDOM.render(<ReactCommponent />, element);
	}

	/**
	 * 渲染卡片
	 * */
	render() {
		// 渲染一个空的div节点
		this.container = $('<div></div>');
		return this.container;
	}

	/**
	 * 卸载组件
	 * */
	destroy() {
		super.destroy();
		const element = this.container.get<HTMLElement>();
		if (element) ReactDOM.unmountComponentAtNode(element);
	}
}
```

### React 卡片插件示例

卡片值类型定义

`test/component/types.ts`

```ts
import { CardValue } from '@aomao/engine';

export interface TestValue extends CardValue {
	text: string;
}
```

react 组件，呈现卡片的视图和交互

`test/component/test.tsx`

```tsx | pure
import { FC } from 'react';
import { TestValue } from './types';
const TestComponent: FC<{ value: TestValue }> = ({ value }) => (
	<div>{value.text}</div>
);
export default TestComponent;
```

卡片组件，主要把 react 组件加载到编辑器中

`test/component/index.tsx`

```tsx | pure
import {
	$,
	Card,
	CardToolbarItemOptions,
	CardType,
	isEngine,
	NodeInterface,
	ToolbarItemOptions,
} from '@aomao/engine';
import ReactDOM from 'react-dom';
import TestComponent from './test';
import type { TestValue } from './types';

class Test extends Card<TestValue> {
	static get cardName() {
		return 'test';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	#container?: NodeInterface;

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
		if (!isEngine(this.editor) || this.editor.readonly) return [];
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
				node: $('<span>测试按钮</span>'),
				didMount: (node) => {
					node.on('click', () => {
						alert('test button');
					});
				},
			},
		];
	}

	render() {
		this.#container = $('<div>Loading</div>');
		return this.#container; // 或者使用 this.getCenter().append(this.#container) 就不用再返回 this.#container 了
	}

	didRender() {
		super.didRender();
		const value = this.getValue();
		ReactDOM.render(
			<TestComponent value={value} />,
			this.#container?.get<HTMLElement>(),
		);
	}

	destroy() {
		super.destroy();
		ReactDOM.unmountComponentAtNode(this.#container?.get<HTMLElement>()!);
	}
}
export default Test;
export type { TestValue };
```

卡片插件文件，主要作用：插入卡片、转换/解析卡片

`test/index.ts`

```ts
import {
	$,
	Plugin,
	NodeInterface,
	CARD_KEY,
	isEngine,
	SchemaInterface,
	PluginOptions,
	decodeCardValue,
	encodeCardValue,
} from '@aomao/engine';
import TestComponent from './component';
import type { TestValue } from './component';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
}
export default class extends Plugin<Options> {
	static get pluginName() {
		return 'test';
	}
	// 插件初始化
	init() {
		// 监听解析成html的事件
		this.editor.on('parse:html', this.parseHtml);
		// 监听粘贴时候设置schema规则的入口
		this.editor.on('paste:schema', this.pasteSchema);
		// 监听粘贴时候的节点循环
		this.editor.on('paste:each', this.pasteHtml);
	}
	// 执行方法
	execute() {
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
		card.insert<TestValue>(TestComponent.cardName, {
			text: 'This is card value',
		});
	}
	// 快捷键
	hotkey() {
		return this.options.hotkey || 'mod+shift+f';
	}
	// 粘贴的时候添加需要的 schema
	pasteSchema = (schema: SchemaInterface) => {
		schema.add({
			type: 'block',
			name: 'div',
			attributes: {
				'data-type': {
					required: true,
					value: TestComponent.cardName,
				},
				'data-value': '*',
			},
		});
	};
	// 解析粘贴过来的html
	pasteHtml = (node: NodeInterface) => {
		if (!isEngine(this.editor)) return;
		if (node.isElement()) {
			const type = node.attributes('data-type');
			if (type === TestComponent.cardName) {
				const value = node.attributes('data-value');
				const cardValue = decodeCardValue(value);
				this.editor.card.replaceNode(
					node,
					TestComponent.cardName,
					cardValue,
				);
				node.remove();
				return false;
			}
		}
		return true;
	};
	// 解析成html
	parseHtml = (root: NodeInterface) => {
		root.find(
			`[${CARD_KEY}="${TestComponent.cardName}"],[${READY_CARD_KEY}="${TestComponent.cardName}"]`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = this.editor.card.find<TestValue, TestComponent>(node);
			const value = card?.getValue();
			if (value) {
				node.empty();
				const div = $(
					`<div data-type="${
						TestComponent.cardName
					}" data-value="${encodeCardValue(value)}">${
						value.text
					}</div>`,
				);
				node.replaceWith(div);
			} else node.remove();
		});
	};

	destroy() {
		// 监听解析成html的事件
		this.editor.off('parse:html', this.parseHtml);
		// 监听粘贴时候设置schema规则的入口
		this.editor.off('paste:schema', this.pasteSchema);
		// 监听粘贴时候的节点循环
		this.editor.off('paste:each', this.pasteHtml);
	}
}
export { TestComponent };
export type { TestValue };
```

使用卡片插件

```tsx | pure
import React, { useEffect, useRef, useState } from 'react';
import Engine, { EngineInterface } from '@aomao/engine';
// 导入自定义的卡片插件和卡片组件 test/index.ts
import Test, { TestComponent } from './test';

const EngineDemo = () => {
	//编辑器容器
	const ref = useRef<HTMLDivElement | null>(null);
	//引擎实例
	const [engine, setEngine] = useState<EngineInterface>();
	//编辑器内容
	const [content, setContent] = useState<string>('Hello card!');

	useEffect(() => {
		if (!ref.current) return;
		//实例化引擎
		const engine = new Engine(ref.current, {
			plugins: [Test],
			cards: [TestComponent],
		});
		//设置编辑器值
		engine.setValue(content);
		//监听编辑器值改变事件
		engine.on('change', () => {
			const value = engine.getValue();
			setContent(value);
			console.log(`value:${value}`);
		});
		//设置引擎实例
		setEngine(engine);
	}, []);

	return <div ref={ref} />;
};
export default EngineDemo;
```

使用 `test/index.ts` 中定义的快捷键 `mod+shift+f` 就能在编辑器中插入刚才定义的卡片组件了

### Vue2 渲染

Vue 组件

```ts
<template>
    <div>Vue Component</div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
@Component({})
export default class VueComponent extends Vue {

}
</script>
```

卡片组件

```ts
import Vue from 'vue';
import { $, Card, CardType } from '@aomao/engine';
// 引入自定义的 vue 组件
import VueCommponent from 'VueCommponent';

export default class extends Card {
	container?: NodeInterface;
	private vm?: Vue;

	static get cardName() {
		return '卡片名称';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	/**
	 * 卡片渲染成功后，空的 div 节点已在编辑器中加载
	 * */
	didRender() {
		super.didRender();
		if (!this.container) return;
		// 获取 HTMLElement 类型的节点
		const element = this.container.get<HTMLElement>()!;
		//使用 createApp 把 Vue 组件渲染到 container 上的空 div 节点上
		//加个延时，不然可能无法渲染成功
		setTimeout(() => {
			this.vm = new Vue({
				render: (h) => {
					return h(VueComponent, {
						props: {},
					});
				},
			});
			element.append(vm.$mount().$el);
		}, 20);
	}

	/**
	 * 渲染卡片
	 * */
	render() {
		// 渲染一个空的div节点
		this.container = $('<div></div>');
		return this.container;
	}

	/**
	 * 卸载组件
	 * */
	destroy() {
		super.destroy();
		this.vm?.$destroy();
		this.vm = undefined;
	}
}
```

### Vue3 渲染

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
import { createApp, App } from 'vue';
import { $, Card, CardType } from '@aomao/engine';
// 引入自定义的 vue 组件
import VueCommponent from 'VueCommponent';

export default class extends Card {
	container?: NodeInterface;
	private vm?: App;

	static get cardName() {
		return '卡片名称';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	/**
	 * 卡片渲染成功后，空的 div 节点已在编辑器中加载
	 * */
	didRender() {
		super.didRender();
		if (!this.container) return;
		// 获取 HTMLElement 类型的节点
		const element = this.container.get<HTMLElement>()!;
		//使用 createApp 把 Vue 组件渲染到 container 上的空 div 节点上
		//加个延时，不然可能无法渲染成功
		setTimeout(() => {
			this.vm = createApp(VueComponent);
			this.vm.mount(element);
		}, 20);
	}

	/**
	 * 渲染卡片
	 * */
	render() {
		// 渲染一个空的div节点
		this.container = $('<div></div>');
		return this.container;
	}

	/**
	 * 卸载组件
	 * */
	destroy() {
		super.destroy();
		this.vm?.unmount();
		this.vm = undefined;
	}
}
```

### Vue3 卡片插件示例

卡片插件文件，主要作用：插入卡片、转换/解析卡片

`test/index.ts`

```ts
import {
	$,
	Plugin,
	NodeInterface,
	CARD_KEY,
	isEngine,
	SchemaInterface,
	PluginOptions,
	decodeCardValue,
	encodeCardValue,
} from '@aomao/engine';
import TestComponent from './component';

export interface Options extends PluginOptions {
	hotkey?: string | Array<string>;
}
export default class extends Plugin<Options> {
	static get pluginName() {
		return 'test';
	}
	// 插件初始化
	init() {
		// 监听解析成html的事件
		this.editor.on('parse:html', this.parseHtml);
		// 监听粘贴时候设置schema规则的入口
		this.editor.on('paste:schema', this.pasteSchema);
		// 监听粘贴时候的节点循环
		this.editor.on('paste:each', this.pasteHtml);
	}
	// 执行方法
	execute() {
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
		card.insert(TestComponent.cardName);
	}
	// 快捷键
	hotkey() {
		return this.options.hotkey || 'mod+shift+0';
	}
	// 粘贴的时候添加需要的 schema
	pasteSchema = (schema: SchemaInterface) => {
		schema.add({
			type: 'block',
			name: 'div',
			attributes: {
				'data-type': {
					required: true,
					value: TestComponent.cardName,
				},
				'data-value': '*',
			},
		});
	};
	// 解析粘贴过来的html
	pasteHtml = (node: NodeInterface) => {
		if (!isEngine(this.editor)) return;
		if (node.isElement()) {
			const type = node.attributes('data-type');
			if (type === TestComponent.cardName) {
				const value = node.attributes('data-value');
				const cardValue = decodeCardValue(value);
				this.editor.card.replaceNode(
					node,
					TestComponent.cardName,
					cardValue,
				);
				node.remove();
				return false;
			}
		}
		return true;
	};
	// 解析成html
	parseHtml = (root: NodeInterface) => {
		root.find(
			`[${CARD_KEY}="${TestComponent.cardName}"],[${READY_CARD_KEY}="${TestComponent.cardName}"]`,
		).each((cardNode) => {
			const node = $(cardNode);
			const card = this.editor.card.find(node) as TestComponent;
			const value = card?.getValue();
			if (value) {
				node.empty();
				const div = $(
					`<div data-type="${
						TestComponent.cardName
					}" data-value="${encodeCardValue(
						value,
					)}">Card to html</div>`,
				);
				node.replaceWith(div);
			} else node.remove();
		});
	};

	destroy() {
		// 监听解析成html的事件
		this.editor.off('parse:html', this.parseHtml);
		// 监听粘贴时候设置schema规则的入口
		this.editor.off('paste:schema', this.pasteSchema);
		// 监听粘贴时候的节点循环
		this.editor.off('paste:each', this.pasteHtml);
	}
}
export { TestComponent };
```

vue 组件，呈现卡片的视图和交互

`test/component/test.vue`

```ts
<template>
  <div>
    <div>This is test plugin</div>
  </div>
</template>

<style lang="less"></style>

```

卡片组件，主要把 vue 组件加载到编辑器中

`test/component/index.ts`

```ts
import {
	$,
	Card,
	CardToolbarItemOptions,
	CardType,
	isEngine,
	NodeInterface,
	ToolbarItemOptions,
} from '@aomao/engine';
import { App, createApp } from 'vue';
import TestVue from './test.vue';

class Test extends Card {
	static get cardName() {
		return 'test';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	#container?: NodeInterface;
	#vm?: App;

	toolbar(): Array<ToolbarItemOptions | CardToolbarItemOptions> {
		if (!isEngine(this.editor) || this.editor.readonly) return [];
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
				node: $('<span>测试按钮</span>'),
				didMount: (node) => {
					node.on('click', () => {
						alert('test button');
					});
				},
			},
		];
	}

	render() {
		this.#container = $('<div>Loading</div>');
		return this.#container; // 或者使用 this.getCenter().append(this.#container) 就不用再返回 this.#container 了
	}

	didRender() {
		super.didRender();
		this.#vm = createApp(TestVue, {});
		this.#vm.mount(this.#container?.get<HTMLElement>());
	}

	destroy() {
		super.destroy();
		this.vm?.unmount();
		this.vm = undefined;
	}
}
export default Test;
```

使用卡片插件

```ts
<template>
   <div ref="container"></div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from "vue";
import Engine, {
  $,
  EngineInterface,
  isMobile,
  NodeInterface,
  removeUnit,
} from "@aomao/engine";
import Test, { TestComponent } from "./test";

export default defineComponent({
  name: "engine-demo",
  setup() {
    // 编辑器容器
    const container = ref<HTMLElement | null>(null);
    // 编辑器引擎
    const engine = ref<EngineInterface | null>(null);
    onMounted(() => {
      // 容器加载后实例化编辑器引擎
      if (container.value) {
        //实例化引擎
        const engineInstance = new Engine(container.value, {
          // 启用的插件
          plugins:[Test],
          // 启用的卡片
          cards:[TestComponent],
        });

        engineInstance.setValue("<strong>Hello</strong>,This is demo");

        // 监听编辑器值改变事件
        engineInstance.on("change", (editorValue) => {
          console.log("value", editorValue);
        });

        engine.value = engineInstance;
      }
    });

    onUnmounted(() => {
      if (engine.value) engine.value.destroy();
    });

    return {
      container,
      engine,
    };
  },
});
</script>
```

使用 `test/index.ts` 中定义的快捷键 `mod+shift+0` 就能在编辑器中插入刚才定义的卡片组件了

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

每个类型的配置请看它的[类型定义](https://github.com/yanmao-cc/am-editor/blob/master/packages/engine/src/types/toolbar.ts)

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
		return CardType.BLOCK;
	}

	// 卡片工具栏
	toolbar(): Array<CardToolbarItemOptions | ToolbarItemOptions> {
		return [
			// 左边拖动按钮
			{
				type: 'dnd',
			},
			// 复制
			{
				type: 'copy',
			},
			// 删除
			{
				type: 'delete',
			},
			// 分割线
			{
				type: 'separator',
			},
			// 自定义节点
			{
				type: 'node',
				node: $('<div />'),
				didMount: (node) => {
					//加载完成后，可以使用前端框架渲染组件到 node 节点上。vue 使用 createApp 需要加延时
					console.log(`按钮加载好了，${node}`);
				},
			},
		];
	}

	// 渲染 div
	render() {
		return $('<div>Card</div>');
	}
}
```

### 设置卡片值

卡片值默认类型 `CardValue`

默认提供 `id` `type` 两个值，自定义值不能与默认值相同

-   `id` 卡片唯一编号
-   `type` 卡片类型

```ts
import { $, Card, CardType } from '@aomao/engine'

export default class extends Card<{ count: number }> {

  container?: NodeInterface

	static get cardName() {
		return '卡片名称';
	}

  static get cardType() {
		return CardType.BLOCK;
	}

	// 在 div 上面单击
	onClick = () => {
		// 获取卡片值
		const value = this.getValue() || { count: 0}
		// 给 count + 1
		const count = value.count + 1
		// 重新设置卡片值，会保存到卡片根节点上的 data-card-value 属性上面
		this.setValue({
				count,
		});
		// 设置 div 的内容
		this.container?.html(count)
	};

	// 渲染 div 节点
	render() {
		// 获取卡片的值
		const value = this.getValue() || { count: 0}
		// 创建 div 节点
		this.container = $(`<div>${value.count}</div>`)
		// 绑定 click 事件
		this.container.on("click" => ()  => this.onClick())
		// 返回节点给容器加载
		return this.container
	}
}
```

### 与插件结合

```ts
import { Plugin, isEngine } from '@aomao/engine';
// 引入卡片
import CardComponent from './component';

type Options = {
	defaultValue?: number;
};

export default class extends Plugin<Options> {
	static get pluginName() {
		return 'card-plugin';
	}
	// 插件执行命令，调用 engine.command.excute("card-plugin") 执行当前命令
	execute() {
		// 阅读器不执行
		if (!isEngine(this.editor)) return;
		const { card } = this.editor;
		//插入卡片，并且传入 count 初始化参数
		card.insert(CardComponent.cardName, {
			count: this.otpions.defaultValue || 0,
		});
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
```

### `cardType`

卡片类型，只读静态属性，必须

类型：`CardType`

`CardType` 有两种类型，`inline` 和 `block`

```ts
export default class extends Plugin {
	//定义卡片类型，它是必须的
	static get cardType() {
		return CardType.BLOCK;
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

### `lazyRender`

是否启用懒加载，卡片节点在视图内可见时触发渲染

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

### `type`

卡片类型，默认获取卡片类的静态属性 `cardType`，如果 `getValue()` 中有 `type` 值，将会使用这个值作为 `type`

在给卡片设置新的 `type` 值时，会移除当前卡片并且使用新的 `type` 在当前卡片位置重新渲染卡片

类型：`CardType`

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
        return "<div><div>Thi is Card</div><div class=\"card-editor-container\">这里可以编辑</div></div>"
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

### `beforeRender`

开启懒惰渲染后，卡片渲染前触发

```ts
beforeRender(): void
```

### `didRender`

卡片渲染成功后触发

```ts
/**
 * 渲染后触发
 */
didRender(): void;
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

### `getSelectionNodes`

```ts
/**
 * 获取卡片区域选中的所有节点
 */
getSelectionNodes?(): Array<NodeInterface>
```
