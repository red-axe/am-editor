# @aomao/plugin-embed

Embed URL

By inheriting this plugin, you can embed a specific URL to realize the preview function.

## Install

```bash
$ yarn add @aomao/plugin-embed
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Embed, {EmbedComponent} from'@aomao/plugin-embed';

new Engine(...,{ plugins:[ Embed], cards:[ EmbedComponent ]})
```

## `Embed` optional

```ts
//Use configuration
new Engine(...,{
    config:{
        [Embed.pluginName]:{
            //...Related configuration
        }
    }
 })
```

### Return specific information before the first rendering

`renderBefore`: return some information before rendering

```ts
renderBefore?:(url: string) => {url?: string
    height?: number
    collapsed?: boolean
    ico?: string
    title?: string
    isResize?: boolean}
```

If you need to extend the returned information more, you can inherit the `EmbedComponent` class, and then override the `handleSubmit` method

## Command

### Insert URL

Parameter 1: The url to be loaded, optional, the current input url interface will be displayed by default
Parameter 2: icon, the default is a web icon
Parameter 3: Title, default is url
Parameter 4: Whether to collapse, the default is false
Parameter 5: Whether the size can be changed, the default is true

```ts
engine.command.execute(
	Math.pluginName,
	'https://editor.aomao.com', // optional
	'ico icon',
	'Display title',
	false,
	true,
);
```
