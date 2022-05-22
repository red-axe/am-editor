# @aomao/plugin-heading

标题样式插件

## 安装

```bash
$ yarn add @aomao/plugin-heading
```

添加到引擎

```ts
import Engine, { EngineInterface } from '@aomao/engine';
import Heading from '@aomao/plugin-heading';

new Engine(...,{ plugins:[Heading] })
```

## 可选项

### 锚点

开启后在标题左边出现可复制锚点按钮

```ts
showAnchor?: boolean;
```

当点击复制锚点的时候触发，传入当前标题的 id 值，返回的内容将写入到用户的粘贴板上，默认将返回当前 url+id

```ts
anchorCopy?:(id:string) => string
```

### 快捷键

```ts
//快捷键
hotkey?: {
    h1?: string;//标题1，默认 mod+opt+1
    h2?: string;//标题2，默认 mod+opt+2
    h3?: string;//标题3，默认 mod+opt+3
    h4?: string;//标题4，默认 mod+opt+4
    h5?: string;//标题5，默认 mod+opt+5
    h6?: string;//标题6，默认 mod+opt+6
};
//使用配置
new Engine(...,{
    config:{
        "heading":{
            //修改快捷键
            hotkey:{
                h1:"快捷键"
            }
        }
    }
 })
```

### 禁用 mark 插件样式效果

可以在标题下禁用 mark 插件效果，默认禁用 ['fontsize', 'bold'] ，在分割、粘贴等情况下过滤掉这些插件样式

```ts
disableMark?: Array<string> //mark插件名称集合
```

### 要启用的类型（h1 h2 h3 h4 h5 h6）

可以定义 h1 - h6 所需要的节点类型，如果不定义则支持全部

```ts
enableTypes?: Array<string>
```

另外可能还需要配置 toolbar 中 items 属性的 heading 插件

```ts
{
    type: 'dropdown',
    name: 'heading',
    items: [
        {
            key: "p",
            className: 'heading-item-p',
            content: "正文"
        },
        {
            key: "h1",
            className: 'heading-item-h1',
            content: "标题1"
        }
    ]
    }
```

## 命令

传入 `p` 或当前标题样式与当前传入值一致 时将取消标题

```ts
//使用 command 执行插件、并传入所需参数
engine.command.execute(
	'heading',
	'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p',
);
//使用 command 执行查询当前状态，返回 string | undefined，返回 "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p"
engine.command.queryState('heading');
```
