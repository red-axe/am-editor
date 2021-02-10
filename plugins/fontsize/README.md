# @aomao/plugin-fontsize

## Getting Started

Install

```bash
$ yarn add @aomao/plugin-fontsize
```

Add Plugin

```bash
$ import Engine, { EngineInterface } from '@aomao/engine';
$ import Fontsize from '@aomao/plugin-fontsize';

$ Engine.plugin.add('fontsize', Fontsize);
```

Options

```
//快捷键，key 组合键，args，执行参数，[size,defaultSize?] ， size 必须，defaultSize 可选
hotkey?:{key:string,args:Array<string>};//默认无
defaultSize?:string //默认11
```

Commands

```bash
//size：更改的字体大小，defaultSize：保持的默认字体大小，默认为11
engine.command.execute("fontsize",size,defaultSize)
```
