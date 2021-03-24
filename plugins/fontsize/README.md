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

$ new Engine(...,{ plugins:[Fontsize] })
```

Options

```
//快捷键，key 组合键，args，执行参数，[size,defaultSize?] ， size 必须，defaultSize 可选
hotkey?:{key:string,args:Array<string>};//默认无
defaultSize?:string //默认14px
data?:Array<string> | {[key:string]:string} //可以指定字体大小列表 ["12px","14px","15px"] 在粘贴的时候过滤，不满足列表条件，将移除字体大小样式。或者为字体小大设置别名 { "9pt":"12px","10pt":"13px"}
```

Commands

```bash
//size：更改的字体大小，defaultSize：保持的默认字体大小，默认为14px
engine.command.execute("fontsize",size,defaultSize)
```
