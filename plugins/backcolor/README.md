# @aomao/plugin-backcolor

## Getting Started

Install

```bash
$ yarn add @aomao/plugin-backcolor
```

Add Plugin

```bash
$ import Engine, { EngineInterface } from '@aomao/engine';
$ import Backcolor from '@aomao/plugin-backcolor';

$ Engine.plugin.add('backcolor', Backcolor);
```

Options

```
//快捷键，key 组合键，args，执行参数，[color,defaultColor?] ， color 必须，defaultColor 可选
hotkey?:{key:string,args:Array<string>};//默认无
```

Commands

```bash
//color：更改的背景颜色，defaultColor：保持的默认背景色
engine.command.execute("backcolor",color,defaultColor)
```
