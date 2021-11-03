# @aomao/plugin-indent

缩进插件

## 安装

```bash
$ yarn add @aomao/plugin-indent
```

添加到引擎

此插件建议放在第一个增加，以免其它插件拦截了事件，使其无法生效

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Indent from '@aomao/plugin-indent';

new Engine(...,{ plugins:[Indent] })
```

## 可选项

### 快捷键

默认缩进快捷键 `mod+]`

默认删除缩进快捷键 `mod+[`

```ts
//快捷键，
hotkey?: {
    in?:string //缩进快捷键，默认 mod+]
    out?:string //删除缩进快捷键，默认 mod+[
};

//使用配置
new Engine(...,{
    config:{
        "indent":{
            //修改快捷键
            hotkey:{
                "in":"快捷键",
                "out":"快捷键"
            }
        }
    }
 })
```

### 最大 padding

最大 padding，每次缩进为 2

```ts
maxPadding?:number
```

## 命令

有一个参数 默认为 `in` ,可选值为 `in` 增加缩进，`out` 减少缩进

```ts
engine.command.execute('indent');
//使用 command 执行查询当前状态，返回 numbber，当前缩进值
engine.command.queryState('indent');
```
