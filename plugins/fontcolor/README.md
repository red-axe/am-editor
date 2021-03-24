# @aomao/plugin-fontcolor

## Getting Started

Install

```bash
$ yarn add @aomao/plugin-fontcolor
```

Add Plugin

```bash
$ import Engine, { EngineInterface } from '@aomao/engine';
$ import Fontcolor from '@aomao/plugin-fontcolor';

$ new Engine(...,{ plugins:[Fontcolor] })
```

Options

```
//快捷键，key 组合键，args，执行参数，[color,defaultColor?] ， color 必须，defaultColor 可选
hotkey?:{key:string,args:Array<string>};//默认无
```

Commands

```bash
//color：更改的字体颜色，defaultColor：保持的默认字体颜色
engine.command.execute("fontcolor",color,defaultColor)
```
