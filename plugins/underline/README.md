# @aomao/plugin-underline

下划线样式插件

## 安装

```bash
$ yarn add @aomao/plugin-underline
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Underline from '@aomao/plugin-underline';

new Engine(...,{ plugins:[Underline] })
```

## 可选项

### 快捷键

默认快捷键为 `mod+u`，以数组形式传入多个快捷键

```ts
//快捷键，
hotkey?: string | Array<string>;

//使用配置
new Engine(...,{
    config:{
        "underline":{
            //修改快捷键
            hotkey:"快捷键"
        }
    }
 })
```

## 命令

```ts
engine.command.execute('underline');
//使用 command 执行查询当前状态，返回 boolean | undefined
engine.command.queryState('underline');
```
