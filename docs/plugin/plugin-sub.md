# @aomao/plugin-sub

Subscript style plugin

## Installation

```bash
$ yarn add @aomao/plugin-sub
```

Add to engine

```ts
import Engine, {EngineInterface} from'@aomao/engine';
import Sub from'@aomao/plugin-sub';

new Engine(...,{ plugins:[Sub] })
```

## Optional

### Hotkey

The default shortcut key is `mod+,`, multiple shortcut keys are passed in as an array

```ts
//hotkey,
hotkey?: string | Array<string>;

//Use configuration
new Engine(...,{
     config:{
         "sub":{
             //Modify shortcut keys
             hotkey: "shortcut key"
         }
     }
  })
```

## Command

```ts
engine.command.execute('sub');
//Use command to execute query current status, return boolean | undefined
engine.command.queryState('sub');
```
