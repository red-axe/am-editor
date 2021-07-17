---
toc: menu
---

# View configuration

Passed in when instantiating the reader

```ts
import {View} from'@aomao/engine';
//Instantiate the view
const view = new View(render node, {
... configuration items,
});
```

### lang

-   Type: `string`
-   Default value: `zh-CN`
-   Detailed: Language configuration, temporarily supports `zh-CN`, `en-US`. Can use `locale` configuration

```ts
const view = new View(render node, {
    lang:'zh-CN',
});
```

### locale

-   Type: `object`
-   Default value: `zh-CN`
-   Detailed: Configure additional language packs

Language pack, default language pack [https://github.com/itellyou-com/am-editor/blob/master/locale](https://github.com/itellyou-com/am-editor/tree/master/ locale)

```ts
const view = new View(render node, {
     locale: {
         'zh-CN': {
             test:'Test',
             a: {
                 b: "B"
             }
         },
     }
});
console.log(view.language.get<string>('test'));
```

### root

-   Type: `Node`
-   Default value: the parent node of the current reader render node
-   Detailed: Reader root node

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
