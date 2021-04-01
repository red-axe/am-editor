# @aomao/plugin-fontsize

## Getting Started

Install

```bash
$ yarn add @aomao/plugin-codeblock
```

Add Plugin

```bash
$ import Engine, { EngineInterface } from '@aomao/engine';
$ import Codeblock, { CodeBlockComponent } from '@aomao/plugin-codeblock';

$ new Engine(...,{ plugins:[Codeblock] , cards:[CodeBlockComponent]})
```

Options

```
//快捷键，key 组合键，args，执行参数，[mode,value] ， mode 语言类型 value 代码文本值
hotkey?:{key:string,args:Array<string>};//默认无
```

Commands

```bash
//mode 语言类型 value 代码文本值
engine.command.execute("codeblock",mode,value)
```
