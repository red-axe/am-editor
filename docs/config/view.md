---
toc: menu
---

# View configuration

The reader is mainly used for draft mode editing or simple content display. It needs real-time collaborative display and is set to be non-editable. You can use the engine's readonly attribute

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

Language pack, default language pack [https://github.com/yanmao-cc/am-editor/blob/master/locale](https://github.com/yanmao-cc/am-editor/tree/master/ locale)

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
-   Detailed: the configuration item of each plugin, the key is the name of the plugin, please refer to the description of each plugin for detailed configuration

### scrollNode

-   Type: `Node | (() => Node | null)`
-   Default value: Find the node whose parent style `overflow` or `overflow-y` is `auto` or `scroll`, if not, take `document.documentElement`
-   Detailed: The editor scroll bar node is mainly used to monitor the `scroll` event to set the floating position of the bomb layer and actively set the scroll to the editor target position

### lazyRender

-   Type: `boolena`
-   Default value: `true`
-   Detailed: Lazy rendering of cards (only cards with lazyRender enabled), the default is true
