# @aomao/plugin-bold

加粗样式插件

## 安装

```bash
$ yarn add @aomao/plugin-bold
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Bold from '@aomao/plugin-bold';

new Engine(...,{ plugins:[Bold] })
```

## 可选项

### 快捷键

默认快捷键为 `mod+b`，以数组形式传入多个快捷键

```ts
//快捷键，
hotkey?: string | Array<string>;

//使用配置
new Engine(...,{
    config:{
        "bold":{
            //修改快捷键
            hotkey:"快捷键"
        }
    }
 })
```

## 命令

```ts
engine.command.execute('bold');
//使用 command 执行查询当前状态，返回 boolean | undefined
engine.command.queryState('bold');
```
