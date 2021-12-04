# @aomao/plugin-embed

嵌入网址

通过继承此插件，可以实现嵌入特定网址实现预览功能。

## 安装

```bash
$ yarn add @aomao/plugin-embed
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Embed , { EmbedComponent } from '@aomao/plugin-embed';

new Engine(...,{ plugins:[ Embed ] , cards:[ EmbedComponent ]})
```

## `Embed` 可选项

```ts
//使用配置
new Engine(...,{
    config:{
        [Embed.pluginName]:{
            //...相关配置
        }
    }
 })
```

### 首次渲染前返回特定信息

`renderBefore`: 渲染前返回一些信息

```ts
renderBefore?:(url: string) => {url?: string
    height?: number
    collapsed?: boolean
    ico?: string
    title?: string
    isResize?: boolean}
```

如果需要对返回信息做更多扩展，可以继承 `EmbedComponent` 类，然后重写 `handleSubmit` 方法

## 命令

### 插入网址

参数 1：要加载的 url，可选，默认会展示当前输入 url 界面
参数 2: 图标，默认为一个网页图标
参数 3: 标题，默认为 url
参数 4: 是否折叠，默认为 false
参数 5: 是否可以改变大小，默认为 true

```ts
engine.command.execute(
	Math.pluginName,
	'https://editor.aomao.com', // 可选
	'ico 图标',
	'展示的标题',
	false,
	true,
);
```
