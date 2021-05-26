---
toc: menu
---

# 阅读器配置

在实例化阅读器时传入

```ts
import { View } from '@aomao/engine';
//实例化引擎
const view = new View(渲染节点, {
	...配置项,
});
```

### lang

-   类型: `string`
-   默认值：`zh-cn`
-   详细：语言配置，暂时支持 `zh-cn`、`en`。可使用 `view.language` 添加

```ts
const view = new View(渲染节点, {
	lang: 'zh-cn',
});
view.language.add({
	'zh-cn': {
		test: '测试',
	},
});
console.log(view.language.get('test'));
```

### root

-   类型: `Node`
-   默认值：当前阅读器渲染节点父节点
-   详细：阅读器根节点

### plugins

-   类型: `Array<Plugin>`
-   默认值：`[]`
-   详细：实现 `Plugin` 抽象类的插件集合

### cards

-   类型: `Array<Card>`
-   默认值：`[]`
-   详细：实现 `Card` 抽象类的卡片集合

### config

-   类型: `{ [key: string]: PluginOptions }`
-   默认值：`{}`
-   详细：每个插件的配置项，key 为插件名称，详细配置请参考每个插件的说明
