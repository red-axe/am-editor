# @aomao/plugin-removeformat

移除样式插件

移除所有 mark 标签插件

移除所有 block 样式

## 安装

```bash
$ yarn add @aomao/plugin-removeformat
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Removeformat from '@aomao/plugin-removeformat';

new Engine(...,{ plugins:[Removeformat] })
```

## 可选项

### 快捷键

默认快捷键为 `mod+\`

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
//使用 command 执行插件
engine.command.execute('removeformat');
```
