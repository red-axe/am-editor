# @aomao/plugin-heading

## Getting Started

Install

```bash
$ yarn add @aomao/plugin-heading
```

Add Plugin

```bash
$ import Engine, { EngineInterface } from '@aomao/engine';
$ import Heading from '@aomao/plugin-heading';

$ Engine.plugin.add('heading', Heading);
```

Options

```
//快捷键
hotkey?: {
    h1?: string;//标题1，默认 mod+opt+1
    h2?: string;//标题2，默认 mod+opt+2
    h3?: string;//标题3，默认 mod+opt+3
    h4?: string;//标题4，默认 mod+opt+4
    h5?: string;//标题5，默认 mod+opt+5
    h6?: string;//标题6，默认 mod+opt+6
};
//是否展示锚点
showAnchor?: boolean;
//当点击复制锚点的时候触发，传入当前标题的id值，返回的内容将写入到用户的粘贴板上，默认将返回当前url+id
anchorCopy?:(id:string) => string
```

Commands

```bash
//需要一个标题类型参数，当传入p标签时，将取消当前标题恢复为p标签
engine.command.execute("heading","h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p")
```
