# @aomao/plugin-alignment

## Getting Started

Install

```bash
$ yarn add @aomao/plugin-alignment
```

Add Plugin

```bash
$ import Engine, { EngineInterface } from '@aomao/engine';
$ import Alignment from '@aomao/plugin-alignment';

$ new Engine(...,{ plugins:[Alignment] })
```

Options

```
//快捷键
hotkey?: {
    left?: string;//左对齐，默认 mod+shift+l
    center?: string;//居中对齐，默认 mod+shift+c
    right?: string;//右对齐，默认 mod+shift+r
    justify?: string;//两端对齐，默认 mod+shift+j
};
```

Commands

```bash
//需要一个标题类型参数，当传入p标签时，将取消当前标题恢复为p标签
engine.command.execute("alignment","left" | "center" | "right" | "justify")
```
