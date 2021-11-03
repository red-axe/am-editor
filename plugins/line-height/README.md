# @aomao/plugin-line-height

行高插件

## 安装

```bash
$ yarn add @aomao/plugin-line-height
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Lineheight from '@aomao/plugin-line-height';

new Engine(...,{ plugins:[Lineheight] })
```

## 可选项

### 粘贴过滤自定义行高

支持过滤不符合自定义的行高

```ts
/**
 * @param lineHeight 当前行高
 * @returns 返回 string 修改当前值，false 移除，true 保留
 * */
filter?: (lineHeight: string) => string | boolean
//配置
new Engine(...,{
    config:{
        [LineHeihgt.pluginName]: {
            //配置粘贴后需要过滤的行高
            filter: (lineHeight: string) => {
                if(lineHeight === "14px") return "1"
                if(lineHeight === "16px") return "1.15"
                if(lineHeight === "21px") return "1.5"
                if(lineHeight === "28px") return "2"
                if(lineHeight === "35px") return "2.5"
                if(lineHeight === "42px") return "3"
                return ["1","1.15","1.5","2","2.5","3"].indexOf(lineHeight) > -1
            }
        }
    }
}
```

### 快捷键

默认无快捷键

```ts
//快捷键，key 组合键，args，执行参数，[lineHeight] ， lineHeight 可选，不传值删除当前光标位置的行高
hotkey?:{key:string,args:Array<string>};//默认无

//使用配置
new Engine(...,{
    config:{
        "line-height":{
            //修改快捷键
            hotkey:{
                key:"mod+b",
                args:["2"]
            }
        }
    }
 })
```

## 命令

```ts
//lineHeight：更改的行高
engine.command.execute('line-height', lineHeight);
//使用 command 执行查询当前状态，返回 Array<string> | undefined，当前光标所在处行高值集合
engine.command.queryState('line-height');
```
