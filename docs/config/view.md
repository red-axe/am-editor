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
-   Default value: `zh-cn`
-   Detailed: Language configuration, temporarily supports `zh-cn`, `en`. Can be added using `view.language`

```ts
const view = new View(render node, {
lang:'zh-cn',
});
view.language.add({
'zh-cn': {
test:'Test',
},
});
console.log(view.language.get('test'));
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
