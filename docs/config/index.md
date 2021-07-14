---
toc: menu
---

# Engine configuration

Passed in when instantiating the engine

```ts
//Instantiate the engine
const engine = new Engine(render node, {
... configuration items,
});
```

### lang

-   Type: `string`
-   Default value: `zh-cn`
-   Detailed: Language configuration, temporarily supports `zh-cn`, `en`. Can use `locale` configuration

```ts
const view = new View(render node, {
    lang:'zh-cn',
});
```

### locale

-   Type: `object`
-   Default value: `zh-cn`
-   Detailed: Configure additional language packs

Language pack, default language pack [https://github.com/itellyou-com/am-editor/blob/master/locale](https://github.com/itellyou-com/am-editor/blob/master/locale)

```ts
const view = new View(render node, {
     locale: {
         'zh-cn': {
             test:'Test',
             a: {
                 b: "B"
             }
         },
     }
});
console.log(view.language.get<string>('test'));
```

### className

-   Type: `string`
-   Default value: `null`
-   Detailed: Add additional styles of editor render nodes

### tabIndex

-   Type: `number`
-   Default value: `null`
-   Detailed: Which tab item is the current editor located in

### root

-   Type: `Node`
-   Default value: the parent node of the render node of the current editor
-   Detailed: Editor root node

### plugins

-   Type: `Array<Plugin>`
-   Default value: `[]`
-   Detailed: A collection of plugins that implement the abstract class of `Plugin`

### cards

-   Type: `Array<Card>`
-   Default value: `[]`
-   Detailed: Implement the card collection of the `Card` abstract class

### config

-   Type: `{ [key: string]: PluginOptions }`
-   Default value: `{}`
-   Detailed: the configuration item of each plug-in, the key is the name of the plug-in, please refer to the description of each plug-in for detailed configuration
