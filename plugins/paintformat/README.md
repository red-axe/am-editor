# @aomao/plugin-paintformat

## Getting Started

Install

```bash
$ yarn add @aomao/plugin-paintformat
```

Add Plugin

```bash
$ import Engine, { EngineInterface } from '@aomao/engine';
$ import PaintFormat from '@aomao/plugin-paintformat';

$ Engine.plugin.add('paintformat', PaintFormat);
```

Options

```
removeCommand?:string | ((range:RangeInterface) => void); //移除样式命令，或提供方法。默认为 removeformat ，需要添加 @aomao/plugin-removeformat 插件
paintBlock?:(currentBlocl:NodeInterface,block:NodeInterface) => boolean | void //如何绘制block节点，内置heading，orderlist，unorderedlist 三种绘制block节点方式，分别需要添加 @aomao/plugin-heading 插件 @aomao/plugin-orderlist 插件 @aomao/plugin-unorderedlist 插件。返回false，不执行内置绘制，包括不复制block节点的css样式
```

Commands

```bash
engine.command.execute("paintformat")
```
