# @aomao/plugin-reminder

高亮块、提示框插件

## 安装

```bash
$ yarn add @aomao/plugin-reminder
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Reminder from '@aomao/plugin-removeformat';

new Engine(...,{ plugins:[Reminder] })
```

## 可选项

### 快捷键

默认快捷键为 `mod+shift+0`

```ts
//快捷键
hotkey?: string | Array<string>;
//使用配置
new Engine(...,{
    config:{
        "remind":{
            //修改快捷键
            hotkey:"快捷键"
        }
    }
 })
```

## 命令

```ts
//使用 command 执行插件
engine.command.execute('remind');
```
