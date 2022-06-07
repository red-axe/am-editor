# @aomao/plugin-redo

Redo history plugin

## Installation

```bash
$ yarn add @aomao/plugin-redo
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Redo from'@aomao/plugin-redo';

new Engine(...,{ plugins:[Redo] })
```

## Optional

### Hotkey

The default shortcut key is `mod+y` `shift+mod+y`

```ts
//hotkey
hotkey?: string | Array<string>;
//Use configuration
new Engine(...,{
     config:{
         "redo":{
             //Modify shortcut keys
             hotkey: "shortcut key"
         }
     }
  })
```

## Command

```ts
//Use command to execute the plugin and pass in the required parameters
engine.command.execute('redo');
//Use command to execute query current status, return boolean | undefined
engine.command.queryState('redo');
```
