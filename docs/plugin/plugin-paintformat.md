# @aomao/plugin-paintformat

Format brush plugin

Support all mark tag plugins

The block supports the following plugins: `@aomao/plugin-heading` `@aomao/plugin-orderlist` `@aomao/plugin-unorderedlist`

## Installation

```bash
$ yarn add @aomao/plugin-paintformat
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Paintformat from'@aomao/plugin-paintformat';

new Engine(...,{ plugins:[Paintformat] })
```

## Optional

### Remove

Remove the style command, or provide a method. The default is removeformat, you need to add the `@aomao/plugin-removeformat` plugin

```ts
removeCommand?:string | ((range:RangeInterface) => void);
```

### Draw

How to draw a block node, return false, do not perform built-in drawing, including not copying the css style of the block node

```ts
/**
 * @param currentBlock The node that currently needs to be drawn
 * @param block needs to be copied format node
 * */
paintBlock?:(currentBlock:NodeInterface,block:NodeInterface) => boolean | void
```

## Command

```ts
//Use command to execute the plugin
engine.command.execute('paintformat');
//Use command to execute query current state, return boolean
engine.command.queryState('paintformat');
```
