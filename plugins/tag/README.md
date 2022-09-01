# @aomao/plugin-tag

任务列表插件

## 安装

```bash
$ yarn add @aomao/plugin-tag
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Tag , { TagComponent } from '@aomao/plugin-tag';

new Engine(...,{ plugins:[Tag] , cards:[TagComponent] })
```

## 可选项

```ts
//快捷键
hotkey?: string | Array<string>;//默认mod+shift+9
//使用配置
new Engine(...,{
    config:{
        "tasklist":{
            //修改快捷键
            hotkey:"快捷键"
        }
    }
 })
```

## 命令

```ts
//使用 command 执行插件、并传入所需参数
engine.command.execute('tag');
//使用 command 执行查询当前状态，返回 false 或者当前列表插件名称 tasklist tasklist unorderedlist
engine.command.queryState('tag');
```
