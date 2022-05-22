# @aomao/plugin-tasklist

任务列表插件

## 安装

```bash
$ yarn add @aomao/plugin-tasklist
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Tasklist , { CheckboxComponent } from '@aomao/plugin-tasklist';

new Engine(...,{ plugins:[Tasklist] , cards:[CheckboxComponent] })
```

## 可选项

### 快捷键

默认快捷键`mod+shift+9`

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

可传入 { checked:true } 表示选中，可选参数

```ts
//使用 command 执行插件、并传入所需参数
engine.command.execute('tasklist', { checked: boolean });
//使用 command 执行查询当前状态，返回 false 或者当前列表插件名称 tasklist tasklist unorderedlist
engine.command.queryState('tasklist');
```
