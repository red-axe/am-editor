# @aomao/plugin-unorderedlist

无序列表插件

## 安装

```bash
$ yarn add @aomao/plugin-unorderedlist
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Unorderedlist from '@aomao/plugin-unorderedlist';

new Engine(...,{ plugins:[Unorderedlist] })
```

## 可选项

### 快捷键

默认快捷键`mod+shift+8`

```ts
//快捷键
hotkey?: string | Array<string>;//默认mod+shift+8
//使用配置
new Engine(...,{
    config:{
        "unorderedlist":{
            //修改快捷键
            hotkey:"快捷键"
        }
    }
 })
```

## 命令

```ts
//使用 command 执行插件、并传入所需参数
engine.command.execute('unorderedlist');
//使用 command 执行查询当前状态，返回 false 或者当前列表插件名称 unorderedlist tasklist unorderedlist
engine.command.queryState('unorderedlist');
```
