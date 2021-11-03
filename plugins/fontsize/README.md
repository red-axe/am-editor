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

### 粘贴过滤自定义字体大小

支持过滤不符合自定义的字体大小

```ts
/**
 * @param fontSize 当前字体大小
 * @returns 返回 string 修改当前值，false 移除，true 保留
 * */
filter?: (fontSize: string) => string | boolean
//配置
new Engine(...,{
    config:{
        [Fontsize.pluginName]: {
            //配置粘贴后需要过滤的字体大小
            filter: (fontSize: string) => {
                return ["12px","13px","14px","15px","16px","19px","22px","24px","29px","32px","40px","48px"].indexOf(fontSize) > -1
            }
        }
    }
}
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
