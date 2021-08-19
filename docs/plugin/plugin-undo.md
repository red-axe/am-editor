# @aomao/plugin-undo

Undo history plugin

If you need to enable history, we need to call the following method after the engine is initialized

```ts
//Initialize local collaboration to record history
engine.ot.initLockMode();
```

## Installation

```bash
$ yarn add @aomao/plugin-undo
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Undo from'@aomao/plugin-undo';

new Engine(...,{ plugins:[Undo] })
```

## Optional

### hot key

The default shortcut key is `mod+z` `shift+mod+z`

```ts
//hot key
hotkey?: string | Array<string>;
//Use configuration
new Engine(...,{
     config:{
         "undo":{
             //Modify shortcut keys
             hotkey: "shortcut key"
         }
     }
  })
```

## Command

```ts
//Use command to execute the plug-in and pass in the required parameters
engine.command.execute('undo');
//Use command to execute query current status, return boolean | undefined
engine.command.queryState('undo');
```
