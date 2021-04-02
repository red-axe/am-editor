# @aomao/plugin-undo

撤销历史插件

## 安装

```bash
$ yarn add @aomao/plugin-undo
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Undo from '@aomao/plugin-undo';

new Engine(...,{ plugins:[Undo] })
```

## 可选项

### 快捷键

默认快捷键为 `mod+z` `shift+mod+z`

```ts
//快捷键
hotkey?: string | Array<string>;
//使用配置
new Engine(...,{
    config:{
        "undo":{
            //修改快捷键
            hotkey:"快捷键"
        }
    }
 })
```

## 命令

```ts
//使用 command 执行插件、并传入所需参数
engine.command.execute('undo');
//使用 command 执行查询当前状态，返回 boolean | undefined
engine.command.queryState('undo');
```
