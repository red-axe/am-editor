# @aomao/plugin-orderedlist

有序列表插件

## 安装

```bash
$ yarn add @aomao/plugin-orderedlist
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Orderedlist from '@aomao/plugin-orderedlist';

new Engine(...,{ plugins:[Orderedlist] })
```

## 可选项

### 快捷键

默认快捷键`mod+shift+7`

```ts
//快捷键
hotkey?: string | Array<string>;//默认mod+shift+7
//使用配置
new Engine(...,{
    config:{
        "orderedlist":{
            //修改快捷键
            hotkey:"快捷键"
        }
    }
 })
```

### Markdown

默认支持 markdown，传入`false`关闭

Orderedlist 插件 markdown 语法为`1.` 序号+点

```ts
markdown?: boolean;//默认开启，false 关闭
//使用配置
new Engine(...,{
    config:{
        "orderedlist":{
            //关闭markdown
            markdown:false
        }
    }
 })
```

## 命令

有一个参数 `start:number` 默认为 1，表示列表开始序号

```ts
//使用 command 执行插件、并传入所需参数
engine.command.execute('orderedlist', 1);
//使用 command 执行查询当前状态，返回 false 或者当前列表插件名称 orderedlist tasklist unorderedlist
engine.command.queryState('orderedlist');
```
