# @aomao/plugin-redo

重做历史插件

## 安装

```bash
$ yarn add @aomao/plugin-redo
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Redo from '@aomao/plugin-redo';

new Engine(...,{ plugins:[Redo] })
```

## 可选项

### 快捷键

默认快捷键为 `mod+y` `shift+mod+y`

```ts
//快捷键
hotkey?: string | Array<string>;
//使用配置
new Engine(...,{
    config:{
        "redo":{
            //修改快捷键
            hotkey:"快捷键"
        }
    }
 })
```

## 命令

```ts
//使用 command 执行插件、并传入所需参数
engine.command.execute('redo');
//使用 command 执行查询当前状态，返回 boolean | undefined
engine.command.queryState('redo');
```
