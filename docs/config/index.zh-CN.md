---
toc: menu
---

# 引擎配置

在实例化引擎时传入

```ts
//实例化引擎
const engine = new Engine(渲染节点, {
	...配置项,
});
```

### lang

-   类型: `string`
-   默认值：`zh-cn`
-   详细：语言配置，暂时支持 `zh-cn`、`en`。可使用 `engine.language` 添加

```ts
const engine = new Engine(渲染节点, {
	lang: 'zh-cn',
});
engine.language.add({
	'zh-cn': {
		test: '测试',
	},
});
console.log(engine.language.get('test'));
```

### className

-   类型: `string`
-   默认值：`null`
-   详细：添加编辑器渲染节点额外样式

### tabIndex

-   类型: `number`
-   默认值：`null`
-   详细：当前编辑器位于第几个 tab 项

### root

-   类型: `Node`
-   默认值：当前编辑器渲染节点父节点
-   详细：编辑器根节点

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
