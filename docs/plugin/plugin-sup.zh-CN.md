# @aomao/plugin-sup

上标样式插件

## 安装

```bash
$ yarn add @aomao/plugin-sup
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Sup from '@aomao/plugin-sup';

new Engine(...,{ plugins:[Sup] })
```

## 可选项

### 快捷键

默认快捷键为 `mod+.`，以数组形式传入多个快捷键

```ts
//快捷键，
hotkey?: string | Array<string>;

//使用配置
new Engine(...,{
    config:{
        "sup":{
            //修改快捷键
            hotkey:"快捷键"
        }
    }
 })
```

## 命令

```ts
engine.command.execute('sup');
//使用 command 执行查询当前状态，返回 boolean | undefined
engine.command.queryState('sup');
```
