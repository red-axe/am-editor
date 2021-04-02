# @aomao/plugin-fontsize

字体大小插件

## 安装

```bash
$ yarn add @aomao/plugin-fontsize
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Fontsize from '@aomao/plugin-fontsize';

new Engine(...,{ plugins:[Fontsize] })
```

## 可选项

### 字体大小列表

支持自定义字体大小列表，传入列表，或键值对

```ts
/**
 * 可以指定字体大小列表 ["12px","14px","15px"]
 * 或者为字体小大设置别名 { "9pt":"12px","10pt":"13px"}
 * 在粘贴的时候过滤，不满足列表条件，将移除字体大小样式。
 * */
data?:Array<string> | {[key:string]:string}
```

### 默认字体大小

```ts
defaultSize?:string //默认为14px
```

### 快捷键

默认无快捷键

```ts
//快捷键，key 组合键，args，执行参数，[size,defaultSize?] ， size 必须，defaultSize 可选
hotkey?:{key:string,args:Array<string>};//默认无

//使用配置
new Engine(...,{
    config:{
        "fontsize":{
            //修改快捷键
            hotkey:{
                key:"mod+b",
                args:["12px","14px"]
            }
        }
    }
 })
```

## 命令

```ts
//size：更改的字体大小，defaultSize：保持的默认字体大小，在没有传入 defaultSize 或者 size 与 defaultSize 值不同时执行前景色修改
engine.command.execute('fontsize', size, defaultSize);
//使用 command 执行查询当前状态，返回 Array<string> | undefined，当前光标所在处字体大小值集合
engine.command.queryState('fontsize');
```
