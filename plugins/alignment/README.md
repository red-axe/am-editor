# @aomao/plugin-alignment

对齐方式：左对齐、居中对齐、右对齐、两端对齐

## 安装

```bash
$ yarn add @aomao/plugin-alignment
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Alignment from '@aomao/plugin-alignment';

new Engine(...,{ plugins:[Alignment] })
```

## 可选项

```ts
//快捷键
hotkey?: {
    left?: string;//左对齐，默认 mod+shift+l
    center?: string;//居中对齐，默认 mod+shift+c
    right?: string;//右对齐，默认 mod+shift+r
    justify?: string;//两端对齐，默认 mod+shift+j
};
//使用配置
new Engine(...,{
    config:{
        "alignment":{
            //修改 左对齐 快捷键
            hotkey:{
                left:"快捷键"
            }
        }
    }
 })
```

## 命令

对齐插件可选参数，`left` | `center` | `right` | `justify`，分别表示 左对齐、居中对齐、右对齐、两端对齐

```ts
//使用 command 执行插件、并传入所需参数
engine.command.execute('alignment', 'left' | 'center' | 'right' | 'justify');
//使用 command 执行查询当前状态，返回 string | undefined，光标所在处节点对齐样式 "left" | "center" | "right" | "justify"
engine.command.queryState('alignment');
```
