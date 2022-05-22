# @aomao/plugin-link

链接插件

## 安装

```bash
$ yarn add @aomao/plugin-link
```

`Vue` 使用

```bash
$ yarn add @aomao/plugin-link-vue
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Link from '@aomao/plugin-link';

new Engine(...,{ plugins:[Link] })
```

## 可选项

### 快捷键

默认快捷键为 `mod+k`，默认参数为 ["_blank"]

```ts
//快捷键，key 组合键，args，执行参数，[target?:string,href?:string,text?:string] 打开模式：可选，默认链接：可选，默认文本：可选
hotkey?:string | {key:string,args:Array<string>};

//使用配置
new Engine(...,{
    config:{
        "link":{
            //修改快捷键
            hotkey:{
                key:"mod+k",
                args:["_balnk_","https://www.aomao.com","ITELLYOU"]
            }
        }
    }
 })
```

## 命令

可传入三个参数[target?:string,href?:string,text?:string] 打开模式：可选，默认链接：可选，默认文本：可选

```ts
//target:'_blank', '_parent', '_top', '_self'，href:链接，text:文字
engine.command.execute('link', '_blank', 'https://www.aomao.com', 'ITELLYOU');
//使用 command 执行查询当前状态，返回 boolean | undefined
engine.command.queryState('link');
```
