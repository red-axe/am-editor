# @aomao/plugin-fontfamily

字体插件

## 安装

```bash
$ yarn add @aomao/plugin-fontfamily
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Fontfamily from '@aomao/plugin-fontfamily';

new Engine(...,{ plugins:[Fontfamily] })
```

## 可选项

### 快捷键

默认无快捷键

```ts
//快捷键，key 组合键，args，执行参数，[color,defaultColor?] ， color 必须，defaultColor 可选
hotkey?:{key:string,args:Array<string>};//默认无

//使用配置
new Engine(...,{
    config:{
        "fontfamily":{
            //修改快捷键
            hotkey:{
                key:"mod+b",
                args:["#000000","#ffffff"]
            }
        }
    }
 })
```

## 命令

```ts
//color：更改的前景颜色，defaultColor：保持的默认字体，在没有传入 defaultColor 或者 color 与 defaultColor 值不同时执行字体修改
engine.command.execute('fontfamily', color, defaultColor);
//使用 command 执行查询当前状态，返回 Array<string> | undefined，当前光标所在处字体值集合
engine.command.queryState('fontfamily');
```
