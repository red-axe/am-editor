# @aomao/plugin-indent

## Getting Started

Install

```bash
$ yarn add @aomao/plugin-indent
```

Add Plugin

```bash
$ import Engine, { EngineInterface } from '@aomao/engine';
$ import Indent from '@aomao/plugin-indent';
//此插件建议放在第一个增加，以免其它插件拦截了事件，使其无法生效
$ new Engine(...,{ plugins:[Indent] })
```

Options

```
//快捷键
hotkey?: {
    in?:string //缩进快捷键，默认 mod+]
    out?:string //删除缩进快捷键，默认 mod+[
};
//最大padding值，每次缩进为 2
maxPadding?: number;
```

Commands

```bash
//默认为 in
//in 缩进，out 删除缩进
engine.command.execute("indent","out" | "in")
```
