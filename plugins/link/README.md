# @aomao/plugin-backcolor

## Getting Started

Install

```bash
$ yarn add @aomao/plugin-link
```

Add Plugin

```bash
$ import Engine, { EngineInterface } from '@aomao/engine';
$ import Link from '@aomao/plugin-link';

$ new Engine(...,{ plugins:[Link] })
```

Options

```
//快捷键，key 组合键，args，执行参数，[target,href,text]
hotkey?:{key:string,args:Array<string>};//默认mod+k ["_blank"]
```

Commands

```bash
//target:'_blank', '_parent', '_top', '_self'，href:链接，text:文字
engine.command.execute("link","_blank","https://www.itellyou.com","ITELLYOU")
```
